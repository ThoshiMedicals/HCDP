# WAVE 6 / M07 Batch 3 — Checkpoints 3.5–3.6 Evidence

**Status:** COMPLETE  
**Authorisation:** Owner Wave 6 / M07 Batch 3 execution.  
**Final recommendation:** READY FOR OWNER ACCEPTANCE

---

## Checkpoint 3.5 — M02 blocker projections

### Implemented
- `adapters/m02-inbox-publish.ts` — projects pay-prep exceptions via `dispatchActionInboxEvent` / `findInboxActionForSource` only (platform bridge).
- Deterministic bridge key: `staff-pay::pay-prep-exception::{exceptionId}` (compatible with inbox link lookup).
- Create / update / close lifecycle; source-version on events; audit `m02.projection.*`.
- Deep-link meta retained on M07 exception `projectionKey` (People Review / Leave context).
- Tenant / clinic / LE carried on inbox events from exception scope.

### Tests
- projects blockers with dedupe and closes on resolve
- architecture forbids `action-inbox/repository` imports from M07 production

### Evidence result
**PASS**

---

## Checkpoint 3.6 — Regression, evidence, acceptance audit

### Wave-control amendment (before CP 3.1)
File: workspace `.cursor/rules/hcdp-wave-control.mdc` (outside Development-folder git root; Cursor alwaysApply). Records:
- Batch 3 execution authorised
- `BLOCKED-M07` cleared by Batch 2 (`CLEARED-M07-BATCH2`)
- Batch 3 scope limits + payment/certification/Batch 4+ exclusions remain
- M11 registry correction deferred

### Architecture self-audit
| Check | Result |
|---|---|
| Workflows functional (not placeholders) | PASS — calc, people, leave, exceptions, M02 |
| Permissions in services | PASS |
| Clinic manager rate redaction UI + service | PASS |
| Doctors excluded from staff-pay prep | PASS |
| No M04/M05/M06 SoT writes | PASS (adapter read-only; architecture scan) |
| Batch 2 snapshots immutable | PASS (calc reads only) |
| Historical ruleVersion preserved | PASS |
| M02 dedupe on recalc | PASS |
| Leave from M04 approved only | PASS |
| Penalty fail-closed | PASS |
| Allowances unavailable | PASS |
| No payment/certification fields | PASS (static scan) |
| Frozen Wave 2–5 evidence untouched | PASS (no edits to WAVE5/WAVE4/WAVE3 acceptance docs) |
| Responsive/a11y | PASS — shell smoke + Batch 3 sections labelled; `data-m07-shell="batch3-prep"` |
| M11 unmodified | PASS |

### Test commands and totals
```
npm run test:workforce  → 45 pass / 0 fail
npm run test:auth       → 16 pass / 0 fail
npm run test:m04        → 16 pass / 0 fail
npm run test:m11        → 37 pass / 0 fail
npm run test:m05        → 117 pass / 0 fail
npm run test:m06        → 83 pass / 0 fail
npm run test:m07        → 119 pass / 0 fail
npm test                → 433 pass / 0 fail
```

### Pre-existing (not Batch 3 regressions)
- `npm run lint`: 1 error in pre-existing `m07-staff-pay/context.tsx` (`react-hooks/set-state-in-effect`); Batch 3 new files eslint-clean.
- `npx tsc --noEmit`: errors in M06 outbox/tests and platform registry tests (Batch 2 era); **no** errors under Batch 3 new production paths.

### Evidence files created
- `docs/audits/WAVE6_BATCH3_REQUIREMENT_TRACEABILITY.md`
- `docs/audits/WAVE6_BATCH3_CHECKPOINT_3_1_3_2_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH3_CHECKPOINT_3_3_3_4_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH3_CHECKPOINT_3_5_3_6_EVIDENCE.md` (this file)

### Prior frozen evidence
Batch 1/2 and Wave 2–5 audit evidence files were **not** overwritten.
