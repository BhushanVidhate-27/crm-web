"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renewMember, type ActionResult } from "@/lib/actions";

const OPTIONS = [
  { label: "Monthly", months: 1 },
  { label: "Quarterly", months: 3 },
  { label: "Half-Yearly", months: 6 },
  { label: "Yearly", months: 12 },
];

export function RenewButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function renew(months: number) {
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("months", String(months));
    const res = await renewMember(fd);
    setMsg(res);
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setOpen(!open)}
          disabled={busy}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            open
              ? "border-indigo-600/20 bg-indigo-50 text-indigo-700"
              : "border-black/[0.08] bg-white text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
        >
          {busy ? "Renewing…" : open ? "Cancel" : "Renew"}
        </button>

        {open &&
          OPTIONS.map((o) => (
            <button
              key={o.label}
              onClick={() => renew(o.months)}
              disabled={busy}
              className="animate-pop rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
              style={{ animationDelay: "0ms" }}
            >
              {o.label}
            </button>
          ))}
      </div>
      {msg && (
        <p className={`animate-pop text-[11px] font-medium ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>
          {msg.message}
        </p>
      )}
    </div>
  );
}