# Phase 1 Research: Foundation (Database & Webhook)

## Context
Migrating a comprehensive Hotmart sales tracking and analytics spreadsheet to a modern web application using PostgreSQL, React, shadcn/ui, and a Next.js/NestJS backend. This phase focuses on the PostgreSQL database schema and the webhook endpoint.

## Key Findings

### Webhook Deduplication
Hotmart webhook payloads may be retried or sent multiple times for the same transaction. Relying on application-level locks (like Google Apps Script's LockService) is an anti-pattern when using a relational database. PostgreSQL's `UNIQUE` constraint on `transaction_id` combined with an `INSERT ... ON CONFLICT DO NOTHING` is the optimal, race-condition-free solution.

### Exchange Rate Handling
Hotmart transactions are often in USD but need to be analyzed in BRL. The spreadsheet used `GOOGLEFINANCE`. For the web app, periodic polling (via a cron job) of an API like AwesomeAPI `economia.awesomeapi.com.br/json/last/USD-BRL` and storing the result in an `exchange_rates` table ensures that the webhook can retrieve the latest available rate quickly without calling external APIs inline.

### Security
The webhook must validate the `Hottok` token (provided by Hotmart) to prevent unauthorized or malicious payload injections.

## Architecture Decisions
1. **PostgreSQL schema:**
   - Table `sales` with fields: `id` (UUID), `transaction_id` (varchar, unique), `purchased_at` (timestamptz), `product_name`, `funnel_stage`, `payment_method`, `status`, `gross_usd`, `net_usd`, `exchange_rate`, `gross_brl`, `net_brl`, `raw_payload` (jsonb).
   - Table `exchange_rates` with fields: `id`, `rate`, `fetched_at`, `source`.
2. **Framework:** Next.js Route Handlers are sufficient for the webhook and integrate well with the frontend stack.

## Validation Architecture
- **Deduplication:** A test must attempt to send the exact same Hotmart payload twice; only one row should be created in the `sales` table.
- **Hottok Validation:** A test payload without the correct token must return 401/403 and NOT insert any data.
- **Exchange Rate:** The cron job must successfully populate the `exchange_rates` table.
