"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { store, memberStatus, type Channel } from "./store";
import { parseQrCode } from "./qr";
import {
  buildEmail,
  buildWhatsApp,
  deliver,
  needsReminder,
  isWithinDays,
  EXPIRY_REMIND_DAYS,
  REMINDER_INTERVAL_DAYS,
} from "./notify";
import type { Member } from "./seed";
import { saveMedia, deleteMedia, mediaMaxBytes, mediaMaxLabel } from "./media-files";

export type ActionResult = { ok: boolean; message: string };

export async function addMemory(formData: FormData): Promise<ActionResult> {
  const caption = String(formData.get("caption") ?? "").trim();
  const tag = String(formData.get("tag") ?? "Events").trim();
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0)
    return { ok: false, message: "Pick a photo to add to memories." };
  if (!photo.type.startsWith("image/")) return { ok: false, message: "Only images are allowed." };
  if (photo.size > mediaMaxBytes())
    return { ok: false, message: `Too large — keep photos under ${mediaMaxLabel()}.` };

  const { file } = await saveMedia(Buffer.from(await photo.arrayBuffer()), photo.type);

  store.addMemory({
    file,
    caption: caption || "A good day at the gym",
    tag,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/memories");
  return { ok: true, message: "Saved to the vault. The good times live here now!" };
}

export async function deleteMemory(formData: FormData): Promise<ActionResult> {
  const mem = store.memory(String(formData.get("id") ?? ""));
  if (!mem) return { ok: false, message: "Memory not found." };
  store.removeMemory(mem.id);
  await deleteMedia(mem.file);
  revalidatePath("/memories");
  return { ok: true, message: "Memory deleted." };
}

export async function checkIn(formData: FormData): Promise<ActionResult> {
  const memberId = String(formData.get("memberId") ?? "");
  const res = store.checkIn(memberId);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/members", "layout"); // includes /members/[id] profile
  revalidatePath("/notifications");
  return res;
}

export async function addMember(formData: FormData): Promise<ActionResult> {
  const member: Omit<Member, "id"> = {
    gymId: String(formData.get("gymId") ?? "g1"),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    plan: String(formData.get("plan") ?? "Monthly"),
    price: Number(formData.get("price") ?? 0),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    imageHue: Math.floor(Math.random() * 360),
  };

  if (!member.name) return { ok: false, message: "Member name is required." };
  if (!member.endDate) return { ok: false, message: "Membership end date is required." };

  const res = store.addMember(member);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/members", "layout"); // includes /members/[id] profile
  return res;
}

export async function renewMember(formData: FormData): Promise<ActionResult> {
  const memberId = String(formData.get("memberId") ?? "");
  const months = Number(formData.get("months") ?? 3);
  const res = store.renew(memberId, months);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/members", "layout"); // includes /members/[id] profile
  return res;
}

export async function sendReminders(): Promise<ActionResult> {
  const members = store.members();
  const gyms = store.gyms();
  let sent = 0;
  let skipped = 0;

  for (const member of members) {
    if (memberStatus(member.endDate) === "expired") continue;
    const { wants, daysLeft } = needsReminder(member);
    if (!wants) continue;

    const gym = gyms.find((g) => g.id === member.gymId)!;
    const channels: Channel[] = ["email", "whatsapp"];

    for (const channel of channels) {
      const last = store.lastReminderAt(member.id, channel);
      if (last && isWithinDays(last, REMINDER_INTERVAL_DAYS)) {
        skipped += 1;
        continue;
      }

      const subject = channel === "email" ? buildEmail(member, gym, daysLeft).subject : "";
      const body =
        channel === "email" ? buildEmail(member, gym, daysLeft).body : buildWhatsApp(member, gym, daysLeft);

      const { ok, ref } = await deliver(channel, member, subject, body);
      store.sendReminder({
        memberId: member.id,
        channel,
        kind: "renewal-reminder",
        sentAt: new Date().toISOString(),
        subject,
        body,
        ref,
        delivered: ok,
      });
      sent += 1;
    }
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/notifications");

  const message =
    sent > 0
      ? `${sent} reminder${sent > 1 ? "s" : ""} delivered via email + WhatsApp.`
      : `Nothing new to send - everyone expiring in the next ${EXPIRY_REMIND_DAYS} days was already reminded.`;
  return { ok: true, message };
}

/* ------------------------------------------------------------------ */
/*  QR self check-in flow                                              */
/*  Scan gym QR -> enter member ID -> recognized: instant check-in.    */
/*  The ID is issued by the admin on the main site; first check-in     */
/*  stores the member in a cookie so every scan after is one tap.      */
/* ------------------------------------------------------------------ */

const MEMBER_COOKIE = "gymos_member";

async function rememberMember(memberId: string) {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, memberId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
}

async function rememberedMember(): Promise<Member | null> {
  const jar = await cookies();
  const id = jar.get(MEMBER_COOKIE)?.value;
  if (!id) return null;
  return store.members().find((m) => m.id === id) ?? null;
}

export type QrResult = { err?: string; done?: string; name?: string };

/* useActionState signature: (previousState, formData) => result.          */
/* The page renders the result from state instead of URL query params.      */
export async function qrIdentify(_prev: QrResult | null, formData: FormData): Promise<QrResult> {
  const code = String(formData.get("code") ?? "");
  const memberId = String(formData.get("memberId") ?? "").trim();

  if (!memberId) return { err: "Enter your member ID." };

  const match = store.members().find((m) => m.id.toLowerCase() === memberId.toLowerCase());
  if (!match) return { err: "No member found with that ID — ask the front desk for help." };

  const qr = parseQrCode(code);
  const res = store.checkIn(match.id, qr?.gymId);
  if (!res.ok) return { err: res.message };
  await rememberMember(match.id);
  revalidatePath("/dashboard");
  revalidatePath("/members", "layout"); // includes /members/[id] profile
  revalidatePath("/reports");
  revalidatePath("/notifications");
  return { done: res.message, name: match.name };
}

export async function qrWelcomeBackCheckin(_prev: QrResult | null, formData: FormData): Promise<QrResult> {
  const code = String(formData.get("code") ?? "");
  const qr = parseQrCode(code);
  const member = await rememberedMember();
  if (!member) return { err: "Session expired — enter your member ID to check in." };

  const res = store.checkIn(member.id, qr?.gymId);
  revalidatePath("/dashboard");
  revalidatePath("/members", "layout"); // includes /members/[id] profile
  revalidatePath("/notifications");
  return { done: res.message, name: member.name };
}

/* Exported for the scan page's welcome-back card. */
export async function getRememberedMember(): Promise<Member | null> {
  return rememberedMember();
}

/* ------------------------------------------------------------------ */
/*  Active gym selection (persisted in a cookie, not the URL)          */
/* ------------------------------------------------------------------ */

const ACTIVE_GYM_COOKIE = "gymos_gym";

export async function setActiveGym(formData: FormData): Promise<void> {
  const gymId = String(formData.get("gymId") ?? "").trim();
  const jar = await cookies();

  if (gymId && store.gyms().some((g) => g.id === gymId)) {
    jar.set(ACTIVE_GYM_COOKIE, gymId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  } else {
    jar.delete(ACTIVE_GYM_COOKIE); // empty gymId -> back to all branches
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}