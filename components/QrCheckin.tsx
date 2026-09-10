"use client";

import { useActionState } from "react";
import { qrIdentify, qrWelcomeBackCheckin } from "@/lib/actions";
import type { QrResult } from "@/lib/actions";
import { formatDate, formatINR, memberStatus } from "@/lib/seed";
import type { Member } from "@/lib/seed";

const inputCls =
  "w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[16px] text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-400";

const btnCls =
  "w-full rounded-xl bg-indigo-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60";

function Banner({ children }: { children: React.ReactNode }) {
  return <div className="animate-pop rounded-xl bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700">{children}</div>;
}

export function QrCheckin({ code, remembered }: { code: string; remembered: Member | null }) {
  const [identifyState, identifyAction, identifyPending] = useActionState<QrResult | null, FormData>(qrIdentify, null);
  const [welcomeState, welcomeAction, welcomePending] = useActionState<QrResult | null, FormData>(qrWelcomeBackCheckin, null);
  const result = identifyState ?? welcomeState;
  const pending = identifyPending || welcomePending;

  if (result?.done) {
    return (
      <div className="animate-rise card p-8 text-center">
        <p className="text-[44px]">✅</p>
        <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-neutral-900">
          {result.name ? `See you inside, ${result.name.split(" ")[0]}!` : "You're in!"}
        </h2>
        <p className="mt-1.5 text-[14px] text-neutral-500">{result.done}</p>
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium leading-relaxed text-emerald-700">
          Saved on this phone — next visit just scan and tap “Check in”. Use the same browser for it to remember you.
        </p>
      </div>
    );
  }

  return (
    <>
      {result?.err && (
        <div className="mb-5">
          <Banner>{result.err}</Banner>
        </div>
      )}

      {remembered ? (
        <div className="animate-rise flex flex-col gap-4">
          <div className="card p-6 text-center">
            <p className="text-[13px] text-neutral-500">Welcome back,</p>
            <p className="text-[19px] font-semibold tracking-tight text-neutral-900">{remembered.name}</p>
            <p className="mx-auto mt-2 inline-block rounded-lg bg-indigo-50 px-3 py-1 font-mono text-[13px] font-semibold tracking-widest text-indigo-700">
              {remembered.id}
            </p>
            <p className="mt-2 text-[12px] text-neutral-400">
              {remembered.plan} · valid till {formatDate(remembered.endDate)} ·{" "}
              {memberStatus(remembered.endDate) === "expiring" ? "renewal due soon" : "active"}
            </p>
          </div>
          <form action={welcomeAction}>
            <input type="hidden" name="code" value={code} />
            <button type="submit" className={`${btnCls} py-4 text-[16px]`} disabled={pending}>
              Check in →
            </button>
          </form>
          <p className="text-center text-[12px] text-neutral-400">Not you? Check in from your own phone instead.</p>
        </div>
      ) : (
        <form action={identifyAction} className="animate-rise card flex flex-col gap-4 p-6">
          <input type="hidden" name="code" value={code} />
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Check in with your member ID</h2>
            <p className="mt-1 text-[13px] text-neutral-500">
              Enter the member ID you got from the front desk to mark attendance.
            </p>
          </div>
          <input
            className={inputCls}
            name="memberId"
            placeholder="e.g. KM7T2X"
            autoFocus
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className={`${btnCls} mt-1`} disabled={pending}>
            Check in
          </button>
          <p className="text-center text-[13px] text-neutral-400">
            New here? Ask the front desk for your member ID — it&apos;s your key to instant check-ins.
          </p>
          <div className="rounded-xl bg-neutral-50 px-4 py-3 text-[12px] leading-relaxed text-neutral-500">
            Demo: <b className="text-neutral-700">KM7T2X</b> active ({formatINR(24000)} yearly) ·{" "}
            <b className="text-neutral-700">R4X6Z2</b> expired (check-in blocked)
          </div>
        </form>
      )}
    </>
  );
}