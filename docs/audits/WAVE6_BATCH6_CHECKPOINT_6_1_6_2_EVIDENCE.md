# Wave 6 / M07 Batch 6 — Checkpoint 6.1–6.2 Evidence

**Status:** Implementation evidence (not independent owner acceptance)  
**Accepted baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  
**Scope:** Domain/lifecycle/storage + approved-manifest consumer / pre-export readiness

## Implemented and tested

| Item | Location | Evidence |
|---|---|---|
| PayrollExportBatch domain + lifecycle | `types/domain.ts`, `export-lifecycle.ts` | A. Domain tests |
| Deterministic identity key | `exportIdentityKey` in `local-store.ts` | A. idempotency |
| Schema v9 additive collections | `migrate-v9.ts`, keys `exports`/`reconciliations`/`periodLocks`/`unlockRequests` | J. Storage |
| Approved Batch 5 manifest gate | `export-manifest-gate.ts` → `verifyManifestAgainstCurrent` | B. Manifest |
| Pre-export validation (fail-closed) | `export-validation-service.ts` | C. Validation |
| Missing external payroll employee ID blocks | validation code `missing-external-payroll-employee-id` | C. test |

## Deferred / excluded

- Prior-period adjustments
- Provider return-file parsing
- Payment / bank / STP / super / Xero / M08

## Non-claims

- Not owner acceptance
- Not production payroll certification
- Not payment-ready
