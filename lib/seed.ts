/* Types, date helpers and seed data for GymOS. */

export type Gym = { id: string; name: string; location: string; initials: string; capacity: number };
export type MemberStatus = "active" | "expiring" | "expired";

export type Member = {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  email: string;
  plan: string;
  price: number;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  imageHue: number;
};

export type Checkin = { id: string; memberId: string; gymId: string; date: string; time: string };
export type RevenuePoint = { month: string; amount: number };
export type Channel = "email" | "whatsapp";
export type Notification = {
  id: string;
  memberId: string;
  channel: Channel;
  kind: string;
  sentAt: string; // ISO datetime
  subject: string;
  body: string;
  ref: string;
  delivered: boolean;
};
export type DB = {
  gyms: Gym[];
  members: Member[];
  checkins: Checkin[];
  revenue: RevenuePoint[];
  notifications: Notification[];
};

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const now = new Date();
  const target = new Date(y, m - 1, d);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function memberStatus(endDate: string): MemberStatus {
  const days = daysUntil(endDate);
  if (days < 0) return "expired";
  if (days <= 7) return "expiring";
  return "active";
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildSeed(): DB {
  const gyms: Gym[] = [
    { id: "g1", name: "Iron Forge", location: "Indiranagar, Bengaluru", initials: "IF", capacity: 120 },
    { id: "g2", name: "Lift Lab", location: "Bandra West, Mumbai", initials: "LL", capacity: 90 },
  ];

  const members: Member[] = [
    { id: "m1", gymId: "g1", name: "Arjun Mehta", phone: "+91 98100 10001", email: "arjun@example.com", plan: "Yearly", price: 24000, startDate: daysFromToday(-320), endDate: daysFromToday(45), imageHue: 12 },
    { id: "m2", gymId: "g1", name: "Priya Sharma", phone: "+91 98100 10002", email: "priya@example.com", plan: "Quarterly", price: 6000, startDate: daysFromToday(-40), endDate: daysFromToday(50), imageHue: 220 },
    { id: "m3", gymId: "g1", name: "Rohan Iyer", phone: "+91 98100 10003", email: "rohan@example.com", plan: "Monthly", price: 2500, startDate: daysFromToday(-20), endDate: daysFromToday(10), imageHue: 90 },
    { id: "m4", gymId: "g1", name: "Sneha Kulkarni", phone: "+91 98100 10004", email: "sneha@example.com", plan: "Daily Pass", price: 300, startDate: daysFromToday(-3), endDate: daysFromToday(1), imageHue: 320 },
    { id: "m5", gymId: "g1", name: "Vikram Singh", phone: "+91 98100 10005", email: "vikram@example.com", plan: "Half-Yearly", price: 12000, startDate: daysFromToday(-180), endDate: daysFromToday(25), imageHue: 45 },
    { id: "m6", gymId: "g2", name: "Aditi Rao", phone: "+91 98200 20001", email: "aditi@example.com", plan: "Yearly", price: 26000, startDate: daysFromToday(-200), endDate: daysFromToday(165), imageHue: 150 },
    { id: "m7", gymId: "g2", name: "Karan Chopra", phone: "+91 98200 20002", email: "karan@example.com", plan: "Quarterly", price: 7000, startDate: daysFromToday(-70), endDate: daysFromToday(20), imageHue: 30 },
    { id: "m8", gymId: "g2", name: "Meera Nair", phone: "+91 98200 20003", email: "meera@example.com", plan: "Monthly", price: 2800, startDate: daysFromToday(-12), endDate: daysFromToday(4), imageHue: 260 },
    { id: "m9", gymId: "g2", name: "Dev Patel", phone: "+91 98200 20004", email: "dev@example.com", plan: "PT + Monthly", price: 8000, startDate: daysFromToday(-30), endDate: daysFromToday(-5), imageHue: 190 },
    { id: "m10", gymId: "g1", name: "Ishita Bose", phone: "+91 98100 10006", email: "ishita@example.com", plan: "Quarterly", price: 6000, startDate: daysFromToday(-15), endDate: daysFromToday(6), imageHue: 10 },
  ];

  const today = toISODate(new Date());

  /* Latest check-in recency per member, so churn detection is meaningful.
     at-risk members still have valid memberships but stopped showing up. */
  const recencyDays: Record<string, number> = {
    m1: 0, m2: 1, m3: 0, m4: 0, m6: 0, m7: 1, m8: 0, m10: 3,   // healthy / active
    m5: 22, m9: 18,                                              // at risk (paying, stalled)
  };

  function buildCheckinHistory(): Checkin[] {
    const out: Checkin[] = [];
    let id = 1;
    for (const member of members) {
      const lastSeenOffset = recencyDays[member.id] ?? 3;
      /* spread a handful of visits in the preceding 21 days, always ending on lastSeenOffset */
      const visits = 3 + (id % 4);
      for (let v = 0; v < visits; v++) {
        const offset = lastSeenOffset + v * 4;
        if (offset > 21) continue;
        const date = daysFromToday(-offset);
        if (out.some((c) => c.memberId === member.id && c.date === date)) continue;
        out.push({
          id: `ch${id++}`,
          memberId: member.id,
          gymId: member.gymId,
          date,
          time: ["08:10", "18:45", "07:30", "20:15"][v % 4],
        });
      }
    }
    return out;
  }

  const checkins: Checkin[] = [
    ...buildCheckinHistory(),
    ...(["m1", "m2", "m6", "m7", "m8", "m3"] as string[]).map((memberId, i) => {
      const member = members.find((m) => m.id === memberId)!;
      return { id: `ct${i + 1}`, memberId, gymId: member.gymId, date: today, time: ["07:12", "07:40", "08:05", "09:20", "10:02", "11:15"][i] };
    }),
  ];

  /* normalize: keep only the single latest check-in per member per day */
  const dedup = new Map<string, Checkin>();
  for (const c of checkins) {
    const key = `${c.memberId}:${c.date}`;
    if (!dedup.has(key) || dedup.get(key)!.time <= c.time) dedup.set(key, c);
  }
  const finalCheckins = [...dedup.values()];

  const revenue: RevenuePoint[] = [
    { month: "Jan", amount: 82000 },
    { month: "Feb", amount: 91500 },
    { month: "Mar", amount: 108000 },
    { month: "Apr", amount: 96200 },
    { month: "May", amount: 115400 },
    { month: "Jun", amount: 127600 },
    { month: "Jul", amount: 121900 },
    { month: "Aug", amount: 139200 },
  ];

  return { gyms, members, checkins: finalCheckins, revenue, notifications: [] };
}