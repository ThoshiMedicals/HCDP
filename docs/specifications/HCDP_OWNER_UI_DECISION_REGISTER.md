# HCDP Owner UI Decision Register

**Document ID:** `HCDP_OWNER_UI_DECISION_REGISTER`  
**Path:** `docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md`  
**Status:** Written for owner acceptance — **controlling UI authority only after owner acceptance**  
**Created:** 30 July 2026  
**Lane:** Documentation only (no production UI implementation in this run)  
**Branch:** `cursor/hcdp-owner-ui-decision-register`

---

## 1. Purpose and authority

This register is the **single written owner UI-decision authority** for completed HCDP production functionality.

After owner acceptance, agents and implementers must treat this document as the controlling UI requirements source for:

- visual and interaction presentation of **completed** production capability;
- shared design-token intent (Premium Clinical Enterprise);
- shell, navigation, responsive, accessibility, appearance, and truthful state handling;
- M07 / PPA-1 presentation within authorised foundation scope.

This run **creates the register only**. It does **not** authorise production CSS, token wiring, or UI code changes.

---

## 2. Scope and exclusions

### In scope (future authorised UI implementation lane, after owner acceptance of this register)

- UI and design-system presentation for **completed** production surfaces;
- Premium Clinical Enterprise visual direction applied to completed screens;
- truthful copy corrections where completed capability is mislabelled (including GAP-PAR-003);
- shell, sidebar/mobile nav, dashboard chrome, and completed-module presentation polish;
- M07 Overview wording correction if still stale;
- M07 Adjustments / PPA-1 **presentation** of already-implemented foundation UI (register / create / cancel draft / pins) — not new capability.

### Explicitly out of scope / not authorised by this register

| Exclusion | Reason |
|---|---|
| New business capability | UI-only lane |
| Alteration of payroll calculations, permissions, audit, storage, concurrency, or domain rules | Domain freeze |
| Prototype fake data | Truthfulness |
| Fake or decorative actions | Wave / parity rules |
| PPA-2 and later phases | Owner decision §6 |
| Adjustment lines / deltas | PPA-2+ |
| PPA code-list pickers | Future PPA only |
| Calculation, approval, reconciliation, export/download UI for PPA | Out of PPA-1 |
| Provider returns; payment; net pay; bank files; STP; superannuation; Xero production | Wave-control / M07 boundaries |
| Module 8 / doctor pay implementation | Wave-control |
| Wave 1A Auth or Postgres work | Separate programme |
| Combining / cherry-picking / merging PPA branches in this run | Owner instruction |

---

## 3. Source precedence

After owner acceptance of this register, precedence is:

1. **Wave-control** and **explicit owner-authorised scope** (including this instruction set once accepted).  
2. **`docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md`** (this document).  
3. **Written module plans** for completed, in-scope functionality (e.g. Wave 6 M07 plans; PPA implementation plan §N for PPA-1 UI journeys).  
4. **Screen / action matrices** (e.g. `WAVE6_M07_SCREEN_ACTION_MATRIX.md`).  
5. **Prototype HTML** (`public/pulse-html-prototype.html` / v34 root HTML; `/prototype` → `/prototype-reference`) as **visual and interaction reference only**.  
6. **Audits and gap registers** as **evidence only** — not implementation authority.

### Prototype boundary

The prototype **cannot override**:

- wave-control;
- completed production capability;
- module boundaries;
- accepted Batch 1–6 behaviour;
- PPA-1 scope restrictions.

Placeholders, mounts, legacy HTML fallbacks, and buttons without service-backed mutation are **never** treated as implemented capability.

---

## 4. Current production baseline and branch lineage

Recorded from repository inspection on 30 July 2026 (no merge performed).

| Ref | SHA | Notes |
|---|---|---|
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | Authorised common baseline (PPA plan docs); **does not** include PPA-1 runtime |
| `cursor/m07-ppa1-integration` | `739e42a39c51558311d030bcd96017c9056159fb` | PPA-1 integration candidate; **3 ahead / 0 behind** `origin/main` |
| `cursor/m07-ppa1-security-concurrency-remediation` | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | Security/concurrency remediation; **1 ahead** of integration tip (`739e42a`) |
| This docs branch | from `origin/main` | Register-only; does **not** combine code lineages |

### Ancestry (exact)

```text
origin/main (0afe878)
  └── +3 commits → integration (739e42a)
        └── +1 commit → security-concurrency remediation (c8c9995)
```

Integration commits (main → tip):

1. `995ee86` — PPA-1 core domain/service  
2. `2ad5f4d` — isolated PPA-1 Adjustments UI  
3. `739e42a` — wire Adjustments into production shell  

Remediation commit:

4. `c8c9995` — fail-closed test hooks + one-open-PPA concurrency hardening  

Independent QA report (evidence only; not a code base): `cursor/m07-ppa1-independent-qa` @ `4be4c04…` containing `docs/audits/WAVE6_M07_PPA1_INDEPENDENT_QA.md`.

### Recommended future UI implementation base (not created in this run)

**Recommend:** start the future UI implementation lane from  
`cursor/m07-ppa1-security-concurrency-remediation` @ `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`  
(so PPA-1 wiring + security/concurrency remediations are present), **after** owner acceptance of this register and explicit UI-batch authorisation.

Do **not** merge to `main` or rewrite accepted Batch 1–6 evidence as part of UI work without separate owner process.

### Obsolete baseline finding

**GAP-PAR-001** from the 30 July 2026 parity gap register (audited against `0afe878`, Adjustments = Planned stub) is **obsolete as a current-state finding** for the authorised PPA-1 candidate lineage. On `739e42a` / `c8c9995`, Adjustments is **available** and mounts `ConnectedAdjustmentsSection`. Remaining acceptance depends on QA qualifications and owner acceptance — not on reopening GAP-PAR-001 as “missing stub.”

---

## 5. Approved visual direction — Premium Clinical Enterprise

**Owner decision:** Premium Clinical Enterprise is **approved** for completed production screens, subject to the boundaries in §2.

### Intent

- Professional clinical-enterprise appearance;
- Calm, premium, and operationally trustworthy;
- Information-dense without visual clutter;
- Warm off-white light canvas based around **`#FBFBFA`**;
- Champagne accent based around **`#C5A880`**;
- Accessible dark-mode equivalents;
- Restrained accent use;
- Clear semantic colours for success, warning, critical, and informational states;
- Strong status hierarchy;
- Consistent typography, spacing, cards, tables, filters, tabs, drawers, and forms;
- Persistent clinic, legal-entity, and user-role context;
- Minimal clicks for frequent operational workflows;
- Mobile layouts that preserve **task completion**, not mere desktop shrink.

### This run

**Do not** convert these colours into production CSS here. Define **token intent**, contrast requirements, and usage rules for the later implementation lane (§6).

---

## 6. Shared design tokens (intent only — not wired)

Future shared tokens must live in a **shared design-system layer**, not per-module CSS forks.

| Token intent | Light guidance | Dark guidance | Usage rules |
|---|---|---|---|
| `canvas` | `#FBFBFA` warm off-white | Deep slate/near-black with sufficient contrast | Page background; not status colour |
| `ink` / primary text | Deep slate; WCAG AA vs canvas | Light ink AA vs dark canvas | Body and headings |
| `muted` | Soft slate | Soft light slate | Secondary copy only |
| `accent.champagne` | `#C5A880` | Lightened champagne meeting AA on dark surfaces | Executive emphasis, selected chrome **only**; **never** sole status cue |
| `accent.positive` | Deep emerald | Accessible emerald | Success / available — paired with text/icon |
| `status.success` | Green family | Accessible green | Semantic success |
| `status.warning` | Amber family | Accessible amber | Semantic warning |
| `status.critical` | Red family | Accessible red | Semantic error/denied |
| `status.info` | Blue family | Accessible blue | Informational |
| `status.neutral` | Neutral grey | Neutral grey | Idle / planned / unknown |
| `card` / `card.line` | Subtle border + restrained shadow | Subtle border | Cards/panels for interactive containers |
| `focus` | Visible 2px ring (ink or accent) | Visible ring on dark | `:focus-visible` required |
| Type | Existing approved minimalist sans (prototype uses Inter; do not introduce decorative display fonts for ops) | Same | Shell + operational UI |
| Density | Spacious executive landings; compact ops; dense tables for roster/attendance/payroll/staff/inbox | Same | Do not starve mobile of actions |

**Contrast:** All text/status combinations used as the only status signal must also expose text, icon, or `role="status"|"alert"` — colour alone is forbidden.

---

## 7. Shell and navigation requirements

| ID | Decision |
|---|---|
| UI-SHELL-01 | Application shell exposes persistent clinic / legal-entity / act-as role context where the platform already provides it. |
| UI-SHELL-02 | Sidebar uses consolidated portal IA from module register (not raw prototype family sprawl). |
| UI-SHELL-03 | Intentional consolidations remain: Tasks & Actions; Approvals → Action Inbox; HR Docs → Staff; Inventory & Assets mega-module; Departments not daily primary nav; Award rules relocated to M07 Settings (not M04). |
| UI-SHELL-04 | Mobile navigation must complete primary tasks (open module, switch section, submit primary action) without requiring desktop-only hover. |
| UI-SHELL-05 | `/prototype` redirects to `/prototype-reference`; prototype is labelled development/QA reference, not default module experience. |
| UI-SHELL-06 | Legacy alias redirects preserved (`/approvals`, `/tasks`, `/checklists`, `/hr-docs`, `/inventory`, etc.). |

---

## 8. Dashboard requirements

| ID | Decision |
|---|---|
| UI-DASH-01 | `/dashboard` (M01 Command Centre) remains a real workspace — not ModuleLanding. |
| UI-DASH-02 | Premium Clinical polish may restyle chrome; must not invent new executive metrics without service backing. |
| UI-DASH-03 | Decorative or toast-only chrome verbs (parity GAP-PAR-008 class) must be removed or wired — never left as fake success. |

---

## 9. Completed-module requirements

Applies to modules with real React workspaces on the authorised lineage (M01–M07 foundation/batches as applicable, M11 Training, etc.):

| ID | Decision |
|---|---|
| UI-MOD-01 | Completed modules receive Premium Clinical presentation **without** changing domain behaviour. |
| UI-MOD-02 | Frozen Waves 1A–5 accepted behaviour must not be altered without documented defect/CR + owner review. |
| UI-MOD-03 | Accepted M07 Batches 1–6 ordinary prep behaviour must not be altered without documented defect/CR + owner review. |
| UI-MOD-04 | Planned / rebuild-pending modules remain honest “not available / rebuild pending” presentations — no fake CRUD. |
| UI-MOD-05 | Cross-module links may exist; deep workflow must not claim capability the target module lacks. |

---

## 10. M07 / PPA-1 presentation requirements

### Ordinary prep (Batches 1–6 — closed within scope)

| ID | Decision |
|---|---|
| UI-M07-01 | Non-certified disclaimer remains visible on M07 surfaces. |
| UI-M07-02 | Export ≠ paid; no bank/STP/super/Xero production claims in copy or controls. |
| UI-M07-03 | Unlock/reopen must never be labelled or presented as prior-period adjustment. |
| UI-M07-04 | History / Reports remains **planned** until a named history UI batch — do not fake history depth. |
| UI-M07-05 | **GAP-PAR-003 (in scope for future UI lane):** Overview copy must not state that completed Batch 6 capabilities are unavailable. |

### GAP-PAR-003 — exact correction required (evidence)

Inspected on remediation tip `c8c9995` in  
`src/modules/m07-staff-pay/sections/OverviewSection.tsx`:

**Current (stale) copy:**

> Create and list ordinary pay periods for one legal entity. Batch 5 management approval is available on the Approval section. **Export, reconciliation and lock remain unavailable.**

**Required correction intent (future UI lane — do not apply in this run):**

Replace the final sentence so it truthfully reflects Batch 6 completed ordinary prep: Export, Reconciliation, and Lock are **available** on their respective sections as non-certified payroll-preparation controls; they are **not** payment execution. Do not claim PPA-2, payment, or certification.

Example target wording (implementation may refine tone, not meaning):

> Create and list ordinary pay periods for one legal entity. Management approval is available on the Approval section. Export preparation, package reconciliation, and period lock are available on their sections (non-certified; export is not payment). Prior-period adjustments, where authorised, are on the Adjustments section.

### PPA-1 foundation (authorised candidate lineage)

| ID | Decision |
|---|---|
| UI-PPA1-01 | Adjustments section is **available** on the PPA-1 candidate lineage (`739e42a` / `c8c9995`); GAP-PAR-001 stub finding is obsolete for that lineage. |
| UI-PPA1-02 | Present register, create (locked ordinary source + mandatory reason), draft cancel, immutable pins, unlock≠PPA banner, scope banner excluding calc/approval/export/payment. |
| UI-PPA1-03 | Every enabled control must invoke real `ppa-service` paths; no UI-local mock repository in production wiring. |
| UI-PPA1-04 | Empty / denied / loading / error states must be truthful; denied when lacking `payroll.adjust`. |
| UI-PPA1-05 | Do **not** add lines, deltas, code-list pickers, calculation, approval, recon, export, provider return, or payment under PPA-1 presentation work. |

---

## 11. Responsive requirements

Future UI verification must cover widths:

| Width | Class |
|---:|---|
| 1440 | Desktop wide |
| 1280 | Desktop |
| 1024 | Compact desktop / large tablet |
| 768 | Tablet |
| 430 | Large phone |
| 390 | Phone |

| ID | Decision |
|---|---|
| UI-RESP-01 | No horizontal overflow that clips primary navigation or primary actions (`overflowX` failure = defect). |
| UI-RESP-02 | M07 shell continues to use `overflow-x-hidden` / `min-w-0` patterns proven in Batch 1 a11y evidence. |
| UI-RESP-03 | Mobile layouts preserve task completion (create period, open adjustment, cancel draft, acknowledge errors). |

---

## 12. Accessibility requirements

| ID | Decision |
|---|---|
| UI-A11Y-01 | Visible `:focus-visible` on interactive controls. |
| UI-A11Y-02 | Form controls have associated labels (`htmlFor` / `aria-labelledby`). |
| UI-A11Y-03 | Status and errors use `role="status"` / `role="alert"` as appropriate — not colour alone. |
| UI-A11Y-04 | Honour `prefers-reduced-motion`. |
| UI-A11Y-05 | Keyboard-only path can reach primary actions in completed modules. |
| UI-A11Y-06 | Landmarks (nav/main) remain present in shell. |

---

## 13. Light, dark, and device appearance

| ID | Decision |
|---|---|
| UI-APPEAR-01 | Light / dark / system appearance continue via existing Command Centre / portal appearance selector patterns. |
| UI-APPEAR-02 | Premium Clinical tokens must define accessible dark equivalents before CSS wiring. |
| UI-APPEAR-03 | Appearance preference persistence must not reset module workspace state unexpectedly. |

---

## 14. Empty, loading, denied, and error states

| ID | Decision |
|---|---|
| UI-STATE-01 | Empty: explicit empty copy + next action when permitted. |
| UI-STATE-02 | Loading: distinguishable from empty. |
| UI-STATE-03 | Denied: permission/scope message; controls disabled or omitted with reason. |
| UI-STATE-04 | Error: fail-closed; no success toast on failure. |
| UI-STATE-05 | Filtered-empty distinct from global empty where filters exist. |

---

## 15. No-fake-functionality rules

| ID | Decision |
|---|---|
| UI-FAKE-01 | No button without a real service-backed mutation or navigation. |
| UI-FAKE-02 | No static demonstration cards counted as completed capability. |
| UI-FAKE-03 | No prototype seed data in production paths. |
| UI-FAKE-04 | No “Export to Xero / Mark paid / Process Final Pay” controls on M07. |
| UI-FAKE-05 | Sidebar/route presence alone ≠ implemented. |

---

## 16. Prototype features explicitly excluded

| Prototype cue | Disposition |
|---|---|
| Process Final Pay / bank transfer execution | REJECTED for M07; M08 not authorised here |
| Xero-only domain / Export to Xero as sole model | Deferred vendor adapter; generic export prep only |
| Ordinary unlock-as-correction | REJECTED; PPA is separate |
| TFN / BSB / bank / super member fields | Forbidden in M07 |
| Doctor pay inside Staff Pay | M08 boundary |
| Award certification claims | Non-certified labels only |
| Separate Approvals / HR Docs / split Inventory nav as required daily IA | Superseded by consolidations |
| Interactive Doctor Pay / BBPIP / Inventory OCR depth | Future authorised module batches only |

---

## 17–18. Route-by-route traceability and requirement IDs

| ID | Requirement source | Approved UI decision | Production route/component | Current status | Future authorised change | Exclusions | Verification method |
|---|---|---|---|---|---|---|---|
| UI-SHELL-01 | Owner direction; platform shell | Persistent clinic/LE/role context | App shell / portal chrome | Partial–present | Tokenised Premium Clinical chrome | No Auth rewrite | Browser + a11y probe |
| UI-SHELL-02 | Module register; parity audit | Consolidated sidebar IA | Sidebar nav | Implemented | Visual polish only | No re-split consolidations | Route crawl + screenshot |
| UI-SHELL-03 | Owner consolidations | Tasks/Approvals/HR/Inventory/Departments/Award relocation | Multiple aliases | Implemented (routing) | None for IA | Depth batches separate | Alias redirect tests |
| UI-SHELL-04 | Owner mobile direction | Task-complete mobile nav | Mobile shell | Partial | Improve without capability invent | — | 430/390 keyboard paths |
| UI-SHELL-05 | Prototype pages | Prototype reference labelled | `/prototype`, `/prototype-reference` | Implemented | Keep out of daily nav | Not production UX | HTTP + banner assert |
| UI-DASH-01 | M01 workspace | Real dashboard workspace | `/dashboard` | Implemented | Premium Clinical polish | No fake metrics | Live mount |
| UI-DASH-03 | GAP-PAR-008 class | No decorative success verbs | M01 chrome | Partial | Remove or wire | — | Control→service audit |
| UI-M01-01 | Completed module | M01 presentation upgrade allowed | Command Centre components | Partial polish | UI-only | Frozen behaviour | Visual + regression |
| UI-M02-01 | Completed module | Action Inbox presentation | `/action-inbox` | Implemented | UI-only polish | Approvals stay consolidated | Visual + regression |
| UI-M03-01 | Completed module | Organisation/settings presentation | `/settings` | Implemented | UI-only | Departments not daily nav | Visual |
| UI-M04-01 | Wave 2 frozen | Staff & Doctors presentation | `/staff-doctors` | Implemented | Polish only with CR if behaviour touched | No SoT edits | Focused regression |
| UI-M05-01 | Wave 4 frozen | Roster presentation | `/roster` | Implemented | UI-only polish | No roster domain change | Regression |
| UI-M06-01 | Wave 5 frozen | Time & Attendance presentation | `/time-attendance` | Implemented | UI-only polish | No M06→m07 writes | Regression |
| UI-M07-01 | Wave 6 plans | Non-certified disclaimer | `StaffPayWorkspace` | Implemented | Keep | Certification claims | Source + UI assert |
| UI-M07-04 | Screen matrix; gap | History planned | `/staffpay?section=history` | Planned stub | Future history batch only | Fake history | Meta `planned` |
| UI-M07-05 | GAP-PAR-003; Overview.tsx | Truthful Overview Batch 6 copy | `OverviewSection.tsx` | **Defect (stale copy) on tip** | Exact correction in §10 | No domain change | String + browser |
| UI-PPA1-01 | Owner §5; integration tip | Adjustments available on PPA-1 lineage | `/staffpay?section=adjustments` · `ConnectedAdjustmentsSection` | Implemented on candidate | Presentation polish only | GAP-PAR-001 obsolete | Shell + integration tests |
| UI-PPA1-02 | PPA plan §N | Register/create/cancel/pins/banners | Adjustments section components | Implemented on candidate | Visual tokens only | Lines/deltas/pickers | UI/integration suites |
| UI-PPA1-05 | Owner §6 | No PPA-2 capability in UI | Adjustments | Enforced by scope | None until PPA-2 auth | Calc/approve/export/pay | UI control inventory |
| UI-PLAN-01 | Module landing pattern | Honest rebuild-pending | `/doctorpay`, `/bbpip`, `/inventory-assets`, … | Landing-only | Future module batches | Fake CRUD | Landing assert |
| UI-APPEAR-01 | Waves 4–5 pattern | Light/dark/system | Appearance selector | Implemented | Token mapping | — | Appearance screenshots |
| UI-RESP-01 | Wave 6 §22; Batch 1 evidence | Six widths no overflow | Shell + modules | Partial evidenced | Re-verify after CSS | — | 1440…390 matrix |
| UI-A11Y-01…06 | Wave 6 §22; M07 shell tests | Focus, labels, roles, reduced motion | Shell + completed modules | Partial | Complete gaps UI-only | — | Keyboard + a11y probes |
| UI-STATE-01…05 | Wave 6 §22; PPA plan §N | Truthful empty/load/deny/error | Completed modules + PPA-1 | Partial–strong on M07 PPA-1 | Polish | Fake success | State matrix |
| UI-FAKE-01…05 | Parity register methodology | No fake functionality | All routes | Ongoing rule | Enforce in UI lane | — | Control audit |
| UI-TOK-01 | Owner Premium Clinical | Token intent `#FBFBFA` / `#C5A880` + semantics | Design system (future) | **Not wired** | Wire in UI lane only | No domain change | Token review + contrast |

---

## 19. Unresolved decisions

| ID | Question | Default until owner decides |
|---|---|---|
| U-01 | Exact production font stack (keep current sans vs explicitly standardise on Inter) | Keep existing approved minimalist sans; do not introduce decorative display fonts for ops |
| U-02 | Whether Champagne accent appears in M07 operational dense tables or only executive chrome | Restrained: executive/chrome emphasis; ops tables prefer semantic status + ink |
| U-03 | Timing of merge of PPA-1 remediation (`c8c9995`) to `main` relative to UI lane | UI lane should base on `c8c9995` recommendation; merge to main is a separate owner gate |
| U-04 | Whether Overview copy correction (UI-M07-05) ships in the first UI batch or a tiny copy-only CR first | Prefer include in first authorised UI batch with Premium Clinical M07 surfaces |
| U-05 | Live browser validation still blocked by webpack `node:crypto` on non-Turbopack — must UI acceptance require Turbopack evidence or platform fix first? | Document as qualification; do not fix webpack inside UI-only lane unless separately authorised |

No other blocking unresolved UI-authority conflicts remain for **register authorship**. Implementation remains blocked until owner accepts this register **and** authorises a named UI implementation batch.

---

## 20. Owner-acceptance checkpoint

Owner acceptance of this register means:

1. This file becomes precedence item **#2** (after wave-control / explicit scope).  
2. Premium Clinical Enterprise is approved for completed production screens under §2–§6 boundaries.  
3. GAP-PAR-001 is obsolete for PPA-1 candidate current-state.  
4. GAP-PAR-003 remains in scope for the future UI lane with the exact Overview correction in §10.  
5. PPA-2 / lines / pickers / payment / M08 / Auth / Postgres remain unauthorised.  
6. A future UI implementation batch may proceed only after **separate explicit authorisation**, preferably based on `c8c9995`, without merging in this documentation run.

**Not claimed by creating this file:** production approval; merge authorisation; CSS shipping; PPA-1 owner acceptance; certification.

---

## Inspected sources (this authorship)

- `.cursor/rules/hcdp-wave-control.mdc`  
- `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` (+ JSON companion)  
- `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md` (§8A, §20–22)  
- `docs/architecture/WAVE6_M07_SCREEN_ACTION_MATRIX.md`  
- `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` (§N)  
- `public/pulse-html-prototype.html` / `/prototype` / `/prototype-reference`  
- `Development folder/docs/audits/HCDP_PROTOTYPE_VS_DASHBOARD_PARITY_AUDIT_20260730.md`  
- `Development folder/docs/audits/HCDP_PROTOTYPE_VS_DASHBOARD_GAP_REGISTER_20260730.md` (evidence only)  
- `src/modules/m07-staff-pay/sections/OverviewSection.tsx` @ `c8c9995` (GAP-PAR-003 evidence)  
- `src/modules/m07-staff-pay/section-meta.ts` / Adjustments wiring on PPA-1 tips  
- Git ancestry for `origin/main`, `739e42a`, `c8c9995`

---

## Stop checkpoint (documentation lane)

- Register created: **this file only**  
- No production code, tests, CSS, tokens, wave-control, plans, or accepted evidence modified in this lane  
- No branch merge / cherry-pick of PPA code into this docs branch  
- Next step: owner acceptance → separate UI implementation authorisation
