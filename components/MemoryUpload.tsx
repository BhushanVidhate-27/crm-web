"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMemory, type ActionResult } from "@/lib/actions";

const TAGS = ["Events", "Workouts", "Celebrations", "Outings", "Vibes"];
const TAG_COLORS: Record<string, string> = {
  Events: "bg-indigo-50 text-indigo-700",
  Workouts: "bg-emerald-50 text-emerald-700",
  Celebrations: "bg-rose-50 text-rose-700",
  Outings: "bg-amber-50 text-amber-700",
  Vibes: "bg-sky-50 text-sky-700",
};

export const memoryTagClass = (tag: string) => TAG_COLORS[tag] ?? "bg-neutral-100 text-neutral-600";

export function MemoryUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const res = await addMemory(fd);
    setMsg(res);
    setBusy(false);
    if (res.ok) {
      formRef.current?.reset();
      setPreview(null);
      router.refresh();
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Add a memory</p>
        <p className="text-[13px] text-neutral-500">
          Drop a photo from a workout, an event or just the crew being the crew.
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-3">
          <label
            className="grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 transition-colors hover:border-indigo-400 hover:text-indigo-600"
            title="Choose a photo"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                <path d="M12 6v12M6 12h12" strokeLinecap="round" />
              </svg>
            )}
            <input name="photo" type="file" accept="image/*" className="hidden" required onChange={onFile} />
          </label>

          <div className="flex flex-col gap-2">
            <input
              name="caption"
              className="field !py-2 !text-[13px] sm:min-w-[260px]"
              placeholder="Caption the moment…"
              maxLength={120}
            />
            <select name="tag" defaultValue="Events" className="field !w-auto !py-2 !text-[12px]">
              {TAGS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Uploading…" : "Share it"}
          </button>
          {msg && (
            <p className={`animate-pop text-[12px] font-medium ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {msg.message}
            </p>
          )}
        </div>
      </form>

      <p className="mt-3 text-[11px] text-neutral-400">Photos up to 10 MB.</p>
    </div>
  );
}