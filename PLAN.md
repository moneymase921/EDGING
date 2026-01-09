### Plan for Milestone 6: Calibration & Reports

1) Math Core
- Add `lib/calibration.ts` with pure functions: `binByProbability`, `brierScore`, `summaryStats`, `segmentFilters` helpers.
- Write unit tests in `tests/lib/calibration.test.ts` for binning, brier, summary, filters.

2) Data Access
- Add a server-side helper or extend existing server actions to load settled slips from `/data/slips.json`.
- Apply filters: probability source (override, devigPair, singleOdds) and date ranges (7/30/90 days).

3) UI (/reports)
- Create new route/page `src/app/reports/page.tsx` (server/component as appropriate).
- Show leg-level and slip-level sections with overall stats (count, hit rate, avg predicted, delta, Brier) and binned calibration table (default 0.05 bins).
- Add simple controls for source filter and date range selection; reuse filtered data for tables.

4) Wiring
- Use server actions / server components to fetch data; pass to client display if needed.
- Keep UI minimal and readable.

5) Docs
- Update README with brief notes on the Reports page and metrics (calibration, Brier, bins).
