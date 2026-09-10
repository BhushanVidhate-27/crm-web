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

function computeGrowth(data: RevenuePoint[], scope: Scope): number | null {
  if (data.length < 2) return null;
  const prev = amountOf(data[data.length - 2], scope);
  const curr = amountOf(data[data.length - 1], scope);
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

/* Round y-axis top so gridlines land on clean numbers (e.g. 150k, not 139.2k). */
function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
  return Math.ceil(v / (pow / 2)) * (pow / 2);
}

const W = 640; // svg viewBox width
const H = 260; // svg viewBox height
const PAD = { top: 24, right: 12, bottom: 28, left: 48 };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [scope, setScope] = useState<Scope>("all");
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const values = data.map((d) => amountOf(d, scope));
  const max = data.length ? niceCeil(Math.max(...values)) : 1;
  const total = values.reduce((s, v) => s + v, 0);
  const growth = computeGrowth(data, scope);
  const selected = data.find((d) => d.month === openMonth) ?? null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(data.length, 1);
  const barW = slot * 0.55;
  const yOf = (v: number) => PAD.top + innerH - (v / max) * innerH;

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
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Monthly revenue</p>
          <p className="text-[13px] text-neutral-500">Collection across all gyms</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {SCOPES.map((s) => (
              <button key={s.id} type="button" onClick={() => setScope(s.id)} className={chip(scope === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        {data.length > 0 && (
          <span className="text-[12px] text-neutral-400 tabular-nums">Total {formatINR(total)}</span>
        )}
        {growth !== null && (
          <p className={`text-[13px] font-semibold ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}% vs last
          </p>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-[13px] text-neutral-400">No revenue data yet</div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-56 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="Monthly revenue bar chart"
          >
            <defs>
              <linearGradient id="bar-active" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>

            {/* Gridlines + y-axis labels */}
            {gridVals.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={yOf(v)}
                  y2={yOf(v)}
                  stroke="rgb(0 0 0 / 0.06)"
                  strokeWidth="1"
                />
                <text x={PAD.left - 8} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="#a3a3a3">
                  {fmtK(v)}
                </text>
              </g>
            ))}

            {/* Bars: click a month bar to open its breakdown */}
            {data.map((d, i) => {
              const v = amountOf(d, scope);
              const x = PAD.left + i * slot + (slot - barW) / 2;
              const y = yOf(v);
              const h = Math.max(PAD.top + innerH - y, 2);
              const isOpen = openMonth === d.month;
              const isLast = i === data.length - 1;
              return (
                <g
                  key={d.month}
                  onClick={() => setOpenMonth(isOpen ? null : d.month)}
                  className="cursor-pointer"
                >
                  {/* full-height hit area so even the empty space above a short bar is clickable */}
                  <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="6"
                    fill={isOpen || (isLast && !openMonth) ? "url(#bar-active)" : "#dce0ee"}
                    className="transition-opacity hover:opacity-80"
                  >
                    <title>{`${d.month}: ${formatINR(v)} — click for breakdown`}</title>
                  </rect>
                  <text
                    x={x + barW / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isOpen ? "700" : "500"}
                    fill={isOpen ? "#4f46e5" : "#a3a3a3"}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Month breakdown panel */}
          {selected && (
            <div className="animate-pop mt-3 rounded-xl border border-indigo-600/15 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold tracking-tight text-neutral-900">
                  {selected.month} revenue
                </p>
                <button
                  type="button"
                  onClick={() => setOpenMonth(null)}
                  className="text-[12px] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  Close
                </button>
              </div>
              <p className="mt-1 text-[22px] font-semibold tracking-tight text-indigo-700">
                {formatINR(amountOf(selected, scope))}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-black/[0.05]">
                  <p className="text-[11px] font-medium text-neutral-400">Jatra Hotel</p>
                  <p className="text-[15px] font-semibold tabular-nums text-neutral-900">{formatINR(selected.g1)}</p>
                </div>
                <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-black/[0.05]">
                  <p className="text-[11px] font-medium text-neutral-400">Adgaon</p>
                  <p className="text-[15px] font-semibold tabular-nums text-neutral-900">{formatINR(selected.g2)}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                {selected.g1 > selected.g2
                  ? `Jatra Hotel led by ${formatINR(selected.g1 - selected.g2)} this month.`
                  : selected.g2 > selected.g1
                    ? `Adgaon led by ${formatINR(selected.g2 - selected.g1)} this month.`
                    : "Both branches collected equally."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
