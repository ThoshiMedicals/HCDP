# Wave 5 Execution Report — Module 6 Time & Attendance

**Date:** 28 July 2026  
**Codebase:** `Development folder/`  
**Governing plan:** `docs/architecture/WAVE5_M06_IMPLEMENTATION_PLAN.md`  
**Approved planning checkpoint:** `309e36b0719229fbc618a05b7fdc046be3952e85`  
**Status:** **Execution complete — awaiting owner review**  
**Owner acceptance:** **NOT granted**  
**Production approval:** **NOT granted**  
**Wave freeze:** **NOT frozen**

## Verdict

Wave 5 M06 Time & Attendance implementation, tests, migrations and generated evidence are complete against the approved plan. Totals below match `docs/audits/wave5-m06-acceptance-evidence.json` exactly.

| Totals | Value |
|---|---|
| Passed | **117** |
| Failed | **0** |
| Skipped | **0** |
| Blocked | **1** (`BLOCKED-M07` / WF-19B only) |

Workflow accounting (§17.1):

| Bucket | Count |
|---|---|
| Required M06 workflows passed (WF-01…18, WF-19A, WF-20, WF-21) | **21** |
| Failed required workflows | **0** |
| Skipped | **0** |
| Separately blocked intake | **1 × `BLOCKED-M07`** (WF-19B) |
| `BLOCKED-M10` | Informational only — **outside** Wave 5 pass/fail/skipped/blocked totals |

### Explicit non-claims

- Wave 5 is **not** owner accepted.
- Production is **not** approved or deployment-ready.
- Local persistence is **not** production-grade persistence.
- Prototype performance is **not** a production SLA.
- Attendance policies are **not** legal, award, payroll or clinical-safety certification.
- Location / device / PIN / QR / geofence / identity checks do **not** prove that work was performed.
- M07 intake remains **`BLOCKED-M07`** (no `pulse.m07.*` writes; no simulated successful intake).
- Wave 6 / M07 payroll truth was **not** started.

## Evidence class legend

| Class | Meaning |
|---|---|
| **unit/integration proof** | `tsx --test` / `npm run test:m06` / `npm test` |
| **functional browser proof** | Playwright nav, section identity, section control |
| **responsive/accessibility proof** | 6×10 matrix, keyboard focus, appearance selector |
| **numeric performance proof** | `wave5-m06-performance-evidence.json` §16 rows |
| **blocked dependency** | Explicit `BLOCKED-M07` only |
| **deferred production concerns** | Prod persistence, SLA, biometrics, award/law certification |

## Scope and ownership confirmation

M06 is source of truth for attendance sessions, clock/break events, exceptions, declarations, corrections, approvals, timesheet calculation inputs, verification evidence references, offline sync records and attendance audit history.

Boundaries preserved:

- M04 owns workforce identity, employment, leave and clinic eligibility (read adapter only).
- M05 owns roster shifts, assignments and publication (read adapter only; no M05 repository import).
- M07 owns payroll preparation — intake adapter returns `BLOCKED-M07` only.
- M02 owns projected inbox actions (create/dedupe/update/close/stale protection evidenced).
- M01 receives aggregate operational projections only (no raw location/device/biometric evidence).
- No legacy dual-write; no `pulse.m07.*` records created (asserted in migration/workflow tests).

## Ten functional sections (browser proof)

Each section navigated via nav control, asserted unique `m06-section-*` / `m06-heading-*` / active nav, exercised a section-specific control, and failed if Live remained for non-live sections.

| Section | Result | Evidence id | Class |
|---|---|---|---|
| Live Attendance | pass | `section.live` | functional browser |
| Clock In/Out | pass | `section.clock` | functional browser |
| Timesheets | pass | `section.timesheets` | functional browser |
| Exceptions | pass | `section.exceptions` | functional browser |
| Corrections | pass | `section.corrections` | functional browser |
| Approvals | pass | `section.approvals` | functional browser |
| Breaks | pass | `section.breaks` | functional browser |
| Attendance History | pass | `section.history` | functional browser |
| Reports | pass | `section.reports` | functional browser |
| Settings & Policies | pass | `section.settings` | functional browser |

## Twenty-one required workflows + blocked intake

| # | Workflow | Result | Class |
|---|---|---|---|
| WF-01…04 | Rostered / unrostered / early / late clock-in | pass | unit/integration |
| WF-05 | Missed clock-in | pass | unit/integration |
| WF-06…07 | Break start/end | pass | unit/integration |
| WF-08 | Missed break | pass | unit/integration |
| WF-09…10 | Normal / early clock-out | pass | unit/integration |
| WF-11 | Missed clock-out | pass | unit/integration |
| WF-12 | Cross-midnight clock pair | pass | unit/integration |
| WF-13 | Offline capture and sync | pass | unit/integration |
| WF-14…16 | Correction request / approve / apply | pass | unit/integration |
| WF-15 | Manager correction | pass | unit/integration |
| WF-17 | Reopen timesheet | pass | unit/integration |
| WF-18 | Exception escalate | pass | unit/integration |
| **WF-19A** | Publish TimesheetRef + `timesheet.approved` | **pass** | unit/integration |
| **WF-19B** | M07 intake | **`BLOCKED-M07`** | blocked dependency |
| WF-20 | Roster vs attendance reconcile | pass | unit/integration |
| WF-21 | Bulk approve partial success | pass | unit/integration |

WF-19A retains M06-owned timesheet truth, publishes TimesheetRef with validated payload/source/version, stable idempotency, and fails if publication does not occur. WF-19B does not simulate M07 success and does not write `pulse.m07.*`.

## Gates executed (separate reporting)

| Gate | Result |
|---|---|
| M06 domain / authz / concurrency / offline / TZ / adapters / privacy / migration / UX / workflows / performance | **57/57 pass** (`unit.pass=57`, `unit.fail=0`) |
| Permission + clinic-scope (+/- / cross-clinic / self-vs-team / evidence mask / audit / export / bulk / override reason) | pass (unit) |
| TZ-01…TZ-08 | pass (unit) |
| M02 lifecycle projections (writes > 0) | pass (unit + perf.m02) |
| M01 aggregate-only executive adapter | pass (unit) |
| WF-19A publication | pass |
| WF-19B blocked boundary | blocked (`BLOCKED-M07`) |
| Migration / seed / repeat-run / rollback + no `pulse.m07.*` | pass |
| Ten-section browser | 10/10 pass |
| Responsive 6×10 | **60/60 pass** |
| Keyboard measurable focus | pass (`a11y.keyboard-focus`) |
| Appearance Light / Dark / Device + OS light→dark + persist nav/reload | pass (real `select[aria-label="Appearance"]`) |
| Numeric §16 performance matrix | **14/14 pass** |
| Frozen-wave regression (`npm test` includes M04/M05/M11/M06) | pass |
| Platform QA (`npm run test:platform-qa`) | **152/152 pass** (harness expectations updated for M06 legacy section ids; leftover platform QA report files **not** committed) |
| Lint | 0 errors (warnings only: intentional `refreshKey` deps) |
| Type-check (`tsc --noEmit`) | pass |
| Production build | pass |

## Numeric performance (§16) — local prototype only

Source: `docs/audits/wave5-m06-performance-evidence.json`  
Unit-test pass counts are **not** substituted for these rows.

| Evidence ID | Dataset | Target | Metric | Measured | Method | Result |
|---|---:|---:|---|---:|---|---|
| `perf.clock` | 1 | ≤300ms | per-op typical | 63.92ms | clockIn+clockOut | pass |
| `perf.eligibility` | 1 | ≤150ms | per-op typical | 0.04ms | listPublishedAssignmentsForPerson | pass |
| `perf.exception` | 100 | ≤1000ms | p95 | 310.1ms | raiseMissedClockIn×100 | pass |
| `perf.break` | 100 | ≤500ms | p95 | 84.99ms | startBreak+endBreak×20 | pass |
| `perf.timesheet` | 1 | ≤2000ms | max | 0.29ms | generateTimesheet | pass |
| `perf.correction` | 1 | ≤400ms | per-op | 5.66ms | requestCorrection | pass |
| `perf.approval` | 1 | ≤500ms | per-op | 6.71ms | approveCorrection | pass |
| `perf.bulkPreview` | 200 | ≤2000ms | max | 0.36ms | previewBulkApprove | pass |
| `perf.bulkSubmit` | 200 | ≤5000ms | max | 172.94ms | submitBulkApprove | pass |
| `perf.offline` | 100 | ≤3000ms | max | 117.74ms | enqueue+syncOfflineQueue | pass |
| `perf.m02` | 1 | ≤50ms | typical | 8.35ms | raiseMissedClockIn→inbox | pass |
| `perf.live` | 50 | ≤2500ms | max/p95 | 0.05ms | listSessionsForActor | pass |
| `perf.report` | 1 | ≤3000ms | max | 0.27ms | buildAttendanceReport | pass |
| `perf.export` | 1 | ≤3000ms | max | 0.84ms | exportAttendance | pass |

## Inventory extras beyond §18 (explicit)

| Path | Why required | Inside M06 scope? | Freeze-safe? |
|---|---|---|---|
| `scripts/platform-integration-qa.mjs` (modify) | Align legacy redirect expectations with approved §18 `legacy-routes.ts` mappings (`timeclock`/`sync-centre` → `section=clock`) so platform regression can pass without changing frozen runtime | Platform harness only | Yes — expectation update only; leftover `PLATFORM_INTEGRATION_QA.md` / `platform-integration-evidence.json` **not** committed |
| `src/modules/m06-time-attendance/tests/_helpers.ts` | Shared test fixtures required by listed M06 test files | Yes (tests) | Yes |

No silent inventory broadening of M06 runtime beyond §18 create/modify lists. Additive TimesheetRef optional fields remain backward compatible (not newly required).

## Leftovers (not part of Wave 5 commit)

Unrelated tracked/untracked leftovers preserved and **not** staged:

- `docs/audits/PLATFORM_INTEGRATION_QA.md`
- `docs/audits/platform-integration-evidence.json`
- `docs/audits/wave3-m11-performance-evidence.json`
- `docs/audits/PLATFORM_INTEGRATION_QA.md.bak`

## Stop

Execution complete. **Stop for explicit owner review.**  
Do not mark Wave 5 accepted or frozen.  
Do not begin Wave 6 / M07.
