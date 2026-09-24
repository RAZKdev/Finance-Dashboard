# Finance Dashboard — SKILL.md

> Engineering source of truth for Finance Dashboard.

## Identity
Finance Dashboard is a personal finance/investment tracking dashboard for assets, portfolio value, holdings/transactions, market information, and analytics.

## Current baseline
Known baseline:
- React + Vite + TypeScript.
- Tailwind CSS v4.
- Premium dark dashboard direction.
- LocalStorage persistence for relevant state.
- Shared finance types centered around `src/types/finance.ts`.
- Asset-management milestone E4 was previously closed and should not be disturbed without a real bug or explicit requirement.

**Audit the repository first. Repository evidence wins over this summary.**

## Product goals
- Correct calculations.
- Clear data provenance/freshness.
- Maintainable architecture.
- Responsive premium UI.
- Honest distinction between mock and real data.
- Incremental path toward real market-data integrations.

## Non-goals
Do not:
- fabricate market values;
- label mock data as live;
- promise investment outcomes;
- over-engineer infrastructure before requirements exist;
- rewrite stable features for aesthetic preference;
- expose provider secrets in frontend code.

## Architecture
Prefer clear boundaries between domain types, UI, state, persistence, calculations, adapters, and API integration. Financial calculations should be pure/testable where practical.

Conceptual real-data path:
```text
Provider/API → adapter → normalized domain model → application state → UI
```

## Data integrity
Explicitly handle null/missing values, zero values, invalid quantities, currency/unit assumptions, stale data, incomplete records, and duplicates where relevant. Never silently turn bad data into plausible-looking numbers.

## Persistence
When using localStorage, validate parsed values, provide safe defaults, avoid silent schema changes, and introduce migrations if persistence schemas materially change.

## API/security
Define contracts before integration. Never place protected provider keys in the client. Keep provider-specific formats behind adapters/services.

## Testing priorities
Asset CRUD, portfolio totals, financial calculations, repeated edits, persistence/reload, empty/zero/invalid values, decimal precision, P&L logic where present, filters, market-detail states, and responsive behavior.

## Security baseline
No secrets in frontend; validate inputs; avoid unsafe HTML; sanitize user-entered labels/notes; protected API access belongs server-side; minimize permissions.

## Mandatory stabilization sequence
```text
READ DOCS
→ AUDIT REPOSITORY
→ MAP ARCHITECTURE
→ REVIEW/CLEAN FOLDERS SAFELY
→ REVIEW CODE
→ FIX VERIFIED ISSUES
→ TEST/BUILD
→ VISUAL QA
→ BASELINE REPORT
→ ONLY THEN PLAN NEXT MILESTONE
```

## Definition of done
Calculations, affected state/data flows, tests/build, UI states, data-source honesty, security implications, and documentation are verified or explicitly marked unverified.
