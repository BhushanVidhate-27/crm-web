import { formatINR } from "@/lib/store";
import type { OwnerInsights } from "@/lib/analytics";

export function OwnerInsightStrip({ insights }: { insights: OwnerInsights }) {
  const items = [
    {
      label: "Monthly recurring revenue",
      value: formatINR(insights.mrr),
      hint: `${formatINR(insights.arr)} / year`,
      tone: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Renewals · next 30 days",
      value: formatINR(insights.renewals30d),
      hint: "lock this in early",
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Members at risk",
      value: String(insights.atRisk),
      hint: insights.atRisk > 0 ? "recoverable with a nudge" : "all members engaged",
      tone: insights.atRisk > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it, i) => (
        <div key={it.label} className="card card-hover animate-rise flex items-center gap-3 px-4 py-3.5" style={{ animationDelay: `${i * 60}ms` }}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${it.tone}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
              {i === 0 ? (
                <path d="M12 2v20M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" strokeLinecap="round" />
              ) : i === 1 ? (
                <path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M12 3l9 16H3z" strokeLinejoin="round" />
              )}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-neutral-400">{it.label}</p>
            <p className="text-lg font-semibold leading-tight tracking-tight text-neutral-900">{it.value}</p>
            <p className="truncate text-[11px] text-neutral-400">{it.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}