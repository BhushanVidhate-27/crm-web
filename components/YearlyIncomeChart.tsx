"use client";

import { useState } from "react";
import { formatINR, type RevenuePoint } from "@/lib/seed";

type Scope = "all" | "g1" | "g2";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "All branches" },
  { id: "g1", label: "Jatra Hotel" },
  { id: "g2", label: "Adgaon" },
];

function amountOf(d: RevenuePoint, scope: Scope): number {
  return scope === "all" ? d.amount : d[scope];
}

function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
  return Math.ceil(v / (pow / 2)) * (pow / 2);
}

const W = 680;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 30, left: 52 };

export function YearlyIncomeChart({ revenue, year }: { revenue: RevenuePoint[]; year: number }) {
  const [scope, setScope] = useState<Scope>("all");
  const [hover, setHover] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const values = revenue.map((r) => amountOf(r, scope));
  const max = niceCeil(Math.max(...values, 1));
  const total = values.reduce((s, v) => s + v, 0);
  const hovered = hover !== null ? revenue[hover] : null;
  const selectedIdx = revenue.findIndex((r) => r.month === selectedMonth);
  const selected = selectedIdx >= 0 ? revenue[selectedIdx] : null;
  const prevOf = (idx: number) => (idx > 0 ? revenue[idx - 1] : null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = revenue.length > 1 ? innerW / (revenue.length - 1) : innerW;

  const xOf = (i: number) => PAD.left + i * stepX;
  const yOf = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const linePath = revenue.map((r, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(amountOf(r, scope))}`).join(" ");
  const areaPath = `${linePath} L ${xOf(revenue.length - 1)} ${PAD.top + innerH} L ${xOf(0)} ${PAD.top + innerH} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const fmtK = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors duration-150 cursor-pointer ${
      active
        ? "bg-indigo-600 text-white ring-indigo-600"
        : "bg-white text-neutral-500 ring-black/[0.08] hover:bg-neutral-50 hover:text-neutral-800"
    }`;

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Past income · {year}</p>
          <p className="text-[13px] text-neutral-500">Month-by-month collection history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SCOPES.map((s) => (
            <button key={s.id} type="button" onClick={() => setScope(s.id)} className={chip(scope === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4">
        <span className="text-[13px] text-neutral-400">
          Year total <span className="font-semibold tabular-nums text-neutral-900">{formatINR(total)}</span>
        </span>
        <span className="text-[13px] text-neutral-400">
          Peak month <span className="font-semibold tabular-nums text-neutral-900">{formatINR(Math.max(...values, 0))}</span>
        </span>
      </div>

      {revenue.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-[13px] text-neutral-400">No income history yet</div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Yearly income chart"
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
          {revenue.map((r, i) => {
            const v = amountOf(r, scope);
            const isHover = hover === i;
            const isSelected = selectedMonth === r.month;
            return (
              <g key={r.month}>
                {/* selection highlight column */}
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
                {/* wide invisible column for easy hovering + click to open month */}
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
                {/* value bubble on hover */}
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

          {/* hovered month breakdown */}
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
      )}

      {/* --- Selected month detail --- */}
      {selected && (
        <div className="animate-pop mt-4 rounded-xl border border-indigo-600/15 bg-indigo-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold tracking-tight text-neutral-900">
                {selected.month} {year} income
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

          {/* Only meaningful when a single branch is selected */}
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

      {/* Monthly income, one row per branch with months across */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-black/[0.05]">
        <table className="w-full min-w-[640px] text-center text-[12px]">
          <thead>
            <tr className="border-b border-black/[0.06] bg-neutral-50/70 text-[11px] uppercase tracking-wide text-neutral-400">
              <th className="px-3 py-2 text-left font-semibold">Branch</th>
              {revenue.map((r) => (
                <th
                  key={r.month}
                  onClick={() => setSelectedMonth(selectedMonth === r.month ? null : r.month)}
                  className={`cursor-pointer whitespace-nowrap px-3 py-2 font-semibold transition-colors hover:text-neutral-700 ${
                    selectedMonth === r.month ? "bg-indigo-50 text-indigo-700" : ""
                  } ${hover !== null && revenue[hover]?.month === r.month ? "text-indigo-600" : ""}`}
                >
                  {r.month}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold text-neutral-900">Year {year}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {([
              { label: "Jatra Hotel", get: (r: RevenuePoint) => r.g1, cls: "text-neutral-600" },
              { label: "Adgaon", get: (r: RevenuePoint) => r.g2, cls: "text-neutral-600" },
              { label: "Combined", get: (r: RevenuePoint) => r.amount, cls: "font-semibold text-neutral-900" },
            ] as const).map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-neutral-50/60">
                <td className="whitespace-nowrap px-3 py-2 text-left font-semibold text-neutral-800">{row.label}</td>
                {revenue.map((r) => {
                  const isSel = selectedMonth === r.month;
                  const isHovered = hover !== null && revenue[hover]?.month === r.month;
                  return (
                    <td
                      key={r.month}
                      onClick={() => setSelectedMonth(isSel ? null : r.month)}
                      className={`cursor-pointer whitespace-nowrap px-3 py-2 text-right tabular-nums transition-colors ${row.cls} ${
                        isSel ? "bg-indigo-50 font-bold text-indigo-700" : isHovered ? "bg-indigo-50/50" : ""
                      }`}
                    >
                      {formatINR(row.get(r))}
                    </td>
                  );
                })}
                <td
                  className={`whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums ${
                    row.label === "Combined" ? "text-indigo-700" : "text-neutral-900"
                  }`}
                >
                  {formatINR(revenue.reduce((s, r) => s + row.get(r), 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">
        Tip: click any month column to see its breakdown above.
      </p>
    </div>
  );
}
