# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence (third remediation)

**Status:** Implementation evidence after third targeted remediation of `87ab37e…`  
**Not independent owner acceptance. Batch 6 remains unaccepted pending final re-verification.**  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Download-versus-lock policy (owner qualification)

**Operational sequence:** `finalize → download → optional lock`  
Download does not require lock. Documented consistently in UI, services, tests and evidence.

## Lock-enforcement inventory (service-layer)

| Mutation surface | Guard |
|---|---|
| Calculate / approvals / leave / deductions | `assertPeriodNotLockedForOrdinaryMutation` (empty periodId fails closed) |
| Exceptions | period-scoped kinds require periodId; `NON_PERIOD_EXCEPTION_KINDS` explicit |
| Material + financial profile create/update/archive | person mutation assert + effective-date overlap (malformed/missing/open-ended fail closed) |
| External payroll employee ID link/relink | financially authoritative lock assert |
| Preparation rule / classification / generic code | LE lock assert with effective dates |
| Export profile create/version/retire (including `legalEntityId === "*"`) | `assertNoLockedPeriodAffectedByExportProfileMutation` — platform profiles resolved via authoritative export-batch references |
| Intake snapshot / eligibility seed | snapshot guard before write |
| Export cancel / re-reconcile | period lock assert |

## Platform-wide export profile

- `*` no longer skips lock enforcement.
- Impact: any export batch whose `exportProfileId` references the profile and whose period is locked → reject-before-mutate.
- Unused new `*` profiles (no batch references) may still be created/versioned.
- Caller-supplied LE is ignored when a profile id is present; store scope is authoritative.

## Unlock atomicity (approach A) + idempotency

1. Validate SoD / lock match  
2. Stage `controls-incomplete` — period remains locked  
3. M02 + unlock-approved audit  
4. Failure → stay locked; `unlock-control-incomplete`; retry resumes  
5. Success → domain unlock → `approved` → `period.unlocked`  
6. Idempotent success only when approved + controls complete + period open + unlock history present + export transition consistent; otherwise `unlock-state-inconsistent`

## Locked-source / reconciliation / decimal

Unchanged from second remediation: non-transactional audit+M02; independent expected/actual recon; scaled multiply.

## Tests (post third remediation)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| `m07-batch6-second-remediation.test.ts` | **9** |
| `m07-batch6-third-remediation.test.ts` | **5** |
| Full M07 | **219** |
| Batch 5 CP + material + remediation | **49** |

## Non-claims

- Not owner acceptance / production / certification  
- Not PPA / payment / bank / STP / super / Xero / M08  
- Not full-repo TypeScript/build health (14 pre-existing TS errors; M06 outbox build)
