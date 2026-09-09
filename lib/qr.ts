/* ------------------------------------------------------------------ */
/*  Gym QR check-in codes                                              */
/*  Two QR posters hang in every gym: one at the entrance, one on      */
/*  the main floor. Codes are deterministic so they never rot.         */
/* ------------------------------------------------------------------ */

export type QrCode = { code: string; gymId: string; label: string };

const QR_STATIONS = ["Entrance", "Main floor"] as const;

export function allQrCodes(): QrCode[] {
  return QR_STATIONS.map((label, i) => ({
    code: `g1-${i === 0 ? "entrance" : "floor"}`,
    gymId: "g1",
    label,
  })).concat(
    QR_STATIONS.map((label, i) => ({
      code: `g2-${i === 0 ? "entrance" : "floor"}`,
      gymId: "g2",
      label,
    }))
  );
}

export function parseQrCode(code: string): QrCode | null {
  return allQrCodes().find((q) => q.code === code) ?? null;
}
