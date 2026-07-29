# Wave 6 / M07 Batch 6 — Checkpoint 6.1–6.2 Evidence

**Status:** **Owner accepted with qualifications** — Batch 6 **closed** (29 July 2026)  
**Accepted technical target:** `ce1f4af68917c9988efff327d521d94b8289f2fc`  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  
**Scope:** Domain/lifecycle/storage + approved-manifest consumer / pre-export readiness  

**Distinction:** This document records implementation evidence under the owner decision of 29 July 2026. Owner acceptance is separate from technical verification and is **not** certification, production deployment, or payment readiness. See `WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md` for the full owner-acceptance record, qualifications, and exclusions.

## Implemented and tested

| Item | Location | Evidence |
|---|---|---|
| PayrollExportBatch domain + lifecycle | `types/domain.ts`, `export-lifecycle.ts` (incl. `failed`) | A / rem F |
| Deterministic identity key | `exportIdentityKey` in `local-store.ts` | A. idempotency |
| Schema v9 additive collections | `migrate-v9.ts`, keys `exports`/`reconciliations`/`periodLocks`/`unlockRequests` | J. Storage |
| Unlock request status `controls-incomplete` | `domain.ts` / `period-unlock-service.ts` | rem2 unlock |
| Unlock idempotent success tightened | approved + open + unlock history + export consistency | rem3 unlock |
| Approved Batch 5 manifest gate | `export-manifest-gate.ts` → `verifyManifestAgainstCurrent` | B. Manifest |
| Pre-export validation (fail-closed) | `export-validation-service.ts` | C. Validation |
| Missing external payroll employee ID blocks | validation code `missing-external-payroll-employee-id` | C. test |
| External ID mutation lock | `linkExternalPayrollEmployeeId` + period lock guard | rem2 |
| Platform (`*`) export-profile lock | `assertNoLockedPeriodAffectedByExportProfileMutation` | rem3 |
| Strict Gregorian effective-date bounds | `isCanonicalCalendarDate` / `effectiveRangeOverlapsPeriod` | rem4 |

## Deferred / excluded

- Prior-period adjustments
- Provider return-file parsing
- Payment / bank / STP / super / Xero / M08

## Non-claims

- Not production payroll certification
- Not payment-ready
- Qualifications and exclusions retained in Batch 6 closure evidence (`WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md`)
