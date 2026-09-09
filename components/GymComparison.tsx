import { formatINR } from "@/lib/seed";
import type { GymStat } from "@/lib/analytics";

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? "bg-amber-500" : pct >= 60 ? "bg-indigo-500" : "bg-emerald-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GymComparison({ stats }: { stats: GymStat[] }) {
  const maxMembers = Math.max(...stats.map((s) => s.members), 1);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Branches compared</p>
          <p className="text-[13px] text-neutral-500">How every gym is performing right now</p>
        </div>
        <span className="text-[12px] font-medium text-neutral-400">{stats.length} locations</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-y border-black/[0.06] bg-neutral-50/70 text-[11px] uppercase tracking-wide text-neutral-400">
              <th className="px-5 py-2.5 font-semibold">Gym</th>
              <th className="px-3 py-2.5 font-semibold">Members</th>
              <th className="px-3 py-2.5 font-semibold">Check-ins today</th>
              <th className="px-3 py-2.5 font-semibold">MRR</th>
              <th className="px-3 py-2.5 font-semibold">Expiring</th>
              <th className="px-5 py-2.5 font-semibold">Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {stats.map((s, i) => (
              <tr key={s.gym.id} className="animate-rise transition-colors hover:bg-neutral-50/60" style={{ animationDelay: `${i * 60}ms` }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 text-[11px] font-bold text-neutral-600">
                      {s.gym.initials}
                    </div>
                    <div className="leading-tight">
                      <p className="font-semibold text-neutral-900">{s.gym.name}</p>
                      <p className="text-[11px] text-neutral-400">{s.gym.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-neutral-900">{s.members}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(s.members / maxMembers) * 100}%` }} />
                  </div>
                </td>
                <td className="px-3 py-3 font-medium tabular-nums text-neutral-700">{s.checkinsToday}</td>
                <td className="px-3 py-3 font-semibold tabular-nums text-neutral-900">{formatINR(s.mrr)}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.expiring > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {s.expiring}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <UtilizationBar pct={s.utilization} />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-neutral-500">{s.utilization}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}