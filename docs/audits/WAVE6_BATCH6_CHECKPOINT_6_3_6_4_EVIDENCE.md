# Wave 6 / M07 Batch 6 — Checkpoint 6.3–6.4 Evidence

**Status:** Implementation evidence after fourth remediation of `58296f6…` — **not** independent owner acceptance  
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
| Package-level reconciliation | `reconciliation-service.ts` | E / rem C / rem2 |
| Independent expected rebuild from approval pins | never reuse actual canonical as expected | rem2 recon |
| Actual totals derived from lines (not trusted cached totals alone) | `computeTotalsFromLines` | rem2 recon |
| Category composition independence (gross equal ≠ matched) | rem2 category test | rem2 |
| Population / line-ref independence | rem C | rem C |
| Structured mismatches + line refs | `ReconciliationMismatch` | E |
| Live export-profile read protected for locked periods | platform `*` version/retire blocked when referenced | rem3 |
| M02 export blocker + stale-source | `syncExportBatchToInbox` | I / rem B |
| Secure audited download (fail-closed audit; test hook gated) | `export-download-service` / `__setM07AuditFailForTests` | H / rem D / rem2 |

## Explicit exclusions preserved

- No automated payroll-provider return-file reconciliation
- No payment / net-pay / bank-file / STP / super / Xero

## Non-claims

- Not independent owner acceptance (Batch 6 remains unaccepted pending final date-validation re-verification)
- Not statutory payroll correctness
- Not payment readiness
