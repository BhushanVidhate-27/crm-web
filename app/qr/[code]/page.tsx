import { store, memberStatus, formatDate, formatINR } from "@/lib/store";
import { parseQrCode } from "@/lib/qr";
import { qrIdentify, qrRegister, qrWelcomeBackCheckin, getRememberedMember } from "@/lib/actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[16px] text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-400";

const btnCls =
  "w-full rounded-xl bg-indigo-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:bg-indigo-500 active:scale-[0.98]";

function Banner({ children }: { children: React.ReactNode }) {
  return <div className="animate-pop rounded-xl bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700">{children}</div>;
}

export default async function QrScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const qr = parseQrCode(code);

  if (!qr) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[40px]">🤔</p>
        <h1 className="text-[20px] font-semibold text-neutral-900">Invalid gym code</h1>
        <p className="text-[14px] text-neutral-500">This QR doesn&apos;t match any gym poster. Try the entrance QR.</p>
      </main>
    );
  }

  const gym = store.gyms().find((g) => g.id === qr.gymId)!;
  const remembered = await getRememberedMember();
  const { err, done, name, phone } = sp;
  const isRegister = sp.step === "register";
  const newMember = sp.new === "1";

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/25">
          {gym.initials}
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">{gym.name}</h1>
        <p className="text-[13px] text-neutral-500">{qr.label} check-in</p>
      </div>

      {err && <div className="mb-5"><Banner>{err}</Banner></div>}

      {done ? (
        <div className="animate-rise card p-8 text-center">
          <p className="text-[44px]">✅</p>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-neutral-900">
            {name ? `See you inside, ${name.split(" ")[0]}!` : "You're in!"}
          </h2>
          <p className="mt-1.5 text-[14px] text-neutral-500">{done}</p>
          {newMember && (
            <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-[13px] font-medium text-indigo-700">
              Membership active. Payment is collected at the front desk — scan again tomorrow for instant check-in.
            </p>
          )}
        </div>
      ) : isRegister ? (
        <form action={qrRegister} className="animate-rise card flex flex-col gap-4 p-6">
          <input type="hidden" name="code" value={code} />
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">First time here?</h2>
            <p className="mt-1 text-[13px] text-neutral-500">
              We couldn&apos;t find <span className="font-semibold text-neutral-700">+91 {phone}</span>. Register once —
              every visit after this is a single scan.
            </p>
          </div>
          <input className={inputCls} name="name" placeholder="Full name" required autoComplete="name" />
          <input className={inputCls} name="phone" placeholder="Phone number" inputMode="numeric" defaultValue={phone} required autoComplete="tel" />
          <input className={inputCls} name="email" type="email" placeholder="Email (optional)" autoComplete="email" />
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-neutral-500">Choose a plan</label>
            <select className={inputCls} name="plan" defaultValue="Monthly">
              <option>Monthly — ₹2,500</option>
              <option>Quarterly — ₹6,000</option>
              <option>Half-Yearly — ₹12,000</option>
              <option>Yearly — ₹24,000</option>
            </select>
          </div>
          <button type="submit" className={`${btnCls} mt-1`}>Register &amp; check in</button>
        </form>
      ) : remembered ? (
        <div className="animate-rise flex flex-col gap-4">
          <div className="card p-6 text-center">
            <p className="text-[13px] text-neutral-500">Welcome back,</p>
            <p className="text-[19px] font-semibold tracking-tight text-neutral-900">{remembered.name}</p>
            <p className="mt-1 text-[12px] text-neutral-400">
              {remembered.plan} · valid till {formatDate(remembered.endDate)} ·{" "}
              {memberStatus(remembered.endDate) === "expiring" ? "renewal due soon" : "active"}
            </p>
          </div>
          <form action={qrWelcomeBackCheckin}>
            <input type="hidden" name="code" value={code} />
            <button type="submit" className={`${btnCls} py-4 text-[16px]`}>Check in →</button>
          </form>
          <p className="text-center text-[12px] text-neutral-400">Not you? Scan on your own phone instead.</p>
        </div>
      ) : (
        <form action={qrIdentify} className="animate-rise card flex flex-col gap-4 p-6">
          <input type="hidden" name="code" value={code} />
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Check in with your phone</h2>
            <p className="mt-1 text-[13px] text-neutral-500">Enter your registered mobile number to mark attendance.</p>
          </div>
          <input className={inputCls} name="phone" placeholder="10-digit mobile number" inputMode="numeric" autoFocus required autoComplete="tel" />
          <button type="submit" className={`${btnCls} mt-1`}>Check in</button>
          <p className="text-center text-[13px] text-neutral-400">
            New here? Enter any number — we&apos;ll take your details next.
          </p>
          <div className="rounded-xl bg-neutral-50 px-4 py-3 text-[12px] leading-relaxed text-neutral-500">
            Demo numbers: <b className="text-neutral-700">9810010001</b> active ({formatINR(24000)} yearly) ·{" "}
            <b className="text-neutral-700">9820020004</b> expired (check-in blocked)
          </div>
        </form>
      )}
    </main>
  );
}
