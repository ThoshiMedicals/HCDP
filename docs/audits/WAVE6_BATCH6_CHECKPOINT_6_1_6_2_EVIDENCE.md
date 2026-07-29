# Wave 6 / M07 Batch 6 — Checkpoint 6.1–6.2 Evidence

**Status:** Implementation evidence after third remediation of `87ab37e…` — **not** independent owner acceptance  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  
**Scope:** Domain/lifecycle/storage + approved-manifest consumer / pre-export readiness

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

## Deferred / excluded

- Prior-period adjustments
- Provider return-file parsing
- Payment / bank / STP / super / Xero / M08

## Non-claims

- Not owner acceptance (Batch 6 remains unaccepted pending final re-verification)
- Not production payroll certification
- Not payment-ready
