# WAVE 6 / M07 Batch 2 — Checkpoint 2.3 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Accepted baseline:** Checkpoint 2.2 evidence
**Scope:** Remove M07 legacy M06 storage scrape; forbid future M07→M06 internal access; route discovery through CP 2.1 platform registry; controlled empty/unavailable states; static boundary tests; this report.
**Excluded:** Checkpoint 2.4+ intake/snapshots/replay; BLOCKED-M07 clearance; operational UI; M01/M02 projections; payroll calculations; CSS / Premium Clinical Enterprise; commit/push.

---

## A. Exact files changed

### Created (Checkpoint 2.3)
- `src/modules/m07-staff-pay/tests/m07-boundary-cp23.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_3_EVIDENCE.md` (this file)

### Modified (Checkpoint 2.3)
- `src/modules/m07-staff-pay/adapters/m06-timesheet-read.ts` — scrape removed; platform discovery only
- `src/modules/m07-staff-pay/tests/m07-adapters.test.ts` — seed platform registry instead of `pulse.m06.*`

### Not modified (by design)
- M06 publisher/outbox/registry semantics
- M06 `m07-timesheet-bridge.ts` (still BLOCKED-M07)
- M07 intake/UI sections
- No additive wipe migration (no scrape-derived M07 cache existed)

---

## B. Paths vs plan

| Plan expectation | Actual | Diff |
|---|---|---|
| M07 legacy bridge/read adapter | Same path `adapters/m06-timesheet-read.ts` rewritten | Filename retained for export stability; source constant renamed |
| Related exports/wiring | `adapters/index.ts` unchanged (re-exports same module) | No broad refactor |
| Boundary/static tests | `tests/m07-boundary-cp23.test.ts` | Dedicated CP 2.3 suite |
| Migration | **None required** | Scrape read M06 keys live; no M07-owned scrape cache to freeze |

---

## C. Removed M07 legacy access paths

| Removed | Former behaviour |
|---|---|
| `const TIMESHEETS_KEY = "pulse.m06.attendance.timesheets"` | Direct localStorage read of M06 SoT |
| `readJsonSafe(TIMESHEETS_KEY, …)` inside `listApprovedTimesheetRefs` | Enumerated/scraped approved M06 rows |
| `M07_M06_TIMESHEET_READ_SOURCE = "pulse.m06.attendance.timesheets"` | Advertised scrape source |
| Fallback scrape of M06 `approved`/`state` fields | Replaced by platform registry discovery |

No M07 imports of M06 repositories/services/storage/domain existed beyond this adapter scrape (confirmed by grep + static walk).

---

## D. Remaining `pulse.m06.*` textual occurrences (classified)

| Location | Classification |
|---|---|
| `m07-staff-pay/adapters/m06-timesheet-read.ts` comment “Does NOT read pulse.m06.*” | Documentation / prohibition statement |
| `m07-staff-pay/tests/m07-boundary-cp23.test.ts` | Explicit boundary-test fixture (writes legacy key to prove it is ignored) + assertion patterns |
| `m07-staff-pay/tests/m07-migration.test.ts` asserts key is `null` after M07 migrate | Explicit boundary test (M07 must not create M06 keys) |
| All `m06-time-attendance/**` storage/services | Authorised M06 ownership |
| CP 2.1/2.2 evidence docs | Historical documentation |
| M06 workflow/adapter tests mentioning BLOCKED-M07 | Historical / boundary evidence |

**No prohibited operational dependency remains in M07 production source.**

---

## E. Final dependency boundary

```
M06 SoT → M06 publisher/outbox → platform PublishedTimesheetRegistry
                                         ↓
                         M07 discoverPublishedTimesheets (read-only discovery)
                                         ✗ no intake / no mutation (CP 2.4+)
```

- M07 must not read M06 storage or import M06 internals.
- M06 must not write `pulse.m07.*` (unchanged; still asserted).
- Platform does not import M06 internals (unchanged).
- M07 does not duplicate the published-timesheet contract.
- M07 does not operationally consume/mutate registry publications.

---

## F. Controlled empty / unavailable behaviour

| Condition | `status` | `reason` |
|---|---|---|
| Missing org or LE scope | `unavailable` | `MISSING_SCOPE` |
| No eligible approved/revised/restored publication | `empty` | `NO_ELIGIBLE_PUBLICATION` |
| Registry JSON corrupt / non-array | `unavailable` | `REGISTRY_CORRUPT` |
| Only unsupported `contractVersion` rows | `unavailable` | `UNSUPPORTED_CONTRACT` |
| Registry API throw | `unavailable` | `REGISTRY_UNAVAILABLE` |
| Eligible publications found | `available` | — |

Always: `intakeStatus: "not-implemented"`, `blockedM07: true`, `intakeImplemented: false` on items.
Legacy M06 key content alone → `empty` (no fallback).
No inference of calculation, payroll approval, export, or payment.

---

## G. Static enforcement design

`m07-boundary-cp23.test.ts` walks **M07 production** `.ts/.tsx` (excludes `tests/`).

Checks:
1. No `pulse.m06` outside comments/strings (comment/string strip then match).
2. No `pulse.m06.*` string literals in production sources.
3. No concatenation/join patterns suggestive of `pulse`+`m06` key construction.
4. No `attendance.timesheets` references in production code.
5. No import path fragments into M06 repository/storage/services/types.
6. localStorage enumeration + `m06` mention fails the file.
7. Behavioural: writing `pulse.m06.attendance.timesheets` does not populate discovery.

Bypass protections: string stripping for comments; literal + concatenation checks; path-fragment import ban; behavioural no-fallback fixture. Not a blanket scan of evidence docs.

---

## H. Storage / migration / preservation

- No M07 scrape-derived cache key existed → no wipe migration.
- `pulse.m07.staffpay.intake` remains an empty Batch 1 placeholder (unused); not converted to platform snapshots.
- M06 source/outbox, platform registry history, and M07 Batch 1 period data are not deleted by this checkpoint.
- Test proves M07 periods key preserved across discovery calls.

---

## I. Tenant / legal-entity / clinic isolation

- Discovery requires independent `organisationId` + `legalEntityId` (never derived from each other).
- Registry list/get already tenant-scoped; discovery re-asserts both fields.
- Optional `clinicId` filter applied when provided.
- Cross-org / wrong-LE lists return empty; guessed `registryPublicationId` under wrong scope returns `null` (no existence leak).

---

## J. New tests and results

| Suite | Result |
|---|---|
| `m07-boundary-cp23.test.ts` | **8 pass / 0 fail** |
| Updated `m07-adapters.test.ts` discovery case | pass (within M07 suite) |

---

## K. Regression results (first-run)

| Suite | First-run | Notes |
|---|---|---|
| `test:workforce` | **45 pass / 0 fail** | |
| `test:auth` | **16 pass / 0 fail** | |
| `test:m04` | **16 pass / 0 fail** | |
| `test:m05` | **115 pass / 2 fail** | Performance-only: bulk submission `11391.92ms > 5000ms` + evidence assert. Preserved for CP 2.7. **No controlled rerun** (not resolved). |
| `test:m06` | **82 pass / 1 fail** | Performance-only: `perf.clock 452.64 > 300`. Preserved for CP 2.7. **No controlled rerun**. |
| `test:m07` | **57 pass / 0 fail** | Was 49; +8 CP 2.3 boundary tests |

Prior CP 2.2 performance qualification remains on record (M05 115/2; M06 82/1; M06 functional excl. perf 70/0). This checkpoint does not relabel those as fixed.

---

## L. Working-tree separation

### Checkpoint 2.1
Platform published-timesheet contract/hash/events/registry/validation/tests + `WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md`

### Checkpoint 2.2
M06 publisher/outbox/migrate-v3/tests + related M06 wiring + `WAVE6_BATCH2_CHECKPOINT_2_2_EVIDENCE.md`

### Checkpoint 2.3
- `adapters/m06-timesheet-read.ts`
- `tests/m07-boundary-cp23.test.ts`
- `tests/m07-adapters.test.ts`
- this evidence doc

### Regression-generated / protected leftovers
`PLATFORM_INTEGRATION_QA.md`, platform/wave3–5 evidence JSONs

### Unrelated untracked
`PLATFORM_INTEGRATION_QA.md.bak`

---

## M. Confirmations

- [x] M07 legacy M06 key-scrape removed
- [x] No fallback M06 scrape remains
- [x] M06 source/outbox data not deleted
- [x] Platform registry history not destructively modified
- [x] No M07 operational intake implemented
- [x] BLOCKED-M07 remains unresolved (`blocked: true`; publication alone does not clear)
- [x] No direct M06→M07 write
- [x] No payroll calculation/approval/export/payment inferred
- [x] organisationId and legalEntityId remain separate
- [x] No prohibited identifiers introduced
- [x] Performance fluctuations transparently recorded (first-run only)
- [x] No CSS / prototype-parity / Premium Clinical Enterprise work
- [x] No commit or push

**STOP** — Checkpoint 2.3 evidence complete. Do not begin Checkpoint 2.4.
