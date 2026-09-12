# Phase 2 Validation Strategy: metrics-api-layer

> Defines what evidence constitutes "done" for Phase 2.

## Required Evidence

### 1. Centralized Date Resolution
- [ ] Evidence: Utility `resolveDateRange` correctly maps presets (e.g., "last7days") to strict Date boundaries. Unit tests must exist.

### 2. Metric Endpoints Reachability & Payload
- [ ] Evidence: `/api/metrics/summary` returns Total Revenue, Total Buyers, AOV, and Uplift.
- [ ] Evidence: `/api/metrics/funnel` returns grouped counts and revenues by `FRONTEND`, `ORDER_BUMP`, `UPSELL`, `DOWNSELL`.
- [ ] Evidence: `/api/metrics/card-health` calculates Approval vs Decline percentage for Credit Cards.
- [ ] Evidence: `/api/sales` accepts pagination (`page`, `limit`) and date filters, returning paginated records and a `total` count.

### 3. Consistency
- [ ] Evidence: All endpoints apply the exact same Prisma `where` clause for `purchasedAt` when the same date filters are passed.
