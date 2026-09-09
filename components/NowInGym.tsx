import type { Member } from "@/lib/store";
import { MemberAvatar } from "./Badge";

export function NowInGym({ members, checkinsToday }: { members: Member[]; checkinsToday: { memberId: string; time: string }[] }) {
  const byId = new Map(members.map((m) => [m.id, m]));
  const rows = [...checkinsToday]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6)
    .map((c) => {
      const member = byId.get(c.memberId);
      return member ? { member, time: c.time } : null;
    })
    .filter(Boolean) as { member: Member; time: string }[];

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Now in the gym</p>
          <p className="text-[13px] text-neutral-500">Latest check-ins today</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {rows.map(({ member, time }, i) => (
          <li
            key={member.id}
            className="animate-rise flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-50"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <MemberAvatar name={member.name} hue={member.imageHue} size={34} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-neutral-800">{member.name}</p>
              <p className="text-[11px] text-neutral-400">{member.plan}</p>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-neutral-400">{time}</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-center text-[13px] text-neutral-400">No check-ins yet today.</li>
        )}
      </ul>
    </div>
  );
}