# Wave 6 / M07 — PPA Readiness and Design

**Document type:** Planning / architecture / evidence discovery only  
**Created:** 30 July 2026  
**Baseline HEAD:** `ad54aed94b0c798d3f26fe66bf811d6e3b083151`  
**Accepted Batch 6 technical target:** `ce1f4af68917c9988efff327d521d94b8289f2fc`  
**Status:** **NOT owner-approved** — awaiting owner decisions before any PPA implementation batch  

**Non-claims:** This document does not authorise implementation. It does not implement PPA, payment, net-pay, bank files, STP, superannuation, provider-return processing, Xero production integration, or Module 8. It does not claim certification, production deployment, statutory correctness, or monetary correctness.

---

## A. Baseline verification

| Check | Result |
|---|---|
| Branch | `main` |
| HEAD | `ad54aed94b0c798d3f26fe66bf811d6e3b083151` |
| `origin/main` | Identical |
| Ahead/behind | `0/0` |
| Working tree | Clean (before this planning commit) |
| Batch 6 status | Owner accepted with qualifications; closed (`docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md`) |

---

## B. PPA definition and boundary

### B.1 Repository meaning (authoritative)

Across M07 architecture, evidence, domain types, UI copy and service comments, **PPA means Prior-Period Adjustment** — a controlled **post-lock / post-export correction cycle**, not the ordinary payroll-preparation pipeline already delivered in Batches 1–6.

Material citations:

| Source | Finding |
|---|---|
| `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md` §13 / Q6 | After lock or export, corrections are **prior-period adjustments**; never silent rewrite of locked/exported lines |
| `docs/architecture/WAVE6_M07_INTEGRATION_BOUNDARY_MAP.md` §3A / §9 | “PPA cycles” linked to a **locked** source; data-source label `prior-period-adjustment` = post-lock correction |
| `docs/architecture/WAVE6_M07_WORKFLOW_CATALOGUE.md` WF-33 | Prior-period adjustment coexistence |
| `docs/architecture/WAVE6_M07_PERMISSIONS_MATRIX.md` | `payroll.adjust` = “Adjustments / prior-period adjustments” |
| `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` | “Record Over/Underpayment” → prior-period adjustment lines (prep only; non-payment); ordinary unlock **REJECTED** in favour of PPA |
| `docs/audits/WAVE6_BATCH6_*` | “Defer prior-period adjustments”; “unlock does not implement PPA” |
| `src/modules/m07-staff-pay/services/period-lock-guard.ts` | “Does not implement PPA” |
| `src/modules/m07-staff-pay/services/period-unlock-service.ts` | “Does not implement prior-period adjustments” |
| `src/modules/m07-staff-pay/types/domain.ts` | `PayPeriodKind = "ordinary" \| "adjustment"` (adjustment unused in create path) |
| `src/modules/m07-staff-pay/section-meta.ts` | `adjustments` section still **`planned`** |
| `src/modules/m07-staff-pay/storage/keys.ts` | `adjustments` storage key exists; no PPA domain service writes it |

Module display name “Staff Pay & Payroll Preparation” (`src/platform/module-registry/module-register.ts`) describes **M07 as a whole**. It is **not** a repository definition of the acronym PPA.

### B.2 Intended business purpose

PPA exists so that after an ordinary period is exported and/or locked, staff-pay corrections (over/under preparation amounts, missed leave lines, rate corrections that must not rewrite history, etc.) are recorded as **new, auditable preparation artefacts** linked to the immutable source period — preserving original calculation, approval, export and lock history.

### B.3 Start / end boundary

| Boundary | Include | Exclude |
|---|---|---|
| Starts | Need to correct a **locked** (and typically exported) ordinary period without rewriting it | Rewriting locked/exported ordinary lines in place |
| Includes | Adjustment period (`kind: "adjustment"`), linkage fields, adjustment lines/deltas, approval of the adjustment cycle, provider-neutral **preparation** export of adjustment packages, package-level recon of those packages, audit | Silent unlock-as-correction; ordinary re-intake of duplicate timesheets into the locked source |
| Ends | Reviewable, versioned, exportable **preparation** package for the adjustment cycle | Money movement, STP lodging, super processing, executable bank files, provider-return file parsing, Xero production connector, M08 doctor pay |

### B.4 Conflict with conversational default boundary

A discovery prompt default described PPA as “prepare a controlled, reviewable and exportable payroll result from workforce/roster/attendance inputs.” **That describes ordinary M07 payroll preparation (Batches 1–6), not repository PPA.**

| Option | Effect |
|---|---|
| **Recommended:** Keep repository meaning — PPA = Prior-Period Adjustment | Next authorised scope builds the missing adjustment subsystem on top of accepted Batches 1–6 |
| Alternate (requires owner approval): Redefine PPA as “payroll preparation application/pipeline” | Would misalign evidence, permissions, parity register and Batch 6 exclusions; would need a renaming CR across docs |

**Owner approval required** before adopting any non-repository meaning of PPA.

### B.5 What already exists vs missing

| Function | Status |
|---|---|
| Ordinary payroll preparation (period → intake → calculate → approve → export → recon → lock) | **Implemented** (Batches 1–6, with qualifications) |
| Controlled unlock remediation | **Implemented but qualified** (Batch 6); explicitly **not** PPA |
| `PayPeriodKind.adjustment`, `adjustments` storage key, `payroll.adjust` permission, Adjustments nav shell | **Partial** (types/keys/permission/UI planned mount only) |
| Prior-period adjustment create/link/line/export lifecycle | **Absent** (deliberately deferred through Batch 6) |
| Payment / net-pay / bank / STP / super / Xero prod / provider returns / M08 | **Outside M07 / deliberately deferred** |

### B.6 Nature of PPA in product structure

**Recommended classification:** an **M07 internal subsystem / subsequent M07 batch sequence** (not a separate module, not M08, not a payment integration). It extends staff-pay preparation SoT under `pulse.m07.staffpay.*` using `kind: "adjustment"` periods and adjustment records.

---

## C. Repository discovery and current-state findings

### C.1 Material paths

**Architecture / plans**

- `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md`
- `docs/architecture/WAVE6_M07_INTEGRATION_BOUNDARY_MAP.md`
- `docs/architecture/WAVE6_M07_PERMISSIONS_MATRIX.md`
- `docs/architecture/WAVE6_M07_WORKFLOW_CATALOGUE.md`
- `docs/architecture/WAVE6_M07_SCREEN_ACTION_MATRIX.md`
- `docs/architecture/WAVE6_M07_EVIDENCE_ACCEPTANCE_PLAN.md`
- `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md`
- `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`
- `docs/architecture/WORKFORCE_FAMILY_DATA_MAP.md`

**Batch evidence (do not modify for this task)**

- `docs/audits/WAVE6_BATCH1_FOUNDATION_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH2_*` … `WAVE6_BATCH5_*`
- `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_1_6_2_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_3_6_4_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md`
- `docs/audits/WAVE6_BATCH6_REQUIREMENT_TRACEABILITY.md`

**Production (read-only inventory)**

- Domain: `src/modules/m07-staff-pay/types/domain.ts`
- Permissions: `src/modules/m07-staff-pay/permissions.ts`
- Services: `src/modules/m07-staff-pay/services/*.ts` (37 files; see capability matrix)
- Adapters: `src/modules/m07-staff-pay/adapters/{m02-inbox-publish,m04-person-read,m04-leave-read,m05-roster-read,m06-timesheet-read,m01-summary-publish,platform}.ts`
- Storage: `src/modules/m07-staff-pay/storage/{keys,migrations,migrate-v*.ts}.ts`
- UI: `src/modules/m07-staff-pay/sections/*.tsx`, `section-meta.ts`
- Platform contract: `src/platform/workforce/contracts/pay-period-ref.ts`
- Module registry: `src/platform/module-registry/module-register.ts`

**Tests:** `src/modules/m07-staff-pay/tests/*.test.ts` (25 test files; full M07 suite **221** at Batch 6 acceptance)

### C.2 Critical current-state facts

1. Ordinary pipeline is production-wired through lock/export/recon.
2. Batch 6 accepted **controlled unlock** despite original Q6 “no ordinary unlock” planning text; evidence states unlock ≠ PPA.
3. PPA coexistence (WF-33 / Q14): adjustment cycles may coexist with at most one open ordinary period when linked to a **locked** source and must not re-intake duplicate ordinary timesheets.
4. `createOrdinaryPayPeriod` only creates `kind: "ordinary"` (`period-service.ts`).
5. `payroll.adjust` is already used by deduction prep services — PPA must not overload that permission without clarifying semantics.
6. Provider-return parsing and payment execution remain OUT-* / deferred.

---

## D. Capability matrix

Status labels: `implemented and production-wired` | `implemented but qualified` | `test/evidence only` | `partial` | `absent` | `deliberately deferred` | `outside M07`

| Capability | Status | Authoritative path | Source | Output | Guard | Permission | Audit | Tests | Evidence | Gap | PPA phase | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Payroll-period create (ordinary) | implemented and production-wired | `period-service.ts` | LE settings, cadence | `PayPeriodRecord` ordinary | one-open ordinary; overlap | `payroll.period.create` | period create | domain/authz/batch | B1+ | — | preserve | ready base |
| Period lifecycle states | implemented and production-wired | `domain.ts` + services | mutations | draft…locked/archived | state machines per service | various | yes | batch CP | B1–6 | adjustment kind unused | PPA-1 | extend |
| Input snapshotting (M06) | implemented and production-wired | `published-timesheet-intake.ts` / lifecycle / replay | TimesheetRef | snapshots + index | lock-before-append; idempotent | `payroll.intake.run` | intake events | intake/replay/cp | B2+ | — | preserve; PPA must not duplicate into locked source | ready base |
| M04 identity/employment | implemented and production-wired | `adapters/m04-person-read.ts`, eligible population | M04 refs | eligibility | doctor/M08 exclude | view/profile | yes | batch | B2–5 | no dual write | preserve | ready base |
| M05 roster refs | implemented but qualified | `adapters/m05-roster-read.ts`, `variance-service.ts` | published shifts | variance views | read-only | view | limited | batch4 | B4 | informational variances | later PPA optional | preserve |
| M06 approved timesheet intake | implemented and production-wired | intake + lifecycle | M06 publish | prep inputs | CLEARED-M07-BATCH2 path | intake | yes | B2 tests | B2 | — | preserve | ready base |
| Late/replayed inputs | implemented and production-wired | `published-timesheet-replay.ts` | events | ordered apply | gap/conflict fail closed | intake | yes | replay tests | B2 | — | PPA must define own replay rules | ready base |
| Earnings classification | implemented and production-wired | `classification-resolve.ts`, rule maps | M04 class + M07 map | rule binding | missing map blocks | rules/calculate | yes | B3–4 | B3+ | — | PPA lines need class/rule pin | ready base |
| Ordinary / OT calc | implemented and production-wired | `calculate-service.ts` | snapshots + rules + rates | `PayPrepLine` / batches | period not locked | `payroll.calculate` | calc | B3 | B3 | non-certified | PPA-2 may reuse patterns | ready base |
| Allowances | implemented and production-wired | leave/allowance prep + codes | codes + profile | prep lines | unknown code blocks | codes/calculate | yes | B4 | B4 | — | PPA-2 | ready base |
| Leave prep | implemented and production-wired | `leave-prep-service.ts` | M04 leave read | leave prep lines | unapproved/unmapped block | adjust/leave | yes | B4 | B4 | — | PPA-2 | ready base |
| Deductions | implemented and production-wired | `deduction-prep-input-service.ts` | codes + inputs | deduction inputs | period lock | `payroll.adjust` | yes | B4 | B4 | permission name overload vs PPA | PPA-1 clarify | qualified |
| Exceptions | implemented and production-wired | `exception-service.ts` | blockers | exceptions | waive matrix | exception.* | yes | B4 | B4 | — | PPA-2/3 | ready base |
| External payroll employee ID | implemented and production-wired | `profile-service.ts` | M07 profile | external id + history | lock guard | externalId.* | yes | B5–6 | B5–6 | — | PPA export needs ID | ready base |
| Preparation rules | implemented and production-wired | `rule-service.ts` | M07 rules | versioned rules | lock guard | `payroll.rules.edit` | yes | B3+ | B3+ | non-certified | pin versions on PPA | ready base |
| Recalculation | implemented and production-wired | calculate-service | open period | new calc version | locked denied | calculate | yes | B3–6 | B3–6 | — | never recalc locked source; PPA instead | ready base |
| Approval + invalidation | implemented and production-wired | `approval-service.ts`, `approval-invalidation.ts` | readiness + manifest | `PayPeriodApproval` | SoD; stale | approve/submit | yes | B5 | B5 | management approval ≠ certification | PPA-3 | ready base |
| Period locking | implemented and production-wired | `period-lock-service.ts` | recon + approval | lock record | SoD; recon | `payroll.period.lock` | yes | B6 | B6 | — | PPA prerequisite source | ready base |
| Unlock / recovery | implemented but qualified | `period-unlock-service.ts` | unlock request | open period | controls-incomplete | unlock.request/approve | yes (non-tx with M02) | B6 rem | B6 | ≠ PPA; non-transactional pair | retain qual | qualified |
| Export profiles/batches | implemented but qualified | export-*-service.ts | approval pins | canonical package | platform `*` via batch refs | export.* | yes | B6 | B6 | mutation-side profile protect | PPA-3 reuse | qualified |
| Download controls | implemented but qualified | `export-download-service.ts` | finalized artifact | download record | audit fail closed | export | download audit | B6 | B6 | download-before-lock allowed | PPA-3 | qualified |
| Checksum / stale | implemented and production-wired | checksum + lock source change | packages/locks | reject stale source | lock guard | — | export-batch.stale-source | B6 | B6 | — | PPA must link checksums | ready base |
| Package reconciliation | implemented but qualified | `reconciliation-service.ts` | expected rebuild + lines | PackageReconciliation | category≠gross | export.reconcile | yes | B6 | B6 | not provider returns | PPA-4 optional | qualified |
| M02 notifications | implemented but qualified | `adapters/m02-inbox-publish.ts` | export/unlock/stale | inbox projection | sequenced not transactional | — | paired with audit | B6 | B6 | non-tx | PPA inherits qual | qualified |
| Tenant/LE isolation | implemented and production-wired | permissions asserts | actor scope | deny cross-entity | fail closed | all | yes | matrix | all | — | PPA same | ready base |
| Revision/history | partial | profile version / material revision / approvals | mutations | versions | — | various | audit | B5–6 | B5–6 | History UI planned | PPA-1+ history | gap UI |
| **Prior-period adjustment create** | absent | — | locked source | adjustment period + linkage | — | `payroll.adjust` (planned) | required | none | deferred B6 | full subsystem | **PPA-1** | **build** |
| **PPA line deltas** | absent | — | reason + pins | adjustment lines | — | adjust | required | none | deferred | lines + pins | **PPA-2** | **build** |
| **PPA approve/export** | absent | — | adjustment cycle | export package | — | approve/export | required | none | deferred | reuse Batch 6 patterns | **PPA-3** | **build** |
| Provider-return processing | deliberately deferred | — | external files | — | — | — | — | — | OUT | — | later wave | deferred |
| Payment / net-pay / bank / STP / super / Xero prod | outside M07 / deliberately deferred | — | — | — | prohibited fields | — | — | architecture | OUT-* | — | never in PPA batches | excluded |
| M08 doctor pay | outside M07 | — | — | — | doctor exclude | — | — | Q7 | — | — | never | excluded |

---

## E. Data ownership

| Item | Authoritative owner | Identifier | Tenant / LE | Effective dates | Version | PPA stores | Recalc trigger | Lock behaviour | Audit | Failure |
|---|---|---|---|---|---|---|---|---|---|---|
| Workforce person | M04 | person / engagement refs | org/LE | employment effective | M04 versions | **reference** only | person change → invalidate open ordinary; locked → PPA | no M04 write | yes | exclude/block |
| Account identity | M03 / platform | userId | actor scope | — | — | actor on audit | — | — | yes | deny |
| Classification | M04 read; M07 map | class ref + mapping id | LE | mapping effective | mapping version | pin mapping/rule versions on lines | map change | locked source immutable | yes | block if missing |
| Approved timesheet | M06 | registryPublicationId / TimesheetRef | org/LE | period bounds | sourceVersion | ordinary: snapshot; **PPA: reference to source snapshot ids — no duplicate ordinary re-intake** | supersession | locked source rejects intake | yes | fail closed |
| Roster | M05 | shift/assignment refs | clinic/LE | as-of | published version | reference for variance only | optional | no rewrite | limited | informational |
| Pay rates / allowances | M07 profile | profile id | LE | effectiveFrom/To (strict Gregorian) | profile version / materialProfileRevision | PPA pins source profile version; may introduce adjustment lines | rate change on locked → PPA | mutation guard | yes | fail closed invalid dates |
| Leave | M04 leave + M07 leave prep | leave id+version | LE | leave dates | leave version | reference + optional PPA leave delta lines | leave late → PPA | locked source immutable | yes | block unapproved |
| Deductions | M07 | deduction prep input ids | LE | effective | input version | PPA may add adjustment deductions | — | lock guard | yes | unknown code block |
| Exceptions | M07 | exception id | LE/period | — | — | PPA-specific exception kinds | — | — | yes | non-waivable set |
| Export profile | M07 | profile id + version | LE or `*` | effective | profile version | pin on export batch | profile mutate | mutation-side lock (Batch 6 qual) | yes | reject if locked impact |
| Prep rules | M07 | rule id | LE | effective | rule version | pin on calc/PPA lines | rule change | locked results retain old version | yes | — |
| Ordinary period | M07 | period id | LE | periodStart/End | period.version | **sourcePeriodId** on PPA | — | must be locked for PPA create | yes | reject if not locked |
| Adjustment period | M07 (planned) | period id `kind=adjustment` | same LE as source | PPA window | version | SoT | PPA recalc within open adjustment only | separate from source lock | yes | coexistence rules |
| Adjustment record | M07 (planned) | adjustment id | LE | — | links source calc/export versions | SoT | — | — | full linkage required | fail closed missing pins |
| Canonical export | M07 | export batch id | one LE | — | package version + checksum | SoT | — | immutable finalize | yes | stale reject |
| Money / bank / STP / super | external / forbidden | — | — | — | — | **never** | — | — | reject prohibited fields | outside |

**No dual ownership / dual write:** M07 must not write M04/M05/M06/M08 repositories; adapters and platform contracts only.

---

## F. State machine

### F.1 Existing ordinary period states (preserve)

From `PayPeriodLifecycleState`:

`draft → open → calculating → in-review → export-ready → exported → reconciled → locked` (+ `archived`)

Batch 6 also supports controlled unlock recovery back toward `open` under unlock-request statuses (`requested` / `controls-incomplete` / `approved` / …) — **qualified**, not PPA.

### F.2 Proposed PPA / adjustment-cycle states

Not every conversational state is required. Recommended minimal machine for **adjustment periods**:

| State | Entry | Allowed actions | Roles | Guards | Exit | Invalidation | Audit | M02 | Recovery |
|---|---|---|---|---|---|---|---|---|---|
| `draft` / `open` (adjustment) | Create linked to locked source | edit metadata, add draft lines | clerk/admin with `payroll.adjust` | source locked; same LE; no duplicate ordinary intake | ready to calculate | source unlock exceptional — freeze or cancel PPA | `ppa.create` | optional blocker | cancel PPA |
| `calculating` / calculated | run PPA calculate | view lines | `payroll.calculate` + adjust | open adjustment only | exceptions or ready for approval | line/source pin mismatch | `ppa.calculate` | — | recalc PPA only |
| `exceptions` | blocking PPA issues | resolve/waive (matrix) | exception.* | non-waivable deny | clear → approval | — | exception events | assign | fix inputs |
| `in-review` / `export-ready` | submit / approve PPA | approve/reject | SoD approve | same SoD as ordinary | export prep | material change → stale | approval events | approval inbox | re-submit |
| `exported` / `reconciled` | finalize PPA package | download; package recon | export ops | checksum; LE isolation | optional lock of adjustment period | stale profile/source | export events | export/stale | new PPA version |
| `locked` (adjustment) | explicit lock | no ordinary mutate | lock permission | recon+approval | closed | — | lock audit | — | further PPA of PPA only if owner later allows |

**Conflict note:** Original Q6 rejected ordinary unlock; Batch 6 accepted controlled unlock. PPA design must treat unlock as exceptional remediation and PPA as the **primary** post-lock correction path (owner Q2).

---

## G. Calculation boundary

### G.1 First PPA implementation should calculate / record

- Explicit **adjustment lines** (over/under preparation amounts) with source references  
- Optional reuse of ordinary/OT/allowance/leave/deduction **line types** as adjustment categories  
- Gross **preparation** totals for the adjustment package only  
- Explainable line ↔ sourcePeriod / sourceCalculationVersion / sourceExportVersion / ruleVersion / profileVersion pins  
- Deterministic rounding consistent with Batch 6 scaled multiply (`export-decimal.ts`) for exportable amounts  

### G.2 Must not calculate / assert (unless separately authorised)

- Executable **net pay**  
- Tax withholding / STP amounts as filing truth  
- Superannuation processing  
- Employer cost engines beyond prep lines already in scope  
- Payment disbursement  
- Silent retro rewrite of locked ordinary lines  
- Cross-period “fix the past in place” without a new adjustment cycle  
- Award/tax/super/employment-law **certification**  

### G.3 Rules that cannot safely be inferred from code today

- Statutory underpayment remediation amounts  
- Which adjustments require employee notification vs internal prep only  
- Whether negative gross packages are permitted  
- Whether multiple concurrent PPA cycles per locked source are allowed (plan default: **one open PPA per sourcePeriodId** until owner says otherwise)  
- Accounting treatment in Xero (deferred vendor)  

---

## H. Fail-closed exception model

| Condition | Blocking stage | Error code (proposed) | User explanation | Service | Audit | M02 | Recovery |
|---|---|---|---|---|---|---|---|
| Missing workforce identity | PPA create/calc | `missing-person-context` | Person required | throw | deny | — | fix M04 link |
| Missing legal entity | all | `missing-legal-entity-context` | LE required | throw | deny | — | fix scope |
| Missing external payroll employee ID | PPA export | `missing-external-payroll-employee-id` | ID required for export | validation block | yes | blocker | link ID on open profile / via policy |
| Missing/conflicting classification | calc | `classification-unresolved` | Cannot map rule | exception | yes | optional | map in Settings |
| Invalid effective dates | mutate/calc | `invalid-effective-date` / overlap fail closed | Date invalid | reject pre-write | yes | — | correct date |
| Missing pay rate | calc/export | `missing-rate` | Rate required | exception | yes | blocker | set rate or waive if waivable |
| Overlapping rates | calc | `overlapping-rate` | Ambiguous rate | fail closed | yes | — | fix profile windows |
| Invalid allowance config / unknown code | calc/export | `unknown-code` | Code not permitted | block | yes | — | add code version |
| Unapproved timesheet | ordinary intake only | existing intake codes | — | — | — | — | N/A to PPA re-intake (forbidden) |
| Changed timesheet revision on locked source | PPA create if pins break | `source-revision-mismatch` | Source moved | reject | stale-source | stale-source | new PPA after controlled policy |
| Late leave/deduction | PPA lines | — | Capture as adjustment line | allow on PPA | yes | — | add line |
| Unresolved attendance exception | ordinary; PPA if referenced | existing | — | block export | yes | — | resolve |
| Stale calculation/approval | approve/export | `stale-approval` | Re-approve | deny | yes | — | recalc/approve |
| Export-profile mutation impacting locked | profile mutate | `period-locked-source-change` | Locked impact | reject pre-write | yes | stale | unlock or new profile unused |
| Cross-tenant/entity | all | scope errors | Denied | deny | yes | — | correct actor |
| Duplicate ordinary intake into locked | intake | existing lock + uniqueness | Denied | reject | yes | — | use PPA |
| Replay ordering failure | intake/replay | replay blocked | Denied | fail closed | yes | — | repair checkpoint |
| Partial audit/M02 failure | locked-source / unlock | `locked-source-control-incomplete` | Controls incomplete | fail closed | partial possible | partial | retry (Batch 6 qual) |
| Locked-period ordinary mutation | mutate | `period-locked-source-change` | Use PPA | reject pre-write | yes | yes | create PPA |

Financially authoritative uncertainty **fails closed**.

---

## I. Permissions and segregation of duties

### I.1 Existing codes (retain)

Canonical list in `permissions.ts` / `WAVE6_M07_PERMISSIONS_MATRIX.md`, including Batch 6 unlock codes `payroll.period.unlock.request` / `payroll.period.unlock.approve`.

### I.2 Minimum additional permissions (only if owner accepts)

| Proposal | Recommendation |
|---|---|
| Reuse `payroll.adjust` for PPA create/edit lines | **Recommended** for PPA-1, with service-level action taxonomy in audit (`ppa.*`) so deduction-prep and PPA remain distinguishable |
| New `payroll.ppa.approve` | **Not recommended** initially — reuse `payroll.approve` with SoD on adjustment periods |
| New `payroll.ppa.export` | **Not recommended** — reuse `payroll.export.create` gated on adjustment period eligibility |

### I.3 SoD / enforcement rules

- Base account roles remain separate from M07 codes (M03 boundary).  
- High-risk actions enforced in **services**, not UI visibility.  
- Calculator/submitter ≠ sole final approver (existing SoD) applies to PPA cycles.  
- Export operator cannot lock; cannot edit export profiles.  
- Authoritative LE/clinic scope from store; caller metadata cannot widen access.  
- Doctor/M08 exclusion remains non-waivable.

---

## J. Audit, history and idempotency

### J.1 Required artefacts

| Artefact | Requirement |
|---|---|
| PPA create | sourcePeriodId, sourceLegalEntityId, sourceCalculationVersion, sourceExportVersion?, adjustmentPeriodId, reason, actor, timestamps |
| Lines | deltas, category, personId, pins to rule/profile/source lines |
| Calc revision | monotonic per adjustment period |
| Approvals / invalidations | same patterns as Batch 5 |
| Exports / downloads / checksums | Batch 6 patterns |
| Locks / unlocks | source remains immutable; adjustment may lock independently |
| Failed attempts | append-only; no success audit on rejected pre-write |
| Replay/duplicates | idempotency keys on intake already; PPA create idempotent on `(sourcePeriodId, openAdjustment)` policy |

### J.2 Idempotency

| Operation | Expectation |
|---|---|
| Create PPA for source | Second concurrent open PPA for same source → conflict |
| Calculate PPA | Idempotent recompute → new version only if inputs changed |
| Finalize export | Immutable; retry returns same artifact identity |
| M02 project | Deterministic projection key; retry safe |
| Download | Audited each download; artifact bytes stable |

### J.3 Non-transactional qualification (retained)

Locked-source **audit + M02** pairing remains sequenced, not transactional (Batch 6 qualification). PPA should not pretend stronger atomicity until a dedicated durability batch is authorised.

---

## K. UI journeys

Minimum changes only; do not redesign unrelated M07 UI.

| Screen | Primary user | Purpose | Data | Actions | Permission | Warnings | Drill-down | Empty/loading/error | Responsive |
|---|---|---|---|---|---|---|---|---|---|
| Adjustments (un-plan → available) | Pay clerk / admin | List PPA cycles; create linked to locked source | adjustment periods + source refs | create, open | `payroll.adjust` | source must be locked | period detail | empty CTA; error banner | yes (existing shell) |
| PPA readiness checklist | clerk | pins + missing IDs | source lock/export/approval pins | refresh | view/adjust | missing pins | person list | blocked badges | yes |
| Calculation summary | clerk/approver | adjustment totals | lines/totals | calculate | calculate | stale | person breakdown | error codes | yes |
| Employee breakdown | clerk | line deltas | person lines | edit draft lines | adjust/rate.view | redaction | line audit | — | yes |
| Exception queue | clerk/approver | PPA exceptions | exceptions | resolve/waive | exception.* | non-waivable | exception detail | — | yes |
| Approval | approver | approve PPA | manifest for adjustment | approve/reject | approve + SoD | stale | clinic readiness if applicable | — | yes |
| Export / Recon | export ops | package for adjustment | export batch | preview/finalize/download/recon | export.* | download≠paid; not provider return | artifact | — | yes |
| History | all permitted | audit trail | audit events | view | audit.view | — | event | planned section today | yes |
| Settings | admin | rules/codes/profiles | existing | existing | settings/rules | locked impact | — | — | yes |

Overview/People/Leave/Exceptions/Variances/Approval/Export/Recon remain; Adjustments leaves `PlannedSection` once PPA-1 authorises UI wiring.

---

## L. Integration boundaries

| Boundary | Producer | Consumer | Contract | ID | Ordering | Versioning | Idempotency | Retry | Failure | Ownership |
|---|---|---|---|---|---|---|---|---|---|---|
| M02 Action Inbox | M07 adapter | M02 | projection DTO | correlation keys | after domain decision | projection schema | deterministic key | retry incomplete | controls-incomplete | M07 projects; M02 displays |
| M03 org/users/perms | M03/platform | M07 | actor + org scope | userId, org ids | — | — | — | — | deny | M03 identity; M07 catalogue |
| M04 staff | M04 | M07 adapters | person/engagement/leave views | personId, leaveId | — | leave/person versions | read | — | exclude doctors | M04 SoT |
| M05 roster | M05 | M07 variance | published refs | shift ids | — | published version | read | — | informational | M05 SoT |
| M06 attendance | M06 | M07 intake | TimesheetRef / events | registryPublicationId | replay order | sourceVersion | intake idempotency | refresh | lock blocks | M06 publish; M07 snapshot |
| M08 doctor pay | M08 | boundary only | exclude | personKind/engagement | — | — | — | — | quarantine | M08 owns doctor pay |
| External payroll provider | M07 export | external system | canonical CSV/JSON | exportId | — | schemaVersion | package id | resend recorded ≠ paid | recon mismatch | M07 prep; provider executes pay |
| Xero / accounting | deferred adapter | — | wrap canonical | — | — | — | — | — | out of scope | deferred |

**Rule:** never import another module’s `repository/`.

---

## M. Provider-neutral export design

Reuse Batch 6 architecture:

1. Canonical internal payroll-preparation package (`export-canonical-service.ts`)  
2. Versioned export profiles (admin versions; operator selects)  
3. Validation before finalize (`export-validation-service.ts`)  
4. Immutable finalize + artifact checksum  
5. Stale-source detection via lock guards  
6. Audited download; export ≠ paid  
7. Future named vendor adapters (Xero) wrap canonical model — **deferred**  
8. Provider-return parsing/recon — **deferred** (not claimed by package recon)

PPA packages: same canonical model with `period.kind === "adjustment"` and metadata linking `sourcePeriodId`.

---

## N. Acceptance criteria and test strategy

### N.1 Representative Given/When/Then (high risk)

1. **PPA create requires locked source**  
   Given ordinary period `locked` with export checksum  
   When actor with `payroll.adjust` creates PPA  
   Then adjustment period created with required linkage pins; source unchanged  

2. **PPA create fails if source not locked**  
   Given `export-ready` ordinary period  
   When create PPA  
   Then `source-not-locked`; no adjustment row  

3. **No duplicate ordinary intake into locked source**  
   Given locked period  
   When intake replay of same TimesheetRef  
   Then rejected; PPA remains the correction path  

4. **Invalid dates fail closed on PPA lines**  
   Given open adjustment  
   When line effectiveFrom `2026-13-01`  
   Then reject before write; no partial revision  

5. **SoD on PPA approval**  
   Given same actor calculated/submitted PPA  
   When sole final approve  
   Then separation-of-duties  

6. **Export adjustment package immutability**  
   Given approved PPA  
   When finalize export  
   Then checksum stable; download audited; UI does not claim paid  

7. **LE isolation**  
   Given ORG_A locked source  
   When ORG_B actor creates PPA  
   Then scope deny; no write  

8. **Unlock still ≠ PPA**  
   Given locked period  
   When controlled unlock completes  
   Then ordinary period may reopen under Batch 6 rules; no adjustment record implied  

Each criterion: exercise real production services; assert pre/post state; no helper-only expected-result duplication.

### N.2 Suites required for a future PPA batch

Domain, production-service, authz, isolation, invalid-date, pre-write, no-partial-mutation, revision/invalidation, intake/replay, export-profile/batch, download, lock/unlock regression, reconciliation regression, UI/component, responsive/a11y smoke, architecture/boundary, full `npm run test:m07` + Batches 5–6 regression.

---

## O. Proposed implementation batches

| Batch | Objective | Include | Exclude | Dependencies | Likely files | Tests | Evidence | Entry gate | Stop | Owner decision |
|---|---|---|---|---|---|---|---|---|---|---|
| **PPA-1 Foundation** (recommended first) | Adjustment period + linkage + Adjustments UI list/create | `kind=adjustment` create; source pins; coexistence; audit; fail closed | calc engine, export, payment, provider return | Batch 6 closed | `period-service`, new `ppa-service` (name TBD), domain types, local-store, Adjustments section, permissions usage | new focused + regression | new Batch PPA-1 evidence only | owner authorises PPA-1 | stop before PPA-2 | Q1–Q3 |
| **PPA-2 Lines & calculate** | Audited adjustment lines + calc revision | line deltas; pins; exceptions | payment; provider return; auto rewrite source | PPA-1 | calculate/exception/leave/deduction patterns | production-service | PPA-2 evidence | PPA-1 accepted | stop | Q3–Q4 |
| **PPA-3 Approve & export** | Reuse Batch 6 export path for adjustment packages | approve, preview/finalize/download, checksum, profile pins | provider return; Xero; bank | PPA-2 | approval/export/* | export/download/SoD | PPA-3 evidence | PPA-2 accepted | stop | Q4 |
| **PPA-4 Package recon (optional)** | Package-level recon for adjustment exports | expected rebuild independence | provider-return files | PPA-3 | reconciliation-service | recon tests | PPA-4 evidence | PPA-3 accepted | stop | Q5 |
| **Future** | Provider returns / named Xero adapter / payment | — | — | separate authorisation | — | — | — | — | — | separate |

Do **not** combine core PPA, provider returns and payment in one batch.

---

## P. Owner questions (max six) with recommendations

### Q1 — Confirm meaning of PPA
**Why it matters:** Conversational “payroll preparation” conflicts with repository “prior-period adjustment.”  
**Options:** (A) PPA = Prior-Period Adjustment (repository); (B) Rename/redefine PPA as ordinary payroll-prep programme.  
**Recommended:** **A**  
**Effect:** Next work builds the missing adjustment subsystem; Batches 1–6 remain the ordinary prep pipeline.

### Q2 — Primary correction path after lock
**Why it matters:** Batch 6 unlock coexists with planned PPA; operators need a single primary path.  
**Options:** (A) PPA primary; unlock exceptional remediation only; (B) Unlock primary; PPA optional; (C) Remove unlock once PPA ships.  
**Recommended:** **A** (retain Batch 6 unlock qualifications; do not remove without separate CR)  
**Effect:** PPA-1 documents unlock≠correction-of-record; PPA carries financial correction history.

### Q3 — First batch depth
**Why it matters:** Controls blast radius.  
**Options:** (A) Foundation+linkage+UI only; (B) Foundation+manual lines; (C) Foundation through export in one batch.  
**Recommended:** **A** then **B** as PPA-2  
**Effect:** Smallest safe authorised increment; export waits for PPA-3.

### Q4 — Open PPA cardinality
**Why it matters:** Coexistence and audit clarity.  
**Options:** (A) At most one open PPA per `sourcePeriodId`; (B) Many concurrent PPAs per source.  
**Recommended:** **A**  
**Effect:** Simple idempotency and SoD; further PPAs require prior PPA locked/archived.

### Q5 — Provider returns and Xero
**Why it matters:** Prevents scope creep into integrations.  
**Options:** (A) Remain deferred through PPA-1…4; (B) Start provider-return design in parallel.  
**Recommended:** **A**  
**Effect:** PPA stays preparation-only; package recon ≠ provider-return recon.

### Q6 — Permission model for PPA
**Why it matters:** `payroll.adjust` already gates deduction prep.  
**Options:** (A) Reuse `payroll.adjust` + distinct audit actions; (B) Add `payroll.ppa.*` codes now.  
**Recommended:** **A** for PPA-1; revisit codes if SoD conflicts appear  
**Effect:** Minimal permission churn; clearer audit taxonomy.

---

## Q. Risk register

| Risk | Cause | Consequence | Current control | Proposed control | Severity | Acceptance impact | Owner decision | Batch |
|---|---|---|---|---|---|---|---|---|
| Meaning drift (prep vs adjustment) | Ambiguous acronym | Wrong scope built | Repo citations | Owner Q1 | High | Blocks correct start | Q1 | before PPA-1 |
| Unlock used instead of PPA | Batch 6 unlock exists | Lost immutable correction trail | Unlock≠PPA copy | Owner Q2 + UI guidance | High | Qual | Q2 | PPA-1 |
| Dual write to M04/M06 | Shortcut | Boundary break | adapters only | architecture tests | High | Blocker if violated | — | all |
| Payment scope creep | “adjustment” misread as pay | Regulatory risk | OUT-* exclusions | hard exclusions in plan/evidence | High | Excluded | Q5 | all |
| Non-transactional audit/M02 | Batch 6 design | Partial controls | fail closed incomplete | retain qual; optional future durability | Med | Qual | — | inherit |
| Export-profile mutation-side only | Batch 6 | Live read without version pin | batch ref guard | retain; pin versions on PPA export | Med | Qual | — | PPA-3 |
| Download-before-lock | Batch 6 policy | Exported unlocked window | evidence policy | retain; PPA docs same | Med | Qual | — | inherit |
| Invalid dates fail-open regression | fixed in rem4 | Financial mutation leak | Gregorian validation | mandatory PPA date tests | High | Prerequisite | — | PPA-2+ |
| Permission overload `payroll.adjust` | shared code | Confused authz | role matrix | Q6 + audit actions | Med | Qual | Q6 | PPA-1 |
| 14 TS errors / M06 build :235 | pre-existing debt | Build noise | known | do not “fix” in PPA unless authorised | Low | Unrelated debt | — | none |
| Open-period create/seed quals | Batch 6 | Edge cases | quals recorded | do not expand in PPA-1 | Low | Qual | — | inherit |

### Batch 6 qualifications — classification for PPA

| Qualification | Classification for PPA |
|---|---|
| Export-profile via export-batch references | acceptance qualification (inherit); pin on PPA export |
| Mutation-side live profile protection | acceptance qualification (inherit) |
| Download before optional lock | acceptance qualification (inherit) |
| Locked-source audit/M02 non-transactional | acceptance qualification (inherit); not PPA prerequisite to start foundation |
| Unlock idempotency / stale nuance | acceptance qualification; clarify vs PPA (Q2) |
| Open-period create / LE seed | acceptance qualification (inherit) |
| 14 TypeScript errors | unrelated technical debt |
| M06 outbox `:235` build failure | unrelated technical debt |
| PPA itself | **deferred scope → candidate next authorised batches** |
| Provider returns / payment / STP / super / Xero / M08 | deferred / outside M07 |

**Prerequisite before PPA implementation:** owner answers Q1–Q3 at minimum; baseline remains Batch 6 closed; no production edits until PPA-1 expressly authorised.

---

## R. Qualifications, exclusions and non-claims

**Retained Batch 6 qualifications:** listed in §Q.  

**Exclusions for all PPA batches unless separately authorised:** PPA-as-payment; net-pay execution; bank-file generation; STP; superannuation processing; provider-return processing; Xero production integration; Module 8 doctor pay; award/tax/super certification claims; rewriting locked ordinary history in place.

**Non-claims:** This design is **not** owner-approved. It is not production deployment approval. It is not statutory or monetary correctness. Full repository TypeScript/build health is not claimed.

---

## S. Recommended next authorised batch

**PPA-1 Foundation — Prior-Period Adjustment domain, linkage and Adjustments UI**

- Create `kind: "adjustment"` periods linked to locked ordinary sources with required version pins  
- Enforce coexistence / no duplicate ordinary re-intake  
- Wire Adjustments section off `planned`  
- Audit + fail closed  
- **Stop** before automatic financial delta calculation and before export  

Entry: owner accepts Q1–Q3 recommendations (or records alternatives).  
Stop checkpoint: PPA-1 evidence + owner acceptance before PPA-2.

---

## T. Stop checkpoint

1. Discovery and this planning document complete.  
2. **No PPA implementation has begun.**  
3. No payment, provider-return, STP, super, Xero, bank-file or M08 work has begun.  
4. Batch 1–6 evidence untouched by this task.  
5. Await owner decisions (§P).  
6. Do **not** start PPA-1 until the owner expressly authorises that batch.

---

*End of planning document.*
