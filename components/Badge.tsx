import { type MemberStatus } from "@/lib/store";

const STYLES: Record<MemberStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  expiring: "bg-amber-50 text-amber-700 ring-amber-600/25",
  expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const LABEL: Record<MemberStatus, string> = {
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
};

export function Badge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[status]}
    </span>
  );
}

export function MemberAvatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, hsl(${hue} 60% 55%), hsl(${hue + 20} 60% 42%))`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </span>
  );
}