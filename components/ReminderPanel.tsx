import { store, memberStatus, daysUntil, formatDate, type Member } from "@/lib/store";
import { needsReminder, EXPIRY_REMIND_DAYS } from "@/lib/notify";
import { MemberAvatar } from "./Badge";
import { SendRemindersButton } from "./SendRemindersButton";

export function ReminderPanel() {
  const members = store.members();
  const gyms = store.gyms();
  const reminders = members
    .filter((m) => memberStatus(m.endDate) !== "expired")
    .filter((m) => needsReminder(m).wants && needsReminder(m).daysLeft <= EXPIRY_REMIND_DAYS)
    .map((m) => ({ m, daysLeft: daysUntil(m.endDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const gymOf = (id: string) => gyms.find((g) => g.id === id)?.name ?? "Branch";

  if (reminders.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Renewal reminders</p>
            <p className="text-[13px] text-neutral-500">
              Nothing expiring in the next {EXPIRY_REMIND_DAYS} days right now.
            </p>
          </div>
          <SendRemindersButton />
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Renewal reminders</p>
          <p className="text-[13px] text-neutral-500">
            Members expiring within {EXPIRY_REMIND_DAYS} days get a nudge on email + WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            {reminders.length}
          </span>
          <SendRemindersButton />
        </div>
      </div>

      <ul className="divide-y divide-black/[0.04]">
        {reminders.map(({ m, daysLeft }, i) => {
          const lastEmail = store.lastReminderAt(m.id, "email");
          const lastWA = store.lastReminderAt(m.id, "whatsapp");
          const bothSent = !!(lastEmail && lastWA);
          return (
            <li
              key={m.id}
              className="animate-rise flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/60"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <MemberAvatar name={m.name} hue={m.imageHue} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-neutral-800">
                  {m.name}
                  <span className="ml-2 text-[11px] font-medium text-neutral-400">{gymOf(m.gymId)}</span>
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                  <span>{m.plan}</span>
                  <span>expires {daysLeft === 0 ? "today" : `in ${daysLeft}d`}</span>
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18" /></svg>
                    {m.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3"><path d="M5 4h4l1.5 4L8.5 10a12 12 0 0 0 5.5 5.5l2-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" /></svg>
                    {m.phone}
                  </span>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  bothSent ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {bothSent ? "Reminded" : "Not reminded yet"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}