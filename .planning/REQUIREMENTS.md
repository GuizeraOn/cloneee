# Project Requirements

## v1 Requirements

### API Webhook
- [ ] **WEBHOOK-01**: Receive Hotmart webhook payloads.
- [ ] **WEBHOOK-02**: Validate Hotmart signature/Hottok for security.
- [ ] **WEBHOOK-03**: Deduplicate payloads using `transaction_id`.
- [ ] **WEBHOOK-04**: Parse and normalize funnel stage, payment method, and status.
- [ ] **WEBHOOK-05**: Extract UTM parameters from payload.
- [ ] **WEBHOOK-06**: Calculate gross and net values in BRL using exchange rate.
- [ ] **WEBHOOK-07**: Insert transaction into PostgreSQL `sales` table.

### Exchange Rate
- [ ] **EXCHANGE-01**: Fetch USD/BRL exchange rate periodically via Cron job.
- [ ] **EXCHANGE-02**: Store exchange rates in `exchange_rates` table.
- [ ] **EXCHANGE-03**: Provide fallback exchange rate (e.g., 5.65) if API fails.

### Metrics API
- [ ] **METRICS-01**: Provide `resolveDateRange` utility for global date filtering (`preset`, `startDate`, `endDate`).
- [ ] **METRICS-02**: Endpoint `GET /api/metrics/summary` for big numbers (Gross/Net Revenue, Buyers, AOV, Uplift).
- [ ] **METRICS-03**: Endpoint `GET /api/metrics/funnel` for funnel metrics (count, revenue, take rates, advance rate).
- [ ] **METRICS-04**: Endpoint `GET /api/metrics/geo` for revenue and participation % by country.
- [ ] **METRICS-05**: Endpoint `GET /api/metrics/payment-methods` for revenue and count by payment method.
- [ ] **METRICS-06**: Endpoint `GET /api/metrics/card-health` for credit card approval/decline rates and diagnostic status.
- [ ] **METRICS-07**: Endpoint `GET /api/sales` for paginated transaction list with filters.
- [ ] **METRICS-08**: Endpoint `GET /api/metrics/exchange-rate` for current rate display.

### Dashboard UI
- [ ] **UI-01**: Global Date Filter component (`preset`, `startDate`, `endDate`) backed by global state (Zustand).
- [ ] **UI-02**: Display Summary "Big Numbers" Cards with tooltips.
- [ ] **UI-03**: Display Conversion Funnel Chart.
- [ ] **UI-04**: Display Revenue by Country Chart.
- [ ] **UI-05**: Display Revenue by Payment Method Chart.
- [ ] **UI-06**: Display Card Health Gateway Diagnostic.
- [ ] **UI-07**: Display Sales Data Table with pagination and filtering.

## v2 Requirements (Deferred)
- [ ] Authentication and Authorization (NextAuth/Clerk).
- [ ] Export reports (CSV/PDF).
- [ ] Automated Slack/Telegram alerts for gateway health anomalies.

## Out of Scope
- Custom payment processing (Relies solely on Hotmart webhook data).

## Traceability
(Updated by roadmapper)
