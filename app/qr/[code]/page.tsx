import { store } from "@/lib/store";
import { parseQrCode } from "@/lib/qr";
import { getRememberedMember } from "@/lib/actions";
import { QrCheckin } from "@/components/QrCheckin";

export const dynamic = "force-dynamic";

export default async function QrScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
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

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/25">
          {gym.initials}
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">{gym.name}</h1>
        <p className="text-[13px] text-neutral-500">{qr.label} check-in</p>
      </div>

      <QrCheckin code={code} remembered={remembered} />
    </main>
  );
}