# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence

**Status:** **Owner accepted with qualifications** — Batch 6 **closed**  
**Owner acceptance date:** 29 July 2026  
**Accepted technical target:** `ce1f4af68917c9988efff327d521d94b8289f2fc`  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`  

**Distinction:** Independent technical verification (including final date-validation re-verification) confirmed readiness; this section records the **product-owner decision**, which is separate from that verification. This acceptance is **not** certification, production deployment approval, statutory or monetary correctness, payment readiness, or full repository health.

## Owner decision

Wave 6 / Module 7 / Batch 6 is **accepted with qualifications** at commit `ce1f4af68917c9988efff327d521d94b8289f2fc`. Batch 6 is **closed**. No subsequent M07 batch, PPA, provider-return work, or Module 8 has begun under this decision.

## Download-versus-lock policy (owner qualification)

**Operational sequence:** `finalize → download → optional lock`

## Final verification defect corrected (fourth remediation)

Independent final verification found that `effectiveRangeOverlapsPeriod` accepted ISO-**shaped** but **impossible** calendar dates (e.g. `2026-13-01`) via shape-only regex + lexicographic compare, which could fail open for financially authoritative locked-period mutations.

**Correction:** `isCanonicalCalendarDate` requires exact `YYYY-MM-DD`, real Gregorian month/day (incl. leap rules), and round-trip equality. Invalid / non-canonical / whitespace / datetime bounds fail closed as overlap. Valid leap dates (e.g. `2028-02-29`) remain valid. Open ends still use internal sentinels only after classifying caller input as missing — never by accepting impossible caller dates as “future”.

## Lock-enforcement inventory (service-layer)

Unchanged surfaces from third remediation, plus strict calendar bounds on all `effectiveRangeOverlapsPeriod` callers (profile financial create/update/archive, LE rules/codes/maps via overlap, person-mutation overlap).

Platform `*` export-profile batch-reference enforcement unchanged.

## Unlock / locked-source / reconciliation

Unchanged from third remediation.

## Tests (at accepted target)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| `m07-batch6-second-remediation.test.ts` | **9** |
| `m07-batch6-third-remediation.test.ts` | **5** |
| `m07-batch6-fourth-remediation.test.ts` | **2** |
| Full M07 | **221** |
| Batch 5 CP + material + remediation | **49** |

## Recorded qualifications (not resolved by this acceptance)

1. Export-profile impact is resolved through authoritative export-batch references.
2. Live export-profile protection is mutation-side rather than based on profile-version pinning.
3. Download may occur before optional period locking.
4. Locked-source audit and M02 notification controls are non-transactional.
5. Unlock idempotency does not explicitly reassert approval-stale state, although the verified domain sequence establishes it before approval.
6. Open-period profile creation and legal-entity seed behaviour remain qualified.
7. Fourteen existing TypeScript errors remain unrelated pre-existing debt.
8. The existing M06 `published-timesheet-outbox.ts:235` build failure remains unrelated pre-existing debt.

## Explicitly deferred / excluded (outside this acceptance)

- PPA
- Provider-return processing
- Payment or net-pay execution
- Bank-file generation
- STP
- Superannuation processing
- Xero production integration
- Module 8

## Non-claims

- Not production deployment approval  
- Not payroll certification or statutory/monetary correctness  
- Not payment / bank / STP / super / Xero readiness  
- Not full-repo TypeScript/build health (14 pre-existing TS errors; M06 outbox build)
