import { store, memberStatus, toISODate, formatINR } from "@/lib/store";
import {
  computeOwnerInsights,
  computeGymStats,
  computeAtRisk,
} from "@/lib/analytics";
import { StatCard } from "@/components/StatCard";
import { GymComparison } from "@/components/GymComparison";
import { AtRiskList } from "@/components/AtRiskList";
import { YearlyIncomeChart } from "@/components/YearlyIncomeChart";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const members = store.members();
  const checkins = store.db.checkins;
  const gyms = store.gyms();
  const revenue = store.revenue();
  const today = toISODate(new Date());

  const insights = computeOwnerInsights(members, checkins, gyms);
  const stats = computeGymStats(gyms, members, checkins, today);
  const atRisk = computeAtRisk(members, checkins);
  const expiredCount = members.filter((m) => memberStatus(m.endDate) === "expired").length;

  /* --- Past income: monthly + yearly (scoped to this year; past years live in the chart's sliding list) --- */
  const thisYear = new Date().getFullYear();
  const yearPoints = revenue.filter((r) => r.year === thisYear);
  const yearTotal = yearPoints.reduce((s, r) => s + r.amount, 0);
  const bestMonth = yearPoints.reduce<null | (typeof yearPoints)[number]>(
    (best, r) => (!best || r.amount > best.amount ? r : best),
    null
  );
  const avgMonth = yearPoints.length ? Math.round(yearTotal / yearPoints.length) : 0;
  const lastMonth = yearPoints.length >= 2 ? yearPoints[yearPoints.length - 2].amount : null;
  const thisMonth = yearPoints.length ? yearPoints[yearPoints.length - 1].amount : 0;
  const momGrowth = lastMonth && lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

  return (
    <div className="animate-fade">
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Revenue statistics</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Your past income, month by month and year over year - turned into action.
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

      {/* --- Past income: this month, best month, year total --- */}
      <section className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          index={0}
          label={`Income · ${yearPoints[yearPoints.length - 1]?.month ?? "this month"}`}
          value={formatINR(thisMonth)}
          hint={momGrowth === null ? "collection so far" : `${momGrowth >= 0 ? "+" : ""}${momGrowth.toFixed(1)}% vs last month`}
          tone={momGrowth !== null && momGrowth < 0 ? "rose" : "green"}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M12 2v20M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          index={1}
          label="Average monthly income"
          value={formatINR(avgMonth)}
          hint={`across ${yearPoints.length} months this year`}
          tone="indigo"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M4 19V5M4 19h16" /><path d="M8 15l3.5-4 3 2.5L18 8" />
            </svg>
          }
        />
        <StatCard
          index={2}
          label="Best month"
          value={bestMonth ? formatINR(bestMonth.amount) : "—"}
          hint={bestMonth ? `${bestMonth.month} — your peak so far` : "no data yet"}
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M8 21h8M12 17v4" strokeLinecap="round" /><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 5M17 6h2.5a2.5 2.5 0 0 1-2.5 5" />
            </svg>
          }
        />
        <StatCard
          index={3}
          label={`Yearly income · ${thisYear}`}
          value={formatINR(yearTotal)}
          hint="all branches combined"
          tone="default"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" />
            </svg>
          }
        />
      </section>

      {/* --- Multi-year income: sliding year list + chart + monthly tiles --- */}
      <section className="mt-6">
        <YearlyIncomeChart revenue={revenue} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GymComparison stats={stats} />
        <AtRiskList atRisk={atRisk} />
      </section>
    </div>
  );
}