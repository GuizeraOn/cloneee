# Phase 2 Research: Metrics API Layer

## Context
Phase 1 established the database schema (`sales`, `exchange_rates`) and webhook handler to ingest Hotmart data securely. Phase 2 focuses on creating the backend API layer that will serve the Dashboard UI. This API layer is responsible for calculating all business metrics based on the data stored in PostgreSQL.

## Key Findings & Architecture Decisions

### 1. Centralized Date Resolution
All dashboard metrics must respond to a global date filter (Meta Ads style). To prevent logic drift between endpoints, a centralized utility (`resolveDateRange`) is required.
- **Inputs**: `preset` (e.g., 'today', 'last7days', 'last30days', 'custom'), `startDate`, `endDate`.
- **Output**: An object `{ gte: Date, lte: Date }` compatible with Prisma's `where` clause.

### 2. Metric Calculations via SQL vs Memory
While simple aggregations could be done in memory after fetching rows, as the dataset grows, doing it via Prisma aggregations or raw SQL is much more performant.
- **Big Numbers (`/api/metrics/summary`)**: `_sum` for `netBrl`, `_count` for total sales. AOV is `_sum(grossUsd) / _count`.
- **Funnel (`/api/metrics/funnel`)**: Needs `groupBy` on `funnelStage` to calculate take rates.
- **Card Health (`/api/metrics/card-health`)**: Filter where `paymentMethod` is `CREDIT_CARD`, then group by `status` to get approval vs decline ratios.

### 3. API Structure & Framework
- Next.js Route Handlers (`src/app/api/.../route.ts`) will be used.
- All GET requests will accept query parameters `preset`, `startDate`, `endDate`.
- Responses should be strongly typed JSON.
- For `GET /api/sales`, offset-based pagination (`take`, `skip`) will be implemented alongside filtering.

### 4. Assumption Delta
- Currently, there is only one "tenant" (the user).
- Currency conversion already happens at ingestion time, so the API can safely aggregate `grossBrl` and `netBrl` without doing real-time conversions.
