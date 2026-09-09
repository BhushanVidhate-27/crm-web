"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendReminders, type ActionResult } from "@/lib/actions";

export function SendRemindersButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await sendReminders();
    setMsg(res);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button onClick={run} disabled={busy} className={`btn-primary ${className}`}>
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M12 3v3M8 5.5 9.4 7M16 5.5 14.6 7" strokeLinecap="round" />
            <rect x="4" y="9" width="16" height="11" rx="2" />
            <path d="M4 12h16M8 16h3" strokeLinecap="round" />
          </svg>
        )}
        {busy ? "Sending reminders..." : "Send renewal reminders"}
      </button>
      {msg && (
        <p
          className={`animate-pop rounded-lg px-2.5 py-1 text-right text-[12px] font-medium ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.message}
        </p>
      )}
    </div>
  );
}