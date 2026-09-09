"use client";

import { useState } from "react";
import {
  formatINR,
  formatDate,
  memberStatus,
  type Gym,
  type Member,
} from "@/lib/seed";
import { Badge, MemberAvatar } from "./Badge";
import { CheckinButton } from "./CheckinButton";

export function MembersGrid({ members, gyms }: { members: Member[]; gyms: Gym[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  const q = query.trim().toLowerCase();
  const rows = members.filter((m) => {
    const status = memberStatus(m.endDate);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (q && !(m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.email.toLowerCase().includes(q)))
      return false;
    return true;
  });

  const gymName = (id: string) => gyms.find((g) => g.id === id)?.name ?? "—";

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400">
            <circle cx="10.5" cy="10.5" r="5" /><path d="M20 5.5A2.5 2.5 0 0 0 7 11.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or email…"
            className="field !pl-9"
          />
        </div>

        <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["expiring", "Expiring"],
            ["expired", "Expired"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as "all" | "active" | "expiring" | "expired")}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                statusFilter === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[13px] font-medium text-neutral-400">{rows.length} members</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.06] bg-neutral-50/70">
              <th className="px-4 py-2.5 font-medium text-neutral-500">Member</th>
              <th className="px-4 py-2.5 font-medium text-neutral-500">Gym</th>
              <th className="px-4 py-2.5 font-medium text-neutral-500">Plan</th>
              <th className="px-4 py-2.5 text-right font-medium text-neutral-500">Fee</th>
              <th className="px-4 py-2.5 font-medium text-neutral-500">Status</th>
              <th className="px-4 py-2.5 text-right font-medium text-neutral-500">Check in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {rows.map((m, i) => {
              const status = memberStatus(m.endDate);
              return (
                <tr key={m.id} className="animate-rise transition-colors hover:bg-neutral-50/60" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={m.name} hue={m.imageHue} size={34} />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-semibold text-neutral-900">{m.name}</p>
                        <p className="truncate text-[11px] text-neutral-400">{m.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{gymName(m.gymId)}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    <p className="font-medium">{m.plan}</p>
                    <p className="text-[11px] text-neutral-400">ends {formatDate(m.endDate)}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-neutral-800">
                    {formatINR(m.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <CheckinButton memberId={m.id} disabled={status === "expired"} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                  No members match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}