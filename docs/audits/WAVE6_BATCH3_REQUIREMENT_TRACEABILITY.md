# WAVE 6 / M07 Batch 3 — Requirement → Test Traceability

**Purpose:** Map authorised CP 3.1–3.6 requirements to production owners, exact tests, and status.  
**Status vocabulary:** `proven` | `qualified` | `not proven` | `out of scope`.  
**Authorisation:** Owner execution authorisation — Wave 6 / M07 Batch 3 complete implementation.  
**Baseline HEAD:** `4fed8ad9bbbe39d9586c3536121b758e591b423c`

---

## Orphans, qualifications, deferred

| Class | Finding |
|---|---|
| Orphan requirements (no test) | **None material** for authorised Batch 3 scope. |
| Deferred to Batch 4+ | Allowance/deduction calc; variances UI; prior-period adjustments; export; recon; period lock; final approve; payment/STP/super/bank; Xero; M08 doctor pay; award certification. |
| Deferred (unrelated) | M11 `legacy-html-fallback` registry correction (explicitly excluded). |
| Qualification | `npx tsc --noEmit` and root `eslint` report **pre-existing** M06/platform/Batch-2 issues; Batch 3 production files eslint-clean; runtime `npm test` green. |
| Wave-control rule | Amended at workspace `.cursor/rules/hcdp-wave-control.mdc` (outside Development-folder git; recorded in CP 3.6 evidence). |

---

## Matrix

| ID | CP | Requirement | Production | Test | Result | Status |
|---|---|---|---|---|---|---|
| R-3.1-01 | 3.1 | Classification→rule resolution when profile/map/rule/rate exist | `classification-resolve.ts` | `m07-batch3-cp31-36` CP3.1 resolve mapping | pass | proven |
| R-3.1-02 | 3.1 | Fail closed missing rate | same + `exception-service` | fails closed for missing rate… | pass | proven |
| R-3.1-03 | 3.1 | Doctor / M08 exclusion | `isDoctorPayExcluded` | doctor exclusion case | pass | proven |
| R-3.1-04 | 3.1 | Fail closed missing classification→rule map | same | missing classification→rule map | pass | proven |
| R-3.2-01 | 3.2 | Ordinary + OT from eligible immutable snapshot | `calculate-service.ts` | calculates ordinary and overtime… | pass | proven |
| R-3.2-02 | 3.2 | Pin `ruleId` + `ruleVersion` on lines | same | pins ruleVersion | pass | proven |
| R-3.2-03 | 3.2 | Recalc → new batch version; prior ruleVersion retained | same | recalculation creates new batch… | pass | proven |
| R-3.2-04 | 3.2 | Penalty inputs → `unsupported-penalty-input` | same | blocks penalty inputs… | pass | proven |
| R-3.2-05 | 3.2 | Ineligible / missing snapshot blocked | same | same case | pass | proven |
| R-3.2-06 | 3.2 | Non-certified disclaimer; no net-pay/payable | domain + calc + architecture scan | CP3.6 payment field forbid | pass | proven |
| R-3.3-01 | 3.3 | People Review workspace + readiness | `PeopleReviewSection` + `people-review-read-model` | section available; shell attr | pass | proven |
| R-3.3-02 | 3.3 | Clinic-manager rate/external-id redaction | read-model + profile-service | redacts rates for clinic managers… | pass | proven |
| R-3.3-03 | 3.3 | External id edit requires reason + audit | `profile-service` | requires reason… `profile.externalId.relink` | pass | proven |
| R-3.3-04 | 3.3 | Permissions at service layer | permissions + services | Batch 1/3 authz + mutation matrix | pass | proven |
| R-3.4-01 | 3.4 | Leave prep from approved M04 only | `leave-prep-service` + `m04-leave-read` | creates leave prep lines from approved M04… | pass | proven |
| R-3.4-02 | 3.4 | Ignore snapshot leaveInputs as SoT | leave-prep + calc comments/tests | ignores snapshot leaveInputs | pass | proven |
| R-3.4-03 | 3.4 | Dedicated `leavePrepLines` storage | keys + migrate-v6 + local-store | migration + leave prep cases | pass | proven |
| R-3.4-04 | 3.4 | Missing leave mapping → exception | leave-prep | opens leave-mapping-missing… | pass | proven |
| R-3.4-05 | 3.4 | Leave UI; Allowances “Planned for Batch 4” | `LeavePrepSection` + section-meta | marks people and leave… allowances planned | pass | proven |
| R-3.5-01 | 3.5 | M02 projection via platform bridge only | `m02-inbox-publish` | projects blockers with dedupe… | pass | proven |
| R-3.5-02 | 3.5 | Replay-safe dedupe + close on resolve | same | same + resolve closes | pass | proven |
| R-3.5-03 | 3.5 | No M02 repository import | architecture scan | forbids action-inbox/repository | pass | proven |
| R-3.6-01 | 3.6 | No M04/M05/M06 repository imports | production tree scan | CP3.6 architecture | pass | proven |
| R-3.6-02 | 3.6 | Schema v6 migration idempotent | `migrate-v6` | `m07-migration-cp27` leavePrepLines | pass | proven |
| R-3.6-03 | 3.6 | Batch 1–2 regression preserved | full `test:m07` | 119/119 | pass | proven |
| R-PAY | excl | Payment / certification / export / recon / lock / approve | — | — | — | out of scope |
| R-M08 | excl | Doctor pay | doctor exclusion | — | — | out of scope |
| R-M11 | excl | M11 registry correction | — | — | — | out of scope |

---

## Suite totals (final gate)

| Suite | Pass | Fail |
|---|---:|---:|
| test:workforce | 45 | 0 |
| test:auth | 16 | 0 |
| test:m04 | 16 | 0 |
| test:m11 | 37 | 0 |
| test:m05 | 117 | 0 |
| test:m06 | 83 | 0 |
| test:m07 | 119 | 0 |
| **npm test total** | **433** | **0** |
