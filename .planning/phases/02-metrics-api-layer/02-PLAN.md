---
phase: 2
goal: "Implement Next.js Route Handlers and utility functions to serve all metrics and sales data for the frontend dashboard."
must_haves:
  - "Centralized date resolution utility (`resolveDateRange`)"
  - "Summary metrics endpoint"
  - "Funnel metrics endpoint"
  - "Card health diagnostic endpoint"
  - "Paginated sales list endpoint"
---

# Phase 2: Metrics API Layer

## Requirements
- METRICS-01: Provide `resolveDateRange` utility for global date filtering (`preset`, `startDate`, `endDate`).
- METRICS-02: Endpoint `GET /api/metrics/summary` for big numbers (Gross/Net Revenue, Buyers, AOV, Uplift).
- METRICS-03: Endpoint `GET /api/metrics/funnel` for funnel metrics (count, revenue, take rates, advance rate).
- METRICS-05: Endpoint `GET /api/metrics/payment-methods` for revenue and count by payment method.
- METRICS-06: Endpoint `GET /api/metrics/card-health` for credit card approval/decline rates and diagnostic status.
- METRICS-07: Endpoint `GET /api/sales` for paginated transaction list with filters.
- METRICS-08: Endpoint `GET /api/metrics/exchange-rate` for current rate display.

*(Note: METRICS-04 Geo is deferred or combined depending on payload structure, but we will focus on the core metrics for now).*

## Tasks

- [ ] **1. Implement `resolveDateRange` utility**
  - Create `src/lib/date-utils.ts`.
  - Implement a function that takes `{ preset?: string; startDate?: string; endDate?: string }` and returns Prisma `gte` and `lte` constraints.
  - Implement basic unit tests in `src/lib/date-utils.test.ts`.

- [ ] **2. Summary Metrics API (`/api/metrics/summary`)**
  - File: `src/app/api/metrics/summary/route.ts`
  - Extract query params, call `resolveDateRange`.
  - Use `prisma.sale.aggregate` to sum `grossBrl`, `netBrl` and count transactions where `status === 'APPROVED'`.
  - Calculate AOV and Uplift. Return JSON.

- [ ] **3. Funnel Metrics API (`/api/metrics/funnel`)**
  - File: `src/app/api/metrics/funnel/route.ts`
  - Group by `funnelStage` where `status === 'APPROVED'`.
  - Return aggregated metrics for FRONTEND, ORDER_BUMP, UPSELL, DOWNSELL.

- [ ] **4. Payment Methods & Card Health APIs**
  - File: `src/app/api/metrics/payment-methods/route.ts`
    - Group by `paymentMethod` and sum revenue.
  - File: `src/app/api/metrics/card-health/route.ts`
    - Filter `paymentMethod === 'CREDIT_CARD'`.
    - Group by `status` (APPROVED vs DECLINED) to calculate approval rate.

- [ ] **5. Paginated Sales Endpoint (`/api/sales`)**
  - File: `src/app/api/sales/route.ts`
  - Accept query params: `page`, `limit`, `preset`, `startDate`, `endDate`.
  - Use `prisma.sale.findMany` with `skip` and `take`, ordering by `purchasedAt` descending.
  - Use `prisma.sale.count` to return total record count for pagination math.

- [ ] **6. Exchange Rate Display Endpoint (`/api/metrics/exchange-rate`)**
  - File: `src/app/api/metrics/exchange-rate/route.ts`
  - Fetch the latest stored rate from the database.
