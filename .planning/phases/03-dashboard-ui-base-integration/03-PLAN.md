---
phase: 3
goal: "Build the frontend Dashboard using React, Tailwind CSS, shadcn/ui, Zustand, and TanStack Query to consume the Metrics API."
must_haves:
  - "Zustand store for global date filtering"
  - "TanStack Query integration for data fetching"
  - "Summary metrics cards"
  - "Funnel and Payment Method charts (Recharts)"
  - "Sales Data Table with pagination"
---

# Phase 3: Dashboard UI Base & Integration

## Requirements
- UI-01: Global Date Filter component (`preset`, `startDate`, `endDate`) backed by global state (Zustand).
- UI-02: Display Summary "Big Numbers" Cards with tooltips.
- UI-03: Display Conversion Funnel Chart.
- UI-05: Display Revenue by Payment Method Chart.
- UI-06: Display Card Health Gateway Diagnostic.
- UI-07: Display Sales Data Table with pagination and filtering.

## Tasks

- [ ] **1. Setup Frontend Dependencies**
  - Install `zustand`, `@tanstack/react-query`, `recharts`, `lucide-react`, `date-fns`.
  - Initialize `shadcn/ui` components (if not initialized, install basic CLI dependencies).
  - Create a React Query Provider component (`src/providers/query-provider.tsx`) and wrap the root layout.

- [ ] **2. Global State & Date Filter Component**
  - Create `src/store/useDateFilter.ts` with Zustand (state: `preset`, `startDate`, `endDate`; action: `setDateFilter`).
  - Create `src/components/dashboard/DateFilter.tsx`. Implement a Select dropdown for presets.

- [ ] **3. API Client / Fetcher Hooks**
  - Create `src/hooks/useMetrics.ts`.
  - Implement custom hooks using `useQuery` for each endpoint: `useSummaryMetrics`, `useFunnelMetrics`, `usePaymentMethods`, `useCardHealth`, `useSalesList`.
  - Ensure query keys include the current date filter from the Zustand store.

- [ ] **4. Summary Cards Component**
  - Create `src/components/dashboard/SummaryCards.tsx`.
  - Consume `useSummaryMetrics`.
  - Render cards for Total Sales, Gross Revenue, Net Revenue, AOV, and Take Rate. Handle loading states.

- [ ] **5. Charts Components**
  - Create `src/components/dashboard/FunnelChart.tsx` consuming `useFunnelMetrics` and rendering a Recharts `BarChart` or `ComposedChart`.
  - Create `src/components/dashboard/PaymentMethodsChart.tsx` consuming `usePaymentMethods` and rendering a Recharts `PieChart`.

- [ ] **6. Card Health & Sales Table Components**
  - Create `src/components/dashboard/CardHealth.tsx` showing the approval rate and a visual diagnostic badge.
  - Create `src/components/dashboard/SalesTable.tsx` consuming `useSalesList`. Implement a basic HTML table or shadcn `Table` with pagination controls.

- [ ] **7. Dashboard Page Assembly**
  - Update `src/app/page.tsx`.
  - Arrange all components into a responsive CSS Grid layout (Tailwind).
  - Place `DateFilter` at the top right, `SummaryCards` below it, followed by Charts and the `SalesTable`.
