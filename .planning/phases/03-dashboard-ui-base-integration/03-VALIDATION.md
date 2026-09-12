# Phase 3 Validation Strategy: dashboard-ui-base-integration

> Defines what evidence constitutes "done" for Phase 3.

## Required Evidence

### 1. Global Date Filter
- [ ] Evidence: A UI component exists allowing selection of presets (Today, Last 7 Days, etc.). Changing the selection updates a Zustand store.

### 2. Dashboard Widgets Rendering
- [ ] Evidence: The Dashboard page renders the "Big Numbers" (Gross, Net, Buyers, AOV, Uplift).
- [ ] Evidence: The Dashboard renders a Conversion Funnel chart/component.
- [ ] Evidence: The Dashboard renders a Payment Methods breakdown.
- [ ] Evidence: The Dashboard renders a Card Health diagnostic (e.g., as a colored badge or progress bar).
- [ ] Evidence: The Dashboard renders a paginated Sales Table.

### 3. API Integration
- [ ] Evidence: All widgets fetch data from the Phase 2 `/api/metrics/...` endpoints using TanStack Query.
- [ ] Evidence: Changing the Date Filter automatically triggers a re-fetch and updates the widgets.
