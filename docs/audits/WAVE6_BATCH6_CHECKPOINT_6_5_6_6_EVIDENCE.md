# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence (second remediation)

**Status:** Implementation evidence after second targeted remediation of `a91aa459…`  
**Not independent owner acceptance. Batch 6 remains unaccepted pending re-verification.**  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Download-versus-lock policy (owner qualification)

**Operational sequence:** `finalize → download → optional lock`  
Download does not require lock. Documented consistently in UI, services, tests and evidence.

## Lock-enforcement inventory (service-layer)

| Mutation surface | Guard |
|---|---|
| Calculate / recalculate | `assertPeriodNotLockedForOrdinaryMutation` (empty periodId fails closed) |
| Submit / approve / reject / withdraw | approval-service |
| Leave / deductions | period assert before write |
| Exceptions | period-scoped kinds require periodId; derive+assert on resolve/waive; non-period kinds explicit (`NON_PERIOD_EXCEPTION_KINDS`) |
| Material + **financial** profile create/update/archive | `assertNoLockedPeriodAffectedByPersonMutation` with effective-date overlap; rates/allowance/deduction codes treated financially authoritative |
| External payroll employee ID link/relink | financially authoritative lock assert before write |
| Preparation rule create/version/retire | `assertNoLockedPeriodsForLegalEntity` with effective dates |
| Generic code create/version/retire | same effective-date LE lock assert |
| Export profile create/version/retire (non-platform) | same effective-date LE lock assert |
| Classification map create/retire | same effective-date LE lock assert |
| Approval invalidation | reject locked source; skip locked periods when mutation does not overlap |
| Intake snapshot write | `assertNoLockedPeriodAffectedBySnapshot` **before** append |
| Eligibility seed / material revision | snapshot guard |
| Export cancel / re-reconcile | period lock assert |
| Export create/finalize | manifest gate rejects locked |

## Unlock atomicity (approach A)

1. Validate SoD / lock match  
2. Stage request as `controls-incomplete` — **period remains locked**  
3. Run M02 + unlock-approved audit  
4. On failure: keep locked; throw `unlock-control-incomplete`; retry resumes  
5. On success: apply domain unlock; mark `approved`; audit `period.unlocked`  
6. Fully approved + open period is idempotent success  

Ordinary mutations remain blocked while controls are incomplete.

## Locked-source control pair

Reject-before-mutate retained. Audit then M02 sequenced — **not transactional**; either may be written while overall result is `locked-source-control-incomplete`. Tests cover audit-only and M02-only failure.

## Reconciliation

Actual totals recomputed from lines (not trusted cached totals blob). Expected rebuilt from approval pins. Category composition mismatch blocks match/download/lock.

## Decimal

`multiplyUnitsRate` scale-100 for export amounts.

## Tests (post second remediation)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| `m07-batch6-second-remediation.test.ts` | **9** |
| Full M07 | **214** (expected; confirm in validation) |
| Batch 5 CP + material + remediation | **49** |

## Non-claims

- Not owner acceptance / production / certification  
- Not PPA / payment / bank / STP / super / Xero / M08  
- Not full-repo TypeScript/build health (14 pre-existing TS errors; M06 outbox build)
