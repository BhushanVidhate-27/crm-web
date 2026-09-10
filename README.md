# MadabolicX - Multi-gym owner console (prototype)

A polished prototype CRM that runs **every gym branch from one place** and turns the
numbers into owner value: cash visibility, churn warnings and cross-branch comparison.

Built with Next.js (App Router, Server Actions) + React + Tailwind CSS, with a
zero-config JSON file store (auto-seeds demo data on first run). No database needed.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

First launch seeds data/db.json with 2 gyms, 10 members and 30+ days of check-in history.
The root redirects to /dashboard.

## Owner benefits (what's actually useful)

| Page      | What the owner gets |
|-----------|---------------------|
| /dashboard| KPIs, owner strip (MRR, ARR, renewals due in 30d, members at risk), revenue chart, live "Now in the gym", 1-click renew |
| /reports  | Owner intelligence: MRR/ARR, renewal pipeline, expired count, branch-vs-branch comparison table (members, check-ins, MRR, capacity utilization) and an at-risk revenue list |
| /billing  | Expect-to-collect total, paid-up members, and a "Renewals due" list with one-tap renew |
| /members  | Search/filter members, status badges, quick check-in, add-member form |

Key signals an owner can act on:
- **Monthly recurring revenue (MRR / ARR)** - computed from active memberships by plan period.
- **Renewal pipeline** - total value of memberships ending within 30 days = money to go collect.
- **Members at risk** - paying members whoseThe root redirects to /dashboard.

## Owner benefits (what's actually useful)

| ew button is one tap away.
- **Branch comparison** - spot your best and weakest gym by MRR, today's footfall and capacity utilization.

Live interactions (Server Actions -> file store): check in (deduped, blocks expired),
renew (+1/+3/+6 months), add member. Everything re-renders via router.refresh() so
counts update instantly.

## Design

Follows taste rules from emilkowalski/skills, Leonxlnx/taste-skill and pbakaus/impeccable -
neutral palette, single indigo accent, soft layere| /members  | Search/filter members, status badges, quick check-in, add-member fients, no bounce easing.

## Stack notes

- Next.js 16 (Turbopack) + Server Actions for mutations.
- lib/seed.ts (types, date helpers, demo seed), lib/store.ts (file-backed store),
  lib/analytics.ts (pure owner-intelligence math), lib/actions.ts (Server Actions).
- Client components import pure helpers from lib/seed/analytics only (keeps node:fs server-side).
- Runtime data lives in data/ (gitignored) - delete it to re-seed.

## Structure

```
app/        dashboard, members, billing, reports + layout + globals.css
components/ Sidebar, StatCard, RevenueChart, Badge, MembersGrid, CheckinButton,
            AddMemberForm, RenewButton, NowInGym, NeedsAttention, KpiCards,
            OwnerInsightStrip, GymComparison, AtRiskList
lib/        seed.ts, store.ts, analytics.ts, actions.ts
data/       db.json (runtime data, gitignored)
```
