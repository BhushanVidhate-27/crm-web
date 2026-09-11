"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, type Memory } from "@/lib/seed";
import { deleteMemory } from "@/lib/actions";
import { memoryTagClass } from "./MemoryUpload";

function timeOf(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(iso.slice(0, 10))} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function MemoryGallery({ memories }: { memories: Memory[] }) {
  const router = useRouter();
  const [tag, setTag] = useState("All");
  const [open, setOpen] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tags = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => set.add(m.tag));
    return ["All", ...set];
  }, [memories]);

  const shown = tag === "All" ? memories : memories.filter((m) => m.tag === tag);

  async function remove(mem: Memory) {
    if (!window.confirm(`Delete this memory${mem.caption ? ` — "${mem.caption}"` : ""}?`)) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", mem.id);
    await deleteMemory(fd);
    setDeleting(false);
    setOpen(null);
    router.refresh();
  }

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors duration-150 cursor-pointer ${
      active
        ? "bg-indigo-600 text-white ring-indigo-600"
        : "bg-white text-neutral-500 ring-black/[0.08] hover:bg-neutral-50 hover:text-neutral-800"
    }`;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">The vault</p>
          <p className="text-[13px] text-neutral-500">Every good day at both branches, kept forever.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
          {memories.length} {memories.length !== 1 ? "memories" : "memory"}
        </span>
      </div>

      {memories.length === 0 ? (
        <div className="px-5 pb-8 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
              <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
              <path d="M3 10h18M8 8h.01M8 14.5h8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-neutral-600">No memories yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-neutral-400">
            Upload the first photo above and start the vault. Future-you will thank present-you.
          </p>
        </div>
      ) : (
        <>
          {tags.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
              {tags.map((t) => (
                <button key={t} type="button" onClick={() => setTag(t)} className={chip(tag === t)}>
                  {t}
                </button>
              ))}
            </div>
          )}

          <ul className="grid grid-cols-3 gap-2.5 px-5 pb-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {shown.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setOpen(m)}
                  className="group w-full overflow-hidden rounded-lg bg-neutral-50 text-left ring-1 ring-inset ring-black/[0.05] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/${m.file}`}
                    alt={m.caption}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="p-2">
                    <p className="truncate text-[12px] font-semibold text-neutral-800">{m.caption}</p>
                    <div className="mt-1 flex items-center justify-between gap-1.5">
                      <span className={`inline-flex rounded-full px-1.5 py-px text-[9px] font-semibold ${memoryTagClass(m.tag)}`}>
                        {m.tag}
                      </span>
                      <span className="text-[9px] tabular-nums text-neutral-400">{timeOf(m.createdAt)}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {shown.length === 0 && (
            <p className="px-5 pb-6 text-center text-[13px] text-neutral-400">No memories tagged &quot;{tag}&quot; yet.</p>
          )}
        </>
      )}

      {/* --- Lightbox --- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:p-10"
          onClick={() => setOpen(null)}
        >
          <div
            className="animate-pop flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-none bg-neutral-50/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-neutral-900">{open.caption}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${memoryTagClass(open.tag)}`}>
                      {open.tag}
                    </span>
                    {timeOf(open.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${open.file}`} alt={open.caption} className="max-h-[60vh] w-full bg-neutral-100 object-contain" />

            <div className="flex flex-none items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => remove(open)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                {deleting ? (
                  "Deleting…"
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[12px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}