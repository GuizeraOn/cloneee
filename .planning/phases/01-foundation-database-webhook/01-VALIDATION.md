# Phase 1 Validation Strategy: foundation-database-webhook

> Defines what evidence constitutes "done" for Phase 1. Used by the verifier to audit phase completeness.

## Required Evidence

### 1. Database Schema
- [ ] Evidence: The PostgreSQL database contains the `sales` and `exchange_rates` tables with the specified columns and a `UNIQUE` constraint on `sales.transaction_id`.

### 2. Webhook Deduplication
- [ ] Evidence: A test proves that sending the identical Hotmart webhook payload twice results in exactly one database row and two HTTP 200 responses.

### 3. Webhook Security
- [ ] Evidence: A test proves that an incoming webhook with a missing or invalid `Hottok` header is rejected (HTTP 401/403) and no database row is inserted.

### 4. Exchange Rate Cron
- [ ] Evidence: A test or log proves that the exchange rate cron job successfully runs and inserts a new rate into the `exchange_rates` table.
