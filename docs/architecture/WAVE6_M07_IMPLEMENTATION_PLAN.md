# Wave 6 Implementation Plan — Module 7 Staff Pay & Payroll Preparation

**Date:** 28 July 2026  
**Status:** **PLANNING ONLY — Wave 6 execution NOT approved**  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:** Waves 1A–5 **owner accepted and frozen**  
**Wave 5 accepted runtime:** `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49`  
**Wave 5 acceptance checkpoint:** `39f892e81f5aa76f6690d6af8c82273def5a6e0f`  
**Wave 5 freeze:** `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md`  
**Wave 6 planning companions:**  
- `docs/architecture/WAVE6_M07_WORKFLOW_CATALOGUE.md`  
- `docs/architecture/WAVE6_M07_PERMISSIONS_MATRIX.md`  
- `docs/architecture/WAVE6_M07_INTEGRATION_BOUNDARY_MAP.md`  
- `docs/architecture/WAVE6_M07_SCREEN_ACTION_MATRIX.md`  
- `docs/architecture/WAVE6_M07_EVIDENCE_ACCEPTANCE_PLAN.md`  
- `docs/audits/WAVE6_CHECKPOINT_STOP_BEFORE_EXECUTION.md`

```json
{
  "planningOnly": true,
  "executionApproved": false,
  "ownerAccepted": false,
  "waveFrozen": false,
  "productionApproved": false,
  "blockedM07Unresolved": true,
  "planningBatch1Decided": "2026-07-28",
  "planningBatch2Decided": "2026-07-28",
  "planningBatch3Decided": "2026-07-28",
  "planningBatch4Decided": "2026-07-28",
  "prototypeParityGate": "docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md",
  "documentationCommitApprovedInPrinciple": true,
  "documentationCommitAuthorised": false
}
```

### Owner decisions — Batch 1 (binding for planning)

| ID | Decision |
|---|---|
| Q1 | **Legal entity (organisation) with clinics underneath.** Each pay period and export package belongs to **exactly one** legal entity. Clinic tags/filters remain. **Never** combine different legal entities in one payroll-preparation package. |
| Q2 | **M07-owned event intake.** Consume frozen M06 `timesheet.approved` / `TimesheetRef`. Receiving + idempotency live in M07. M06 must **not** import or write M07 repositories. Authorised **manual refresh/reconciliation** may detect missed approved publications without rewriting M06 attendance. |
| Q3 | **Fortnightly default**; cadence **configurable per legal entity** (`weekly` \| `fortnightly` \| `monthly`). Cadence encodes **no** award, tax or legal assumptions. |
| Q4 | **Generic versioned CSV + JSON first.** Canonical internal export model + versioned file schemas. Named vendor adapters later without changing M07 domain model. |
| Q5 | **Configurable SoD, enabled by default.** Actor who calculates or submits must not be the **sole** final export approver. Enforce in **service layer**, including bulk and delegated access. |
| Q6 | **No ordinary unlock.** After lock or export, corrections are **prior-period adjustments** in a later controlled cycle. Preserve original calculation, approval, export, versions and audit. **Break-glass unlock** is future-only documentation — **not** implemented in Wave 6 without separate owner approval. |

### Owner decisions — Batch 2 (binding for planning)

| ID | Decision |
|---|---|
| Q7 | **Exclude doctors / M08 by default.** Reject or quarantine `personKind=doctor`, M08-owned engagements, and any record that could duplicate staff+doctor pay prep. **No Wave 6 override.** Future override requires separate permission, justification, audit and duplicate-pay protection. |
| Q8 | **`legalEntityId` = existing organisation id.** No separate M07 pay-entity master. M07 may store prep settings keyed to organisation id; must not duplicate/rewrite organisation master data. Validate org exists, engagement belongs to org, one entity per period, cross-org isolation, clinics subordinate. |
| Q9 | **Clinic managers have no rate visibility by default.** Operational fields only (identity, clinic, approved hours, readiness, non-rate missing-input indicators, permitted approval progress). Rates, rate history, monetary values and sensitive profile fields require `payroll.rate.view`. **Service/DTO redaction** — not UI-only. |
| Q10 | **Simple owner-editable M07 rule table, labelled non-certified.** Prototype ordinary/OT prep only. Screens/reports/exports state: prototype; not award-certified; not legal/tax/super/payroll advice; needs authoritative validation before production. Rule changes need permission, versioning, effective dates, audit. Results retain `ruleVersion`. No silent recalc of locked/exported periods. |
| Q11 | **Approved M04 leave → separate non-certified preparation leave lines.** Only via M04 read boundary. Separate from worked-time; reference origin leave id+version; no assumed paid/loading/entitlement/award; missing mapping → exception/review; never rewrite M04. |
| Q12 | **Pay approver owns final approval.** With SoD: clerk prepare/calculate/submit; Pay approver final-approves; Export operator generate/download/reconcile **only after** export-ready; Export operator cannot self-approve; calculator/submitter cannot be sole final approver; bulk+delegated same rules. Export generation fails if approval missing, stale, revoked or wrong legal entity. |

### Owner decisions — Batch 3 (binding for planning)

| ID | Decision |
|---|---|
| Q13 | **Forbid TFN, bank account, BSB, super member number, banking credentials, payment instructions** in M07. External payroll holds those. M07 may keep only a minimum **external payroll employee id** (sensitive, permission-controlled, audited). |
| Q14 | **At most one open ordinary (non-locked) pay period per legal entity** in Wave 6 — **not** configurable. Prior-period adjustment cycles may coexist only when clearly linked to the locked source and **cannot** re-intake/duplicate ordinary timesheets. Reject overlapping ordinary periods and duplicate intake. |
| Q15 | **Waive blocking exceptions: Pay approver or Pay admin only** — not clerk/preparer. Waiver requires reason, actor, permission, timestamp, version, affected lines, legal entity, audit, and recalc/reapproval when result changes. Waiver never bypasses entity isolation, doctor/M08 exclusion, lock immutability, missing approval, or SoD. **Non-waivable:** cross-entity, doctor/M08 ownership, stale approval, duplicate intake. |
| Q16 | **Default export:** external payroll employee id, period ref, approved hours, line classification, external code, source/recon refs. Names/emails optional **off by default**. Rates/money only with export profile + `payroll.rate.view` + export permission + audit + sensitive-package marking. Never export TFN/BSB/bank/super ids. |
| Q17 | **Explicit Lock after full external acceptance** — no silent auto-lock. UI: complete-but-unlocked state, persistent reminder, authorised role, consequences, confirmation, audit. Exported-but-unlocked: no uncontrolled recalc, re-intake, approval replacement, or source mutation. |
| Q18 | **Small versioned M07 allowance/deduction code list, non-certified.** Generic demo classifications only. Codes need id, label, line type, effective dates, active flag, version, external mapping, origin, audit. Unknown/unmapped → blocking exception (never silent export). |

### Owner decisions — Batch 4 (binding for planning)

| ID | Decision |
|---|---|
| Q19 | **External payroll employee id lives on org-scoped M07 pay profile.** M04 identity/employment remain SoT (read-only in M07). Unique within legal entity when export profile requires. Permission-controlled, audited, hidden from clinic-manager views. Relink retains history/actor/reason/timestamp. No TFN/BSB/bank/super/payment fields. M04 person archive must not silently erase historical prep refs. |
| Q20 | **Lock = Pay approver or Pay admin only.** Export operator alone cannot lock. Requires fully accepted recon, current valid approval, no unresolved non-waivable blockers, legal-entity scope, SoD check, immutability warning, confirmation, audit (actor, time, period version, approval version, recon result). Pay admin cannot bypass non-waivable controls or entity isolation. |
| Q21 | **Prototype Approve Location CONSOLIDATED** into final approval + clinic-readiness indicators/filters. **No** separate location-approved period state. Each clinic shows readiness; clinic exceptions visible; final approval evaluates all included clinics; incomplete readiness blocks when applicable; excluded clinics explicit + audited. |
| Q22 | **Pay admin owns export profiles** (create/version/activate/retire). Export operator selects only active, entity-permitted profiles; cannot modify during generate. Profiles carry id, version, entity applicability, effective dates, status, schema version, fields, PII class, names flag, rates/money flag, required permissions, mappings, validations, audit. Default = min-PII. Historical exports retain exact profile id+version. |
| Q23 | **M07 Settings owns prep rule/code tables.** M04 owns workforce/employment/engagement/classification SoT only. M07 reads M04 classification via adapter and maps to versioned non-certified prep rule; missing/ambiguous mapping → blocking exception. Prototype Staff-hub award-rule editing = **RELOCATED/CONSOLIDATED** into M07 Settings (not a missing M04 feature). |
| Q24 | **Documentation-only planning checkpoint approved in principle** — **do not commit/push until a separate explicit instruction** after this readiness report is reviewed. |

**Prototype parity gate:** `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md`  
**Design direction:** Premium Clinical Enterprise — planning only; **no CSS rewrite**.

Do **not** implement M07 runtime until explicit Wave 6 execution approval.  
Do **not** write `pulse.m07.*` operational records under this planning document.  
Do **not** resolve or waive **`BLOCKED-M07`** until the receiving boundary is implemented and evidenced.  
Do **not** alter frozen Waves 1A–5 runtime, tests or accepted evidence.  
Do **not** process bank payments, lodge STP, submit to the ATO, or claim award/tax/super/employment-law certification.  
Do **not** calculate doctor payments (M08).  
Do **not** commit or push unless separately and explicitly instructed.  
Do **not** implement break-glass unlock, doctor-pay override, multi-open ordinary periods, bank/tax storage, or CSS rewrite in Wave 6.  
Do **not** create a second organisation or workforce source of truth.  
Do **not** introduce a separate “location approved” pay-period state.

Paths are relative to the GitHub repository root (`ThoshiMedicals/HCDP` = `Development folder/`).

---

## 1. Exact scope and exclusions

### In scope (execution, when approved)

- Rebuild **Module 7 Staff Pay & Payroll Preparation** as the authoritative SoT for staff payroll-preparation periods, TimesheetRef intake, pay-line calculation drafts, missing-input exceptions, controlled adjustments, export packages, external result recording and reconciliation — **not** final payroll execution.
- Replace `StaffPayModule` landing stub with an eleven-section workspace (architecture §Wave 6 sections).
- **Resolve WF-19B / `BLOCKED-M07` only by implementing a real M07-owned intake** that consumes published `TimesheetRef` / `timesheet.approved` and writes only `pulse.m07.staffpay.*`.
- Read M04 people/employment/leave via adapters + platform contracts only.
- Read M05 published shift/assignment context via adapters + platform contracts only (for variance display — never rewrite roster).
- Read M06 approved timesheets via `TimesheetRef` / event bus / published snapshots only — never edit M06 attendance SoT.
- Project pay blockers/approvals to **M02** and readiness counts to **M01** via adapters.
- Enforce clinic / legal-entity scope and service-layer permissions (M03 identity consumption; M07-owned catalogue).
- Idempotent, non-destructive M07 seed/migration; preserve frozen Wave 2–5 data; no dual-write; no bank/STP/ATO integration.

### Explicit exclusions

- Wave 6 **execution** until owner approval (this document is planning only).
- Bank payment processing, payment files that trigger disbursement, or “paid” truth.
- STP lodgement, ATO submission, BAS, or statutory filing.
- Replacing payroll, accounting or banking software.
- Doctor pay / practitioner draws / M08 calculations.
- Award, tax, superannuation or employment-law **certification** (prototype calculation tables only, if owner-approved later).
- Altering approved M06 attendance or timesheet records.
- Clinical or patient information of any kind.
- Treating controlled demo seeds as live operational payroll data.
- Production DB auth / server-side persistence (deferred).
- Cross-module repository imports/writes.
- Banking/tax/super identifiers (TFN, BSB, account, super member, credentials, payment instructions) — Q13.
- Multiple concurrent ordinary open periods per legal entity — Q14 (hard limit = 1).
- Clerk self-waiver of blocking exceptions — Q15.
- Silent auto-lock after reconciliation — Q17.
- Award-certified allowance/deduction catalogues — Q18.
- Resolving `BLOCKED-M10` (outside Wave 6 M07 totals; inherited informational).
- Global/module CSS rewrite under planning (design direction recorded only).

---

## 2. Repository and dependency audit (as of Wave 5 freeze)

### 2.1 Existing M07 skeleton (reuse / extend)

| Path | Finding |
|---|---|
| `src/modules/m07-staff-pay/StaffPayModule.tsx` | Landing placeholder — replace with workspace on execution |
| `src/modules/m07-staff-pay/module.config.ts` | `MODULE_ID=staff-pay`, route `/staffpay`, `STORAGE_PREFIX=pulse.m07.` |
| `src/modules/m07-staff-pay/storage/keys.ts` | `pulse.m07.staffpay.*` — meta, periods, calculations, adjustments, exports, reconciliations — **extend** for profiles, exceptions, intake, audit, approvals |
| `src/modules/m07-staff-pay/storage/migrations.ts` | Skeleton `m07-staffpay-storage-v1` — extend additively |
| `src/modules/m07-staff-pay/repository/types.ts` | `linkApprovedTimesheet(TimesheetRef)`, `resolvePerson` — expand domain types |
| `src/modules/m07-staff-pay/adapters/platform.ts` | Migration runner stub; no M04/M05/M06 repo imports |
| Registry `staff-pay` | Registered; `legacy-html-fallback`; sections `pay-prep`, `exceptions`, `exports` outdated |
| Permissions | **Missing** — create `permissions.ts` on execution |

### 2.2 Frozen contracts M07 may consume

| Asset | Owner | M07 may | M07 must not |
|---|---|---|---|
| `TimesheetRef` | M06 | Intake when `approved===true` | Mutate M06 timesheet SoT |
| `timesheet.approved` event | M06 | Subscribe / replay for intake | Invent payroll truth without intake |
| `WorkforcePersonRef`, `EngagementRef` | M04/platform | Resolve person, employment type, clinic scope | Edit M04 people/engagements |
| `leave.approved` / leave windows | M04 | Read approved leave for variance/context | Own leave SoT |
| `ShiftRef`, `AssignmentRef`, `RosterPublicationRef` | M05 | Read published context for variances | Edit roster/publications |
| `PayPeriodRef` | M07 (planned) | Own/publish | Let M06 write pay periods |
| Action-inbox bridge | Platform | Project blockers/approvals | Import M02 repositories |
| Executive summary | Platform/M01 | Contribute readiness counts | Dump sensitive pay rates to M01 |

### 2.3 Frozen M06 intake stub (BLOCKED-M07 — unresolved)

`src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts` always returns `BLOCKED-M07` and must not write `pulse.m07.*`.  
**Planning rule:** keep blocked until M07 intake service exists and intake workflow evidence passes.

**Owner-decided intake shape (Q2):** M07 owns receiving and idempotency. M06 continues to publish `timesheet.approved` / `TimesheetRef` only and must **not** import or write M07 repositories. M07 consumes events; an authorised **manual refresh/reconciliation** may scan for missed approved publications without rewriting M06 attendance data. No thin M06→M07 repository write path.

---

## 3. Business boundary

### May

- Receive approved `TimesheetRef` records from M06.
- Calculate and review payroll-preparation lines (ordinary, OT, allowances, leave hours as **preparation inputs** — not certified pay).
- Identify missing or invalid pay inputs (rate, classification, employment effective-dated profile).
- Manage payroll-preparation exceptions.
- Support controlled corrections and reprocessing.
- Prepare versioned export/reconciliation packages for an **external** payroll system.
- Maintain audit history and approval status.
- Lock periods and create prior-period adjustments as **preparation** records.

### Must not

- Process bank payments or mark people “paid” as banking truth.
- Lodge STP or submit to the ATO.
- Replace payroll, accounting or banking software.
- Calculate doctor payments (M08).
- Certify award, tax, superannuation or employment-law compliance.
- Alter approved M06 attendance records.
- Store clinical or patient information.
- Use fake operational records as live data (demo seeds must be labelled and separable).

---

## 4. User roles and service-layer permissions

Canonical catalogue: `docs/architecture/WAVE6_M07_PERMISSIONS_MATRIX.md`.

Planned roles (demo + service mapping):

| Role (working name) | Intent |
|---|---|
| Pay clerk | Prepare lines, calculate, submit (not final approve) |
| Pay reviewer | Review variances / non-final review |
| Pay approver | **Sole final export approval** (Q12) |
| Export operator | Generate/download/reconcile **after** export-ready only; never self-approve |
| Pay admin | Profiles, rule tables, period settings, legal-entity cadence, SoD flag |
| Clinic manager (read) | Clinic-scoped operational readiness **without** rates/monetary values (Q9) |
| Restricted / no access | Restricted UX |

Enforcement: every mutating service asserts permission + **legal-entity (organisation id)** + clinic scope. Field-level rate/monetary redaction at **service/DTO** boundary. SoD and role splits enforced in services (including bulk/delegated).

---

## 5. Legal-entity and clinic scope (Q1 + Q8 — decided)

- `legalEntityId` **is** the existing platform/M04 **organisation id**. No separate M07 pay-entity master register.
- M07 may store payroll-preparation settings keyed by organisation id (cadence, SoD). M07 must **not** duplicate or rewrite organisation master data.
- Every pay period and every export package has **exactly one** `legalEntityId`. Required.
- Clinic membership is via `clinicIds[]` tags/filters only — subordinate to entity isolation; clinics never replace entity scope.
- Validation on create/intake/calculate/export:
  1. organisation id exists (resolve via platform/M04/M03 read);
  2. engagement belongs to that organisation;
  3. period has exactly one legal entity;
  4. records from different organisations cannot enter the same period or export;
  5. clinic tags filter within the entity only.
- Cross-entity link/package → `legal-entity-mismatch` / `legal-entity-denied` (no write).
- Cross-clinic bulk **within one organisation**: partial success. Cross-organisation bulk rejected whole.

---

## 5A. Doctor / M08 exclusion (Q7 — decided)

Intake and calculation must **reject or quarantine** (no staff-pay lines produced):

- `personKind=doctor`;
- engagements designated M08-owned;
- any record that would create duplicate staff + doctor pay preparation.

State: `excluded` / exception `doctor-pay-excluded` with audit.  
**No override in Wave 6.** Future override (post–Wave 6) requires separately approved permission, justification, audit entry and duplicate-pay protection — document only.

---

## 5B. Rate visibility and redaction (Q9 — decided)

Without `payroll.rate.view`, DTOs must redact:

- ordinary/OT rates, rate history;
- calculated monetary amounts;
- sensitive pay-profile fields.

Clinic managers may still see: staff identity needed for review, clinic, approved hours, readiness, exceptions requiring action, **non-rate** missing-input indicators (e.g. “classification missing”), permitted approval progress.  
Redaction is **service/DTO enforced**; UI hiding alone is insufficient.

---

## 6. TimesheetRef intake contract (Q2 — decided)

### Input (frozen M06)

```text
TimesheetRef {
  owningModuleId: "time-attendance"
  recordId, personId, clinicId?, organisationId?
  periodStart, periodEnd
  approved: true
  sourceVersion?, publishedAt?, idempotencyKey?
  attendanceSessionIds?
}
```

Event: `timesheet.approved` with payload `{ timesheetRef, published: true }` and idempotency via `eventId` / `idempotencyKey`.

### Intake ownership

- Receiving + idempotency logic lives **inside M07** only.
- M06 must not import M07 repositories or write `pulse.m07.*`.
- Primary path: M07 consumes `timesheet.approved`.
- Secondary path: authorised `refreshMissedApprovedTimesheets` / reconciliation scans published approved refs readable without M06 repository import; links missed items; **never** rewrites M06 attendance.

### Intake rules (planned)

1. Reject if `approved !== true`.
2. Idempotent link key: `intake::{legalEntityId}::{timesheetRef.recordId}::{sourceVersion|0}::{idempotencyKey||recordId}`.
3. Duplicate same key / replayed event → no-op success (return existing intake link; no duplicate lines).
4. Newer `sourceVersion` for same timesheet → supersede prior link (audit + recalculation flag); never mutate M06.
5. Person must resolve via M04/platform ref; else exception `missing-person`.
6. Organisation must exist; engagement must belong to period `legalEntityId` (organisation id); else `legal-entity-mismatch` / `engagement-org-mismatch`.
7. Clinic tag must be in period `clinicIds` (or period allows all clinics under entity per settings); else `clinic-scope-denied`.
8. **Doctor / M08 exclusion (Q7):** `personKind=doctor` or M08-owned engagement → quarantine/exclude; **no pay lines**; no Wave 6 override.

### Output (M07 SoT)

`TimesheetIntakeLink` under `pulse.m07.staffpay.intake`: periodId, legalEntityId, timesheetRecordId, personId, clinicId, sourceVersion, intakeKey, state (`linked|superseded|excluded`), linkedAt, source (`event|refresh`).

**`BLOCKED-M07` remains unresolved until this path is implemented and evidenced.**

---

## 7. Idempotent intake and duplicate prevention

| Scenario | Behaviour |
|---|---|
| Same intake key twice | Return existing; no duplicate calculation lines |
| Replay `timesheet.approved` event | Deduped by event/intake key |
| Missed event then manual refresh | Links missing approved pubs; idempotent if already linked |
| Same person overlapping periods | Allowed if period windows differ within entity; variance warning if overlap |
| Unapproved timesheet presented | Validation error; no link |
| Refresh without new publications | No-op success |
| Timesheet for other legal entity | `legal-entity-mismatch`; no write |

---

## 8. Pay-period lifecycle (Q3, Q5, Q6 — decided)

### Cadence (Q3)

- Default cadence for a legal entity: **fortnightly**.
- Configurable per legal entity: `weekly` | `fortnightly` | `monthly`.
- Cadence drives suggested `periodStart`/`periodEnd` only — **no** award, tax or legal encoding.

### States

```text
draft → intake-open → calculating → in-review → export-ready → exported → reconciling → locked
                                      ↑_________________| (reject → in-review / calculating)
locked → (prior-period-adjustment only; no ordinary unlock)
```

| Transition | Permission | Audit | Notes |
|---|---|---|---|
| create draft | `payroll.period.create` | yes | Requires **legalEntityId** + clinic tags + date window from cadence |
| open intake / refresh missed | `payroll.intake.run` | yes | Event consumer + manual refresh |
| calculate | `payroll.calculate` | yes | Versioned batch; records `calculatedBy` |
| submit review | `payroll.review.submit` | yes | Records `submittedBy`; blocks if open blockers |
| approve export-ready | `payroll.approve` | yes | **Pay approver only** when SoD maps roles; SoD vs calculate/submit |
| reject | `payroll.approve` | yes | Reason required |
| create export | `payroll.export.create` | yes | Requires valid current approval for **this** period+entity; CSV+JSON; **not** paid |
| record external result | `payroll.export.reconcile` | yes | Export operator after export-ready |
| lock | `payroll.period.lock` | yes | Pay approver/admin only; recon accepted; valid approval; non-waivable clear; confirm + audit |
| prior-period adjustment | `payroll.adjust` | yes | Later cycle; full audit linkage |
| ordinary unlock | — | — | **Not in Wave 6** |
| break-glass unlock | — | — | Documented future only |
| doctor-pay override | — | — | **Not in Wave 6** |

Optimistic concurrency: every mutable aggregate has `version`; stale writes → concurrent-conflict UX.

### Separation of duties and roles (Q5 + Q12 — decided)

| Role | May | Must not (when SoD on) |
|---|---|---|
| Pay clerk | prepare, calculate, submit | Final approve; Lock; waive |
| Pay approver | final approve / reject; **Lock**; waive (waivable) | — |
| Export operator | generate/download/reconcile **after** `export-ready`; select export profile | Self-approve; Lock alone; modify profiles |
| Pay admin | profiles, rules, codes, export profiles, Lock, waive | Bypass non-waivable / cross-entity |
| Calculator/submitter | — | Be sole final approver |

- `separationOfDuties` default **true** per organisation.
- `createExportPackage` **fails safely** if approval is missing, stale (version mismatch), revoked/rejected, or belongs to another legal entity / period.
- Service-layer enforcement — UI disable is not sufficient.

### Locked-period / exported-unlocked policy (Q6 + Q14 + Q17 + Q20 — decided)

- **One open ordinary period per legal entity** (Wave 6 hard rule). Creating a second open ordinary period → `overlapping-open-period` rejection.
- Prior-period adjustment cycles may coexist only when linked to a **locked** source period and **cannot** re-intake or duplicate ordinary timesheets.
- After full external acceptance: show **reconciled but unlocked**; persistent Lock reminder. **No auto-lock.**
- **Lock actors:** Pay approver or Pay admin only — **Export operator alone cannot lock**.
- Lock preconditions: recon fully accepted; approval current/valid; no unresolved non-waivable blockers; legal-entity scope; SoD check; immutability warning; confirmation.
- Lock audit: actor, timestamp, period version, approval version, reconciliation result.
- Pay admin cannot bypass non-waivable controls or legal-entity isolation.
- Exported-but-unlocked: forbid uncontrolled recalculation, re-intake, approval replacement, and source mutation.
- No ordinary unlock after lock; break-glass future-only.

### Prohibited identifiers + external payroll employee id (Q13 + Q19 — decided)

M07 must reject persistence of: TFN, bank account, BSB, super fund member number, banking credentials, payment instructions.  
**External payroll employee id** lives on the **organisation-scoped M07 pay profile** only. M04 identity/employment/engagement remain SoT and display read-only. Unique within legal entity when export profile requires. Permission-controlled, audited, excluded from clinic-manager views. Relink/replace retains history, actor, reason, timestamp. M04 person archive/delete must not silently erase historical payroll-preparation references.

### Export profiles (Q16 + Q22 — decided)

| Rule | Detail |
|---|---|
| Owner | **Pay admin** creates, versions, activates, retires |
| Operator | Selects active, entity-permitted profile only; **cannot modify** during generate |
| Default | Minimum-PII (external payroll employee id, period ref, approved hours, line classification, external code, source/recon refs; names/emails off) |
| Rates/money | Only if profile requires + `payroll.rate.view` + export permission + audit + sensitive marking |
| Retention | Historical exports store exact `exportProfileId` + `exportProfileVersion` |
| Profile metadata | id, version, legal-entity applicability, effective dates, active/inactive, CSV/JSON schema version, included fields, PII classification, names flag, rates/money flag, required permissions, external mappings, validation rules, audit |
| Never | TFN/BSB/bank/super ids |

### Clinic readiness in final approval (Q21 — decided)

No separate “location approved” period state. Each included clinic exposes readiness; clinic exceptions/incomplete inputs visible; final approval is one legal-entity SoD action evaluating all included clinics; incomplete readiness blocks when applicable; excluded clinics explicit + audited. Prototype “Approve Location” = **CONSOLIDATED** here.

### Prep rules ownership (Q23 — decided)

**M07 Settings** owns prep rule/code tables. **M04** owns workforce/employment/engagement/classification SoT (read-only via adapter). M07 maps classification → versioned non-certified prep rule; missing/ambiguous → blocking exception. Do not edit M07 rules from M04 Staff. Prototype Staff-hub award-rule editing = **RELOCATED/CONSOLIDATED** into M07 Settings.

### Waiver rules (Q15 — decided)

| Waivable (approver/admin only) | Non-waivable |
|---|---|
| Some missing-rate / mapping blockers after justification | Cross-entity records |
| Selected leave-mapping gaps with recalc/reapproval | Doctor/M08 ownership |
| | Stale approval |
| | Duplicate intake |

Waiver payload: reason, actor, permission, timestamp, record version, affected lines, legal entity, audit; trigger recalc/reapproval when result changes. Cannot bypass SoD, lock, missing approval, or entity isolation.

### Allowance / deduction codes (Q18 — decided)

Small versioned M07 code list (non-certified): stable id, display label, line type, effective-from/to, active/inactive, version, external mapping field, permitted origin (manual/system), audit.  
Unknown/unmapped code → blocking exception; never silent export. No invented broad real-world entitlement catalogue.

---

## 8A. Prototype parity and design direction (pre-execution gate)

- Formal register: `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` (+ JSON companion).
- Reference: v34 HTML prototype (`Healthcare_Doctors_Pulse_Executive_Healthcare_Operations_Platform_v34_Stronger_Navigation_Palette.html`; identical copy at `public/pulse-html-prototype.html`).
- Placeholders, mounts, legacy HTML fallbacks, and buttons without service-backed mutation are **not** IMPLEMENTED-EVIDENCED.
- **Premium Clinical Enterprise** design direction recorded in the register — planning only; **no CSS rewrite** now.

---

## 9. Employee pay-profile inputs

M07-owned **pay profile** (not M04 rewrite):

| Field | Purpose |
|---|---|
| personId | Link to WorkforcePersonRef (M04 read-only display) |
| legalEntityId | Organisation id (required) |
| clinicId | Optional clinic tag |
| externalPayrollEmployeeId | Org-scoped export mapping id (Q19); sensitive |
| externalPayrollEmployeeIdHistory | Relink audit trail |
| m04ClassificationRef | Read-only classification from M04 adapter |
| preparationRuleRef | Mapped non-certified M07 rule version |
| ordinaryHourlyRate | Preparation rate (`payroll.rate.view`) |
| overtimeRulesRef | Points to M07 rule table version |
| allowanceCodes[] / deductionCodes[] | Non-certified code list refs |
| leavePayMapping | Optional; missing → exception |
| effectiveFrom / effectiveTo | Effective-dated |
| version | Concurrency |

Missing rate, classification, or classification→rule mapping → blocking exception.  
Profiles are **preparation inputs**, not employment contracts. No TFN/BSB/bank/super fields.

---

## 10. Ordinary hours, overtime, allowances, leave, deductions (Q10 + Q11 — decided)

### Rule table (Q10)

- Simple owner-editable M07 rule table for prototype ordinary/OT preparation.
- Every relevant screen, report and export must state clearly:
  - prototype payroll-preparation rules;
  - **not** award-certified;
  - **not** legal, tax, superannuation or payroll advice;
  - subject to authoritative validation before production use.
- Rule changes require `payroll.rules.edit`, **versioning**, **effective dates**, and **audit history**.
- Each calculation line stores `ruleVersion` / `ruleSetVersion` identity used — retained forever for that result.
- Changing rules must **not** silently recalculate locked or exported periods.

### Component boundaries

| Component | M07 may | M07 must not |
|---|---|---|
| Ordinary hours | Derive from approved timesheet hours within period | Invent attendance hours |
| Overtime | Apply versioned non-certified rule table | Claim Fair Work / award certification |
| Allowances | Apply configured codes | Invent clinical loadings as clinical truth |
| Leave hours | Create **separate** preparation leave lines from **approved** M04 leave only | Approve/deny leave; rewrite M04; assume paid/loading/entitlement/award |
| Deductions | Record preparation deduction lines | Process garnishment banking |
| Tax / super | **Out of prototype default** | Lodge or certify |

### Leave lines (Q11)

- Only approved leave via M04 read boundary.
- Separate from worked-time lines; reference originating leave `recordId` + `version`.
- Labelled **non-certified** until owner approves authoritative leave-pay mappings.
- Missing mapping/classification → exception/review state (`leave-mapping-missing`); **never** silently become payable.
- Unapproved leave must not create preparation leave lines.

---

## 11. Missing-rate and missing-classification handling

- Blocking exceptions prevent `export-ready` and export create.
- Exception kinds: `missing-rate`, `missing-classification`, `missing-person`, `invalid-timesheet`, `scope-mismatch`, `doctor-pay-excluded`, `leave-mapping-missing`, `legal-entity-mismatch`, `engagement-org-mismatch`.
- Resolution: update pay profile → reprocess person → close exception (versioned).
- M02 projection while open; close on resolve.

---

## 12. Exception and approval lifecycle

```text
open → in-progress → resolved | waived(with permission+reason) | cancelled
```

Approvals (period / export):

```text
pending → approved | rejected
```

Waive requires `payroll.exception.waive` + reason + audit.  
Rejected approval returns period to `in-review` or `calculating` per matrix.

---

## 13. Recalculation and prior-period adjustments (Q6 — decided)

| Action | When | Rules |
|---|---|---|
| Recalculate person | Before lock / before export immutability | New calculation version; supersedes prior open lines |
| Recalculate period | Before lock | Batch version bump; records `calculatedBy` |
| Correction after export or lock | Always via prior-period adjustment | Never silent rewrite of locked/exported lines |
| Ordinary unlock | — | **Forbidden in Wave 6** |
| Break-glass unlock | Future capability only | Documented; **not implemented** without separate owner approval |

Prior-period adjustment must store: `sourcePeriodId`, `sourceLegalEntityId`, `sourceCalculationVersion`, `sourceExportVersion` (if any), `adjustmentPeriodId`, reason, actor, timestamps, line deltas. Full audit linkage required for acceptance.

---

## 14. Bulk operations with partial success

- Bulk intake, bulk recalculate, bulk approve, bulk waive (if permitted).
- Response shape mirrors M06: per-item `ok | clinic-scope-denied | legal-entity-denied | separation-of-duties | not-found | validation | conflict`.
- SoD applies to bulk final approve the same as single approve.
- `rejectRest` must not mutate out-of-scope or SoD-denied items; versions unchanged.
- Preview required for destructive bulk.
- Bulk requests spanning multiple legal entities are rejected whole.

---

## 15. External payroll export boundary (Q4 — decided)

| Concept | Meaning |
|---|---|
| Canonical internal export model | M07 domain DTO independent of vendor |
| File schemas | **Versioned CSV** and **versioned JSON** packages (both emitted from same model) |
| Package identity | `exportId`, `schemaVersion`, `legalEntityId`, `periodId`, `packageVersion` |
| Status | `draft | generated | sent-recorded | external-accepted | external-rejected | superseded` |
| Reconciliation | Compare external result codes to package lines |
| Vendor adapters | **Out of Wave 6 default** — may wrap canonical model later without domain change |
| Paid | **Never** set by M07 as banking truth |

Isolation: one export package → one `legalEntityId`. Export ≠ paid. UI copy must state this explicitly.

---

## 16. Integrations (summary)

Full map: `WAVE6_M07_INTEGRATION_BOUNDARY_MAP.md`.

| Module | Direction | Mechanism |
|---|---|---|
| M06 | In | `TimesheetRef` / `timesheet.approved` |
| M04 | In | Person/engagement/leave adapters |
| M05 | In | Published shift/assignment read for variances |
| M02 | Out | Inbox bridge for blockers/approvals |
| M01 | Out | Executive readiness counts |
| M03 | In | Identity/roles; M07 enforces own catalogue |
| M08 | Boundary | Exclude doctor pay; no shared SoT writes |

---

## 17. Storage and migration

Prefix: `pulse.m07.staffpay.` (existing).

Planned keys (additive):

| Key | Content |
|---|---|
| meta | schema version |
| legalEntities | per-entity cadence + SoD defaults (M07 config; not M04 rewrite) |
| periods | pay periods (`legalEntityId` required, `clinicIds[]`, cadence snapshot) |
| intake | TimesheetRef links |
| profiles | pay profiles |
| rules | rule set versions (non-certified) |
| calculations | calculation batches + lines |
| exceptions | pay exceptions |
| approvals | approval queue |
| adjustments | adjustments + prior-period adjustments |
| exports | export packages (CSV+JSON metadata) |
| reconciliations | reconciliation records |
| audit | append-only audit |

Migrations: insert-if-absent; never wipe frozen Wave 2–5 keys; never touch `pulse.m06.*` / `pulse.m05.*` / `pulse.m04.*`.

Demo seed: clearly marked `source: "demo-seed"` and separable from operational intake.

---

## 18. Audit requirements

Every mutate writes audit: actor, action, targetId, clinicId, before/after version, reason (when required), at.  
Sensitive rates: view gated by `payroll.rate.view`; exports mask rates without permission.

---

## 19. Concurrency and version controls

- Aggregate `version` on period, profile, calculation batch, export, exception.
- Stale version → `ConcurrentConflictError` + UX concurrent-conflict.
- Export packages immutable once `generated`; corrections create new version.

---

## 20. Screen / section structure

Architecture Wave 6 sections (11):

1. Pay Run Overview  
2. People Review  
3. Exceptions  
4. Variances  
5. Adjustments  
6. Approval  
7. Export  
8. Reconciliation  
9. History  
10. Reports  
11. Settings  

Functional actions: `WAVE6_M07_SCREEN_ACTION_MATRIX.md`.

---

## 21. Functional action matrix (summary)

Every enabled control maps to a named service. Unsupported actions are omitted or disabled with reason (e.g. “Period locked”, “Missing rate”, “Requires payroll.approve”).  
No mount-only acceptance predicates at execution time.

---

## 22. Responsive and accessibility

- 6 widths × 11 sections matrix (66 cells) on execution evidence.
- Keyboard focus visible on M07 nav.
- Real UX states: loading, empty, filtered-empty, restricted, validation-error, system-error, offline, concurrent-conflict (not `?uxState=` demos alone).
- Appearance persistence via Command Centre selector (same pattern as Waves 4–5).

---

## 23. Performance targets (prototype — not SLAs)

| ID | Operation | Dataset | Target |
|---|---|---:|---:|
| perf.intake | Link 200 timesheets | 200 | ≤3000ms |
| perf.calculate | Calculate period | 200 people | ≤5000ms |
| perf.exception | Raise/list exceptions | 100 | ≤1000ms |
| perf.bulkApprove | Bulk approve lines | 200 | ≤5000ms |
| perf.export | Generate export package | 200 | ≤3000ms |
| perf.reconcile | Record external results | 200 | ≤2000ms |
| perf.m02 | Project blocker to inbox | 1 | ≤50ms |
| perf.overview | Overview load | 50 | ≤2500ms |

---

## 24. Workflow acceptance catalogue

See `WAVE6_M07_WORKFLOW_CATALOGUE.md`. Independently evidenced IDs WF-01…WF-30.  
**`BLOCKED-M07` is resolved only when intake workflow evidence passes in execution** — until then it remains blocked.

Accounting (planned for execution evidence):

- Required M07 workflows: pass independently (WF-01…WF-30)  
- Failed: 0  
- Skipped: 0  
- Blocked: none for core M07 once intake ships; `BLOCKED-M10` outside totals  
- OUT-* (bank/STP/ATO/M08/cert/unlock/vendor/doctor-override): **out of scope** (not counted as pass)

---

## 25. Test and evidence plan

See `WAVE6_M07_EVIDENCE_ACCEPTANCE_PLAN.md`.  
**Do not generate acceptance evidence for unimplemented functionality.**

---

## 26. Freeze and owner-acceptance gates

Execution (when approved) must achieve:

| Gate | Required |
|---|---|
| Eleven sections functionally evidenced | pass |
| Independent workflow catalogue (WF-01…WF-30) | all required pass |
| Batch 1–2 scenarios (entity/org validation, doctor/M08 exclusion, rate redaction, rules/leave, SoD/export roles, lock/PPA) | pass |
| Timesheet intake (former BLOCKED-M07) | pass with real M07 `pulse.m07.*` writes; M06 still publish-only |
| Permissions + legal-entity/clinic scope + bulk partial success | pass |
| Export ≠ paid asserted | pass |
| Locked-period immutability + prior-period adjustment audit linkage | pass |
| M02 blockers + M01 summary | pass |
| Responsive / a11y / appearance | pass |
| Numeric performance matrix | pass |
| Frozen Waves 1A–5 regression | pass |
| Lint / tsc / production build | pass |
| Owner acceptance | Explicit only |
| Production approval | **Not** in scope |
| Break-glass unlock | **Not** in Wave 6 |

---

## 27. No-fake-data and labelling rules

- UI labels: medical-centre **staff** payroll preparation (receptionist, nurse, admin, etc. — not patient billing).
- Demo seeds: banner/`data-m07-data-source="demo-seed"`.
- Operational intake: `data-m07-data-source="timesheet-ref"`.
- Disabled actions show reason text.
- Never present demo rates as “award compliant”.

---

## 28. File inventory (execution, when approved) — planning preview

Create/extend under `src/modules/m07-staff-pay/` primarily (plus additive platform contract fields if required).  
Frozen Wave 5 M06 runtime stays publish-only for timesheets. Closing `BLOCKED-M07` is an **M07 intake implementation**, not an M06 write path — any M06 bridge change requires Wave 5 CR + impact analysis + owner review and must still forbid M06→`pulse.m07.*` writes.

Batch 1–4 decisions are locked. No unresolved owner decisions material to Implementation Batch 1.

### Proposed Implementation Batch 1 (when execution authorised — not now)

| Area | Planned paths (preview) |
|---|---|
| Module shell | `src/modules/m07-staff-pay/` → workspace, sections, context, permissions (replace landing stub) |
| Storage | Extend `pulse.m07.staffpay.*` keys: profiles, intake, rules, codes, exportProfiles, approvals, audit |
| Services | period, intake, profile, calculate, exception, approve, export, reconcile, lock, adjust |
| Adapters | m04-person-read, m05-shift-read, m06-timesheet-read (no repos), m02 inbox, m01 executive |
| Tests | unit workflows WF-01…; authz; no bank fields; one-open-period; SoD; lock gates |
| Evidence | harnesses only after behaviour exists |
| Frozen waves | **No** M04/M05/M06 SoT edits; M06 bridge remains blocked until intake evidenced via M07-owned path + Wave 5 CR if bridge text changes |
| Rollback | Additive migrations insert-if-absent; feature flag / registry condition revert to landing |

**Stop/rollback:** Any frozen-wave test fail, `pulse.m07.*` write from M06, bank/tax field introduction, or SoD bypass → halt batch and revert.

---

## 29. Assumptions, risks, deferred

**Assumptions:** Demo Act-as; local persistence; Wave 5 TimesheetRef publish remains frozen; `legalEntityId` maps to existing organisation id.  

**Risks:** False confidence from prototype rates/rules; export mistaken for payment; intake race; accidental cross-org mixing; clinic manager rate leakage (mitigated by DTO redaction).  

**Deferred:** Production persistence; WCAG certification; STP/ATO; award/tax/super engines; M08; bank files; named vendor adapters; break-glass unlock; doctor-pay override.

---

## 30. Stop gate (planning)

**Batches 1–4 owner decisions and prototype-parity/design gate are recorded.**  
**Documentation commit approved in principle — not authorised until separate explicit instruction after readiness report review.**

After this documentation amendment:

- **Stop.** Return final readiness report. Wait for owner review.  
- Do not commit/push until separately authorised.  
- Do not alter frozen Waves 1A–5 runtime.  
- Do not resolve `BLOCKED-M07` in code under planning.  
- Do not implement unlock, doctor override, bank/tax storage, multi-open ordinary periods, separate location-approved state, or CSS rewrite.
