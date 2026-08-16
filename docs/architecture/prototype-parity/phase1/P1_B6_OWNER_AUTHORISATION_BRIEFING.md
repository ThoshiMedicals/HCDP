# P1-B6 Owner-Authorisation / Readiness Briefing — Accepted-module Decision A presentation apply

**Document type:** Owner-authorisation readiness briefing (implementation boundary + evidence matrix)
**Batch:** P1-B6 — Accepted-module final-design apply, **preserving domain behaviour**
**Status stamp:** `P1 — PLANNED, NOT AUTHORISED`
**Publication branch:** `cursor/p1-b5-m01-m02-presentation`
**Publication tip (docs):** tip at time of this briefing on the accepted P1-B5 branch
**Accepted P1-B1 tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`
**Accepted P1-B2 tip:** `66f3f8d27803f5b8d24043639d21b9069f58e77a`
**Accepted P1-B3 tip:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`)
**Accepted P1-B4 tip:** `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`)
**Accepted P1-B5 tip:** `4306116fdf28f9d90a989d8ec78b317ad351b0d2` (`P1-B5-OWNER-ACCEPT-2026-08-17`)
**Briefing date:** 2026-08-17

> **This briefing is not authorisation.**
> P1-B6 remains `P1 — PLANNED, NOT AUTHORISED`. No coding, PR, merge, deployment, gap closure, decision approval, Aurora integration, PPA, payment, or automatic progression is granted by this document.
> Aurora (`cursor/aurora-design-foundation`) remains **parked, isolated and unintegrated** — do not merge, cherry-pick, copy or selectively reapply Aurora code.
> Decision A remains the binding P1 visual contract.
> Frozen Waves 2–5 and accepted M07 Batches 1–6 domain behaviour must be preserved.

**Authoritative sources (this briefing does not replace them):**

| Pack | Source |
| --- | --- |
| Design contract | [`../design-system-contract.json`](../design-system-contract.json) |
| Decision A acceptance | [`../DESIGN_REFERENCE_DECISION_A_ACCEPTANCE.md`](../DESIGN_REFERENCE_DECISION_A_ACCEPTANCE.md) |
| Gap register | [`P1_PROTOTYPE_PARITY_GAP_REGISTER.md`](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) |
| Execution batches | [`P1_EXECUTION_BATCHES.md`](./P1_EXECUTION_BATCHES.md) |
| Sequencing | [`P1_DEPENDENCY_AND_SEQUENCING_PLAN.md`](./P1_DEPENDENCY_AND_SEQUENCING_PLAN.md) |
| Owner decisions | [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) |
| Scope exclusions / firewall | [`P1_SCOPE_EXCLUSIONS.md`](./P1_SCOPE_EXCLUSIONS.md); parent firewall |
| Wave control | [`.cursor/rules/hcdp-wave-control.mdc`](../../../../.cursor/rules/hcdp-wave-control.mdc) |
| P1-B5 acceptance | [`../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** unimplemented; **PPA** and **payment execution** out of scope; Best Practice (or equivalent) remains clinical system of record.

---

## 1. Executive summary

P1-B1 through P1-B5 are **owner accepted with qualifications and closed**. The next proposed batch is **P1-B6 — Accepted-module final-design apply**: apply already-accepted Decision A presentation to frozen modules **M04, M05, M06, M07 and M11** while **preserving domain behaviour** (SoT, permissions, calculations, events, exports, validations).

| Item | Status |
| --- | --- |
| P1-B6 | `P1 — PLANNED, NOT AUTHORISED` — briefing prepared only |
| Included gaps | 022, 023, 024, 025, 026, 050, 081 |
| New owner-decision blocker for B6 presentation | **None found** when Adjustments honesty wording is preserved exactly (see §3) |
| Express named-batch authorisation | **Not granted** — owner must expressly authorise before coding |
| `OWN-P1-009` / `OWN-P1-011` / `OWN-P1-016` | Remain **open**; do **not** block presentation-only B6 consideration |
| Aurora | Parked, isolated, unintegrated — adoption **unauthorised** |
| P1-B7 / P1-B8 | Remain `P1 — PLANNED, NOT AUTHORISED` |

**Hard dependency:** P1-B6 depends on accepted P1-B1 shared primitives/tokens, B2 honesty, B3 register/M07 honesty baselines, B4 shell a11y/appearance, and B5 M01/M02 presentation acceptance. Soft preference: apply modules in wave order **M04 → M11 → M05 → M06 → M07** so earlier freezes are verified before payroll-presentation work.

---

## 2. Authoritative accepted-module baseline table

| Module | Route | Accepted wave/batch | Accepted implementation SHA | Evidence files | Required regression suite |
| --- | --- | --- | --- | --- | --- |
| M04 | `/staff-doctors` | Wave 2 — owner accepted and frozen (27 July 2026) | **Not pinned** as a full SHA in wave-control or Wave 2 acceptance/completion reports in this worktree — freeze is by status/date; use evidence pack as behavioural baseline | `docs/audits/WAVE2_M04_COMPLETION_REPORT.md`; `docs/audits/WAVE2_ACCEPTANCE_REPORT.md`; `docs/audits/WAVE2_CHECKPOINT_STOP_BEFORE_WAVE3.md`; `docs/audits/wave2-m04-acceptance-evidence.json`; `docs/audits/wave2-m04-browser-evidence.json` | `npm run test:m04`; `npm run test:wave2-evidence` |
| M05 | `/roster` | Wave 4 — owner accepted and frozen — NOT production-approved | `15f020800bbca40702ef08ad25f94f1d1999112f` | `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`; `docs/audits/WAVE4_CHECKPOINT_STOP_BEFORE_WAVE5.md`; `docs/audits/wave4-m05-acceptance-evidence.json`; `docs/audits/wave4-m05-performance-evidence.json` | `npm run test:m05`; `npm run test:wave4-evidence` |
| M06 | `/time-attendance` | Wave 5 — owner accepted and frozen — NOT production-approved | Runtime `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49`; acceptance checkpoint `39f892e81f5aa76f6690d6af8c82273def5a6e0f` | `docs/audits/WAVE5_M06_COMPLETION_REPORT.md`; `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md`; `docs/audits/wave5-m06-acceptance-evidence.json`; `docs/audits/wave5-m06-workflow-evidence.json`; `docs/audits/wave5-m06-performance-evidence.json` | `npm run test:m06`; `npm run test:wave5-evidence` |
| M07 | `/staffpay` | Wave 6 / M07 Batches 1–6 closed within approved scope (Batches 3–4 and 6 with qualifications); plus P1-B3 honesty | Batch 6 technical target `ce1f4af68917c9988efff327d521d94b8289f2fc`; Batch 6 owner-acceptance evidence `ad54aed94b0c798d3f26fe66bf811d6e3b083151`; P1-B3 honesty tip `2515a4ffac0fb94cbd37092e26bf372cb43898f8` | `docs/audits/WAVE6_BATCH6_*`; P1-B3: `docs/audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md`; `docs/audits/p1/P1_B3_REMEDIATION_EVIDENCE.md` | `npm run test:m07`; `npm run test:p1-b3` |
| M11 | `/training` | Wave 3 — owner accepted and frozen (27 July 2026); plus P1-B3 register sync | **Not pinned** as a full SHA in wave-control or Wave 3 completion reports in this worktree — freeze is by status/date; P1-B3 register sync tip `2515a4ffac0fb94cbd37092e26bf372cb43898f8` | `docs/audits/WAVE3_M11_COMPLETION_REPORT.md`; `docs/audits/WAVE3_CHECKPOINT_STOP_BEFORE_WAVE4.md`; `docs/audits/wave3-m11-acceptance-evidence.json`; `docs/audits/wave3-m11-performance-evidence.json`; P1-B3: `docs/audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md`; `docs/audits/p1/b3-register-hygiene/` | `npm run test:m11`; `npm run test:wave3-evidence`; `npm run test:p1-b3` |

**Honesty note:** Where a full accepted implementation SHA is not recorded in authoritative control/evidence, future B6 work must treat the freeze status + evidence pack + focused regression suite as the behavioural baseline, and must not invent a SHA.

### Distinguishing accepted domain implementation from later P1 presentation

| Layer | Meaning for P1-B6 |
| --- | --- |
| Accepted wave/batch tip | Domain behaviour, permissions, calculations, events, exports — **immutable under B6** |
| P1-B1–B5 accepted tips | Shared Decision A shell/chrome/honesty — **may be applied** as presentation-only |
| P1-B6 (if later authorised) | Presentation/layout/tokens/a11y chrome on M04–M07/M11 only — **domain-equivalent exit required** |

---

## 3. Owner-decision blocker review

| Decision / topic | Classification for P1-B6 |
| --- | --- |
| Decision A PNGs / visual authority (`DEC-FINAL-PNGS-MISSING` closed) | **Relevant but already closed** — binding visual SoT |
| Light / Dark / System only (`DEC-BRANDED-THEMES`) | **Relevant but already closed** |
| OWN-P1-002 SHARED-first then authorise B2–B8 | **Relevant but already closed** — still requires **express** B6 auth |
| OWN-P1-006 / OWN-P1-007 (M11 register sync; M07 History/Adjustments honesty) | **Relevant but already closed** — preserve accepted honesty labels |
| OWN-P1-009 (durable M01–M03 domain) | **Outside P1-B6** / may remain deferred — does not block presentation-only B6 |
| OWN-P1-011 (named PPA batch) | **Outside P1-B6** / may remain deferred — B6 must not implement PPA |
| OWN-P1-016 (localStorage vs SQL) | **May remain deferred** — not a B6 presentation blocker; blocks production data claims only |
| OWN-P1A-* / OWN-P1C-* (planning extensions) | **Outside P1-B6** for presentation apply — remain open/not approved; do not smuggle production/privacy/security decisions into B6 |
| M07 Adjustments wording (P1-GAP-025 owner clarification) | **No new decision required** if accepted P1-B3 Adjustments honesty wording is preserved exactly (recommended default) |
| PPA / payment / M08 | **Outside P1-B6** — prohibited |
| Historical register supersession (P1-B3) | **Relevant but already closed** — do not rewrite historical MD bodies |
| Aurora integration/adoption | **Outside P1-B6** — parked; integration unauthorised |
| Next available sequential ID if a genuine new choice arises | **OWN-P1-018** (highest allocated OWN-P1-* is 017) — **do not create** unless a genuine unresolved choice appears |

### Special rule — P1-GAP-025 / M07 Adjustments wording

- Owner clarification is required **if** M07 Adjustments UI wording would change.
- **Recommended default:** preserve the accepted P1-B3 Adjustments honesty wording exactly and limit B6 to layout/presentation (tokens, spacing, density, shared chrome, focus, responsive).
- Under that default, **no new owner decision is needed** and no `OWN-P1-018` is proposed.
- If a future implementer believes a wording change is genuinely required, they must stop and present exact before/after wording with options for owner decision — **do not modify or approve wording in this briefing**.

**Verdict:** No owner-choice blocker currently prevents *consideration* of presentation-only P1-B6. Express named-batch authorisation remains a separate owner act.

---

## 4. Binding presentation-only boundary

### P1-B6 may change (if later authorised)

- Application of accepted Decision A tokens
- Accepted shared shell/chrome primitives
- Page-header consistency
- Typography hierarchy
- Spacing and density (within Decision A compact operational targets)
- Card/panel presentation
- Status-badge consistency (colour-independent status retained)
- Table/list presentation
- Form presentation
- Drawer/detail-panel presentation
- Responsive layout
- Loading/empty/error/denied **visual** consistency
- Focus visibility
- Accessible labels and descriptions
- Reduced-motion compatibility
- Removal of duplicated presentation chrome
- Honest labelling of **existing** demo/local behaviour (without inventing new capabilities)

### P1-B6 must not change

- Domain services, repositories/adapters, data models, persistence
- Permissions, state machines, workflow transitions
- Calculations, audit/event generation, export payloads
- Business validation, seed meaning
- Existing accepted controls or outcomes
- PPA, payment, M08, patient/clinical data
- Dependencies or lockfile; SQL/schema/migrations; environment/secrets; CI/CD
- Aurora code, tokens, or selective reapplication

### Exit condition

Domain behaviour must remain **equivalent** to the accepted module baseline (see §7). Unexplained domain-output differences **block publication**.

---

## 5. Module-by-module presentation review

### 5.1 M04 — Staff and Doctor Management (`/staff-doctors`) — P1-GAP-022

**Accepted domain (preserve):** Wave 2 workforce/person model; SoT `pulse.m04.workforce.*`; service-layer permissions (view/create/edit/assign_clinic/manage_engagement, credential.verify, leave.approve, restriction sensitive paths, onboarding/offboarding, suspend/reinstate/export) with clinic scope; linking rules; audit behaviour. **Not production-approved.**

**Presentation areas for Decision A alignment:** landing/overview; staff and doctor directories; profiles; tabs; qualifications/credentials; employment/engagement status; filters/search; drawers/forms; loading/empty/error/denied; mobile layouts.

**Must not:** introduce patient or clinical records; alter person model, permissions, or audit semantics.

### 5.2 M05 — Roster and Shift Management (`/roster`) — P1-GAP-023

**Accepted domain (preserve):** Wave 4 rostering rules, conflicts, cost information presentation semantics, permissions, publish/review behaviour; M04 remains eligibility owner (`authority: "m04-platform"`); WF-12 remains `BLOCKED-M10` (informational). Fatigue/conflict rules are **not** legal/award/clinical certification. **Not production-approved.**

**Presentation areas:** roster grid/planner; shift cards; coverage warnings; filters; conflict presentation; publish/review chrome; drawers/forms; mobile actions; loading/empty/error/denied.

**Must not:** expand domain scope. Where drag-and-drop exists, retain any existing accessible non-drag alternative; do not remove it for visual polish.

### 5.3 M06 — Time and Attendance (`/time-attendance`) — P1-GAP-024

**Accepted domain (preserve):** Wave 5 time calculations, exception logic, approvals, audit; M06 publishes `TimesheetRef` / `timesheet.approved`; must not write `pulse.m07.*` except via authorised M07 intake contracts; `BLOCKED-M10` remains informational. **Not production-approved.**

**Presentation areas:** clocking/status; timesheets; exceptions; approvals; attendance summaries; filters; drawers/forms; mobile; loading/empty/error/denied.

**Must not:** change calculation or downstream contract behaviour.

### 5.4 M07 — Staff Pay Preparation (`/staffpay`) — P1-GAP-025

**Accepted domain (preserve exactly):**

- Ordinary payroll-preparation behaviour through accepted Batch 6 (export preparation, package reconciliation, period lock, controlled unlock)
- Accepted **P1-B3 Adjustments honesty wording** (preparation/foundation only)
- History planned/non-operational status
- Unlock/reopen ≠ PPA
- No payment; no PPA product; no M08
- `OWN-P1-011` remains open

**Presentation areas:** overview; pay-run preparation; exceptions; Adjustments chrome (layout only); History planned-state presentation; export/report chrome; tables; drawers/forms; loading/empty/error/denied.

**Must not:** change calculation or export payload behaviour; reopen OWN-P1-011; claim production/payment readiness.

### 5.5 M11 — Training and Learning (`/training`) — P1-GAP-026

**Accepted domain (preserve):**

- Wave 3 behaviour (11 functional sections; clinic-scoped permissions; contributes training status to M04 readiness)
- P1-B3 11-section register sync (`records → assignments`, `expiry → certificates`)
- `strong-existing` without production overclaim
- Existing progress/certification/data behaviour

**Presentation areas:** TrainingWorkspace 11-section navigation; legacy aliases; course/training presentation; assignments; certificates; expiry/compliance; tables; drawers/forms; loading/empty/error/denied.

**Must not:** invent new sections, reverse register sync, or claim production readiness from `strong-existing`.

---

## 6. Density and typography (Decision A targets)

Source: [`../design-system-contract.json`](../design-system-contract.json). Do **not** introduce Aurora-only tokens or deferred Aurora dimensions.

| Token / target | Decision A value |
| --- | --- |
| Fonts | IBM Plex Sans / Source Sans 3 / Segoe UI; mono IBM Plex Mono |
| Page / display | 28px / 600 |
| Title | 20px / 600 |
| Subtitle / section | 16px / 600 |
| Body / supporting | 14px / 400 (strong 14/600) |
| Label | 12px / 600 |
| Caption / minimum readable metadata | 11px / 500 — do not go smaller |
| KPI value | 24px / 650 |
| Density intent | high — compact operational workbench |
| Spacing rhythm | 0,4,8,12,16,20,24,32,40 px |
| Table row height | 36px (compact 32px) |
| Control height | 32px (large 36px); mobile primary ≈ 44×44 where required by accepted P1-B4 baselines |
| Card padding | 12px |
| Section gap | 16px |
| Appearance | Light / Dark / System only |

**Rules:** Do not make dense operational tables unnecessarily spacious. Do not reduce text or target sizes below accepted accessibility baselines (P1-B4). Preserve colour-independent status presentation.

---

## 7. Domain-equivalence gate (mandatory)

Before/after P1-B6 implementation (if later authorised), for **each** of M04–M07/M11 inventory:

- Routes; sections/tabs; visible controls
- Permissions; state transitions
- Storage writes; events/audit entries
- Export outputs; calculated values
- Test fixtures; network/API activity (distinguish Next asset requests from durable domain calls)

Produce machine-readable:

`docs/audits/p1/b6-accepted-modules-presentation/domain-equivalence.json`

Required fields:

| Field | Requirement |
| --- | --- |
| `baselineSha` | Per-module accepted baseline SHA where pinned; else freeze evidence reference |
| `implementationSha` | P1-B6 tip under review |
| `expectedPresentationOnlyChanges` | Explicit allow-list |
| `domainTestsBefore` / `domainTestsAfter` | Suite counts + failing IDs |
| `changedBehaviour` | Empty array required for pass, or explained presentation-only diffs |
| `decision` | `pass` \| `fail` |

**Fail rule:** any unexplained domain-output difference blocks publication.

**P1-GAP-081:** cannot close merely because tests pass; evidence must demonstrate frozen-wave behaviour preservation via the equivalence report + control inventory.

Also produce:

`docs/audits/p1/b6-accepted-modules-presentation/control-inventory.json`

---

## 8. Proposed evidence (future implementation — not created by this briefing)

| Path | Purpose |
| --- | --- |
| `docs/audits/p1/P1_B6_IMPLEMENTATION_EVIDENCE.md` | Narrative evidence + qualifications |
| `docs/audits/p1/b6-accepted-modules-presentation/` | Pack root |
| `…/shots/` | Screenshots |
| `…/domain-equivalence.json` | Equivalence gate |
| `…/control-inventory.json` | Control inventory |

**Widths:** 1440, 1280, 1024, 768, 430, 390  
**Appearances:** Light; Dark; System+OS Light; System+OS Dark (System captures are not dual-OS evidence)

**Per module — representative states (objective assertions may prove matrix cells without redundant screenshots):**

- Ready; Loading; Empty; Error; Access denied (or honestly unsupported)
- Primary directory/table/planner view; Detail/drawer/form
- Keyboard/focus interaction; Mobile presentation
- Module-specific critical/exception state
- Honest unavailable/planned state where applicable (esp. M07 History; M07 Email/SMS if present)

Balance coverage with screenshot count — prefer exact-state discriminators + geometry/overflow/theme assertions over combinatorial explosion.

---

## 9. Required future testing (if later authorised)

Recommend `npm run test:p1-b6` covering:

- Presentation contract; shared-component reuse
- Module route and section preservation
- Control inventory preservation
- Permission / state-transition / storage / event / audit preservation
- Calculation/output preservation
- M07 PPA/payment exclusions
- M11 section and alias preservation
- Patient/clinical firewall
- Aurora non-integration
- P1-B7/P1-B8 remaining unauthorised

Plus existing accepted wave/module suites and:

- Register validator; `tsc --noEmit`; full lint; full test suite
- `test:p1-b1` … `test:p1-b6`
- Production browser harness; production build
- Diff hygiene; BOM/EOL inspection
- GitHub workflow/check/status counts (expect local-only if zero)

**Restore** any test-mutated evidence JSON to HEAD before committing.

---

## 10. Aurora relationship

- Aurora foundation is owner-approved as a design foundation but **parked**.
- Aurora **integration** and module adoption remain **unauthorised**.
- Decision A remains the binding P1 visual contract.
- P1-B6 must **not** copy or selectively reapply Aurora.
- A future Aurora integration must begin from the then-current accepted P1 tip under **separate** authorisation.
- Visual similarity does **not** prove Aurora integration.

---

## 11. Risks and recommendation

### Blocking risks

- Frozen-wave behaviour regression (permissions, calculations, exports, audit events)
- M07 PPA/payment leakage or Adjustments wording drift
- M11 navigation/alias / register-sync regression
- Patient/clinical leakage
- Unexplained domain-equivalence failures (GAP-081)

### Advisory risks

- Excessive density reduction or accessibility regression
- Responsive table/planner failure
- Whole-file EOL churn / broad formatter changes
- Test-mutated evidence committed by mistake
- Aurora leakage via copied tokens
- No GitHub CI (local-only validation)

### Recommended implementation sequence (do not implement now)

1. M04 presentation apply + equivalence  
2. M11 presentation apply + register/alias preservation  
3. M05 presentation apply + accessible non-drag retention  
4. M06 presentation apply + TimesheetRef boundary checks  
5. M07 presentation apply + P1-B3 honesty preservation + PPA/payment exclusions  
6. Cross-module density/typography pass (GAP-050)  
7. Full equivalence pack + harness evidence (GAP-081 gate)

### Recommended commit structure (do not implement now)

Prefer **multiple module-specific commits** followed by **one evidence/control commit**, all under a single expressly authorised P1-B6 batch:

- Improves reviewability and rollback per module freeze  
- Keeps domain-equivalence diffs attributable  
- Still one authorised batch (OWN-P1-002 / express auth) — not automatic B7

A single monolithic commit is acceptable only if the owner prefers atomicity over bisectability; module-scoped commits are the default recommendation.

---

## 12. Included gaps (status unchanged by this briefing)

| Gap | Batch | Status after this briefing |
| --- | --- | --- |
| P1-GAP-022 | P1-B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-023 | P1-B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-024 | P1-B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-025 | P1-B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed**; Adjustments wording preserved by default |
| P1-GAP-026 | P1-B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-050 | P1-B5/B6 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-081 | all / B6 gate | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed**; equivalence evidence required to close later |

---

## 13. Control preservation

Preserve: P1-B1–P1-B5 accepted/closed with qualifications; P1-B6–P1-B8 unauthorised; **83** gaps; **8** batches; **24** modules; M25 unimplemented; `OWN-P1-009` / `OWN-P1-011` / `OWN-P1-016` open; Aurora parked; no overall Programme P1 acceptance; no PR/merge/deploy from this briefing.

---

## 14. Final briefing claim

P1-B6 accepted-module presentation authorisation briefing prepared and published — P1-B6 remains unauthorised, frozen domain behaviour remains protected, Aurora remains unintegrated, and no implementation, merge or deployment was performed.
