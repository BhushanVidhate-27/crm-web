"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setActiveGym } from "@/lib/actions";
import { type Gym } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/members", label: "Members", icon: "users" },
  { href: "/qr-codes", label: "Gym QR", icon: "qr" },
  { href: "/reports", label: "Owner Intel", icon: "chart" },
  { href: "/billing", label: "Billing", icon: "card" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3 2.6-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <path d="M15.5 5.1a3.2 3.2 0 0 1 0 5.8M17.6 14.8c1.4.5 2.4 1.6 2.9 3.7" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M4 19V5M4 19h16" /><path d="M8 16l3.5-4 3 2.5L18 9" />
    </svg>
  ),
  qr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20.5 14v.01M20.5 17.5v3M14 20.5v.01M17.5 20.5h.01" />
    </svg>
  ),
};

export function Sidebar({ gyms, activeGymId }: { gyms: Gym[]; activeGymId: string | null }) {
  const pathname = usePathname();

  /* Only the dashboard consumes the active gym, so only highlight there. */
  const gymItemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer ${
      active
        ? "border-indigo-600/20 bg-indigo-50"
        : "border-black/[0.05] bg-white hover:border-black/[0.1] hover:bg-neutral-50"
    }`;
  const isGymActive = (id: string) => pathname === "/dashboard" && activeGymId === id;
  const isAllActive = pathname === "/dashboard" && !activeGymId;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/[0.06] bg-white/80 px-4 py-6 backdrop-blur md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
          G
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">MadabolicX</p>
          <p className="text-[11px] text-neutral-500">Owner console</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <span className={active ? "text-indigo-600" : "text-neutral-400 group-hover:text-neutral-600"}>
                {ICONS[item.icon]}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Your gyms</p>
        <div className="flex flex-col gap-1.5">
          <form action={setActiveGym}>
            <input type="hidden" name="gymId" value="" />
            <button type="submit" className={gymItemClass(isAllActive)}>
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  isAllActive ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {ICONS.grid}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-semibold text-neutral-800">All branches</p>
                <p className="truncate text-[11px] text-neutral-400">across every gym</p>
              </div>
            </button>
          </form>
          {gyms.map((g) => {
            const active = isGymActive(g.id);
            return (
              <form key={g.id} action={setActiveGym}>
                <input type="hidden" name="gymId" value={g.id} />
                <button type="submit" className={gymItemClass(active)}>
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                      active ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {g.initials}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[13px] font-semibold text-neutral-800">{g.name}</p>
                    <p className="truncate text-[11px] text-neutral-400">{g.location}</p>
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </aside>
  );
}