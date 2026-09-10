import { formatINR } from "@/lib/store";

function computeGrowth(data: { month: string; amount: number }[]): number | null {
  if (data.length < 2) return null;
  const prev = data[data.length - 2].amount;
  const curr = data[data.length - 1].amount;
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

/* Nice round baseline just below the lowest value, so month-to-month
   changes aren't squashed against a zero baseline (the "flat" look).
   The y-axis labels keep the truncation honest. */
function chartFloor(min: number): number {
  return Math.floor((min * 0.9) / 10000) * 10000;
}

function gridLines(floor: number, max: number, count = 4): number[] {
  const step = Math.ceil((max - floor) / count / 1000) * 1000;
  const lines: number[] = [];
  for (let v = floor + step; v < max; v += step) lines.push(v);
  return lines;
}

export function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = data.length ? Math.max(...data.map((d) => d.amount)) : 0;
  const min = data.length ? Math.min(...data.map((d) => d.amount)) : 0;
  const floor = data.length > 1 ? chartFloor(min) : 0;
  const range = max - floor;
  const growth = computeGrowth(data);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Monthly revenue</p>
          <p className="text-[13px] text-neutral-500">Collection across all gyms</p>
        </div>
        <div className="flex items-center gap-3">
          {data.length > 0 && (
            <span className="text-[12px] text-neutral-400 tabular-nums">Total {formatINR(total)}</span>
          )}
          {growth !== null && (
            <p className={`text-[13px] font-semibold ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% vs last
            </p>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-[13px] text-neutral-400">
          No revenue data yet
        </div>
      ) : (
        <div className="flex h-44 gap-3">
          {/* Y-axis labels + gridlines */}
          <div className="relative flex w-12 flex-col justify-between py-5 text-right">
            {(() => {
              const lines = gridLines(floor, max);
              return (
                <>
                  {[max, ...lines, floor].map((v, i) => (
                    <span key={i} className="text-[10px] tabular-nums text-neutral-300">
                      {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
                    </span>
                  ))}
                </>
              );
            })()}
          </div>

          {/* Chart area */}
          <div className="relative flex-1">
            {/* Horizontal gridlines */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-5">
              {(() => {
                const lines = gridLines(floor, max);
                return (
                  <>
                    {[max, ...lines, floor].map((_, i) => (
                      <div key={i} className="border-t border-neutral-100" />
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Bars */}
            <div className="relative flex h-full items-end gap-3 py-5">
              {data.map((d, i) => {
                const h = range > 0 ? ((d.amount - floor) / range) * 100 : 100;
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
        </div>
      )}
    </div>
  );
}
