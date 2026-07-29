# Wave 6 / M07 Batch 6 — Checkpoint 6.3–6.4 Evidence

**Status:** Implementation evidence after remediation (not independent owner acceptance)  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Implemented and tested

| Item | Location | Evidence |
|---|---|---|
| Canonical provider-neutral export | `export-canonical-service.ts` (`canonical-export-v1`) | D. Export prep |
| Scaled-integer amount multiply | `export-decimal.multiplyUnitsRate` | rem J |
| Generic CSV adapter | `serializeCanonicalExportCsv` | D / H |
| Preview vs final parity + re-verify | `export-service.ts` | D |
| Immutable finalize + artifact checksum | `finalizePayrollExportBatch` | D / H |
| Finalize recon failure → `failed` via lifecycle assert | `export-service` / `export-lifecycle` | rem F |
| Package-level reconciliation | `reconciliation-service.ts` | E / rem C |
| Population / line-ref independence | rem C (totals match ≠ matched) | rem C |
| Structured mismatches + line refs | `ReconciliationMismatch` | E |
| M02 export blocker + stale-source | `syncExportBatchToInbox` | I / rem B |
| Secure audited download (fail-closed audit) | `export-download-service.ts` | H / rem D |

## Explicit exclusions preserved

- No automated payroll-provider return-file reconciliation
- No payment / net-pay / bank-file / STP / super / Xero

## Non-claims

- Not independent owner acceptance
- Not statutory payroll correctness
- Not payment readiness
