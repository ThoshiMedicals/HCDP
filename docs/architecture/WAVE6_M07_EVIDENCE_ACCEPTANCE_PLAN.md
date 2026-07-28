# Wave 6 — M07 Evidence & Acceptance Plan

**Status:** PLANNING ONLY  
**Batches 1–4:** binding  
**Parity:** `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md`  

**Do not generate functional evidence for unimplemented behaviour.**  
**Do not count placeholders/mounts/legacy HTML/unwired buttons as complete.**

---

## Required acceptance scenarios (Batch 4 additions)

| # | Scenario | Assert |
|---|---|---|
| 1 | Org-scoped external payroll employee id uniqueness + access | Unique within legal entity when required; permission-gated; clinic managers excluded |
| 2 | Audited identifier relinking | Relink retains history/actor/reason/timestamp; M04 identity unchanged |
| 3 | Prohibited banking/tax/super ids absent | Persist/export of TFN/BSB/bank/super/credentials/payment instructions fails |
| 4 | Only Pay approver or Pay admin can Lock | Other roles denied |
| 5 | Export operator cannot Lock | Explicit deny |
| 6 | Lock requires accepted recon + valid current approval | Fail otherwise |
| 7 | Lock cannot bypass entity isolation or non-waivable blockers | Hard deny |
| 8 | Clinic-readiness indicators in final approval | Per-clinic readiness visible and evaluated |
| 9 | Incomplete clinic readiness blocks approval when applicable | Final approve denied |
| 10 | Approve Approve Location consolidated | No separate location-approved state; control preserved via readiness |
| 11 | Only Pay admin creates/versions export profiles | Operator cannot mutate profiles |
| 12 | Export operator selects but cannot alter profile | Generate uses immutable profile snapshot |
| 13 | Historical exports retain exact profile version | `exportProfileId` + version persisted |
| 14 | Minimum-PII remains default profile | Default package excludes names/rates unless profile says otherwise |
| 15 | Rate/money profiles require correct permissions | Fail without rate.view + export permission |
| 16 | M04 classifications read-only inputs | No M04 write from M07 mapping |
| 17 | Missing classification→rule mapping blocks | Exception; no silent calculate/export |
| 18 | M07 rules non-certified, versioned, audited | Labels + version + effective dates + audit |
| 19 | Locked/exported retain original rule version | Rule change does not mutate locked results |
| 20 | Staff-hub rule editing relocated to M07 Settings | Parity CONSOLIDATED/RELOCATED; not missing M04 |

Prior Batch 1–3 scenarios remain required (entity isolation, intake, SoD, leave lines, codes, etc.).

---

## Accounting (planned)

Required WF catalogue independently pass; fail/skip 0; `BLOCKED-M07` unresolved until intake evidenced; OUT-*/REJECTED not counted as pass.

---

## Planning validation

Docs consistent with Batches 1–4; no runtime changes; no commit/push until separate instruction.
