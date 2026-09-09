"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { store, memberStatus, daysUntil, toISODate, daysFromToday, type Channel } from "./store";
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

export type ActionResult = { ok: boolean; message: string };

export async function checkIn(formData: FormData): Promise<ActionResult> {
  const memberId = String(formData.get("memberId") ?? "");
  const res = store.checkIn(memberId);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/members");
  return res;
}

export async function addMember(formData: FormData): Promise<ActionResult> {
  const member: Omit<Member, "id"> = {
    gymId: String(formData.get("gymId") ?? "g1"),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
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
  revalidatePath("/members");
  return res;
}

export async function renewMember(formData: FormData): Promise<ActionResult> {
  const memberId = String(formData.get("memberId") ?? "");
  const months = Number(formData.get("months") ?? 3);
  const res = store.renew(memberId, months);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/members");
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

  const message =
    sent > 0
      ? `${sent} reminder${sent > 1 ? "s" : ""} delivered via email + WhatsApp.`
      : `Nothing new to send - everyone expiring in the next ${EXPIRY_REMIND_DAYS} days was already reminded.`;
  return { ok: true, message };
}

/* ------------------------------------------------------------------ */
/*  QR self check-in flow                                              */
/*  Scan gym QR -> enter phone -> recognized: instant check-in.        */
/*  Unknown phone: registration form, then checked in automatically.   */
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

export async function qrIdentify(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const rawPhone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);

  if (rawPhone.length !== 10) {
    redirect(`/qr/${code}?err=${encodeURIComponent("Enter a valid 10-digit phone number.")}`);
  }

  const match = store.members().find((m) => m.phone.replace(/\D/g, "").endsWith(rawPhone));
  if (!match) {
    redirect(`/qr/${code}?step=register&phone=${encodeURIComponent(rawPhone)}`);
  }

  const qr = parseQrCode(code);
  const res = store.checkIn(match.id, qr?.gymId);
  await rememberMember(match.id);
  revalidatePath("/dashboard");
  revalidatePath("/members");
  revalidatePath("/reports");
  redirect(`/qr/${code}?done=${encodeURIComponent(res.message)}&name=${encodeURIComponent(match.name)}`);
}

export async function qrRegister(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const qr = parseQrCode(code);
  const gymId = qr?.gymId ?? "g1";

  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);
  const email = String(formData.get("email") ?? "").trim();
  const plan = String(formData.get("plan") ?? "Monthly");

  if (!name) redirect(`/qr/${code}?step=register&err=${encodeURIComponent("Name is required.")}`);
  if (phoneRaw.length !== 10) redirect(`/qr/${code}?step=register&err=${encodeURIComponent("Valid 10-digit phone is required.")}`);

  /* Plan pricing mirror of the owner's rate card. */
  const PLANS: Record<string, { price: number; months: number }> = {
    Monthly: { price: 2500, months: 1 },
    Quarterly: { price: 6000, months: 3 },
    "Half-Yearly": { price: 12000, months: 6 },
    Yearly: { price: 24000, months: 12 },
  };
  const chosen = PLANS[plan] ?? PLANS.Monthly;

  const res = store.addMember({
    gymId,
    name,
    phone: `+91 ${phoneRaw.slice(0, 5)} ${phoneRaw.slice(5)}`,
    email,
    plan,
    price: chosen.price,
    startDate: toISODate(new Date()),
    endDate: daysFromToday(chosen.months * 30),
    imageHue: Math.floor(Math.random() * 360),
  });
  if (!res.ok) redirect(`/qr/${code}?step=register&err=${encodeURIComponent(res.message)}`);

  const created = store.members().find((m) => m.name === name && m.phone.endsWith(phoneRaw));
  if (created) {
    store.checkIn(created.id, gymId);
    await rememberMember(created.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/members");
  revalidatePath("/reports");
  revalidatePath("/billing");
  redirect(`/qr/${code}?done=${encodeURIComponent(`Welcome to the gym, ${name}! You're checked in.`)}&name=${encodeURIComponent(name)}&new=1`);
}

export async function qrWelcomeBackCheckin(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const qr = parseQrCode(code);
  const member = await rememberedMember();
  if (!member) redirect(`/qr/${code}`);

  const res = store.checkIn(member.id, qr?.gymId);
  revalidatePath("/dashboard");
  revalidatePath("/members");
  redirect(`/qr/${code}?done=${encodeURIComponent(res.message)}&name=${encodeURIComponent(member.name)}`);
}

/* Exported for the scan page's welcome-back card. */
export async function getRememberedMember(): Promise<Member | null> {
  return rememberedMember();
}