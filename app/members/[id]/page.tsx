import Link from "next/link";
import { notFound } from "next/navigation";
import { store, memberStatus, daysUntil, formatDate, formatINR, toISODate, type Checkin } from "@/lib/store";
import { Badge, MemberAvatar } from "@/components/Badge";
import { CheckinButton } from "@/components/CheckinButton";
import { RenewButton } from "@/components/RenewButton";

export const dynamic = "force-dynamic";

function rel(date: string): string {
  const d = daysUntil(date);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  if (d < 0) return `${Math.abs(d)} days ago`;
  return `in ${d} days`;
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = store.members().find((m) => m.id === id);
  if (!member) notFound();

  const gym = store.gyms().find((g) => g.id === member.gymId);
  const gymOf = (gymId: string) => store.gyms().find((g) => g.id === gymId)?.name ?? "Branch";

  const checkins: Checkin[] = store.db.checkins
    .filter((c) => c.memberId === member.id)
    .sort((a, b) => (b.date === a.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));

  const status = memberStatus(member.endDate);
  const daysLeft = daysUntil(member.endDate);
  const last = checkins[0] ?? null;
  const todayStr = toISODate(new Date());

  const endLabel =
    status === "expired"
      ? `expired ${Math.abs(daysLeft)}d ago`
      : daysLeft === 0
        ? "ends today"
        : `${daysLeft}d left`;

  return (
    <div className="animate-fade">
      <Link
        href="/members"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
          <path d="M15 5 8.5 12 15 19" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to members
      </Link>

      {/* --- Profile card --- */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <MemberAvatar name={member.name} hue={member.imageHue} size={64} />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">{member.name}</h1>
                <Badge status={status} />
              </div>
              <p className="mt-1 text-[13px] text-neutral-500">
                {member.plan} · {formatINR(member.price)}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-400">
                <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-neutral-500">
                  {member.id}
                </span>
                {" · "}
                {gym?.name} · {gym?.location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CheckinButton memberId={member.id} disabled={status === "expired"} />
            <RenewButton memberId={member.id} />
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-2 gap-px border-t border-black/[0.05] bg-neutral-100/70 sm:grid-cols-4">
          {[
            { label: "Membership", value: endLabel },
            { label: "Started", value: formatDate(member.startDate) },
            { label: "Total check-ins", value: String(checkins.length) },
            { label: "Last visit", value: last ? rel(last.date) : "never" },
          ].map((s) => (
            <div key={s.label} className="bg-white px-5 py-3.5">
              <p className="text-[11px] font-medium text-neutral-400">{s.label}</p>
              <p className="mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight text-neutral-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- Membership + contact --- */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Membership</p>
          <dl className="mt-4 space-y-3">
            {[
              { label: "Plan", value: member.plan },
              { label: "Fee", value: formatINR(member.price) },
              { label: "Started", value: formatDate(member.startDate) },
              { label: "Expires", value: `${formatDate(member.endDate)} · ${endLabel}` },
              { label: "Status", value: status === "active" ? "Active" : status === "expiring" ? "Expiring soon" : "Expired" },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 text-[13px]">
                <dt className="text-neutral-400">{row.label}</dt>
                <dd className="text-right font-medium text-neutral-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5">
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Contact &amp; branch</p>
          <dl className="mt-4 space-y-3">
            {[
              { label: "Phone", value: member.phone },
              { label: "Email", value: member.email },
              { label: "Living address", value: member.address || "—" },
              { label: "Member ID", value: member.id, mono: true },
              { label: "Branch", value: gym?.name ?? "—" },
              { label: "Location", value: gym?.location ?? "—" },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 text-[13px]">
                <dt className="text-neutral-400">{row.label}</dt>
                <dd className={`text-right font-medium text-neutral-800 ${row.mono ? "font-mono tracking-wider" : ""}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --- Check-in history --- */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Check-in history</p>
            <p className="text-[13px] text-neutral-500">Every visit logged on the member&apos;s pass</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            {checkins.length} visit{checkins.length !== 1 ? "s" : ""}
          </span>
        </div>

        {checkins.length === 0 ? (
          <p className="px-5 pb-6 text-[13px] text-neutral-400">No check-ins yet — hit &quot;Check in&quot; to record the first visit.</p>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {checkins.map((c, i) => (
              <li key={c.id} className="animate-rise flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50/60" style={{ animationDelay: `${i * 30}ms` }}>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    c.date === todayStr ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M5 12.5 10 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-neutral-800">
                    {formatDate(c.date)}
                    <span className="ml-2 text-[11px] font-medium text-neutral-400">{c.time}</span>
                  </p>
                  <p className="truncate text-[11px] text-neutral-400">checked in at {gymOf(c.gymId)}</p>
                </div>
                {c.date === todayStr && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">today</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}