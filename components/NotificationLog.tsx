import { store } from "@/lib/store";

export function NotificationLog() {
  const notifications = store.notifications();
  const members = store.members();
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Member";
  const timeOf = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (notifications.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Reminder history</p>
        <p className="mt-1 text-[13px] text-neutral-400">
          No reminders sent yet. Hit "Send renewal reminders" to notify members expiring soon.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Reminder history</p>
          <p className="text-[13px] text-neutral-500">Last email + WhatsApp sends</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
          {notifications.length}
        </span>
      </div>

      <ul className="divide-y divide-black/[0.04]">
        {notifications.slice(0, 12).map((n) => (
          <li key={n.id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                n.channel === "email" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {n.channel === "email" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <rect x="3" y="5.5" width="18" height="13" rx="2" />
                  <path d="m3.5 7 8.5 6 8.5-6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M5 4h4l1.5 4L8.5 10a12 12 0 0 0 5.5 5.5l2-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-800">
                {nameOf(n.memberId)}
                <span className="ml-2 text-[11px] font-medium normal-case text-neutral-400">
                  {n.channel === "email" ? "Email" : "WhatsApp"}
                </span>
              </p>
              <p className="truncate text-[11px] text-neutral-400">
                {n.channel === "email" ? n.subject : n.body.split("\n")[0]}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[11px] font-medium tabular-nums text-neutral-400">{timeOf(n.sentAt)}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3 w-3">
                  <path d="M5 12.5 10 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                delivered
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}