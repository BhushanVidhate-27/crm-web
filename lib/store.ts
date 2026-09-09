import fs from "node:fs";
import path from "node:path";
import { buildSeed, toISODate, memberStatus, type DB, type Member, type Channel, type Notification } from "./seed";

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
    this.save();
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
    this.db.members.push({ ...input, id: `m${Date.now()}` });
    this.save();
    return { ok: true, message: `${input.name} added as a member.` };
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
}

export const store = new Store();