import { store, memberStatus, daysUntil, toISODate, formatINR, formatDate } from "@/lib/store";
import { MemberAvatar } from "@/components/Badge";
import { RenewButton } from "@/components/RenewButton";
import { ReminderPanel } from "@/components/ReminderPanel";
import { NotificationLog } from "@/components/NotificationLog";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  const members = store.members();
  const checkins = store.db.checkins;
  const today = toISODate(new Date());

  /* Memberships the owner can expect to collect on within the next 30 days. */
  const pipeline = members
    .filter((m) => {
      const s = memberStatus(m.endDate);
      if (s === "expired") return daysUntil(m.endDate) > -30; // recently lapsed, still recoverable
      return s === "expiring" || daysUntil(m.endDate) <= 30;
    })
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  const pipelineValue = pipeline.reduce((s, m) => s + m.price, 0);
  const activeCount = members.filter((m) => memberStatus(m.endDate) !== "expired").length;

  return (
    <div className="animate-fade">
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Billing &amp; collections</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          See exactly what's coming in and collect renewals with one tap.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-hover p-5">
          <p className="text-[13px] font-medium text-neutral-500">Expect to collect · 30 days</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-900">{formatINR(pipelineValue)}</p>
          <p className="mt-1 text-[12px] font-medium text-emerald-600">{pipeline.length} renewals due</p>
        </div>
        <div className="card card-hover p-5">
          <p className="text-[13px] font-medium text-neutral-500">Paid-up members</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-900">{activeCount}</p>
          <p className="mt-1 text-[12px] font-medium text-neutral-400">recurring base today</p>
        </div>
        <div className="card card-hover p-5">
          <p className="text-[13px] font-medium text-neutral-500">Check-ins today</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-900">{checkins.filter((c) => c.date === today).length}</p>
          <p className="mt-1 text-[12px] font-medium text-neutral-400">across all branches</p>
        </div>
      </div>

      <div className="card divide-y divide-black/[0.04] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Renewals due</p>
            <p className="text-[13px] text-neutral-500">Members with memberships ending in the next 30 days</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">{pipeline.length}</span>
        </div>

        {pipeline.length === 0 ? (
          <div className="px-5 pb-5 text-center text-[13px] text-neutral-400">No renewals due in the next 30 days.</div>
        ) : (
          pipeline.slice(0, 20).map((m, i) => {
            const days = daysUntil(m.endDate);
            const isExpired = memberStatus(m.endDate) === "expired";
            return (
              <div key={m.id} className="animate-rise flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50/60" style={{ animationDelay: `${i * 40}ms` }}>
                <MemberAvatar name={m.name} hue={m.imageHue} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-neutral-800">{m.name}</p>
                  <p className="truncate text-[12px] text-neutral-400">
                    {m.plan} · {isExpired ? `lapsed ${Math.abs(days)}d ago` : days === 0 ? "ends today" : `${days}d left`} · renews {formatDate(m.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold tabular-nums text-neutral-900">{formatINR(m.price)}</p>
                  <p className={`text-[11px] font-medium ${isExpired ? "text-rose-600" : "text-neutral-400"}`}>{isExpired ? "overdue" : "due"}</p>
                </div>
                <RenewButton memberId={m.id} />
              </div>
            );
          })
        )}
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ReminderPanel />
        <NotificationLog />
      </section>
    </div>
  );
}