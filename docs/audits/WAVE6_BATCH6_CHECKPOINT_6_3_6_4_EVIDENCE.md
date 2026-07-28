# Wave 6 / M07 Batch 6 — Checkpoint 6.3–6.4 Evidence

**Status:** Implementation evidence (not independent owner acceptance)  
**Accepted baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Implemented and tested

| Item | Location | Evidence |
|---|---|---|
| Canonical provider-neutral export | `export-canonical-service.ts` (`canonical-export-v1`) | D. Export prep |
| Generic CSV adapter | `serializeCanonicalExportCsv` | D / H |
| Preview vs final parity + re-verify | `export-service.ts` | D |
| Immutable finalize + artifact checksum | `finalizePayrollExportBatch` | D / H |
| Package-level reconciliation | `reconciliation-service.ts` | E |
| Structured mismatches + line refs | `ReconciliationMismatch` | E |
| M02 export blocker projection | `syncExportBatchToInbox` | I |
| Secure audited download | `export-download-service.ts` | H |

## Explicit exclusions preserved

- No automated payroll-provider return-file reconciliation
- No payment / net-pay / bank-file / STP / super / Xero

## Non-claims

- Not independent owner acceptance
- Not statutory payroll correctness
- Not payment readiness
