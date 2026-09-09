"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMember, type ActionResult } from "@/lib/actions";
import { type Gym } from "@/lib/store";

const PLANS = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Daily Pass", "PT + Monthly"];

export function AddMemberForm({ gyms }: { gyms: Gym[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
      setOpen(false);
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

          <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name *</label>
              <input name="name" required className="field" placeholder="e.g. Aarav Gupta" />
            </div>
            <div>
              <label className="label">Gym</label>
              <select name="gymId" className="field">
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.location}
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
              <input name="endDate" type="date" required className="field" />
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