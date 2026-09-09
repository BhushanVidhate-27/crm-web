import { formatDate, daysUntil, type Member } from "@/lib/store";
import { Badge, MemberAvatar } from "./Badge";
import { RenewButton } from "./RenewButton";

export function NeedsAttention({ expiring }: { expiring: Member[] }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Needs attention</h2>
        <span className="text-[12px] font-medium text-neutral-400">memberships expiring in 7 days</span>
      </div>

      {expiring.length === 0 ? (
        <div className="card p-8 text-center text-[13px] text-neutral-400">
          All memberships are healthy. Nothing expiring this week.
        </div>
      ) : (
        <div className="card divide-y divide-black/[0.04] overflow-hidden">
          {expiring.slice(0, 5).map((m, i) => {
            const days = daysUntil(m.endDate);
            return (
              <div
                key={m.id}
                className="animate-rise flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50/60"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <MemberAvatar name={m.name} hue={m.imageHue} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-neutral-800">{m.name}</p>
                  <p className="text-[12px] text-neutral-400">{m.plan} · ends {formatDate(m.endDate)}</p>
                </div>
                <Badge status="expiring" />
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] font-medium text-neutral-400">expires</p>
                  <p className="text-[13px] font-semibold text-amber-600">{days === 0 ? "today" : `in ${days}d`}</p>
                </div>
                <RenewButton memberId={m.id} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}