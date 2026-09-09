import { formatINR } from "@/lib/seed";
import type { AtRiskMember } from "@/lib/analytics";
import { MemberAvatar } from "./Badge";
import { RenewButton } from "./RenewButton";

export function AtRiskList({ atRisk }: { atRisk: AtRiskMember[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">At-risk revenue</p>
          <p className="text-[13px] text-neutral-500">
            Paying members who stopped showing up. Reach out to save them.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {atRisk.length} at risk
        </span>
      </div>

      {atRisk.length === 0 ? (
        <div className="px-5 pb-5 text-center text-[13px] text-neutral-400">
          No paying members are slipping away. Keep it up.
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {atRisk.map(({ member, daysAgo }, i) => (
            <li
              key={member.id}
              className="animate-rise flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/60"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <MemberAvatar name={member.name} hue={member.imageHue} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-neutral-800">
                  {member.name}
                  <span className="ml-2 text-[11px] font-semibold text-neutral-400">{member.plan}</span>
                </p>
                <p className="truncate text-[11px] text-neutral-400">
                  Last seen {daysAgo} days ago · {member.phone} · {formatINR(member.price)}
                </p>
              </div>
              <RenewButton memberId={member.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}