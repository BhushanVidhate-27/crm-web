"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIn, type ActionResult } from "@/lib/actions";

export function CheckinButton({ memberId, disabled }: { memberId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const res = await checkIn(fd);
    setMsg(res);
    setBusy(false);
    router.refresh();
    if (res.ok && formRef.current) formRef.current.reset();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form ref={formRef} onSubmit={onSubmit}>
        <input type="hidden" name="memberId" value={memberId} />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[12px] font-semibold text-indigo-700 transition-all duration-150 hover:bg-indigo-600 hover:text-white active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-50 disabled:hover:text-indigo-700"
        >
          {busy ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600/30 border-t-indigo-600" />
          ) : (
            <>
              Check in
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </form>
      {msg && (
        <p
          className={`animate-pop max-w-[180px] rounded-lg px-2 py-1 text-right text-[11px] font-medium ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.message}
        </p>
      )}
    </div>
  );
}