"use client";

import { useMemo, useRef, useState } from "react";
import { formatINR, type RevenuePoint } from "@/lib/seed";

type Scope = "all" | "g1" | "g2";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "All branches" },
  { id: "g1", label: "Jatra Hotel" },
  { id: "g2", label: "Adgaon" },
];

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function amountOf(d: RevenuePoint, scope: Scope): number {
  return scope === "all" ? d.amount : d[scope];
}

function yearTotal(points: RevenuePoint[], scope: Scope): number {
  return points.reduce((s, r) => s + amountOf(r, scope), 0);
}

function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
  return Math.ceil(v / (pow / 2)) * (pow / 2);
}

const W = 680;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 30, left: 52 };

export function YearlyIncomeChart({ revenue }: { revenue: RevenuePoint[] }) {
  const [scope, setScope] = useState<Scope>("all");
  const [hover, setHover] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const byYear = new Map<number, RevenuePoint[]>();
    for (const r of revenue) {
      const list = byYear.get(r.year);
      if (list) list.push(r);
      else byYear.set(r.year, [r]);
    }
    return [...byYear.entries()]
      .map(([year, points]) => ({
        year,
        points: [...points].sort((a, b) => MONTH_INDEX[a.month] - MONTH_INDEX[b.month]),
      }))
      .sort((a, b) => b.year - a.year);
  }, [revenue]);

  const activeYear = selectedYear ?? years[0]?.year ?? new Date().getFullYear();
  const active = years.find((y) => y.year === activeYear);
  const points = active?.points ?? [];

  const values = points.map((r) => amountOf(r, scope));
  const max = niceCeil(Math.max(...values, 1));
  const total = values.reduce((s, v) => s + v, 0);
  const peak = Math.max(...values, 0);
  const hovered = hover !== null ? points[hover] : null;
  const selectedIdx = points.findIndex((r) => r.month === selectedMonth);
  const selected = selectedIdx >= 0 ? points[selectedIdx] : null;
  const prevOf = (idx: number) => (idx > 0 ? points[idx - 1] : null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const xOf = (i: number) => PAD.left + i * stepX;
  const yOf = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const linePath = points.map((r, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(amountOf(r, scope))}`).join(" ");
  const areaPath = `${linePath} L ${xOf(points.length - 1)} ${PAD.top + innerH} L ${xOf(0)} ${PAD.top + innerH} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const fmtK = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors duration-150 cursor-pointer ${
      active
        ? "bg-indigo-600 text-white ring-indigo-600"
        : "bg-white text-neutral-500 ring-black/[0.08] hover:bg-neutral-50 hover:text-neutral-800"
    }`;

  const setYear = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setHover(null);
  };

  const slice = (dir: 1 | -1) =>
    stripRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Past income</p>
          <p className="text-[13px] text-neutral-500">Yearly totals with month-by-month collection history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SCOPES.map((s) => (
            <button key={s.id} type="button" onClick={() => setScope(s.id)} className={chip(scope === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Sliding list of years, each showing its yearly income --- */}
      {years.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-[13px] text-neutral-400">No income history yet</div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => slice(-1)}
              aria-label="Scroll to earlier years"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-neutral-500 ring-1 ring-inset ring-black/[0.08] transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path d="M15 5 8.5 12 15 19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              ref={stripRef}
              className="flex flex-1 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {years.map((y) => {
                const isActive = y.year === activeYear;
                return (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => setYear(y.year)}
                    className={`flex min-w-[112px] flex-col items-start gap-0.5 rounded-xl px-3.5 py-2 text-left ring-1 ring-inset transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white ring-indigo-600"
                        : "bg-white text-neutral-600 ring-black/[0.08] hover:bg-neutral-50 hover:text-neutral-800"
                    }`}
                  >
                    <span className="text-[14px] font-bold tracking-tight">{y.year}</span>
                    <span className={`text-[11px] font-medium tabular-nums ${isActive ? "text-white/80" : "text-neutral-400"}`}>
                      {formatINR(yearTotal(y.points, scope))}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => slice(1)}
              aria-label="Scroll to later years"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-neutral-500 ring-1 ring-inset ring-black/[0.08] transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path d="m9 5 6.5 7L9 19" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mb-3 flex items-center gap-4">
            <span className="text-[13px] text-neutral-400">
              {activeYear} total{" "}
              <span className="font-semibold tabular-nums text-neutral-900">{formatINR(total)}</span>
            </span>
            <span className="text-[13px] text-neutral-400">
              Peak month <span className="font-semibold tabular-nums text-neutral-900">{formatINR(peak)}</span>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-56 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Income chart for ${activeYear}`}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="income-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Gridlines + y-axis */}
            {gridVals.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={yOf(v)} y2={yOf(v)} stroke="rgb(0 0 0 / 0.06)" strokeWidth="1" />
                <text x={PAD.left - 8} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="#a3a3a3">
                  {fmtK(v)}
                </text>
              </g>
            ))}

            {/* Area + line */}
            <path d={areaPath} fill="url(#income-area)" />
            <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {/* Points + month labels + hover/click hit areas */}
            {points.map((r, i) => {
              const v = amountOf(r, scope);
              const isHover = hover === i;
              const isSelected = selectedMonth === r.month;
              return (
                <g key={r.month}>
                  {isSelected && (
                    <rect
                      x={xOf(i) - stepX / 2}
                      y={PAD.top}
                      width={stepX}
                      height={innerH}
                      fill="#6366f1"
                      opacity="0.07"
                    />
                  )}
                  <circle cx={xOf(i)} cy={yOf(v)} r={isHover || isSelected ? 5 : 3.5} fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                  <text
                    x={xOf(i)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHover || isSelected ? "700" : "500"}
                    fill={isHover || isSelected ? "#4f46e5" : "#a3a3a3"}
                  >
                    {r.month}
                  </text>
                  <rect
                    x={xOf(i) - stepX / 2}
                    y={PAD.top}
                    width={stepX}
                    height={innerH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setSelectedMonth(isSelected ? null : r.month)}
                  />
                  {isHover && (
                    <g>
                      <rect
                        x={Math.min(Math.max(xOf(i) - 46, PAD.left), W - PAD.right - 92)}
                        y={Math.max(yOf(v) - 34, 2)}
                        width="92"
                        height="24"
                        rx="6"
                        fill="#1e1b4b"
                      />
                      <text
                        x={Math.min(Math.max(xOf(i), PAD.left + 46), W - PAD.right - 46)}
                        y={Math.max(yOf(v) - 18, 19)}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#fff"
                      >
                        {r.month}: {formatINR(v)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {hovered && scope === "all" && (
              <g>
                <line
                  x1={xOf(hover!)}
                  x2={xOf(hover!)}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  stroke="#4f46e5"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              </g>
            )}
          </svg>

          {/* --- Clean monthly income: one tile per month for the active year --- */}
          {points.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold tracking-tight text-neutral-900">
                  Monthly income · {activeYear}{" "}
                  <span className="ml-1 font-medium text-neutral-400">
                    {scope === "all" ? "all branches" : scope === "g1" ? "Jatra Hotel" : "Adgaon"}
                  </span>
                </p>
                <p className="text-[11px] text-neutral-400">Tap a month for its branch split</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {points.map((r) => {
                  const v = amountOf(r, scope);
                  const isSelected = selectedMonth === r.month;
                  return (
                    <button
                      key={r.month}
                      type="button"
                      onClick={() => setSelectedMonth(isSelected ? null : r.month)}
                      className={`rounded-xl px-3 py-3 text-left ring-1 ring-inset transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white ring-indigo-600"
                          : "bg-white text-neutral-800 ring-black/[0.06] hover:bg-neutral-50 hover:ring-black/[0.12]"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "text-white/70" : "text-neutral-400"}`}>
                        {r.month} {r.year}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold tabular-nums">{formatINR(v)}</p>
                      <div className={`mt-2 h-1 rounded-full ${isSelected ? "bg-white/25" : "bg-neutral-100"}`}>
                        <div
                          className={`h-1 rounded-full ${isSelected ? "bg-white" : "bg-indigo-500"}`}
                          style={{ width: `${max > 0 ? (v / max) * 100 : 0}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- Selected month detail --- */}
          {selected && (
            <div className="animate-pop mt-4 rounded-xl border border-indigo-600/15 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold tracking-tight text-neutral-900">
                    {selected.month} {selected.year} income
                  </p>
                  <p className="text-[12px] text-neutral-400">Click the month again or Close to dismiss</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(null)}
                  className="text-[12px] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  Close
                </button>
              </div>

              <p className="mt-1 text-[24px] font-semibold tracking-tight text-indigo-700">
                {formatINR(amountOf(selected, scope))}
              </p>

              {(() => {
                const prev = prevOf(selectedIdx);
                if (!prev) return <p className="mt-1 text-[12px] text-neutral-400">First tracked month — no comparison yet.</p>;
                const pv = amountOf(prev, scope);
                const diff = amountOf(selected, scope) - pv;
                const pct = pv > 0 ? (diff / pv) * 100 : null;
                return (
                  <p className={`mt-1 text-[12px] font-medium ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {diff >= 0 ? "▲" : "▼"} {formatINR(Math.abs(diff))} ({pct === null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}) vs {prev.month}
                  </p>
                );
              })()}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ${scope === "g1" ? "ring-indigo-600/30" : "ring-black/[0.05]"}`}>
                  <p className="text-[11px] font-medium text-neutral-400">Jatra Hotel</p>
                  <p className="text-[15px] font-semibold tabular-nums text-neutral-900">{formatINR(selected.g1)}</p>
                </div>
                <div className={`rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ${scope === "g2" ? "ring-indigo-600/30" : "ring-black/[0.05]"}`}>
                  <p className="text-[11px] font-medium text-neutral-400">Adgaon</p>
                  <p className="text-[15px] font-semibold tabular-nums text-neutral-900">{formatINR(selected.g2)}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                {selected.g1 > selected.g2
                  ? `Jatra Hotel led by ${formatINR(selected.g1 - selected.g2)} in ${selected.month}.`
                  : selected.g2 > selected.g1
                    ? `Adgaon led by ${formatINR(selected.g2 - selected.g1)} in ${selected.month}.`
                    : "Both branches collected equally."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}