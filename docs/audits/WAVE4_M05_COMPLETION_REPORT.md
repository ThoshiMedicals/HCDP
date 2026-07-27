# Wave 4 Execution Report — Module 5 Roster & Shift Management

**Date:** 28 July 2026  
**Codebase:** `Development folder/`  
**Governing plan:** `docs/architecture/WAVE4_M05_IMPLEMENTATION_PLAN.md`  
**Planning checkpoint:** `03a0beff267c9aaf382d161cbfec9f3d0df013e1`  
**Status:** **Evidence correction completed; awaiting explicit owner acceptance**  
**Owner acceptance:** **NOT granted**  
**Production approval:** **NOT claimed**

## Scope confirmation

- Wave 4 M05 evidence correction only (harness + directly required testability/a11y/performance fixes).
- Preserved frozen Waves 1A–3 functionality, data, contracts and tests.
- M04 remains authoritative eligibility owner; M05 consumes `authority: "m04-platform"`.
- M11 contribution remains through M04 only.
- No M06 attendance, M07 payroll, or M22 recruitment records created.
- No dual-write introduced.
- Wave 5 was not started.

## Evidence class legend

| Class | Meaning |
|---|---|
| **unit-test proof** | `tsx --test` / `npm test` assertions |
| **automated functional proof** | Service/read-model conditions exercised without `?uxState=` demos |
| **visual/browser proof** | Playwright navigation, selectors, themes, keyboard, responsive |
| **blocked dependency** | Explicit `BLOCKED-M10` only |
| **deferred production concerns** | Out of Wave 4 scope (prod persistence/SLA) |

## Boundaries and dependency status

| Boundary | Result | Class |
|---|---|---|
| Publication immutable snapshots | **pass** | unit-test |
| Period lifecycle excludes ack pseudo-states | **pass** | unit-test |
| Acknowledgement derived `none \| partial \| full` | **pass** | unit-test |
| Stale ack / optimistic concurrency | **pass** | unit-test + browser functional |
| Service-layer clinic scope + permissions | **pass** | unit-test |
| Override requires permission + reason + audit | **pass** | unit-test |
| Clinic IANA timezone, no silent UTC fallback | **pass** | unit-test |
| M10 duty bridge safety gate | **blocked** | blocked dependency (`BLOCKED-M10`) |

## Ten functional sections (individual browser proof)

Each section was navigated via its nav control, waited until active, asserted unique `m05-section-*` / `m05-heading-*` / active nav, exercised a section-specific control, and failed if Roster Board remained displayed for non-board sections. Identical weak fingerprints (`headings=3; placeholderOnly=false; bodyChars=2316`) are rejected.

| Section | Result | Evidence id | Class |
|---|---|---|---|
| Roster Board | pass | `section.roster-board` | visual/browser |
| Coverage | pass | `section.coverage` | visual/browser |
| Open Shifts | pass | `section.open-shifts` | visual/browser |
| Availability & Leave | pass | `section.availability-leave` | visual/browser |
| Requests | pass | `section.requests` | visual/browser |
| Conflicts & Warnings | pass | `section.conflicts-warnings` | visual/browser |
| Published History | pass | `section.published-history` | visual/browser |
| Cost Forecast | pass | `section.cost-forecast` | visual/browser |
| Reports | pass | `section.reports` | visual/browser |
| Settings | pass | `section.settings` | visual/browser |

## Twelve workflows (individual)

| # | Workflow | Result | Evidence | Class |
|---|---|---|---|---|
| 1 | Create roster period | pass | `m05-domain.test.ts` / `U-WF01` | unit-test |
| 2 | Add/edit shifts | pass | `m05-domain.test.ts` / `U-WF02` | unit-test |
| 3 | Assign eligible worker | pass | `m05-eligibility.test.ts` / `U-WF03` | unit-test |
| 4 | Blocking/advisory eligibility reasons | pass | `m05-eligibility.test.ts` / `U-WF04` | unit-test |
| 5 | Cross-clinic conflicts / fatigue | pass | `m05-conflict-policy.test.ts` / `U-WF05` | unit-test |
| 6 | Publish roster | pass | `m05-publication.test.ts` / `U-WF06` | unit-test |
| 7 | Notify + acknowledgement | pass | `m05-publication.test.ts` / `U-WF07` | unit-test |
| 8 | Swap request/approve | pass | `m05-swap-open.test.ts` / `U-WF08` | unit-test |
| 9 | Open-shift offer/accept | pass | `m05-swap-open.test.ts` / `U-WF09` | unit-test |
| 10 | Urgent coverage escalation | pass | `m05-adapters.test.ts` | unit-test |
| 11 | Version published change | pass | `m05-publication.test.ts` / `U-WF11` | unit-test |
| 12 | Transfer duties to M10 | **blocked** | `BLOCKED-M10` | blocked dependency |

## Real UX-state matrix (not `?uxState=` demos)

Demo `?uxState=` routes may remain for development only. Acceptance evidence uses real triggers:

| ID | State | Trigger | Result | Class |
|---|---|---|---|---|
| UX-01 | loading | `pulse.m05.evidence.forceLoading` delayed bootstrap | pass | automated functional + browser |
| UX-02 | empty | empty repository periods/shifts (seed migration held) | pass | automated functional + browser |
| UX-03 | filtered-empty | board filter removes all rows | pass | automated functional + browser |
| UX-04 | restricted | `forceRestricted` clears actor permissions | pass | automated functional + browser |
| UX-05 | validation-error | create-period with empty required fields | pass | automated functional + browser |
| UX-06 | system-error | `forceSystemError` on period read | pass | automated functional + browser |
| UX-07 | offline | Playwright `context.setOffline(true)` | pass | automated functional + browser |
| UX-08 | concurrent-conflict | stale period version + Submit for review | pass | automated functional + browser |

## Appearance (real Command Centre selector)

| Check | Result | Class |
|---|---|---|
| Explicit Light via Appearance select | pass | visual/browser |
| Explicit Dark via Appearance select | pass | visual/browser |
| Dark persists on `/roster` navigation | pass | visual/browser |
| Dark persists after reload | pass | visual/browser |
| Device/System stored as `system` | pass | visual/browser |
| System + OS light preference | pass | visual/browser |
| System + OS dark preference | pass | visual/browser |
| Contrast usable @ desktop and mobile | pass | visual/browser |

OS media emulation alone is **not** reported as explicit Light or explicit Dark.

## Keyboard / focus

| Check | Result | Class |
|---|---|---|
| Tab to `m05-nav-coverage` with measurable outline | pass | visual/browser |
| Enter activates Coverage | pass | visual/browser |
| Space activates Open Shifts | pass | visual/browser |
| Logical order / labelled nav / no trap | pass | visual/browser |

Focused elements with no measurable focus indicator fail the harness.

## Responsive matrix (6 × 10)

Widths **1440, 1280, 1024, 768, 430, 390** × all ten sections: correct section active + no page-level horizontal overflow.  
Evidence ids: `responsive.<width>.<section-id>`. Class: visual/browser.

## Numeric performance (§23)

Source: `docs/audits/wave4-m05-performance-evidence.json`  
Unit-test counts are **not** substituted for performance results.

| Operation | Dataset | Target | Measured | Metric | Result |
|---|---:|---:|---:|---|---|
| Initial roster-board load | 200 | ≤2500ms | 0.59ms | max | pass |
| Board filtering | 200 | ≤300ms | 0.18ms | p95 | pass |
| Eligibility lookup | 1 | ≤100ms | 0.17ms | typical | pass |
| Conflict recalculation | 160 | ≤2000ms | 1.7ms | max | pass |
| Coverage calculation | 30 | ≤500ms | 1.89ms | p95 | pass |
| Publication preview | 60 | ≤2000ms | 28.47ms | max | pass |
| Publication submission | 60 | ≤3000ms | 216.35ms | max | pass |
| Open-shift acceptance | 1 | ≤400ms | 4.03ms | max | pass |
| Swap approval | 1 | ≤500ms | 5.12ms | max | pass |
| Bulk preview | 500 | ≤2000ms | 1.29ms | max | pass |
| Bulk submission | 500 | ≤5000ms | 3905.37ms | max | pass |
| M02 projection | 1 | ≤50ms | 1.15ms | typical | pass |
| Reports | scoped | ≤3000ms | 3.5ms | max | pass |
| Scoped export | scoped | ≤3000ms | 14.16ms | max | pass |

Prototype measurements only — not production SLAs.

## Final gates (fresh correction run)

| Gate | Pass | Fail | Skipped | Blocked |
|---|---:|---:|---:|---:|
| M05 unit (+ performance suite rows in evidence) | 117 | 0 | 0 | 0 |
| Workforce / auth / M04 / M11 / M05 regression (`npm test`) | all | 0 | 0 | 0 |
| Platform QA | 152 | 0 | 0 | 0 |
| Corrected browser workflows (10 sections) | 10 | 0 | 0 | 0 |
| Responsive matrix (60 cells) | 60 | 0 | 0 | 0 |
| Appearance modes | 9 | 0 | 0 | 0 |
| Real eight-state UX matrix | 8 | 0 | 0 | 0 |
| Keyboard / a11y checks | 4 | 0 | 0 | 0 |
| Numeric performance matrix | 14 | 0 | 0 | 0 |
| lint | 0 errors (warnings only) | 0 | 0 | 0 |
| type-check (`tsc --noEmit`) | pass | 0 | 0 | 0 |
| production build | pass | 0 | 0 | 0 |
| M10 duty bridge | — | — | — | **1 (`BLOCKED-M10`)** |

### Acceptance evidence totals

- Source: `docs/audits/wave4-m05-acceptance-evidence.json`
- Totals: **pass 106 / fail 0 / skipped 0 / blocked 1**
- Blocked: workflow 12 (`BLOCKED-M10`) only — no other critical check skipped.

## Known defects / assumptions / deferred

### Known defects
- None open in corrected Wave 4 evidence.

### Assumptions
- Demo Act-as identity and local persistence environment.
- Clinic timezone registry available for demo clinics.

### Deferred production concerns
- M10 duty bridge until safe M10-owned contract exists (`BLOCKED-M10`).
- Production persistence and production-grade concurrency/SLA remain out of Wave 4 scope.

## Regression confirmation

- `npm test` passed (workforce/auth/m04/m11/m05).
- `npm run test:platform-qa` passed (152/152).
- Wave 2 and Wave 3 functional behaviour remains intact under their existing suites.

## File-scope summary

Correction touched:
- `src/modules/m05-roster/**` (section identity, focus, concurrency snapshot, coverage/store perf, evidence hooks);
- `src/lib/portal-context.tsx` (system appearance subscription);
- `src/styles/tokens.css` (measurable M05 nav focus);
- `scripts/wave4-m05-acceptance-evidence.mjs`;
- `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`;
- `docs/audits/wave4-m05-acceptance-evidence.json`;
- `docs/audits/wave4-m05-performance-evidence.json`.

No Wave 5 files were created or modified.
**Wave 4 owner acceptance is not marked.**
