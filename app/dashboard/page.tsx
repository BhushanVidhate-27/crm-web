import { store, memberStatus } from "@/lib/store";
import { computeOwnerInsights } from "@/lib/analytics";
import { KpiCards } from "@/components/KpiCards";
import { OwnerInsightStrip } from "@/components/OwnerInsightStrip";
import { RevenueChart } from "@/components/RevenueChart";
import { NowInGym } from "@/components/NowInGym";
import { NeedsAttention } from "@/components/NeedsAttention";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const members = store.members();
  const checkinsToday = store.checkinsToday();
  const revenue = store.revenue();
  const gyms = store.gyms();

  const active = members.filter((m) => memberStatus(m.endDate) === "active");
  const expiring = members
    .filter((m) => memberStatus(m.endDate) === "expiring")
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  const expired = members.filter((m) => memberStatus(m.endDate) === "expired");
  const lastRevenue = revenue[revenue.length - 1]?.amount ?? 0;
  const insights = computeOwnerInsights(members, store.db.checkins, gyms);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayNum = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="animate-fade">
      <header className="mb-8">
        <p className="text-[13px] font-medium text-neutral-500">{todayNum}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">{greeting}, Arjun</h1>
          <div className="flex gap-2">
            {gyms.map((g) => (
              <span
                key={g.id}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ring-inset ${
                  g.id === "g1"
                    ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                    : "bg-white text-neutral-500 ring-black/[0.07]"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {g.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      <KpiCards
        active={active.length}
        expiring={expiring.length}
        expired={expired.length}
        checkinsToday={checkinsToday.length}
        lastRevenue={lastRevenue}
        totalMembers={members.length}
      />

      <div className="mt-5">
        <OwnerInsightStrip insights={insights} />
      </div>

      <section className="mt-5 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <RevenueChart data={revenue} />
        <NowInGym members={members} checkinsToday={checkinsToday} />
      </section>

      <NeedsAttention expiring={expiring} />
    </div>
  );
}