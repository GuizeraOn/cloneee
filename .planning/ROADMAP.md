# Project Roadmap

## Phase 1: Foundation (Database & Webhook)
**Goal:** Setup PostgreSQL schema, periodic exchange rate fetcher, and the webhook endpoint for handling incoming Hotmart payloads with deduplication.
**Requirements:** WEBHOOK-01, WEBHOOK-02, WEBHOOK-03, WEBHOOK-04, WEBHOOK-05, WEBHOOK-06, WEBHOOK-07, EXCHANGE-01, EXCHANGE-02, EXCHANGE-03
**Success Criteria:**
1. Database schema (`sales` and `exchange_rates`) is provisioned and migrated.
2. Webhook endpoint returns 200 OK and successfully deduplicates repeated `transaction_id`s.
3. Cron job runs periodically and stores the latest USD/BRL exchange rate.

## Phase 2: Metrics API Layer
**Goal:** Create backend services and endpoints to aggregate and filter sales data for the dashboard.
**Requirements:** METRICS-01, METRICS-02, METRICS-03, METRICS-04, METRICS-05, METRICS-06, METRICS-07, METRICS-08
**Success Criteria:**
1. `resolveDateRange` utility functions correctly for all predefined and custom presets.
2. The `/api/metrics/summary` and `/api/metrics/funnel` endpoints return accurate aggregated data.
3. Endpoints handle zero-division edge cases gracefully (e.g. 0% instead of NaN).

## Phase 3: Dashboard UI Base & Integration
**Goal:** Setup React/Vite + shadcn/ui frontend, implement the global date filter, and connect charts/tables to the API.
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07
**Success Criteria:**
1. Global date filter updates the global Zustand state and invalidates React Query caches.
2. Big number cards, funnel chart, and other visuals render correctly with API data.
3. The datatable correctly paginates and filters individual sales records.
