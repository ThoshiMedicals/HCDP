# Wave 5 Execution Report — Module 6 Time & Attendance

**Date:** 28 July 2026  
**Codebase:** `Development folder/`  
**Governing plan:** `docs/architecture/WAVE5_M06_IMPLEMENTATION_PLAN.md`  
**Approved planning checkpoint:** `309e36b0719229fbc618a05b7fdc046be3952e85`  
**Prior execution commit (not accepted):** `5ccfde9b435a89a70d87220b91168f8de04ca466`  
**Status:** **Workflow-evidence correction complete — awaiting owner review**  
**Owner acceptance:** **NOT granted**  
**Production approval:** **NOT granted**  
**Wave freeze:** **NOT frozen**

## Verdict

Focused Wave 5 correction: every required workflow now has independent evidence with asserted business outcomes. Acceptance totals match executed JSON exactly.

| Totals | Value |
|---|---|
| Passed | **119** |
| Failed | **0** |
| Skipped | **0** |
| Blocked | **1** (`BLOCKED-M07` / WF-19B only) |

Workflow accounting (§17.1) — source `docs/audits/wave5-m06-workflow-evidence.json`:

| Bucket | Count |
|---|---|
| Required M06 workflows independently passed | **21** |
| Failed required workflows | **0** |
| Skipped | **0** |
| Separately blocked intake | **1 × `BLOCKED-M07`** (WF-19B) |
| `BLOCKED-M10` | Informational only — **outside** Wave 5 totals |

### Explicit non-claims

- Wave 5 is **not** owner accepted and **not** frozen.
- Production is **not** approved.
- Local persistence is **not** production-grade persistence.
- Prototype performance is **not** a production SLA.
- Attendance policies are **not** legal, award, payroll or clinical-safety certification.
- Location / device checks do **not** prove work was performed.
- M07 intake remains **`BLOCKED-M07`**.
- Wave 6 / M07 was **not** started.

## Correction summary (owner review findings)

| Finding | Correction |
|---|---|
| Grouped WF-01/02/03/04 and WF-09/10 tests | Split into independent tests with unique IDs and outcomes |
| Acceptance generator marked all WFs pass from suite-green | Generator now requires `wave5-m06-workflow-evidence.json` per-ID pass + business detail; rejects grouped names |
| WF-20 array-only assertion | Seeds known mismatch; asserts `missing-attendance` / `unrostered-attendance` |
| WF-19A incomplete publish proof | Asserts payload, sourceVersion, idempotency, no duplicate side effect |
| WF-21 audit gaps | Bulk service writes per-item audit (`ok` / `fail` / `skipped`) |
| Clock UI forced unrostered | Prefers published roster match via M05 read adapter |
| Break controls without session | Disabled with explicit reason |

## Evidence class legend

| Class | Meaning |
|---|---|
| **unit/integration proof** | Independent `it("WF-xx …")` + service assertions |
| **functional browser proof** | Playwright section nav + control |
| **responsive/accessibility proof** | 6×10 matrix, keyboard, appearance selector |
| **numeric performance proof** | §16 rows in performance JSON |
| **blocked dependency** | `BLOCKED-M07` only |
| **deferred production concerns** | Prod persistence / SLA / biometrics / award certification |

## Twenty-one required workflows (independent)

| ID | Result | Detail class |
|---|---|---|
| WF-01 rostered clock-in | pass | unit — M05 published assignment; `rostered===true`; shift/assignment linked |
| WF-02 unrostered clock-in | pass | unit — unrostered exception + M02 |
| WF-03 early clock-in | pass | unit — early-in exception + M02 |
| WF-04 late arrival | pass | unit — late-in exception + M02 |
| WF-05 missed clock-in | pass | unit — idempotent + M02 |
| WF-06 break start | pass | unit — break `in_progress`; session `on_break` |
| WF-07 break end | pass | unit — break `completed`; session `open` |
| WF-08 missed break | pass | unit — missed + dedupe |
| WF-09 normal clock-out | pass | unit — closed; **no** early-out exception |
| WF-10 early departure | pass | unit — early-out exception + M02 |
| WF-11 missed clock-out | pass | unit — idempotent + M02 |
| WF-12 cross-midnight | pass | unit — Brisbane civil dates differ; TZ fields retained |
| WF-13 offline sync | pass | unit — enqueue idempotent; applied |
| WF-14 correction request | pass | unit — `requested` only; M02 pending; not auto-applied |
| WF-15 manager correction | pass | unit — applied via manager path |
| WF-16 approve/reject/apply | pass | unit — approve applies; reject not applied; stale version conflict |
| WF-17 reopen timesheet | pass | unit — `reopened` + audit |
| WF-18 escalate exception | pass | unit — escalated + M02 retained |
| WF-19A TimesheetRef publish | pass | unit — payload/version/idempotency; no duplicate publish |
| WF-20 reconcile | pass | unit — exact `missing-attendance` classification |
| WF-21 bulk partial | pass | unit — authorized approved; missing skipped; per-item audit |
| WF-19B M07 intake | **blocked** | `BLOCKED-M07`; no `pulse.m07.*` |

## Gates

| Gate | Result |
|---|---|
| M06 unit/integration (`npm run test:m06`) | **64/64 pass** |
| Independent workflow evidence JSON | 21 pass + 1 blocked |
| Frozen-wave regression (`npm test`) | pass |
| Platform QA | **152/152** (leftover platform report files not committed) |
| Ten-section browser | 10/10 pass |
| Responsive 6×10 | 60/60 pass |
| Appearance (real Command Centre selector) | pass |
| Keyboard focus | pass |
| Numeric §16 performance | 14/14 pass |
| Lint | 0 errors (warnings only) |
| `tsc --noEmit` | pass |
| Production build | pass |

## Numeric performance (§16) — prototype only

Source: `docs/audits/wave5-m06-performance-evidence.json`

| Evidence ID | Dataset | Target | Measured | Result |
|---|---:|---:|---:|---|
| `perf.clock` | 1 | ≤300ms | 51.86ms | pass |
| `perf.eligibility` | 1 | ≤150ms | 0.03ms | pass |
| `perf.exception` | 100 | ≤1000ms | 558.26ms | pass |
| `perf.break` | 100 | ≤500ms | 446.07ms | pass |
| `perf.timesheet` | 1 | ≤2000ms | 0.68ms | pass |
| `perf.correction` | 1 | ≤400ms | 11.84ms | pass |
| `perf.approval` | 1 | ≤500ms | 29.34ms | pass |
| `perf.bulkPreview` | 200 | ≤2000ms | 0.49ms | pass |
| `perf.bulkSubmit` | 200 | ≤5000ms | 691.15ms | pass |
| `perf.offline` | 100 | ≤3000ms | 148.68ms | pass |
| `perf.m02` | 1 | ≤50ms | 10.81ms | pass |
| `perf.live` | 50 | ≤2500ms | 0.06ms | pass |
| `perf.report` | 1 | ≤3000ms | 0.34ms | pass |
| `perf.export` | 1 | ≤3000ms | 1.76ms | pass |

Exact measured milliseconds are also recorded in `docs/audits/wave5-m06-performance-evidence.json` and must agree with this table.

## Leftovers (not part of this correction commit)

- Untracked: `docs/audits/PLATFORM_INTEGRATION_QA.md.bak`
- Preserved / not staged: `PLATFORM_INTEGRATION_QA.md`, `platform-integration-evidence.json`, `wave3-m11-performance-evidence.json`

## Stop

Correction complete. **Stop for explicit owner review.**  
Do not mark Wave 5 accepted or frozen.  
Do not begin Wave 6 / M07.
