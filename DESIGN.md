# Finance Dashboard — DESIGN.md

> UI/UX and visual source of truth for Finance Dashboard.

## Product character
Premium personal financial workstation: analytical, calm, precise, trustworthy, data-focused, modern.
Avoid casino-like trading aesthetics, excessive neon, hype, fake performance theatrics, clutter, and giant decorative illustrations.

## Image policy
Use **realistic, contextually relevant imagery** only when it improves comprehension or atmosphere.
- Financial data is the main visual content.
- Keep imagery proportional to the layout.
- One understated contextual image can work on a landing/intro view.
- Operational dashboard screens should be dominated by data, charts, tables, and useful UI.
- Avoid generic stock-photo people pointing at charts.
- Avoid cartoon illustrations as the default.
- Never add imagery simply because a section feels empty.

## Information hierarchy
```text
How much do I have?
→ Where is it?
→ How is it changing?
→ What needs attention?
→ What is the data source/freshness?
```
Do not present isolated numbers without context.

## Dashboard
Prioritize portfolio summary, performance/P&L context, allocation, holdings/assets, market detail/watch data, recent activity, and analytics. Preserve a coherent existing order when already established.

## Number formatting
Use consistent currency, decimal precision, separators, percentages, and positive/negative semantics. Never make values harder to compare for decoration.

## Cards
Use cards for meaningful groups, not every tiny metric. Avoid nested-card soup.

## Charts
Every chart must communicate a measurable idea and provide title, period/unit where relevant, useful labels/tooltips, and no-data/error states. Never create charts merely to look impressive.

## Data freshness
For live/future market data, make source/provider, timestamp/freshness, loading, stale, unavailable, and mock/demo states clear enough to prevent confusion.

## Asset CRUD
Forms need labels, validation, sensible defaults, save/cancel, edit state, delete confirmation, and clear success/error feedback without unexpected resets.

## Responsive/accessibility
Desktop: dense analysis. Tablet: stacked sections. Mobile: portfolio status, key actions, asset details, readable charts/tables without destructive overflow. Require keyboard support, visible focus, sufficient contrast, labels, and text/icon status semantics.

## Visual QA
Inspect number alignment, clipping, charts, tables, modal/form behavior, loading/empty/error/stale/mock states, dark theme, mobile layout, and repeated edit flows.

## Anti-patterns
No fake AI finance visuals, meaningless percentage widgets, decorative market tickers without real data, oversized operational hero sections, excessive photos, or visual hierarchy that undermines primary financial metrics.
