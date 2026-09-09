import { formatINR } from "@/lib/store";

export function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Monthly revenue</p>
          <p className="text-[13px] text-neutral-500">Collection across all gyms</p>
        </div>
        <p className="text-[13px] font-semibold text-emerald-600">+6.4% vs last</p>
      </div>

      <div className="flex h-44 items-end gap-3">
        {data.map((d, i) => {
          const h = (d.amount / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={d.month} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">
                {formatINR(d.amount)}
              </span>
              <div
                className="w-full rounded-lg animate-rise"
                style={{
                  height: `${Math.max(h, 4)}%`,
                  minHeight: 12,
                  background: isLast
                    ? "linear-gradient(180deg,#6366f1,#4f46e5)"
                    : "#dce0ee",
                  animationDelay: `${i * 55}ms`,
                }}
              />
              <span className="text-[11px] font-medium text-neutral-400">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}