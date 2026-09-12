# Phase 3 Research: Dashboard UI Base & Integration

## Context
Phases 1 and 2 established the data ingestion and metrics APIs. Phase 3 focuses on the frontend: consuming these APIs and rendering the dashboard using React, Next.js App Router, shadcn/ui, Recharts, and TanStack Query.

## Key Findings & Architecture Decisions

### 1. Global State Management (Date Filter)
The date filter is the central control mechanism for the entire dashboard.
- **Decision**: Use Zustand to store `{ preset, startDate, endDate }`. This allows any component deep in the tree to subscribe to the filter state without prop drilling.
- **Interaction**: Changing the date in the global filter will trigger re-fetches for all metric components.

### 2. Data Fetching
- **Decision**: Use React Query (TanStack Query v5) for data fetching. It handles caching, loading states, and automatic refetching when the global date filter (passed as a query key) changes.
- Next.js Server Components are generally preferred, but since the dashboard is highly interactive and relies on a global client-side state (Zustand) that drives parallel data fetching, the dashboard components will primarily be Client Components (`"use client"`). The layout can remain a Server Component.

### 3. UI Component Library
- **Decision**: `shadcn/ui` with Tailwind CSS.
- **Required Components**: 
  - `Card` (for Big Numbers and wrappers)
  - `Select` or `Popover`/`Calendar` (for Date Filter)
  - `Table` (for Sales list)
  - `Skeleton` (for loading states)
  - `Badge` (for statuses)

### 4. Charting
- **Decision**: `recharts` is the standard, well-documented choice for React. It integrates well with Tailwind colors.
- We need a Funnel Chart, Bar/Pie Chart (for Payment Methods), and potentially a Line Chart if we added a time-series API (though not explicitly required yet).

### 5. Layout Architecture
- `src/app/page.tsx` will house the main dashboard grid.
- `src/components/dashboard/` will contain specific widgets (`SummaryCards`, `FunnelChart`, `SalesTable`, `DateFilter`).
