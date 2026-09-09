import {
  daysUntil,
  memberStatus,
  type Checkin,
  type Gym,
  type Member,
} from "./seed";

/* Plan -> billing period in months. Drives MRR/ARR. */
const PERIOD_MONTHS: Record<string, number> = {
  Yearly: 12,
  "Half-Yearly": 6,
  Quarterly: 3,
  Monthly: 1,
  "PT + Monthly": 1,
};

export function periodMonths(plan: string): number {
  if (plan.startsWith("Daily")) return 0; // one-off, not recurring
  return PERIOD_MONTHS[plan] ?? 1;
}

export type OwnerInsights = {
  mrr: number; // monthly recurring revenue from all active-but-not-expired members
  arr: number;
  renewals30d: number; // revenue tied to memberships ending within 30 days
  atRisk: number; // paying members who haven't checked in recently
  bestGym: Gym | null;
};

export function lastSeenDay(memberId: string, checkins: Checkin[]): string | null {
  let best: string | null = null;
  for (const c of checkins) {
    if (c.memberId === memberId && (best === null || c.date > best)) best = c.date;
  }
  return best;
}

export function computeOwnerInsights(
  members: Member[],
  checkins: Checkin[],
  gyms: Gym[]
): OwnerInsights {
  let mrr = 0;
  let renewals30d = 0;
  let atRisk = 0;

  for (const m of members) {
    const status = memberStatus(m.endDate);
    if (status === "expired") continue;

    const months = periodMonths(m.plan);
    if (months > 0) mrr += m.price / months;
    if (daysUntil(m.endDate) <= 30) renewals30d += m.price;

    const last = lastSeenDay(m.id, checkins);
    const daysAgo = last ? daysUntil(last) * -1 : Number.MAX_SAFE_INTEGER;
    if (daysAgo >= 14) atRisk += 1;
  }

  const arr = mrr * 12;
  const ranked = gyms
    .map((g) => ({
      gym: g,
      score: members.filter((m) => m.gymId === g.id && memberStatus(m.endDate) !== "expired").length,
    }))
    .sort((a, b) => b.score - a.score);
  const bestGym = ranked[0]?.gym ?? null;

  return { mrr, arr, renewals30d, atRisk, bestGym };
}

export type GymStat = {
  gym: Gym;
  members: number;
  active: number;
  checkinsToday: number;
  mrr: number;
  utilization: number; // 0..100
  expiring: number;
};

export function computeGymStats(
  gyms: Gym[],
  members: Member[],
  checkins: Checkin[],
  todayStr: string
): GymStat[] {
  const activeByGym = new Map<string, number>();
  const expiringByGym = new Map<string, number>();
  const todayByGym = new Map<string, number>();
  let mrrTotal = 0;

  for (const m of members) {
    const status = memberStatus(m.endDate);
    if (status === "expired") continue;
    mrrTotal += periodMonths(m.plan) > 0 ? m.price / periodMonths(m.plan) : 0;
    if (status === "active" || status === "expiring") {
      activeByGym.set(m.gymId, (activeByGym.get(m.gymId) ?? 0) + 1);
    }
    if (status === "expiring") {
      expiringByGym.set(m.gymId, (expiringByGym.get(m.gymId) ?? 0) + 1);
    }
  }
  for (const c of checkins) {
    if (c.date === todayStr) todayByGym.set(c.gymId, (todayByGym.get(c.gymId) ?? 0) + 1);
  }

  return gyms.map((g) => {
    const active = activeByGym.get(g.id) ?? 0;
    const mrr = members
      .filter((m) => m.gymId === g.id && memberStatus(m.endDate) !== "expired")
      .reduce((s, m) => s + (periodMonths(m.plan) > 0 ? m.price / periodMonths(m.plan) : 0), 0);
    return {
      gym: g,
      members: members.filter((m) => m.gymId === g.id).length,
      active,
      checkinsToday: todayByGym.get(g.id) ?? 0,
      mrr,
      utilization: Math.min(100, Math.round((active / g.capacity) * 100)),
      expiring: expiringByGym.get(g.id) ?? 0,
    };
  });
}

export type AtRiskMember = {
  member: Member;
  daysAgo: number;
  status: "active" | "expiring";
};

export function computeAtRisk(
  members: Member[],
  checkins: Checkin[]
): AtRiskMember[] {
  const out: AtRiskMember[] = [];
  for (const m of members) {
    const status = memberStatus(m.endDate);
    if (status === "expired") continue;
    const last = lastSeenDay(m.id, checkins);
    const daysAgo = last ? daysUntil(last) * -1 : Number.MAX_SAFE_INTEGER;
    if (daysAgo >= 14) out.push({ member: m, daysAgo, status });
  }
  return out.sort((a, b) => b.daysAgo - a.daysAgo);
}