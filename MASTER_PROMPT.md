# Finance Dashboard — MASTER_PROMPT.md

You are the implementation agent for **Finance Dashboard**.

## Mission
Stabilize and understand the existing dashboard before adding the next feature. Audit first, safely reorganize, review code, fix verified issues, prove the baseline, then continue development.

## Mandatory context
Read:
1. `SKILL.md`
2. `DESIGN.md`
3. `MASTER_PROMPT.md`

These are project-local source of truth. Do not import another project's rules.

## Execution order
```text
READ DOCS
→ AUDIT
→ MAP ARCHITECTURE
→ FOLDER REVIEW
→ SAFE CLEANUP
→ CODE REVIEW
→ BUG FIXES
→ TESTS
→ BUILD
→ VISUAL QA
→ BASELINE REPORT
→ NEXT MILESTONE PLAN
→ IMPLEMENT
→ TEST
→ SECURITY REVIEW
→ VISUAL QA
→ DELIVERY
```
Do not skip stabilization to chase the next feature.

## Audit requirements
Inspect `src/`, `src/types/finance.ts`, pages/routes, components, state, localStorage, asset CRUD, portfolio calculations, market-detail/mock adapters, filters, P&L logic where present, configs, tests, styling, and Git state.

Identify stable features, incomplete features, duplicate/dead files, broken imports, calculation risks, state inconsistencies, UI regressions, and technical debt.

## Folder cleanup
Propose a target structure based on the actual repository. Check imports/routes/assets before every move or deletion. Preserve stable behavior and run the build after structural changes.

## Code review priorities
Pay special attention to:
- calculations;
- type mismatches;
- stale state;
- localStorage parsing;
- duplicate source-of-truth data;
- form reset behavior;
- repeated add/edit/delete;
- P&L edge cases;
- mock-vs-live labeling;
- chart transformations;
- filters;
- responsive overflow;
- console errors.

Classify findings as CRITICAL/HIGH/MEDIUM/LOW/INFO.

## Baseline acceptance
Verify startup/build, asset add/edit/delete, portfolio totals, persistence/reload, repeated edits, filters, P&L where present, mock market-detail labeling, responsive behavior, and important console errors.

Unverified items must be explicitly listed.

## Next feature
After stabilization, define one bounded milestone with acceptance criteria, impacted files, tests, and security considerations. Do not add a real external API just because a mock adapter exists.

## Financial integrity
Never fabricate data. Keep unit/currency assumptions explicit. Keep financial logic testable. Never expose provider secrets client-side.

## Image rule
Use authentic/relevant imagery only where it helps. Keep image quantity proportional. Do not flood finance screens with photographs or cartoon illustrations; charts, tables, icons, and actual data are usually the primary visual language.

## Final report
Return:
- BASELINE
- FOLDER CLEANUP
- CODE REVIEW
- BUGS FOUND/FIXED
- TESTS/BUILD
- VISUAL QA
- SECURITY
- NEXT MILESTONE
- UNVERIFIED/BLOCKED

Never claim calculations are correct without testing representative cases.
