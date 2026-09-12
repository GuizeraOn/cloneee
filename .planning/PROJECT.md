# Project: Hotmart Spreadsheet to WebApp Migration

## What This Is
Migrating a comprehensive Hotmart sales tracking and analytics spreadsheet to a modern web application. The core objective is to replace each layer of the spreadsheet (Webhook, DB_Vendas, Aux_Calculos, Dashboard) with robust web equivalents (API Webhook, PostgreSQL, SQL Aggregations, React/shadcn/ui Frontend) while maintaining 100% of the validated business logic.

## Core Value
A robust, automated, and secure dashboard for Hotmart sales analytics that eliminates manual spreadsheet calculations, handles webhook concurrency natively via database constraints, and provides real-time "Meta Ads style" date filtering for complex metrics (take rates, AOV uplift, etc.).

## Target Audience
Internal team / executives who need to analyze Hotmart sales funnels, conversion rates, and gateway health without relying on fragile Google Sheets formulas.

## Tech Stack
- **Frontend:** React + Vite (or Next.js App Router)
- **UI Kit:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts or Tremor
- **State Management:** TanStack Query (Server) + Zustand/Context (Client)
- **Backend:** Next.js Route Handlers or NestJS/Express
- **Database:** PostgreSQL (Supabase, Neon, or Railway)
- **ORM:** Prisma or Drizzle
- **Jobs:** Vercel Cron / node-cron (for USD/BRL exchange rate)
- **Auth:** Clerk / NextAuth / Supabase Auth

## Requirements

### Validated
(None yet — ship to validate)

### Active
- [ ] Receive Hotmart webhooks, validate Hottok, and deduplicate by `transaction_id`.
- [ ] Parse and normalize webhook payloads (funnel stage, payment method, status, UTMs).
- [ ] Fetch and store USD/BRL exchange rate periodically.
- [ ] Calculate and store gross/net values in BRL.
- [ ] Provide unified date filtering (`preset`, `startDate`, `endDate`) for all metrics.
- [ ] Calculate funnel metrics (take rates, advance rate).
- [ ] Calculate revenue by country and payment method.
- [ ] Calculate summary metrics (AOV, Additional Revenue, Gross/Net).
- [ ] Calculate card health metrics (approval rate, decline rate).
- [ ] Display dashboard with big numbers, charts, and paginated sales table.

### Out of Scope
- Building a custom payment gateway (relying strictly on Hotmart data).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No client-side recalculations | Replicate `Aux_Calculos` as backend services/SQL views | — Pending |
| PostgreSQL UNIQUE constraint for idempotency | Replaces LockService and manual deduplication | — Pending |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-11 after initialization*
