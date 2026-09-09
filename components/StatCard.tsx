export type StatTone = "default" | "green" | "amber" | "rose" | "indigo";

const TONES: Record<StatTone, { icon: string; chip: string }> = {
  default: { icon: "text-neutral-500 bg-neutral-100", chip: "text-neutral-500" },
  indigo: { icon: "text-indigo-600 bg-indigo-50", chip: "text-indigo-600" },
  green: { icon: "text-emerald-600 bg-emerald-50", chip: "text-emerald-600" },
  amber: { icon: "text-amber-600 bg-amber-50", chip: "text-amber-600" },
  rose: { icon: "text-rose-600 bg-rose-50", chip: "text-rose-600" },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: StatTone;
  index?: number;
}) {
  const t = TONES[tone];
  return (
    <div
      className="card card-hover animate-rise p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-neutral-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${t.icon}`}>{icon}</span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-neutral-900">
        {value}
      </p>
      {hint && <p className={`mt-2 text-[12px] font-medium ${t.chip}`}>{hint}</p>}
    </div>
  );
}