# Wave 6 / M07 Batch 6 — Requirement Traceability

**Status:** Implementation evidence after third remediation of `87ab37e…` — **not** independent owner acceptance  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  
**Scope:** Payroll export preparation, package reconciliation, period lock + controlled unlock

## Approved owner decisions applied

| # | Decision | Applied |
|---|---|---|
| 1 | Include explicit payroll-period locking | `explicitLockPayPeriod` + service-layer `period-lock-guard` (fail-closed missing period context; platform `*` export profiles included) |
| 2 | Defer prior-period adjustments | Excluded; unlock does not implement PPA |
| 3 | Secure permission-controlled audited download | `downloadPayrollExportArtifact` (download before lock permitted) |
| 4 | Block export when external payroll employee ID missing | validation blocker + locked-period link/relink guard |
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
| R-6.4-01 | 6.4 | Package reconciliation | independent expected + line-derived actual totals | E / rem C / rem2 | proven |
| R-6.4-02 | 6.4 | M02 export/unlock/stale-source | `m02-inbox-publish.ts` | G/I / rem B / rem2 | proven |
| R-6.5-01 | 6.5 | Period lock + mutation guard | omit-metadata; rates/rules/ext-id/intake; platform `*` profiles | G / rem A / rem2 / rem3 | proven |
| R-6.5-02 | 6.5 | Controlled unlock (controls before open) | `controls-incomplete` + tightened idempotent complete | G / rem E / rem2 / rem3 | proven |
| R-6.5-03 | 6.5 | Permissions + SoD | `permissions.ts` / `sod-policy.ts` | F | proven |
| R-6.6-01 | 6.6 | Export + Reconciliation UI | sections + workspace | shell | proven |
| R-TERM | all | Non-certified / non-payment | types + UI copy | suite | proven |
| R-EXCL | excl | PPA, payment, bank, STP, super, Xero, M08, provider return files | — | architecture | excluded |

## Named test totals (post third remediation)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| `m07-batch6-second-remediation.test.ts` | **9** |
| `m07-batch6-third-remediation.test.ts` | **5** |
| Full `m07-staff-pay/tests/**/*.test.ts` | **219** |
| Batch 5 material + CP + remediation | **49** |

## Lock / unlock qualifications (corrected)

- Missing/empty/ambiguous `periodId` on ordinary period-scoped mutations **fails closed**.
- Non-period exception kinds use explicit `NON_PERIOD_EXCEPTION_KINDS`.
- Financial effective dates: missing/open-ended/malformed fail closed; future non-overlap allowed when proven.
- Platform export profiles (`legalEntityId === "*"`) use authoritative export-batch reference resolution — no lock skip.
- Intake asserts lock **before** snapshot append.
- Unlock: stage `controls-incomplete` → M02 + audit → domain unlock → `approved`. Idempotent success requires open period + unlock history + consistent export transition.
- Locked-source audit+M02 pair is **not** transactional.
- Download-before-lock remains permitted (`finalize → download → optional lock`).

## Explicit non-claims

- Not independent owner acceptance (Batch 6 still unaccepted pending final re-verification)
- Not production deployment or payroll certification
- Not payment / bank / STP / super / Xero readiness
- Not prior-period adjustment support
- Not automated provider-result reconciliation
- Not full repository TypeScript/build health (14 pre-existing TS errors remain; M06 outbox build defect pre-existing)
