const ICONS = {
  checkin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M5 12.5 10 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path d="M18 10a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  ),
};

export type PassActivity = {
  key: string;
  type: "checkin" | "alert";
  at: string;
  memberName: string;
  hue: number;
  detail: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function PassActivityFeed({ items }: { items: PassActivity[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Recent activities</p>
          <p className="text-[13px] text-neutral-500">Latest pass check-ins and alerts sent</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="px-5 pb-6 text-[13px] text-neutral-400">
          Nothing yet — activities appear as members check in and alerts go out.
        </p>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {items.map((item, i) => (
            <li
              key={item.key}
              className="animate-rise flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/60"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <MemberAvatarDot hue={item.hue} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-neutral-800">
                  {item.memberName}
                  <span
                    className={`ml-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      item.type === "checkin"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    {ICONS[item.type]}
                    {item.type === "checkin" ? "Pass used" : "Alert sent"}
                  </span>
                </p>
                <p className="truncate text-[11px] text-neutral-400">{item.detail}</p>
              </div>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-neutral-400">
                {timeAgo(item.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberAvatarDot({ hue }: { hue: number }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: `hsl(${hue} 60% 55%)` }}
    />
  );
}
