# Phase 1 Summary: Foundation (Database & Webhook)

## Work Completed
1. **Database Schema Setup**
   - Configured Prisma with PostgreSQL provider.
   - Defined `exchange_rates` and `sales` models in `prisma/schema.prisma` with appropriate `@@map` attributes and indexes.
   - Defined `transaction_id` as `@unique` to ensure deduplication.

2. **Database Client**
   - Implemented Prisma client singleton in `src/lib/db.ts` to prevent connection exhaustion in Next.js development.

3. **Exchange Rate Fetcher**
   - Created `src/lib/exchange-rate.ts` fetching USD-BRL from AwesomeAPI.
   - Fallback logic to 5.65 if the API request fails.
   - Created Vercel Cron compatible endpoint at `src/app/api/cron/exchange-rate/route.ts` to securely fetch and store rates.

4. **Hotmart Webhook Utilities**
   - Created `src/lib/hotmart-utils.ts` to normalize Hotmart payloads (status, payment methods, funnel stages, UTMs).
   - Added unit tests for utilities in `src/lib/hotmart-utils.test.ts`.

5. **Webhook Endpoint**
   - Created `src/app/api/webhook/hotmart/route.ts` to handle incoming Hotmart events.
   - Validates `x-token` header against `HOTMART_HOTTOK` env var.
   - Extracts all necessary fields and computes BRL values.
   - Stores transactions safely handling Prisma `P2002` error to gracefully deduplicate retries.

## Pending actions for User
- Add `DATABASE_URL` and `HOTMART_HOTTOK` to `.env`.
- Run `npx prisma db push` to push the schema to the database (since this environment lacks a running PostgreSQL instance, this step must be performed manually or connected to a remote DB).
- Ensure Vercel or your hosting provider is configured to call `/api/cron/exchange-rate` periodically.
