# WAVE 6 / M07 Batch 4 — Checkpoints 4.4–4.6 Evidence

**Status:** COMPLETE  
**Final recommendation:** READY FOR OWNER ACCEPTANCE

## CP4.4 Exceptions workspace + waiver
- `ExceptionsSection` with status/person/kind filters; resolve + waive.
- Waivable kinds: `WAIVABLE_EXCEPTION_KINDS`; non-waivable include doctor + tenant/clinic/LE boundary + intake/penalty safety kinds.
- Requires `payroll.exception.waive`, reason, SoD (creator cannot waive), audit `exception.waived`, M02 close.
- Waiver ≠ payroll approval / certification / payment.

## CP4.5 Integration
- People Review shows allowance/deduction readiness, variance summary, exception counts.
- Calc orchestration includes allowance + deduction lines without rewriting historical batches (new batchVersion).
- M02 via platform bridge; variance differences do not create M02 blockers.

## CP4.6 Gate
- `data-m07-shell="batch4-prep"`; exceptions/variances available.
- Architecture scan: no M04/M05/M06/M02 repository imports; no netPay/markAsPaid/paymentStatus.
- Schema v7 migration idempotent; prior leave/calc/snapshots untouched.
- Wave-control: workspace `.cursor/rules/hcdp-wave-control.mdc` (outside Development-folder git) — OD-6.

### Tests
```
workforce 45 · auth 16 · m04 16 · m11 37 · m05 117 · m06 83 · m07 129 · total 443 / 0 fail
```

### Lint/TS parent comparison
- Batch 4 production files eslint-clean (`--max-warnings 0`).
- Pre-existing root lint/`tsc` debt in untouched M06/platform/Batch-2 paths remains (not introduced by Batch 4).

### Prior evidence
Wave 2–5 and M07 Batch 1–3 audit evidence files were not overwritten.
Evidence-writing suite JSON churn was discarded before commit.
