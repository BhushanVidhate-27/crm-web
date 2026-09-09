"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-500 active:scale-[0.97]"
    >
      Print all posters
    </button>
  );
}
