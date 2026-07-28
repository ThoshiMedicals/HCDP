# WAVE 6 / M07 Batch 3 — Checkpoints 3.1–3.2 Evidence

**Status:** COMPLETE  
**Authorisation:** Owner Wave 6 / M07 Batch 3 execution.  
**Baseline:** `4fed8ad9bbbe39d9586c3536121b758e591b423c`  
**Excluded:** Payment, certification, allowances, M08, M11 registry edits.

---

## Checkpoint 3.1 — Classification-to-rule resolution and fail-closed blockers

### Implemented
- `services/classification-resolve.ts` — resolves person preparation inputs (profile, classification map, rule, rate); doctor exclusion.
- `services/exception-service.ts` — open/resolve/list pay-prep exceptions with permissions, audit, M02 sync hooks.
- Domain kinds include: `missing-rate`, `missing-classification`, `missing-classification-rule-map`, `ineligible-intake`, `doctor-m08-contamination`, tenant/clinic/LE mismatches, `missing-snapshot`, `unsupported-input`, `unsupported-penalty-input`, `leave-mapping-missing`, `unapproved-or-unsupported-leave`.

### Tests
- `m07-batch3-cp31-36.test.ts` → CP3.1 cases (resolve; missing rate + doctor; missing map).

### Evidence result
**PASS** — fail-closed; blocked records do not emit payable-looking calc output.

---

## Checkpoint 3.2 — Ordinary/OT calculation and rule-version preservation

### Implemented
- `services/calculate-service.ts` — ordinary + overtime prep only from **eligible** immutable Batch 2 snapshots.
- Persists `ruleId` + `ruleVersion` on each prep line; recalculation creates a **new** calculation batch version; historical batches retain original rule versions.
- Penalty hour inputs open `unsupported-penalty-input` and block completion.
- Labels use `M07_NON_CERTIFIED_DISCLAIMER`; no net-pay / mark-as-paid / paymentStatus fields.

### Tests
- calculates ordinary and overtime… pins ruleVersion
- recalculation creates new batch version…
- blocks penalty inputs and ineligible/missing snapshots

### Evidence result
**PASS**
