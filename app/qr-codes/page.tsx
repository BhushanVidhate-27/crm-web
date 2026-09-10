import { headers } from "next/headers";
import QRCode from "qrcode";
import { store } from "@/lib/store";
import { allQrCodes } from "@/lib/qr";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function QrCodesPage() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const base = `${proto}://${host}`;

  const gyms = store.gyms();
  const posters = await Promise.all(
    allQrCodes().map(async (q) => ({
      ...q,
      gym: gyms.find((g) => g.id === q.gymId)!,
      url: `${base}/qr/${q.code}`,
      dataUrl: await QRCode.toDataURL(`${base}/qr/${q.code}`, { width: 512, margin: 1 }),
    }))
  );

  return (
    <div className="animate-fade">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Gym QR check-in posters</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Two posters per gym — entrance and main floor. Print, frame, hang. Members scan and check themselves in.
          </p>
        </div>
        <PrintButton />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {gyms.map((gym) => (
          <section key={gym.id} className="card overflow-hidden p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100 text-[12px] font-bold text-neutral-600">
                {gym.initials}
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-neutral-900">{gym.name}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {posters
                .filter((p) => p.gymId === gym.id)
                .map((p) => (
                  <div
                    key={p.code}
                    className="rounded-2xl border border-black/[0.06] bg-white p-5 text-center shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600">{p.label}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt={`Check-in QR for ${p.gym.name} ${p.label}`} className="mx-auto my-4 h-40 w-40 rounded-lg" />
                    <p className="text-[14px] font-semibold text-neutral-900">Scan to check in</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                      Point your camera here. First visit takes 30 seconds — after that it&apos;s instant.
                    </p>
                    <p className="mt-2 truncate text-[10px] text-neutral-300">{p.url}</p>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-neutral-400 print:hidden">
        Tip: test each poster by scanning it with your phone before hanging it up.
      </p>
    </div>
  );
}
