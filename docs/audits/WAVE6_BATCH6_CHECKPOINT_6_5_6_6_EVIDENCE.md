# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence (remediation)

**Status:** Implementation evidence after targeted remediation of `ebbd0eea75a0e9c8cf9c043d4e0082d20ae74289`  
**Not independent owner acceptance. Batch 6 remains unaccepted pending re-verification.**  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Download-versus-lock policy (owner qualification)

**Operational sequence implemented:** `finalize → download → optional lock`

- Download requires `downloadable` status + matched reconciliation + audit success.
- Download does **not** require an active period lock.
- Lock requires finalized/downloadable export with matched reconciliation.
- UI, services, evidence and tests all describe this same sequence.
- No authorization bypass or deadlock: lock is optional after download; unlock is a separate controlled workflow.
- Spec wording that “only appropriately locked batches may be downloaded” is **not** enforced as a hard gate unless an approved M07 specification clearly requires lock-before-download. Classified as **owner decision / qualification** — preserve current workable sequence.

## Lock-enforcement inventory (service-layer; UI is not a control)

| Mutation surface | Guard |
|---|---|
| Calculate / recalculate | `assertPeriodNotLockedForOrdinaryMutation` in `calculate-service.ts` |
| Submit / approve / reject / withdraw | same in `approval-service.ts` |
| Leave prep | `leave-prep-service.ts` |
| Deduction create / supersede / cancel | `deduction-prep-input-service.ts` |
| Exception open / resolve / waive | `exception-service.ts` |
| Material profile create / update / archive | assert **before write** via `assertNoLockedPeriodAffectedByPersonMutation` |
| Classification mapping create / retire | `assertNoLockedPeriodsForLegalEntity` before write |
| Approval invalidation / M04 notify | `rejectLockedPeriodSourceChange` when period locked (no silent stale) |
| Snapshot eligibility seed / material revision | `assertNoLockedPeriodAffectedBySnapshot` |
| Export cancel / re-reconcile | period lock assert |
| Export create/finalize | manifest gate rejects locked unless `allowLockedPeriod` (download/lock paths only) |

Authoritative guard module: `period-lock-guard.ts` (re-exported from `period-lock-service.ts`).

## Locked-source-change behaviour

- Fail closed; no silent mutation of lock / approval / export / artifact history.
- Audit `export-batch.stale-source-detected`.
- Deterministic M02 via export-batch `stale-source` or `syncLockedPeriodSourceChangeToInbox`.
- If audit or M02 incomplete → `locked-source-control-incomplete` (not reported as successful control).
- Directs remediation to controlled unlock. **No PPA.**

## Lifecycle enforcement

- Central `assertExportBatchTransition` for create/supersede/preview/finalize/downloadable/cancel.
- Finalize recon failure: explicit `finalized → failed` (new terminal status).
- Unlock supersession: `assertExportBatchTransition` before `superseded`.
- Lifecycle matrix tested including failed / cancellation / supersession / idempotent same-status.

## Reconciliation independence

- Population mismatch and source-line reference mismatch block matched status even when aggregate totals match.
- Blocks download and lock when reconciliation is not matched.

## Download audit-failure

- `recordM07Audit` failure → download refused (`audit-failed`).
- No download-history success row; artifact unchanged.
- Test hook: `setM07AuditFailForTests` (tests only).

## Unlock failure handling

- Domain unlock may apply; if M02 or unlock-approved audit fails → `unlock-control-incomplete`.
- Operation does not return complete success. History is not deleted.

## Decimal arithmetic

- `multiplyUnitsRate` in `export-decimal.ts` (scale-100 integer multiply) replaces `units * rate * 1.5` float path in canonical export amounts.
- Reproducibility covered in remediation tests.

## Tests

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| Full M07 | **205** |
| Batch 5 material + CP + remediation | **49** (unchanged suite) |

## Known pre-existing debt (unchanged)

- 14 TypeScript errors
- M06 `published-timesheet-outbox.ts:235`
- Pre-existing ESLint `set-state-in-effect` in `context.tsx`

## Non-claims

- Not independent owner acceptance
- Not production deployment / payroll certification
- Not PPA / payment / bank / STP / super / Xero / M08
- Not full-repo TypeScript/build health beyond baseline comparison
