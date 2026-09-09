import { store, memberStatus, toISODate, formatINR } from "@/lib/store";
import {
  computeOwnerInsights,
  computeGymStats,
  computeAtRisk,
} from "@/lib/analytics";
import { StatCard } from "@/components/StatCard";
import { GymComparison } from "@/components/GymComparison";
import { AtRiskList } from "@/components/AtRiskList";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const members = store.members();
  const checkins = store.db.checkins;
  const gyms = store.gyms();
  const today = toISODate(new Date());

  const insights = computeOwnerInsights(members, checkins, gyms);
  const stats = computeGymStats(gyms, members, checkins, today);
  const atRisk = computeAtRisk(members, checkins);
  const expiredCount = members.filter((m) => memberStatus(m.endDate) === "expired").length;

  return (
    <div className="animate-fade">
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Owner intelligence</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          The numbers that matter most to your business - turned into action.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Monthly recurring revenue"
          value={formatINR(insights.mrr)}
          hint={`${formatINR(insights.arr)} / year`}
          tone="indigo"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M12 2v20M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          index={1}
          label="Renewals in next 30 days"
          value={formatINR(insights.renewals30d)}
          hint="cash you can lock in soon"
          tone="green"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          index={2}
          label="Members at risk"
          value={String(insights.atRisk)}
          hint="paying but not showing up"
          tone="rose"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M12 3l9 16H3z" strokeLinejoin="round" /><path d="M12 9v4M12 16.5v.01" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          index={3}
          label="Expired memberships"
          value={String(expiredCount)}
          hint={`best branch: ${insights.bestGym?.name ?? "—"}`}
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" strokeLinecap="round" />
            </svg>
          }
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GymComparison stats={stats} />
        <AtRiskList atRisk={atRisk} />
      </section>
    </div>
  );
}