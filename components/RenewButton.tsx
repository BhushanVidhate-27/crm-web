"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renewMember, type ActionResult } from "@/lib/actions";

export function RenewButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function renew(months: number) {
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("months", String(months));
    const res = await renewMember(fd);
    setMsg(res);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-1.5">
        {[1, 3, 6].map((m) => (
          <button
            key={m}
            onClick={() => renew(m)}
            disabled={busy}
            className="rounded-lg border border-black/[0.08] bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
          >
            +{m}m
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