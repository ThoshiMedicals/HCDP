# P1-B5 Owner-Authorisation / Readiness Briefing — M01/M02 Decision A presentation parity

**Document type:** Owner-authorisation readiness briefing (implementation boundary + evidence matrix)
**Batch:** P1-B5 — M01/M02 Decision A presentation parity **without** durable domain services
**Status stamp (historical briefing):** prepared as `P1 — PLANNED, NOT AUTHORISED`
**Implementation stamp (post-authorisation):** Expressly authorised and implemented on `cursor/p1-b5-m01-m02-presentation`
**Acceptance stamp:** **Owner accepted with qualifications — CLOSED (2026-08-17)** (`P1-B5-OWNER-ACCEPT-2026-08-17`) at `4306116fdf28f9d90a989d8ec78b317ad351b0d2`
**Evidence:** [`../../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md`](../../../audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md)
**Publication branch:** `cursor/p1-b5-m01-m02-presentation`
**Accepted implementation tip:** `4306116fdf28f9d90a989d8ec78b317ad351b0d2`
**Accepted P1-B1 tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`
**Accepted P1-B2 tip:** `66f3f8d27803f5b8d24043639d21b9069f58e77a`
**Accepted P1-B3 tip:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`)
**Accepted P1-B4 tip:** `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`)
**Accepted P1-B5 tip:** `4306116fdf28f9d90a989d8ec78b317ad351b0d2` (`P1-B5-OWNER-ACCEPT-2026-08-17`)
**Briefing date:** 2026-08-14
**Acceptance date:** 2026-08-17

> **Historical note:** This briefing was prepared before coding. Express named-batch authorisation was subsequently granted; presentation work was implemented and remediated.
> **Current:** P1-B5 is **owner accepted with qualifications and closed** (`P1-B5-OWNER-ACCEPT-2026-08-17`). Gaps 020/021 closed for accepted presentation scope; 066/067/068 remain **partial** with residuals. M01/M02 domain remains **NOT-STARTED**.
> This briefing does **not** authorise durable M01/M02 services, close `OWN-P1-009`/`OWN-P1-011`/`OWN-P1-016`, open a PR, merge, deploy, integrate Aurora, or begin P1-B6.
> Aurora (`cursor/aurora-design-foundation`) remains **parked, isolated and unintegrated** — do not merge, cherry-pick, copy or adopt Aurora code.
> Decision A remains the binding P1 visual contract.

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
| Gap traceability | [`P1_GAP_TRACEABILITY.md`](./P1_GAP_TRACEABILITY.md) |
| Module parity matrix | [`P1_MODULE_PARITY_MATRIX.md`](./P1_MODULE_PARITY_MATRIX.md) |
| P1-B1–B4 acceptance | [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md) … [`P1_B4_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** unimplemented; **PPA** and **payment execution** out of scope; Best Practice (or equivalent) remains clinical system of record.

---

## 1. Executive summary

P1-B1 through P1-B4 are **owner accepted with qualifications and closed**. The next proposed batch is **P1-B5 — M01/M02 Decision A presentation parity**: apply already-accepted Decision A shared shell/chrome to Executive Command Centre (M01) and Action Inbox (M02) **without** durable domain services, workflow engines, patient/clinical data, or Aurora integration.

| Item | Status |
| --- | --- |
| P1-B5 | **Owner accepted with qualifications — CLOSED (2026-08-17)** (`P1-B5-OWNER-ACCEPT-2026-08-17`) |
| Included gaps | 020, 021, 066, 067, **chrome portion of** 068 |
| Gap disposition | 020/021 Closed (presentation scope); 066/067/068 Partial with residuals |
| New owner-decision blocker for B5 presentation | **None found** (verified) |
| Express named-batch authorisation | **Granted** historically; acceptance recorded 2026-08-17 |
| `OWN-P1-009` (M01/M02/M03 durable domain) | **Open / deferred to P2** — outside P1-B5 |
| `OWN-P1-011` / `OWN-P1-016` | Remain **open** |
| Aurora | Parked, isolated, unintegrated — adoption **unauthorised** |
| P1-B6 through P1-B8 | Remain `P1 — PLANNED, NOT AUTHORISED` |

**Hard dependency (sequencing):** P1-B5 depends on accepted P1-B1 shared primitives/tokens and benefits from B2 honesty + B3 register hygiene + B4 shell a11y/appearance evidence. Soft preference: B3 before B5 to avoid false readiness scoring during design apply.

---

## 2. Owner-decision analysis (verified)

### 2.1 Gap register owner-clarification fields

| Gap | Topic | Owner clarification (register) |
| --- | --- | --- |
| P1-GAP-020 | M01 Decision A chrome apply | **No** |
| P1-GAP-021 | M02 Decision A chrome apply | **No** |
| P1-GAP-066 | Shared filter/search semantics | **No** (short-form) |
| P1-GAP-067 | Drill-down / detail panel patterns | **No** (short-form) |
| P1-GAP-068 | Alert/notification chrome vs M02 domain notifications | **No** — P1 chrome honesty only; domain notifications **P2+** |

### 2.2 Decisions reviewed (classification)

| Decision / topic | Classification for P1-B5 |
| --- | --- |
| Decision A PNGs / visual authority (`DEC-FINAL-PNGS-MISSING` closed) | **Relevant but already closed** — binding visual SoT |
| Light / Dark / System only (`DEC-BRANDED-THEMES`) | **Relevant but already closed** |
| OWN-P1-002 SHARED-first then authorise B2–B8 | **Relevant but already closed** — still requires **express** B5 auth |
| OWN-P1-005 clinic multi-select (Command Centre only) | **Relevant but already closed** — preserve Accepted difference |
| OWN-P1-008 / OWN-P1-017 demo/QA gate + Act-as identity honesty | **Relevant but already closed** — preserve honesty labels |
| OWN-P1-004 inactive-control honesty | **Relevant but already closed** |
| OWN-P1-009 M01/M02/M03 **durable domain services** | **Outside P1-B5** / may remain deferred (P2) |
| OWN-P1-011 PPA product | **Outside P1-B5** — remains open |
| OWN-P1-016 localStorage vs SQL production path | **May remain deferred** — not a B5 presentation blocker |
| OWN-PATIENT-FIREWALL | **Relevant but already closed** — binding exclusion |
| Aurora foundation approval / integration | **Outside P1-B5** — integration unauthorised |
| Prototype HTML+BRD capability precedence vs Decision A visual hierarchy | **Relevant but already closed** (firewall) — do not invent new scores/workflows from prototype alone |
| Demo / seed labelling | **Relevant but already closed** via B2 — B5 must not regress honesty |

### 2.3 Does any open decision **block** P1-B5 authorisation?

**No.** No open `OWN-P1-*` decision is registered as a product-choice blocker for **presentation-only** M01/M02 Decision A chrome apply.

- Durable domain enablement is explicitly **OWN-P1-009 → Programme P2**, not B5.
- Persistence architecture (**OWN-P1-016**) and PPA (**OWN-P1-011**) remain open and **out of B5 product scope**.
- Next available sequential ID if a **new** choice is later required: **OWN-P1-018** (do **not** create without owner approval).

### 2.4 Conclusion

- **No new owner decision ID is required** for P1-B5 readiness as framed (presentation-only).
- **No unresolved owner-choice blocker** was found for gaps 020/021/066/067/068-chrome.
- **Express named-batch implementation authorisation is still required** before any P1-B5 coding.

---

## 3. Exact P1-B5 boundary

### 3.1 Definition

P1-B5 = **presentation-only** application of the already accepted Decision A shell/chrome and shared P1 primitives to **M01 Executive Command Centre** and **M02 Action Inbox**, preserving existing local/demo data behaviour and honesty labels, without claiming durable domain completion.

### 3.2 Potentially permitted (subject to evidence) — presentation

- Page hierarchy and shared shell integration (sidebar, topbar, regions)
- Shared `PageHeader`, cards/surfaces, status badges
- Existing typography and spacing tokens from Decision A / B1
- Responsive arrangement at required widths
- Accessible names, descriptions, visible focus; Escape / focus restoration where drawers/panels apply
- Honest loading, empty, error and denied presentation
- Action-oriented presentation using **existing** local/demo data
- Existing drawer/detail-panel presentation patterns
- Existing filters/controls **where already functional**
- Honest unavailable/planned treatment for non-operational controls (B2 honesty preserved)
- Removal of duplicated or contradictory chrome
- Existing data-source attribution and freshness labels
- Visual alignment with Decision A within accepted P1 design contracts

### 3.3 Explicitly not permitted (domain / durable / out of scope)

| Prohibited | Why |
| --- | --- |
| New executive scoring engines, analytics pipelines, durable KPI SoT | Domain / OWN-P1-009 / P2 |
| New inbox aggregation, approval orchestration, notification delivery, backend export | Domain / P2 |
| Claiming M01/M02 domain complete or production-ready | Matrix Domain **NS**; register UI condition ≠ domain acceptance |
| Patient lists, appointments, clinical notes, diagnoses, prescriptions, Medicare, patient invoicing | OWN-PATIENT-FIREWALL |
| Aurora merge/cherry-pick/reimplementation of Aurora tokens/primitives | Aurora unauthorised |
| Dependency/lockfile upgrades, SQL/migrations, CI/CD, env/secrets | Outside batch |
| PPA, payment, M08 doctor pay, M25 | Out of programme scope for B5 |
| Automatic progression to P1-B6–P1-B8 | OWN-P1-002 + control stamps |
| Closing gaps 020/021/066/067/068 by briefing alone | Acceptance only after authorised implementation + owner review |

### 3.4 Presentation vs domain (control line)

| Layer | Status |
| --- | --- |
| Current M01/M02 UI | Functionally rich **localStorage/demo** interactive rebuild (`complete-interactive-rebuild`) |
| Domain / integration (parity matrix) | Domain **NOT-STARTED**; Integration **ID** |
| If P1-B5 authorised | Chrome/presentation parity only; domain remains **NOT-STARTED** at exit |
| Durable workflows | `prompts/p2-m01.md` / `prompts/p2-m02.md` — **Programme P2**, not B5 |

Screenshots, mock data and visual presence are **not** proof of durable domain functionality.

---

## 4. M01 Executive Command Centre — current state and presentation target

### 4.1 Runtime identity

| Item | Value |
| --- | --- |
| Module id | `executive-command-centre` (M01) |
| Routes | `/dashboard` (also `/` → dashboard) |
| Register condition | `complete-interactive-rebuild` — **UI rebuild**, not production/domain acceptance |
| Key files | `src/modules/m01-command-centre/CommandCentreModule.tsx` → `DashboardWorkspace` → `command-centre/CommandCentre.tsx` |
| Data | `pulse.cc.*` / `pulse.cc.m1.*` localStorage; `@/lib/command-centre/mock-data` + period engine; optional live **projections** from M02 localStorage |
| Honesty | Demonstration seed banners; export/email/SMS labelled demo; “not live operational truth” |

### 4.2 Authoritative presentation target (Decision A)

Apply Decision A M01 visual hierarchy/density/shell chrome (`m01-command-centre-final.png` catalogue) using **accepted shared primitives**, while retaining truthful attribution of every metric and control.

### 4.3 Truthfulness checklist (review before/during implementation)

| Surface | Current observation | B5 expectation |
| --- | --- | --- |
| Executive status / attention strip | Demo priority strip + deltas vs “yesterday” | Keep; attribute source/period; no unexplained authoritative scores |
| Clinic context | Clinic/period filters; OWN-P1-005 multi-select = Command Centre only | Preserve Accepted difference |
| Metric titles, units, periods | Present via panels/KPI views | Require visible unit/period/source or honest unavailable |
| Calculation / source explanations | Partial; projections labelled | Strengthen attribution; no prototype KPI as live SoT |
| Owners / due / reasons / actions | Executive actions / tasks panels (demo) | Present where data exists; else planned/unavailable |
| Drill-downs | Local demo / projections | Existing source records only; mock drill-downs labelled |
| Loading / empty / error / denied | `CcStates` demonstration states + QA force | Preserve honesty; improve Decision A chrome consistency |
| Responsive / keyboard / appearance | Shared shell B1–B4; module density residual | Align to Decision A within B5 matrix |

### 4.4 Prototype / reference elements — disposition classes

| Class | Treatment under P1-B5 |
| --- | --- |
| Presentable with existing local/demo data | May restyle and organise under Decision A |
| Demo-labelled | Must remain demo-labelled |
| Planned / unavailable | Honest unavailable (B2 pattern) |
| Deferred to durable services | Do not fake; OWN-P1-009 / P2 |
| Deferred beyond P1 | Exclude from claims |
| Patient/clinical implication | Exclude or redirect to clinical SoR |

**No unexplained score or KPI may be presented as authoritative merely because it exists in the prototype.**

---

## 5. M02 Action Inbox — current state and presentation target

### 5.1 Runtime identity

| Item | Value |
| --- | --- |
| Module id | `action-inbox` (M02) |
| Routes | `/action-inbox`; legacy `/approvals` |
| Register condition | `complete-interactive-rebuild` |
| Key files | `ActionInboxModule.tsx` → `ActionInboxWorkspace` → `action-inbox/ActionInboxApp.tsx` |
| Data | `pulse.m2.inbox.*` localStorage; seed/reset; Act-as identity; QA demo gate |
| Honesty | Demonstration mode / seed banners; email/SMS simulated |

### 5.2 Authoritative presentation target (Decision A)

Apply Decision A M02 chrome (`m02-action-inbox-final.png` catalogue) with honest classification of every control.

### 5.3 Control classification (required for evidence)

| Classification | Meaning |
| --- | --- |
| Existing and operational | Local/demo behaviour that actually mutates inbox state |
| Existing local/demo behaviour | Works in browser only; must stay labelled |
| Presentation-only | Visual/layout change with no new capability |
| Planned/unavailable | Visible but non-operational; B2 honesty |
| Outside P1-B5 | Durable aggregation, notification delivery, backend export, P2 workflows |

### 5.4 Truthfulness checklist

| Surface | Current observation | B5 expectation |
| --- | --- | --- |
| Mine/team/approval/exception views | Present where seed/settings support | Only where genuinely supported |
| Search / filters / saved views | Present in UI | Evidence operational vs planned |
| List/detail / split-view | Present | Align chrome; preserve behaviour |
| Priority / clinic / module / owner / due / evidence / activity | Summary + list fields | Keep; attribute; no invented fields |
| Open-source / resolve / approve / reject | Local demo actions | Only where functional; else unavailable |
| Loading / empty / error / denied | Load states + empty copy; sensitivity restriction | Decision A chrome + honesty |
| Mobile stacked | Partial | Required widths matrix |
| Notifications chrome vs domain | GAP-068 | **Chrome honesty only** in B5; domain notifications remain P2+ |

Do **not** create new inbox aggregation, approval orchestration, notification delivery, backend exports or durable workflow services.

---

## 6. Patient and clinical boundary (binding)

1. MCOP/HCDP does **not** manage patient clinical records.
2. Patient arrival, booking, consultation, billing and clinical source-of-record functions remain in **Best Practice** (or the relevant clinical system).
3. P1-B5 must **not** introduce patient lists, appointments, clinical notes, diagnoses, prescriptions, Medicare billing or patient invoicing.
4. Any prototype content implying duplicated patient functionality must be **excluded** or **truthfully redirected** to the clinical source system.
5. Operational references may identify a clinic, task, exception or source record **without** importing patient clinical data.

---

## 7. Decision A versus Aurora (binding)

1. **Decision A** remains the binding P1 visual contract.
2. **Aurora** is owner-approved as an **isolated design foundation only**.
3. Aurora **integration and module adoption remain unauthorised**.
4. P1-B5 must **not** cherry-pick or reimplement Aurora tokens or primitives.
5. Similar visual characteristics already present in **accepted Decision A** components may continue.
6. Any future Aurora integration requires a **fresh branch** from the then-current accepted P1 tip and **separate compatibility authorisation**.

---

## 8. Proposed evidence matrix (future — if authorised)

| Artefact | Path |
| --- | --- |
| Implementation evidence | `docs/audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md` |
| Harness pack | `docs/audits/p1/b5-m01-m02-presentation/` |
| Screenshots | `docs/audits/p1/b5-m01-m02-presentation/shots/` |

### Required widths

1440 · 1280 · 1024 · 768 · 430 · 390

### Required appearances

Light · Dark · System+OS Light · System+OS Dark

### Required M01 states

- Normal/ready
- Loading
- Empty (where supported)
- Error
- Permission/access denied
- Attention item with owner, reason, due state and action
- Metric/source explanation
- Drill-down **or** honest unavailable treatment

### Required M02 states

- Normal/ready · Loading · Empty · Error · Access denied
- List/detail selection · Filters/search · Keyboard navigation
- Drawer/detail behaviour · Operational and unavailable controls
- Mobile stacked presentation

### Evidence must prove

- No horizontal overflow; no clipped actions; required regions present
- Wait-for-ready; no loading placeholder accepted as complete
- Correct accessible names/descriptions; visible focus; Escape + focus restoration
- Honest control outcomes; no patient/clinical content; no Aurora integration
- No unsupported domain claims
- Appearance preference and resolved theme separately recorded
- GitHub CI availability stated accurately (expect local-only unless CI exists)

Do **not** claim full WCAG compliance or pixel parity unless separately proven.

---

## 9. Test and validation plan (recommendation for future authorisation)

### 9.1 Focused `test:p1-b5` (recommended)

- Decision A shared-component use on M01/M02
- M01 / M02 presentation honesty
- Metric/source attribution; owner/reason/due/action fields
- Functional versus unavailable controls
- Loading/empty/error/denied states
- Responsive presentation; keyboard/focus; Light/Dark/System
- Patient/clinical exclusion; durable-service exclusion
- Aurora non-integration
- P1-B6–P1-B8 remain unauthorised (control assertions)

### 9.2 Full validation suite (recommended)

Register validator · `tsc --noEmit` · full lint · full test suite · `test:p1-b1`…`test:p1-b5` · production browser harness · production build · semantic diff hygiene · BOM/EOL inspection · GitHub workflow/check/status counts (expect 0 unless changed)

---

## 10. Risks and recommendation

### 10.1 Blocking risks (must be controlled if B5 is authorised)

| Risk | Control |
| --- | --- |
| Prototype controls that look functional but are not | Classify + unavailable honesty |
| Hard-coded / demo scores presented as live | Attribution + demo labelling |
| Misleading success toasts | B2 honesty; no fake backend success |
| Unattributed metrics | Require source/period/unit or unavailable |
| Mock drill-downs as live SoT | Label or remove claim |
| Patient/clinical duplication | Firewall exclusions in tests/evidence |
| Domain scope creep / durable services | OWN-P1-009 stays out; exit domain NOT-STARTED |
| Aurora leakage | Explicit non-integration checks |
| Claiming gap closure without owner acceptance | Gaps remain open until acceptance |

### 10.2 Advisory risks

| Risk | Note |
| --- | --- |
| M01/M02 state gaps vs Decision A density | GAP-072 accepted-difference tension |
| Responsive density at 390/430 | Use B4 shell lessons; module residual may remain |
| Accessibility regression | Reuse B4 focus/trap patterns; no full WCAG claim |
| Line-ending / formatter churn | Preserve parent CRLF; semantic diff |
| Test-mutated wave evidence JSON | Restore after tests |
| No GitHub CI | Local-only; state accurately |

### 10.3 Recommended implementation approach (**recommendation only**)

1. Owner expressly authorises named batch **P1-B5** on a clean tip of the authoritative P1 branch.
2. Apply Decision A chrome via **existing shared primitives** to M01 and M02 routes only.
3. Inventory every metric/control → operational / demo / unavailable / out-of-scope.
4. Strengthen attribution and honesty without new durable services.
5. Produce production-runtime evidence pack per §8; run §9 validations.
6. Stop for owner acceptance — **no automatic P1-B6**.

This is a **recommendation**, not authorisation.

---

## 11. Included gaps (disposition after `P1-B5-OWNER-ACCEPT-2026-08-17`)

| Gap | Batch | Status after acceptance |
| --- | --- | --- |
| P1-GAP-020 | P1-B5 | **Closed** for accepted M01 Decision A presentation scope; durable M01 remains P2+ / NOT-STARTED |
| P1-GAP-021 | P1-B5 | **Closed** for accepted M02 Decision A presentation scope; durable M02 remains P2+ / NOT-STARTED |
| P1-GAP-066 | P1-B2/B5 | **Partial** — M01/M02 filter/search presentation accepted; broader M03/module residual |
| P1-GAP-067 | P1-B1/B5 | **Partial** — M01/M02 drill-down/detail presentation accepted; broader cross-module/M03 residual |
| P1-GAP-068 (chrome) | P1-B5 / P2 | **Partial** — M01/M02 chrome honesty accepted; durable M02 notifications remain P2+ |

---

## 12. Control preservation

- P1-B1 / P1-B2 / P1-B3 / P1-B4 remain accepted/closed with qualifications
- **83** gaps / **8** batches / **24** runtime modules preserved
- M25 unimplemented
- `OWN-P1-011` open; `OWN-P1-016` open; `OWN-P1-009` deferred (durable domain P2)
- P1-B5 through P1-B8 **unauthorised**
- Aurora parked, isolated and unintegrated
- No application-code, test, script, PR, merge or deployment change from this briefing alone

---

## 13. Owner next act (not performed by this briefing)

To proceed, the owner must **expressly authorise** named batch **P1-B5** implementation on a stated tip/branch. Until then:

- No P1-B5 coding
- No gap closure
- No PR / merge / deploy
- No automatic progression to P1-B6
- No Aurora integration

**Current programme claim for this docs tip:**
`P1-B5 M01/M02 Decision A presentation authorisation briefing prepared and published — P1-B5 remains unauthorised, Aurora remains parked and unintegrated, and no implementation, merge or deployment was performed.`
