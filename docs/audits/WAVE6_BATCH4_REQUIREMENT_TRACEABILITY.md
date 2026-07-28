# WAVE 6 / M07 Batch 4 — Requirement → Test Traceability

**Purpose:** Map authorised CP 4.1–4.6 requirements to production owners and tests.  
**Authorisation:** Owner execution authorisation — Wave 6 / M07 Batch 4.  
**Baseline HEAD:** `6ebf1c16cce3b94f8b4f63b14fd20444e4113105`  
**OD decisions:** OD-1 A; OD-2 A+controls; OD-3 separate `deductionPrepInputs` + calc lines; OD-4 informational variance; OD-5 controlled waive; OD-6 wave-control outside Development git.

| ID | CP | Requirement | Production | Test | Status |
|---|---|---|---|---|---|
| R-4.1-01 | 4.1 | Allowance from snapshot + active codes | `calculate-service.ts` | batch4 CP4.1 maps… | proven |
| R-4.1-02 | 4.1 | Unknown/inactive allowance blocks | same | blocks unknown… | proven |
| R-4.2-01 | 4.2 | Manual deduction inputs + supersede/cancel | `deduction-prep-input-service.ts` | creates supersedes… | proven |
| R-4.2-02 | 4.2 | Deduction outputs on calc batch | calculate-service | calculation emits deduction… | proven |
| R-4.2-03 | 4.2 | Doctor / reason / isolation | deduction service | rejects doctor…; cross-LE | proven |
| R-4.3-01 | 4.3 | Informational variance; no blockers | `variance-service.ts` | CP4.3 | proven |
| R-4.4-01 | 4.4 | Waive SoD + non-waivable reject | `exception-service` + sod | CP4.4 | proven |
| R-4.5-01 | 4.5 | People Review fields + M02 | people-review + m02 | CP4.5 | proven |
| R-4.6-01 | 4.6 | Architecture / shell | batch4 architecture | CP4.6 | proven |
| R-PAY | excl | Approve/export/recon/lock/PPA/payment | — | — | out of scope |

## Suite totals (final gate)

| Suite | Pass | Fail |
|---|---:|---:|
| workforce | 45 | 0 |
| auth | 16 | 0 |
| m04 | 16 | 0 |
| m11 | 37 | 0 |
| m05 | 117 | 0 |
| m06 | 83 | 0 |
| m07 | 129 | 0 |
| **npm test total** | **443** | **0** |
