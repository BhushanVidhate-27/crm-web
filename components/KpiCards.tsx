import { formatINR } from "@/lib/store";
import { StatCard } from "./StatCard";

export function KpiCards({
  active,
  expiring,
  expired,
  checkinsToday,
  lastRevenue,
  totalMembers,
  scopeLabel = "across branches",
}: {
  active: number;
  expiring: number;
  expired: number;
  checkinsToday: number;
  lastRevenue: number;
  totalMembers: number;
  scopeLabel?: string;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard
        index={0}
        label="Active members"
        value={String(active)}
        hint={`${totalMembers} total ${scopeLabel}`}
        tone="indigo"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3 2.6-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
            <path d="M15.5 5.1a3.2 3.2 0 0 1 0 5.8" />
          </svg>
        }
      />
      <StatCard
        index={1}
        label="Check-ins today"
        value={String(checkinsToday)}
        hint="live right now"
        tone="green"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M12 3v3M12 21v-3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M18.4 5.6l-2.1 2.1M5.6 18.4l2.1-2.1M18.4 18.4l-2.1-2.1" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        }
      />
      <StatCard
        index={2}
        label="Expiring this week"
        value={String(expiring)}
        hint={`${expired} already expired`}
        tone="amber"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" strokeLinecap="round" />
          </svg>
        }
      />
      <StatCard
        index={3}
        label="Revenue · Aug"
        value={formatINR(lastRevenue)}
        hint="+14% vs July"
        tone="green"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M12 2v20M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" strokeLinecap="round" />
          </svg>
        }
      />
    </section>
  );
}