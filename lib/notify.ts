import { daysUntil, formatINR, type Channel, type Gym, type Member } from "./seed";

/* ------------------------------------------------------------------ */
/*  Renewal-reminder config                                            */
/* ------------------------------------------------------------------ */

export const EXPIRY_REMIND_DAYS = 7; // remind members expiring within this window
export const REMINDER_INTERVAL_DAYS = 7; // never spam: skip if reminded within this window

export function needsReminder(member: Member): { wants: boolean; daysLeft: number } {
  const daysLeft = daysUntil(member.endDate);
  return {
    wants: daysLeft >= 0 && daysLeft <= EXPIRY_REMIND_DAYS,
    daysLeft,
  };
}

export function isWithinDays(isoDate: string, days: number): boolean {
  const diff = Date.now() - new Date(isoDate).getTime();
  return diff >= 0 && diff < days * 86_400_000;
}

/* ------------------------------------------------------------------ */
/*  Message builders                                                   */
/* ------------------------------------------------------------------ */

type Email = { subject: string; body: string };

export function buildEmail(member: Member, gym: Gym, daysLeft: number): Email {
  const family = daysLeft <= 3 ? "almost there" : "on the way";
  return {
    subject: `Your ${member.plan} membership at ${gym.name} renews in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
    body: [
      `Hi ${member.name},`,
      ``,
      `Your ${member.plan} membership at ${gym.name} is ${family} - it expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""} (${new Date(member.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long" })}).`,
      ``,
      `Keep your training on track with no gap: renew today.`,
      `Amount due: ${formatINR(member.price)}.`,
      ``,
      `Renew at the front desk, give us a call, or reply to this email and we'll sort it for you.`,
      ``,
      `- The ${gym.name} team`,
    ].join("\n"),
  };
}

export function buildWhatsApp(member: Member, gym: Gym, daysLeft: number): string {
  const urgent = daysLeft <= 3 ? " just a heads up it's really close" : "";
  return [
    `Hi ${member.name}! ${gym.name} here${urgent}.`,
    `Your ${member.plan} plan expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""} (${new Date(member.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long" })}).`,
    `Renew now to keep your training going - amount due ${formatINR(member.price)}.`,
    `Reply "RENEW" and we'll confirm your payment link.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Delivery layer                                                     */
/* ------------------------------------------------------------------ */
/*  The functions below are the ONLY place external sends happen.      */
/*  For now they log to the server and record a reference so the       */
/*  prototype is fully demonstrable end-to-end.                        */
/*                                                                     */
/*  To go live, replace the body with a real provider:                 */
/*  - Email:    nodemailer.createTransport({...}).sendMail(...)        */
/*              using SMTP credentials from process.env.               */
/*  - WhatsApp: the Twilio Messages API (accountSid, authToken, from)  */
/*              from process.env.                                      */
/* ------------------------------------------------------------------ */

export async function deliver(
  channel: Channel,
  member: Member,
  subject: string,
  body: string
): Promise<{ ok: boolean; ref: string }> {
  if (channel === "email") {
    // nodemailer example (production):
    //   await transporter.sendMail({ to: member.email, subject, text: body });
    console.log(`[email:mock] to ${member.email} | ${subject}`);
    return { ok: true, ref: `email-${member.id}-${Date.now()}` };
  }
  // Twilio example (production):
  //   await client.messages.create({ from: `whatsapp:+1415...`, to: `whatsapp:${member.phone}`, body });
  console.log(`[whatsapp:mock] to ${member.phone}`);
  return { ok: true, ref: `wa-${member.id}-${Date.now()}` };
}