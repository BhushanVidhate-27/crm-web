import { store, memberStatus, daysUntil, toISODate, formatINR } from "@/lib/store";
import { needsReminder, EXPIRY_REMIND_DAYS } from "@/lib/notify";
import { StatCard } from "@/components/StatCard";
import { MemberAvatar } from "@/components/Badge";
import { SendRemindersButton } from "@/components/SendRemindersButton";
import { PassActivityFeed } from "@/components/PassActivityFeed";
import { NotificationLog } from "@/components/NotificationLog";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  const members = store.members();
  const gyms = store.gyms();
  const notifications = store.notifications();
  const today = toISODate(new Date());

  const gymOf = (id: string) => gyms.find((g) => g.id === id)?.name ?? "Branch";

  /* Members currently in the alert window (expiring, not yet expired). */
  const expiringSoon = members
    .filter((m) => memberStatus(m.endDate) !== "expired")
    .map((m) => ({ m, daysLeft: daysUntil(m.endDate) }))
    .filter(({ m, daysLeft }) => needsReminder(m).wants && daysLeft <= EXPIRY_REMIND_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const whatsappSent = notifications.filter((n) => n.channel === "whatsapp").length;
  const emailSent = notifications.filter((n) => n.channel === "email").length;

  /* --- Recent activities ---------------------------------------------- */
  /* Latest check-ins ("gym pass" uses) and latest alert sends, unified.  */
  const activity = [
    ...store.db.checkins.map((c) => {
      const m = members.find((x) => x.id === c.memberId);
      return {
        key: `c-${c.id}`,
        type: "checkin" as const,
        at: `${c.date}T${c.time}:00`,
        memberName: m?.name ?? "Member",
        hue: m?.imageHue ?? 0,
        detail: gymOf(c.gymId),
      };
    }),
    ...notifications.map((n) => {
      const m = members.find((x) => x.id === n.memberId);
      return {
        key: `n-${n.id}`,
        type: "alert" as const,
        at: n.sentAt,
        memberName: m?.name ?? "Member",
        hue: m?.imageHue ?? 0,
        detail:
          n.channel === "email"
            ? `Email alert sent to ${m?.email ?? "member"}`
            : `WhatsApp alert sent to ${m?.phone ?? "member"}`,
      };
    }),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  return (
    <div className="animate-fade">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Gym pass notifications</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Alert members on WhatsApp and email before their gym pass expires, and see who&apos;s been in.
          </p>
        </div>
        <SendRemindersButton />
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Passes expiring soon"
          value={String(expiringSoon.length)}
          hint={`within ${EXPIRY_REMIND_DAYS} days`}
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M18 10a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.3 20a2 2 0 0 0 3.4 0" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          index={1}
          label="WhatsApp alerts sent"
          value={String(whatsappSent)}
          hint="to member phone numbers"
          tone="green"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M5 4h4l1.5 4L8.5 10a12 12 0 0 0 5.5 5.5l2-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
            </svg>
          }
        />
        <StatCard
          index={2}
          label="Email alerts sent"
          value={String(emailSent)}
          hint="to member inboxes"
          tone="indigo"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <rect x="3" y="5.5" width="18" height="13" rx="2" />
              <path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
          }
        />
        <StatCard
          index={3}
          label="Check-ins today"
          value={String(store.db.checkins.filter((c) => c.date === today).length)}
          hint="passes used across branches"
          tone="default"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M5 12.5 10 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* --- Alert queue: who gets WhatsApp + email nudges --- */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Alert queue</p>
              <p className="text-[13px] text-neutral-500">WhatsApp + email go out together on one tap</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              {expiringSoon.length}
            </span>
          </div>

          {expiringSoon.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-neutral-400">
              No passes expiring in the next {EXPIRY_REMIND_DAYS} days. You&apos;re all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {expiringSoon.map(({ m, daysLeft }, i) => (
                <li
                  key={m.id}
                  className="animate-rise flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/60"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <MemberAvatar name={m.name} hue={m.imageHue} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-neutral-800">
                      {m.name}
                      <span className="ml-2 text-[11px] font-medium text-neutral-400">{gymOf(m.gymId)}</span>
                    </p>
                    <p className="truncate text-[11px] text-neutral-400">
                      {m.plan} · {daysLeft === 0 ? "expires today" : `${daysLeft}d left`} · {formatINR(m.price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                        <path d="M5 4h4l1.5 4L8.5 10a12 12 0 0 0 5.5 5.5l2-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
                      </svg>
                      {m.phone}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                        <rect x="3" y="5.5" width="18" height="13" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                      {m.email}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* --- Recent activity: check-ins + alerts sent --- */}
        <PassActivityFeed items={activity} />
      </div>

      <div className="mt-5">
        <NotificationLog />
      </div>
    </div>
  );
}
