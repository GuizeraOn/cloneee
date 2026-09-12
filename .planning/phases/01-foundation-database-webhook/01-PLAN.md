---
phase: 1
goal: "Setup PostgreSQL schema, periodic exchange rate fetcher, and the webhook endpoint for handling incoming Hotmart payloads with deduplication."
must_haves:
  - "PostgreSQL database configured with Prisma/Drizzle ORM"
  - "Database schema for `sales` and `exchange_rates` tables"
  - "Next.js Route Handler for Hotmart Webhook"
  - "Webhook Hottok token validation"
  - "Webhook transaction_id deduplication"
  - "Exchange rate fetching via cron"
---

# Phase 1: Foundation (Database & Webhook)

## Requirements
- WEBHOOK-01: Receive Hotmart webhook payloads.
- WEBHOOK-02: Validate Hotmart signature/Hottok for security.
- WEBHOOK-03: Deduplicate payloads using `transaction_id`.
- WEBHOOK-04: Parse and normalize funnel stage, payment method, and status.
- WEBHOOK-05: Extract UTM parameters from payload.
- WEBHOOK-06: Calculate gross and net values in BRL using exchange rate.
- WEBHOOK-07: Insert transaction into PostgreSQL `sales` table.
- EXCHANGE-01: Fetch USD/BRL exchange rate periodically via Cron job.
- EXCHANGE-02: Store exchange rates in `exchange_rates` table.
- EXCHANGE-03: Provide fallback exchange rate (e.g., 5.65) if API fails.

## Tasks

- [ ] **1. Setup Next.js Project and Prisma/Drizzle**
  - Initialize the Next.js project if not already present.
  - Install ORM dependencies (Prisma or Drizzle).
  - Configure PostgreSQL database connection strings via `.env`.

- [ ] **2. Define Database Schema**
  - Create the `exchange_rates` table (`id`, `rate`, `fetched_at`, `source`).
  - Create the `sales` table (`id`, `transaction_id` [UNIQUE], `purchased_at`, `product_name`, `funnel_stage`, `payment_method`, `status`, `gross_usd`, `net_usd`, `exchange_rate`, `gross_brl`, `net_brl`, `raw_payload`, `created_at`).
  - Add relevant enums and indexes (e.g., on `purchased_at`, `status`).

- [ ] **3. [BLOCKING] Schema Push**
  - Execute the database schema push command to synchronize the PostgreSQL instance with the defined schema.
  - Command: `npx prisma db push` (or Drizzle equivalent).

- [ ] **4. Exchange Rate Service & Cron**
  - Implement a utility function to fetch the latest USD/BRL rate from AwesomeAPI.
  - Implement a cron job or scheduled API route to run periodically (e.g., Vercel Cron).
  - Provide a fallback logic returning 5.65 if the database table is empty and the API fails.

- [ ] **5. Webhook Utility Functions**
  - Implement parsing utilities: `normalizeFunnelStage`, `normalizePaymentMethod`, `normalizeStatus`, `extractUtm`.
  - Add unit tests for these utilities to ensure 100% business logic parity with the old spreadsheet.

- [ ] **6. Webhook Endpoint (`POST /api/webhook/hotmart`)**
  - Implement payload validation (e.g., Zod).
  - Implement `Hottok` token validation (reject with 401/403 if invalid).
  - Handle payload extraction and formatting.
  - Fetch the latest exchange rate from the DB.
  - Execute `INSERT ... ON CONFLICT DO NOTHING` into the `sales` table using the ORM.
  - Return `200 OK` on success or deduplication.
