# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence (fourth remediation)

**Status:** Implementation evidence after fourth targeted remediation of `58296f6…`  
**Not independent owner acceptance. Batch 6 remains unaccepted pending final date-validation re-verification.**  
**Accepted Batch 5 baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

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

## Tests (post fourth remediation)

| Suite | Pass |
|---|---|
| `m07-batch6-cp61-66.test.ts` | **18** |
| `m07-batch6-remediation.test.ts` | **9** |
| `m07-batch6-second-remediation.test.ts` | **9** |
| `m07-batch6-third-remediation.test.ts` | **5** |
| `m07-batch6-fourth-remediation.test.ts` | **2** |
| Full M07 | **221** |
| Batch 5 CP + material + remediation | **49** |

## Non-claims

- Not owner acceptance / production / certification  
- Not PPA / payment / bank / STP / super / Xero / M08  
- Not full-repo TypeScript/build health (14 pre-existing TS errors; M06 outbox build)
