# Wave 6 / M07 Batch 6 — Requirement Traceability

**Status:** Implementation evidence after remediation of `ebbd0ee…` — **not** independent owner acceptance  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  
**Scope:** Payroll export preparation, package reconciliation, period lock + controlled unlock

## Approved owner decisions applied

| # | Decision | Applied |
|---|---|---|
| 1 | Include explicit payroll-period locking | `explicitLockPayPeriod` + service-layer `period-lock-guard` |
| 2 | Defer prior-period adjustments | Excluded; unlock does not implement PPA |
| 3 | Secure permission-controlled audited download | `downloadPayrollExportArtifact` (download before lock permitted) |
| 4 | Block export when external payroll employee ID missing | validation blocker |
| 5 | SoD: management approver ≠ sole final export generator | `assertExportFinalizeSeparation` |
| 6 | Package-level recon; defer provider return-file parsing | `reconciliation-service.ts` |

## Traceability

| Req | CP | Requirement | Implementation | Test | Status |
|---|---|---|---|---|---|
| R-6.1-01 | 6.1 | Export-batch domain + lifecycle | `domain.ts` / `export-lifecycle.ts` (+ `failed`) | A / rem F | proven |
| R-6.1-02 | 6.1 | Deterministic identity + storage v9 | `local-store` / `migrate-v9` | A/J | proven |
| R-6.2-01 | 6.2 | Consume Batch 5 approved manifest | `export-manifest-gate.ts` | B | proven |
| R-6.2-02 | 6.2 | Pre-export validation fail-closed | `export-validation-service.ts` | C | proven |
| R-6.3-01 | 6.3 | Canonical export + CSV adapter | `export-canonical-service.ts` + scaled multiply | D / rem J | proven |
| R-6.3-02 | 6.3 | Preview / finalize / download | `export-service` / `export-download-service` | D/H / rem D | proven |
| R-6.4-01 | 6.4 | Package reconciliation | `reconciliation-service.ts` | E / rem C | proven |
| R-6.4-02 | 6.4 | M02 export/unlock/stale-source | `m02-inbox-publish.ts` | G/I / rem B | proven |
| R-6.5-01 | 6.5 | Period lock + mutation guard | `period-lock-service` / `period-lock-guard` | G / rem A | proven |
| R-6.5-02 | 6.5 | Controlled unlock (fail-closed controls) | `period-unlock-service.ts` | G / rem E | proven |
| R-6.5-03 | 6.5 | Permissions + SoD | `permissions.ts` / `sod-policy.ts` | F | proven |
| R-6.6-01 | 6.6 | Export + Reconciliation UI | sections + workspace | shell | proven |
| R-TERM | all | Non-certified / non-payment | types + UI copy | suite | proven |
| R-EXCL | excl | PPA, payment, bank, STP, super, Xero, M08, provider return files | — | architecture | excluded |

## Named test totals (post-remediation)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| Full `m07-staff-pay/tests/**/*.test.ts` | **205** |
| Batch 5 material + CP + remediation | **49** |

## Policy qualification

Download-before-lock remains permitted (`finalize → download → optional lock`). Documented as owner qualification — not an arbitrary policy change.

## Explicit non-claims

- Not independent owner acceptance (Batch 6 still unaccepted pending re-verification)
- Not production deployment or payroll certification
- Not payment / bank / STP / super / Xero readiness
- Not prior-period adjustment support
- Not automated provider-result reconciliation
- Not full repository TypeScript/build health (14 pre-existing TS errors remain)
