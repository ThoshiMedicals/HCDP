# WAVE 6 / M07 Batch 4 — Checkpoints 4.1–4.3 Evidence

**Status:** COMPLETE  
**Authorisation:** Owner Wave 6 / M07 Batch 4 execution (OD-1…OD-6).  
**Baseline:** `6ebf1c16cce3b94f8b4f63b14fd20444e4113105`

## CP4.1 Allowance preparation
- Consumes eligible Batch 2 snapshot `allowanceInputs` only (not duplicated in M07).
- Maps to active M07 `GenericCode` (`lineType: allowance`); pins `codeId` + `codeVersion` + snapshot id/version.
- Unknown/inactive/malformed → blocking exception; no completed payable-looking batch.
- Leave UI: `data-m07-allowances="available-batch4"`.

## CP4.2 Deduction preparation
- Source collection: `pulse.m07.staffpay.deductionPrepInputs` (schema v7).
- Fields: id, tenant/LE/clinic, person, period, code id/version, quantity, units, effective date, actor, timestamps, mandatory reason, status, supersession/cancel linkage.
- Outputs are calculation-batch `lineType: deduction` lines retaining input id/version.
- No tax/super/bank/net-pay/monetary invention.

## CP4.3 Variance visibility
- `VariancesSection` + `variance-service`: M05 published roster vs M06 eligible snapshot hours.
- Informational only; misaligned scope → unavailable/incomplete; never opens exceptions from delta alone; never blocks calculation; no monetary variance; no M05/M06 writes.
