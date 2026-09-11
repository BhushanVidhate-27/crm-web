"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMember, type ActionResult } from "@/lib/actions";
import { type Gym } from "@/lib/store";

const PLANS = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Daily Pass", "PT + Monthly"];

/* How many months each plan lasts (0 = pass, priced per day). */
const PLAN_MONTHS: Record<string, number> = {
  "Monthly": 1,
  "Quarterly": 3,
  "Half-Yearly": 6,
  "Yearly": 12,
  "PT + Monthly": 1,
  "Daily Pass": 0,
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* End date = start date + plan length. Mirrors the renew logic in
   lib/store.ts: calendar months, clamping overflow days (31 Mar + 1mo -> 30 Apr). */
function computeEndDate(plan: string, startDate: string): string | null {
  const months = PLAN_MONTHS[plan] ?? 0;
  if (!startDate || months <= 0) return null;
  const [y, m, d] = startDate.split("-").map(Number);
  const end = new Date(y, m - 1 + months, d);
  return toISODate(end);
}

export function AddMemberForm({ gyms }: { gyms: Gym[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [endDate, setEndDate] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const res = await addMember(fd);
    setMsg(res);
    setBusy(false);
    router.refresh();
    if (res.ok && formRef.current) {
      formRef.current.reset();
      setEndDate("");
      setAutoFilled(false);
      setOpen(false);
    }
  }

  /* Re-compute the end date whenever plan or start date changes. */
  function syncEndDate(form: HTMLFormElement) {
    const fd = new FormData(form);
    const end = computeEndDate(String(fd.get("plan") ?? ""), String(fd.get("startDate") ?? ""));
    if (end) {
      setEndDate(end);
      setAutoFilled(true);
    }
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add member
        </button>
      ) : (
        <div className="card animate-pop p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">Add a new member</h3>
            <button
              onClick={() => {
                setOpen(false);
                setMsg(null);
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form
            ref={formRef}
            onSubmit={onSubmit}
            onChange={(e) => syncEndDate(e.currentTarget)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="label">Full name *</label>
              <input name="name" required className="field" placeholder="e.g. Aarav Gupta" />
            </div>
            <div>
              <label className="label">Gym</label>
              <select name="gymId" className="field">
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="field" placeholder="+91 98xxx xxxxx" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="field" placeholder="name@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Living address</label>
              <input name="address" className="field" placeholder="e.g. 14, MG Road, Indiranagar, Bengaluru 560038" />
            </div>
            <div>
              <label className="label">Plan</label>
              <select name="plan" className="field" defaultValue="Monthly">
                {PLANS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input name="price" type="number" className="field" placeholder="2500" />
            </div>
            <div>
              <label className="label">Start date</label>
              <input name="startDate" type="date" className="field" />
            </div>
            <div>
              <label className="label">End date *</label>
              <input
                name="endDate"
                type="date"
                required
                className="field"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setAutoFilled(false);
                }}
              />
              {autoFilled && (
                <p className="mt-1 text-[11px] font-medium text-emerald-600">
                  Auto-filled from plan length — edit it if needed.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? "Adding…" : "Save member"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              {msg && (
                <p
                  className={`animate-pop text-[12px] font-medium ${
                    msg.ok ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {msg.message}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}