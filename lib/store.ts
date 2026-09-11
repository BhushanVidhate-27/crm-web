import fs from "node:fs";
import path from "node:path";
import { buildSeed, buildRevenueHistory, toISODate, memberStatus, generateMemberId, type DB, type Member, type Memory, type Channel, type Notification } from "./seed";

export * from "./seed";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

function ensureFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(buildSeed(), null, 2), "utf-8");
  }
}

function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

class Store {
  db: DB;

  constructor() {
    ensureFile();
    this.db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DB;
    if (!Array.isArray(this.db.notifications)) this.db.notifications = []; // migration for pre-notification data files
    if (!Array.isArray(this.db.memories)) this.db.memories = []; // migration for pre-memories data files
    this.migrateRevenue(); // migration for pre-branch-split / single-year revenue data files
    this.migrateMembers(); // migration for members without an address
    this.save();
  }

  /* Older data files have members without a living address. Backfill from the
     seed (for known demo members) or empty so the profile never crashes. */
  private migrateMembers() {
    if (!Array.isArray(this.db.members)) return;
    const seedAddress = new Map(buildSeed().members.map((m) => [m.id, m.address ?? ""]));
    let changed = false;
    for (const m of this.db.members) {
      if (typeof m.address !== "string" || m.address === "") {
        m.address = seedAddress.get(m.id) ?? "";
        changed = true;
      }
    }
    if (changed) console.log("[store] backfilled member addresses");
  }

  /* Older data files have revenue points without per-branch g1/g2 splits or a year.
     Backfill them and expand the history so the yearly-income view can slide back
     through past years. */
  private migrateRevenue() {
    const currentYear = new Date().getFullYear();
    if (!Array.isArray(this.db.revenue) || this.db.revenue.length === 0) {
      this.db.revenue = buildRevenueHistory();
      console.log("[store] seeded multi-year revenue history");
      return;
    }
    let changed = false;
    for (const r of this.db.revenue) {
      if (typeof r.year !== "number") {
        r.year = currentYear;
        changed = true;
      }
      if (typeof r.g1 !== "number") {
        r.g1 = Math.round(r.amount / 2);
        changed = true;
      }
      if (typeof r.g2 !== "number") {
        r.g2 = r.amount - r.g1; // keep the combined total exact
        changed = true;
      }
    }
    /* Single-year data files: prepend generated past years, ahead of the current year's points. */
    if (!this.db.revenue.some((r) => r.year < currentYear)) {
      this.db.revenue = [...buildRevenueHistory().filter((r) => r.year < currentYear), ...this.db.revenue];
      changed = true;
    }
    if (changed) console.log("[store] migrated revenue to per-branch, multi-year history");
  }

  save() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2), "utf-8");
  }

  gyms() {
    return this.db.gyms;
  }
  members() {
    return [...this.db.members].sort((a, b) => a.name.localeCompare(b.name));
  }
  checkinsToday() {
    const today = toISODate(new Date());
    return this.db.checkins.filter((c) => c.date === today);
  }
  revenue() {
    return this.db.revenue;
  }

  checkIn(memberId: string, gymId?: string): { ok: boolean; message: string } {
    const member = this.db.members.find((m) => m.id === memberId);
    if (!member) return { ok: false, message: "Member not found." };
    if (memberStatus(member.endDate) === "expired")
      return { ok: false, message: `${member.name}'s membership expired. Renew to check in.` };

    const today = toISODate(new Date());
    if (this.db.checkins.some((c) => c.memberId === memberId && c.date === today))
      return { ok: false, message: `${member.name} already checked in today.` };

    this.db.checkins.push({
      id: `c${Date.now()}`,
      memberId,
      gymId: gymId ?? member.gymId,
      date: today,
      time: new Date().toTimeString().slice(0, 5),
    });
    this.save();
    return { ok: true, message: `${member.name} checked in.` };
  }

  addMember(input: Omit<Member, "id">): { ok: boolean; message: string } {
    const id = generateMemberId(this.db.members.map((m) => m.id));
    this.db.members.push({ ...input, id });
    this.save();
    return { ok: true, message: `${input.name} added as a member. Member ID: ${id}` };
  }

  renew(memberId: string, months: number): { ok: boolean; message: string } {
    const member = this.db.members.find((m) => m.id === memberId);
    if (!member) return { ok: false, message: "Member not found." };
    const base = maxDate(member.endDate, toISODate(new Date()));
    const [y, m, d] = base.split("-").map(Number);
    const nd = new Date(y, m - 1, d);
    nd.setMonth(nd.getMonth() + months);
    member.endDate = toISODate(nd);
    this.save();
    return { ok: true, message: `${member.name} renewed for ${months} month${months > 1 ? "s" : ""}.` };
  }

  /* --- notifications --- */
  notifications() {
    return [...this.db.notifications].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }

  sendReminder(input: Omit<Notification, "id">): Notification {
    const rec: Notification = {
      ...input,
      id: `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    this.db.notifications.push(rec);
    this.save();
    return rec;
  }

  lastReminderAt(memberId: string, channel: Channel): string | null {
    const list = this.db.notifications
      .filter((n) => n.memberId === memberId && n.channel === channel && n.kind === "renewal-reminder")
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    return list.length ? list[0].sentAt : null;
  }

  countReminders(memberId: string): number {
    return this.db.notifications.filter((n) => n.memberId === memberId).length;
  }

  /* --- memories --- */
  memories() {
    return [...this.db.memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  memory(id: string): Memory | null {
    return this.db.memories.find((m) => m.id === id) ?? null;
  }
  addMemory(input: Omit<Memory, "id">): Memory {
    const rec: Memory = { ...input, id: `mv${Date.now()}${Math.random().toString(36).slice(2, 6)}` };
    this.db.memories.push(rec);
    this.save();
    return rec;
  }
  removeMemory(id: string): boolean {
    const i = this.db.memories.findIndex((m) => m.id === id);
    if (i < 0) return false;
    this.db.memories.splice(i, 1);
    this.save();
    return true;
  }
}

export const store = new Store();