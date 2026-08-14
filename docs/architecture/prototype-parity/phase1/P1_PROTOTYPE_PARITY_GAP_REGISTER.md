# P1 Prototype-Parity Gap Register

**Stamp:** **P1-B1**, **P1-B2**, **P1-B3** and **P1-B4** owner accepted with qualifications and **closed**. Accepted tips: P1-B1 `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; P1-B2 `66f3f8d27803f5b8d24043639d21b9069f58e77a`; P1-B3 `2515a4ffac0fb94cbd37092e26bf372cb43898f8`; P1-B4 `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`). **P1-B5–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED` unless noted. Overall Programme P1 is **not** complete.
**Scheme:** `P1-GAP-###` (append-only; never reuse)  
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`  
**Accepted P1-B1 tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`

## Field legend

| Field | Meaning |
| --- | --- |
| Classification | Blocker \| Major \| Moderate \| Minor \| Accepted difference \| Future scope \| Not applicable \| Duplicate or prohibited clinical scope |
| Priority | P0-gate \| P1-rec \| P2+ \| Later \| Exclude |
| Implementation status | Default `P1 — PLANNED, NOT AUTHORISED`; P1-B1-associated rows may record qualified owner acceptance / partial treatment |
| Batch | Proposed or accepted batch id (B2–B8 not authorised) |
| Owner clarification | Yes / No |

## Audit dimensions applied (all modules / SHARED)

1. Screens / routes  
2. Tabs / sections  
3. Data states  
4. Actions / controls  
5. Forms / fields  
6. Filters / search  
7. Drill-downs / detail panels  
8. Roles / permissions  
9. Alerts / notifications  
10. Empty / loading / error / denied  
11. Audit trail  
12. Reports / export / print  
13. Responsive behaviour  
14. Light / Dark / System appearance  
15. Accessibility / keyboard  
16. Demo / reset controls  
17. Business rules  
18. Prototype-only features  
19. Material dashboard differences  
20. Duplicate / obsolete / patient-clinical content  

---

## A. Programme / SHARED blockers and majors

### P1-GAP-001 — Programme P1 not authorised (`OWN-NO-P1-YET`)
| Field | Value |
| --- | --- |
| Module / screen | SHARED / programme gate |
| Source | `OWN-NO-P1-YET`; `FIRST_RUN_STOP_CHECKPOINT.md`; `prompts/p1.md` |
| Current | P1 authorised = No |
| Required | Owner accepts corrected P0 pack and names first batch |
| Roles | Owner |
| Impact | Blocks all Programme P1 implementation |
| Classification | **Blocker** |
| Priority | P0-gate |
| Dependency | P0 owner acceptance |
| Risk | Starting P1 without acceptance invalidates programme control |
| Acceptance evidence | Written owner acceptance record + named batch auth |
| Batch | Entry gate (pre-batch) |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | **Yes** |

### P1-GAP-002 — Decision A SHARED shell conversion incomplete
| Field | Value |
| --- | --- |
| Module / screen | SHARED — `/dashboard`, `/action-inbox`, global chrome |
| Source | `prompts/p1.md` imgctrl-* requirements; `FINAL_DESIGN_SYSTEM_CONTRACT.md`; Decision A PNGs |
| Current | Tokenised `--dp-*` shell + Decision A chrome regions delivered on accepted tip `fdb2beb…`; full module presentation parity remains later batches |
| Required | Tokenised shell matching design-system-contract + Decision A regions |
| Roles | All authenticated |
| Impact | Visual/interaction parity baseline for all modules |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-GAP-001 |
| Risk | Module work before shell locks churn |
| Acceptance evidence | Theme/shell tests + screenshot harness vs Decision A + Work-Step for shell controls |
| Batch | P1-B1 |
| Implementation status | **P1-B1 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` |
| Owner clarification | No (scope already in prompts/p1.md) |

### P1-GAP-003 — Shared KPI strip / toolbar / detail-panel primitives
| Field | Value |
| --- | --- |
| Module / screen | SHARED primitives (referenced by M01+ chrome) |
| Source | imgctrl-*-kpi-strip / primary-toolbar / detail-panel |
| Current | Shared `KpiStrip`, `PrimaryToolbar`, `DetailPanel` primitives + unit contracts on accepted tip |
| Required | Shared primitives reusable across modules |
| Roles | All |
| Impact | Multi-module chrome inconsistency |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-GAP-002 |
| Risk | Per-module reinvention |
| Acceptance evidence | Component tests + visual regions |
| Batch | P1-B1 |
| Implementation status | **P1-B1 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` |
| Owner clarification | No |

### P1-GAP-004 — Shell dimension contract (240/72 sidebar, 48 topbar)
| Field | Value |
| --- | --- |
| Module / screen | SHARED shell |
| Source | `FINAL_DESIGN_SYSTEM_CONTRACT.md`; `prompts/p1.md` §9 |
| Current | B1 dimension evidence asserted (visible geometry; mobile off-screen when closed) on accepted tip; broader responsive/a11y matrix remains P1-B4 |
| Required | Asserted dimensions at 1280 / 768 / 390 |
| Roles | All |
| Impact | Layout parity |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-GAP-002 |
| Risk | Responsive regressions |
| Acceptance evidence | Shell dimension tests |
| Batch | P1-B1 / P1-B4 |
| Implementation status | **P1-B1 — PARTIAL / OWNER-ACCEPTED FOR B1 SCOPE (2026-08-13)**; residual responsive/a11y evidence remains `P1 — PLANNED, NOT AUTHORISED` (P1-B4) |
| Owner clarification | No |

### P1-GAP-005 — Inactive Topbar Export / MFA / New Entry truthfulness
| Field | Value |
| --- | --- |
| Module / screen | SHARED Topbar |
| Source | `Topbar.tsx` toast stubs; GLOBAL fail condition “toast-only success” |
| Current | Controls present; toast-only / hidden below 2xl; not backend-backed |
| Required | Either remove/relabel as non-operational OR implement with real persistence/audit (latter likely P2+) |
| Roles | Manager / executive |
| Impact | Users may believe export/MFA/new-entry work |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | Owner decision on stub disposition |
| Risk | False operational confidence |
| Acceptance evidence | UI copy/visibility tests; no toast-as-success |
| Batch | P1-B2 |
| Implementation status | **P1-B2 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (Topbar Export/MFA keyboard-explainable unavailable; New Entry local-demo drawer preserved; see `docs/audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md`) |
| Owner clarification | **Yes** — hide vs truthful non-op vs defer backend |

### P1-GAP-006 — Clinic multi-select limited to Command Centre
| Field | Value |
| --- | --- |
| Module / screen | SHARED Topbar clinic scope |
| Source | Topbar `onClinicChange` toast for `"multiple"`; CC ControlBar multi-clinic |
| Current | Topbar multi-select inactive (toast redirect) |
| Required | Consistent clinic-scope UX across shell (or documented Accepted difference) |
| Roles | Executive / manager multi-clinic |
| Impact | Scope confusion across modules |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | Owner decision |
| Risk | Wrong clinic data views |
| Acceptance evidence | Role/clinic scenarios |
| Batch | P1-B2 |
| Implementation status | **P1-B2 — OWNER ACCEPTED AS ACCEPTED DIFFERENCE — CLOSED (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (Command Centre-only multi-clinic; shell-wide multi-select not authorised; OWN-P1-005) |
| Owner clarification | **Yes** |

### P1-GAP-007 — Dashboard non-operational shell cards
| Field | Value |
| --- | --- |
| Module / screen | M01 / `DashboardShellControls.tsx` |
| Source | UI Batch1 owner visual report; truthful non-operational labels |
| Current | Auth/emergency/start intervention labelled non-operational |
| Required | Keep truthful labels in P1; domain enablement is P2+ |
| Roles | Executive |
| Impact | Low if labels stay honest; high if re-enabled as fake |
| Classification | **Moderate** |
| Priority | P1-rec (label preservation) / P2+ (domain) |
| Dependency | P1-GAP-002 |
| Risk | Fake success if “activated” without backend |
| Acceptance evidence | Copy/visibility checks |
| Batch | P1-B2 / P2 |
| Implementation status | **P1-B2 — OWNER ACCEPTED FOR HONESTY/NON-OPERATIONAL LABELS — CLOSED (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a`; domain enablement remains P2+ / `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-008 — Appearance System hydrate settle
| Field | Value |
| --- | --- |
| Module / screen | SHARED appearance |
| Source | UI Batch1 colour report QUALIFIED; `theme-init-script.ts`; `pulse.cc.appearance` |
| Current | Light/Dark/System persisted; System+OS-dark may flash/settle |
| Required | Contract-compliant System default with no false theme flash in acceptance evidence |
| Roles | All |
| Impact | Visual QA noise |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-GAP-002 |
| Risk | Flaky screenshot diffs |
| Acceptance evidence | Theme tests + screenshot harness |
| Batch | P1-B4 |
| Implementation status | **Closed (2026-08-14)** — P1 System appearance/hydration scope at `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); no production or cross-browser certification |
| Owner clarification | No |

### P1-GAP-009 — Keyboard / focus baselines for shell chrome
| Field | Value |
| --- | --- |
| Module / screen | SHARED nav/tabs/toolbar/drawer |
| Source | Design contract a11y; `prompts/p1.md` §9 |
| Current | Partial (Drawer Escape/focus restore; section tabs roles); full roving tabindex / contract baselines not evidenced |
| Required | Focus-ring + keyboard navigation tests for chrome |
| Roles | All (keyboard users) |
| Impact | Accessibility parity |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-GAP-002 |
| Risk | a11y regressions across modules |
| Acceptance evidence | Named a11y tests + Work-Step |
| Batch | P1-B4 |
| Implementation status | **Closed (2026-08-14)** — P1 shared-shell keyboard/focus scope at `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); not full AT certification |
| Owner clarification | No |

### P1-GAP-010 — Screenshot harness vs Decision A viewports
| Field | Value |
| --- | --- |
| Module / screen | SHARED visual QA |
| Source | Design contract viewports/regions/tolerances; `prompts/p1.md` §10 |
| Current | P1-B1 harness smoke started and owner-accepted for shell foundation; Decision A pixel-difference and Programme P1 exit **not** closed |
| Required | Harness smoke against contract viewports/regions |
| Roles | QA / owner inspection |
| Impact | Cannot claim Decision A parity |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-GAP-002 |
| Risk | Subjective visual acceptance |
| Acceptance evidence | Screenshot diffs + SHA evidence |
| Batch | P1-B1 / P1-B8 |
| Implementation status | **P1-B1 — HARNESS START OWNER-ACCEPTED (2026-08-13); NOT CLOSED** — pixel-diff / Programme P1 exit remain for later controlled batch (P1-B8); residual status `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

---

## B. Register / honesty hygiene

### P1-GAP-011 — M11 register condition/sections stale vs TrainingWorkspace
| Field | Value |
| --- | --- |
| Module / screen | M11 `/training` |
| Source | `module-register.ts` (`legacy-html-fallback`, 3 sections) vs `TrainingWorkspace.tsx` (full interactive) |
| Current | Full workspace implemented; register badge/sections misleading |
| Required | Register reflects actual sections/condition without claiming production |
| Roles | All training users + auditors of readiness |
| Impact | False “rebuild pending” / incomplete section map |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | None (docs/register sync) |
| Risk | Wrong planning scores |
| Acceptance evidence | Register validator + manual nav check |
| Batch | P1-B3 |
| Implementation status | **Closed (2026-08-13)** — accepted P1-B3 M11 register synchronisation to verified TrainingWorkspace NAV; `strong-existing`; **not** production-approved; no new M11 domain functionality |

### P1-GAP-012 — M07 History planned honesty / non-operational labelling
| Field | Value |
| --- | --- |
| Module / screen | M07 `/staffpay` → history |
| Source | `section-meta.ts` `batch1: "planned"`; Batch 6 qualifications; re-audit FUNCTIONALLY-COMPLETE |
| Current | History section navigable but planned/disabled actions |
| Required | Honest UI + register wording; operational history is Future/P2+ unless owner expands |
| Roles | Payroll prep users |
| Impact | Over-claim risk |
| Classification | **Moderate** |
| Priority | P1-rec (honesty) / Later (build) |
| Dependency | Owner scope |
| Risk | Treating planned as done |
| Acceptance evidence | UI label + register text |
| Batch | P1-B3 |
| Implementation status | **Partial (2026-08-13)** — accepted P1-B3 History planned/non-operational honesty (keyboard-reachable explanation; activation blocked). **Residual:** operational History / reporting implementation remains Future/P2+ outside P1-B3 |

### P1-GAP-013 — Historic prototype parity register supersession
| Field | Value |
| --- | --- |
| Module / screen | Docs hygiene |
| Source | `HCDP_PROTOTYPE_PARITY_REGISTER.md` vs `CURRENT_IMPLEMENTATION_REAUDIT.*` |
| Current | Contradictory stub claims for e.g. M07 |
| Required | Mark historic register superseded or add pointer to re-audit |
| Roles | Planners |
| Impact | Planning errors |
| Classification | **Minor** |
| Priority | P1-rec |
| Dependency | None |
| Risk | Low if re-audit preferred |
| Acceptance evidence | Doc cross-link |
| Batch | P1-B3 |
| Implementation status | **Closed (2026-08-13)** — accepted supersession banner / planning pointer. **Residual:** historic body content preserved (not rewritten); Wave re-audit packs remain preferred SoT for current readiness |

### P1-GAP-014 — SHARED unresolved workflow section mappings
| Field | Value |
| --- | --- |
| Module / screen | Cross-register |
| Source | `ACCOUNTING_SUMMARY.json` sectionMappingTotals.unresolved=298 |
| Current | Many actions `UNRESOLVED — SOURCE DOES NOT IDENTIFY SECTION` |
| Required | Resolve or explicitly accept unresolved for non-P1 waves |
| Roles | Implementers / QA |
| Impact | Weak Work-Step targeting |
| Classification | **Moderate** |
| Priority | P2+ (bulk); P1 only for SHARED dossiers |
| Dependency | Source quality |
| Risk | Wrong screen wiring |
| Acceptance evidence | Mapping counts for in-scope IDs |
| Batch | P1-B3 (SHARED subset) / P2+ |
| Implementation status | **Partial (2026-08-13)** — P1-B3 SHARED honesty/register subset accepted (documented; targeted M11 remaps only). **Residual:** bulk unresolved≈298 workflow-mapping remains deferred to P2+ |

### P1-GAP-015 — Placeholder / legacy-html ModuleLanding honesty
| Field | Value |
| --- | --- |
| Module / screen | M08–M10, M12–M24 ModuleLanding |
| Source | Re-audit placeholderShell; ModuleLanding code |
| Current | Routes/nav/section chips exist; domain not built |
| Required | Keep Future scope; honesty in badges |
| Roles | All |
| Impact | False readiness |
| Classification | **Major** (control risk) / Future scope (build) |
| Priority | P1-rec (honesty) / Later (build) |
| Dependency | None |
| Risk | Scope creep into rebuilds |
| Acceptance evidence | Landing-only confirmation tests |
| Batch | P1-B3 |
| Implementation status | **Partial (2026-08-13)** — accepted ModuleLanding / placeholder honesty (not scored as interactive rebuild complete). **Residual:** real domain implementation for placeholder modules remains Future / not authorised by P1-B3 |

### P1-GAP-016 — M01 durable domain services absent
| Field | Value |
| --- | --- |
| Module / screen | M01 `/dashboard` |
| Source | Re-audit servicePaths NONE; targetWave P2 |
| Current | Workspace UI; no durable services/repos/tests |
| Required | Domain services + persistence + audit (Programme P2) |
| Roles | Executive |
| Impact | Demo/seed cannot be production truth |
| Classification | **Major** |
| Priority | P2+ |
| Dependency | SHARED shell P1; producer modules |
| Risk | Fake KPIs as truth |
| Acceptance evidence | Service/permission/isolation/audit tests |
| Batch | Beyond P1 (P2-M01) |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-017 — M02 durable domain services / workflows absent
| Field | Value |
| --- | --- |
| Module / screen | M02 `/action-inbox` |
| Source | Re-audit; p1 workflow dossiers wave=P2 NONE |
| Current | UI workspace; SLA/delegation/triage workflows not implemented as durable services |
| Required | Workflow completion in P2 |
| Roles | Operational |
| Impact | Actions not durable |
| Classification | **Major** |
| Priority | P2+ |
| Dependency | Producer modules; SHARED shell |
| Risk | Lost approvals |
| Acceptance evidence | Work-Step QA per workflow ID |
| Batch | Beyond P1 (P2-M02) |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-018 — M03 demo controls without durable services/audit
| Field | Value |
| --- | --- |
| Module / screen | M03 `/settings` OrganisationWorkspace |
| Source | prod-ctrl-m03-* dossiers; service NONE wave P2 |
| Current | Interactive UI handlers (act-as, demo clock, reset, resolve…) without durable service/audit claims |
| Required | Persistence + audit for mutating controls in P2; P1 may only ensure truthful labelling |
| Roles | Manager |
| Impact | Demo mistaken for production IAM |
| Classification | **Major** |
| Priority | P1-rec (labels) / P2+ (services) |
| Dependency | Owner |
| Risk | Security misunderstanding |
| Acceptance evidence | Label tests (P1); service/audit tests (P2) |
| Batch | P1-B2 / P2-M03 |
| Implementation status | **P1-B2 — PARTIAL / OWNER-ACCEPTED FOR LABELLING + IDENTITY (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a`; durable IAM/services remain P2+ / `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | **Yes** — which M03 controls must be disabled vs demo-labelled in P1 |

### P1-GAP-019 — M01/M02 cross-module projections incomplete
| Field | Value |
| --- | --- |
| Module / screen | M01/M02 integration |
| Source | Re-audit crossModuleIntegrations |
| Current | IN-DEVELOPMENT until producers exist |
| Required | Contract projections from producer modules |
| Roles | Executive / operational |
| Impact | Incomplete command centre / inbox |
| Classification | **Moderate** |
| Priority | P2+ |
| Dependency | M04–M07/M11+ producers |
| Risk | Empty or stale cards |
| Acceptance evidence | Integration tests |
| Batch | Beyond P1 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-020 — M01 Decision A chrome apply (presentation)
| Field | Value |
| --- | --- |
| Module / screen | M01 sections command-centre / my-day / kpi / reports |
| Source | Decision A PNGs; UI Batch1 de-crowding PASS but not Decision A complete |
| Current | Remodeled dashboard; final PNG conversion pending |
| Required | Presentation parity after SHARED primitives |
| Roles | Executive |
| Impact | Visual parity |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-B1 |
| Risk | Layout churn |
| Acceptance evidence | Visual QA regions |
| Batch | P1-B5 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-021 — M02 Decision A chrome apply (presentation)
| Field | Value |
| --- | --- |
| Module / screen | M02 sections |
| Source | Decision A / imgctrl references in p1.md |
| Current | Functional UI; final design conversion pending |
| Required | Presentation parity |
| Roles | Operational |
| Impact | Visual/interaction consistency |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-B1 |
| Risk | Layout churn |
| Acceptance evidence | Visual QA |
| Batch | P1-B5 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

---

## D. Accepted domain modules (M04–M07, M11) — preserve behaviour

### P1-GAP-022 — Apply shared final design to M04 without domain change
| Field | Value |
| --- | --- |
| Module / screen | M04 `/staff-doctors` |
| Source | Re-audit missingCapabilityGaps; Wave2 frozen |
| Current | Domain FUNCTIONALLY-COMPLETE; final-design conversion pending |
| Required | Presentation-only apply of SHARED tokens/shell; preserve SoT |
| Roles | HR / roster consumers |
| Impact | Visual inconsistency vs Decision A |
| Classification | **Moderate** |
| Priority | P1-rec (after shell) |
| Dependency | P1-B1; Wave2 freeze rules |
| Risk | Accidental domain regression |
| Acceptance evidence | Focused regression + visual QA |
| Batch | P1-B6 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-023 — Apply shared final design to M05 without domain change
Same pattern as P1-GAP-022 for M05 `/roster` (Wave4). Classification **Moderate**. Batch P1-B6. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-024 — Apply shared final design to M06 without domain change
Same pattern for M06 `/time-attendance` (Wave5). Classification **Moderate**. Batch P1-B6. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-025 — Apply shared final design to M07 without domain / PPA / payment change
Same pattern for M07 `/staffpay` (Batch6). Must not touch PPA/payment. Classification **Moderate**. Batch P1-B6. Status `P1 — PLANNED, NOT AUTHORISED`. Owner clarification: **Yes** if any Adjustments UI wording changes.

### P1-GAP-026 — Apply shared final design to M11 without domain change
Same pattern for M11 `/training` (Wave3). Prefer after P1-GAP-011 register sync. Classification **Moderate**. Batch P1-B6. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-027 — Empty/loading/error/denied completeness on accepted modules
| Field | Value |
| --- | --- |
| Module / screen | M04–M07/M11 |
| Source | GLOBAL axes; M05/M06/M11 UxStateDemo patterns; M04 weaker shared UX-state demo |
| Current | Partial coverage; not uniform |
| Required | Consistent state coverage for in-scope sections |
| Roles | All module roles |
| Impact | Unhandled edge UX |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-B1 |
| Risk | Silent failures |
| Acceptance evidence | State matrix tests |
| Batch | P1-B7 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-028 — Permission-denied and clinic-isolation UI completeness
| Field | Value |
| --- | --- |
| Module / screen | SHARED + accepted modules |
| Source | Firewall; prompts permissions sections; wave evidence |
| Current | Classification gating exists; denied-state UI incomplete in places |
| Required | Real denied/empty states for unauthorised roles |
| Roles | Cross-role |
| Impact | Security UX |
| Classification | **Major** |
| Priority | P1-rec |
| Dependency | P1-B1 |
| Risk | Information disclosure / confusion |
| Acceptance evidence | Role/permission scenarios |
| Batch | P1-B7 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-029 — Audit trail visibility gaps on mutating UI
| Field | Value |
| --- | --- |
| Module / screen | Accepted modules with mutations |
| Source | GLOBAL fail conditions; wave audit evidence |
| Current | Domain audit exists in accepted waves; UI surfacing uneven |
| Required | Where P1 touches chrome only — do not invent audit; where states touched — show truthful audit/denied |
| Roles | Auditor / manager |
| Impact | Assurance |
| Classification | **Moderate** |
| Priority | P1-rec (honesty) / P2+ (new mutations) |
| Dependency | No new domain writes in P1 |
| Risk | Fake audit UI |
| Acceptance evidence | No toast-as-audit; existing audit regression |
| Batch | P1-B7 |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-030 — Reports/export/print honesty on accepted modules
| Field | Value |
| --- | --- |
| Module / screen | Module report sections + Topbar export |
| Source | Toast-only portal export; module report sections vary |
| Current | Some local demo exports; portal export stub |
| Required | Truthful capability labels; no fake paid/exported claims |
| Roles | Manager / finance |
| Impact | False completion |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-GAP-005 |
| Risk | Compliance misunderstanding |
| Acceptance evidence | Control labelling tests |
| Batch | P1-B2 / P1-B7 |
| Implementation status | **P1-B2 — PARTIAL / OWNER-ACCEPTED FOR HONESTY (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a`; real reporting/export-processing remains later (P1-B7 / P2+) / residual `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No |

### P1-GAP-031 — Responsive behaviour residual (tablet/mobile)
| Field | Value |
| --- | --- |
| Module / screen | SHARED + modules |
| Source | Design breakpoints; UI Batch1 matrices expensive/partial |
| Current | Partial (sidebar off-canvas, section nav compact select) |
| Required | Contract breakpoints evidenced for P1 surfaces |
| Roles | All |
| Impact | Mobile/tablet usability |
| Classification | **Moderate** |
| Priority | P1-rec |
| Dependency | P1-B1 |
| Risk | Overflow / clipped chrome |
| Acceptance evidence | Width matrix 390/768/1280 (+ contract list) |
| Batch | P1-B4 |
| Implementation status | **Partial (2026-08-14)** — tested P1 shell/shared-surface responsive scope closed at `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); **residual:** module-specific responsive work outside tested P1 surfaces |
| Owner clarification | No |

### P1-GAP-032 — Demo/reset control governance
| Field | Value |
| --- | --- |
| Module / screen | QaDemoMenu; M03 demo; UxStateDemo |
| Source | Prototype demo features; GLOBAL fake-seed fail |
| Current | Active demo tooling in UI |
| Required | Keep demo clearly non-production; do not migrate seed as truth |
| Roles | QA / owner |
| Impact | Seed mistaken for live data |
| Classification | **Minor** (if labelled) / **Major** (if not) |
| Priority | P1-rec |
| Dependency | Owner preference on demo visibility |
| Risk | Data misunderstanding |
| Acceptance evidence | Visible “demo/QA” labelling |
| Batch | P1-B2 |
| Implementation status | **P1-B2 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (explicit QA/demo mode gate; production enforcement forces off) |
| Owner clarification | **Yes** — retain vs gate behind flag |

---

## E. Future-scope module rebuilds (not Programme P1 build)

For each of M08, M09, M10, M12, M13, M14, M15, M16, M17, M18, M19, M20, M21, M22, M23, M24:

### P1-GAP-033 … P1-GAP-048 — ModuleLanding-only (full BRD/prototype capability pending)
| Field | Value |
| --- | --- |
| Modules | M08 `/doctorpay`, M09 `/bbpip`, M10 `/tasks-actions`, M12 `/compliance-quality`, M13 `/documents-policies`, M14 `/ticket-desk`, M15 `/inventory-assets`, M16 `/incidents-risk`, M17 `/communications`, M18 `/digital-ops`, M19 `/analytics`, M20 `/saas`, M21 `/vendor-console`, M22 `/recruitment`, M23 `/website-studio`, M24 `/financial-forecast` |
| Source | Re-audit placeholderShell; ModuleLanding; roadmap P3–P8 |
| Current | Landing / partial seed panels only — **not** implemented modules |
| Required | Full rebuild in later authorised waves |
| Classification | **Future scope** |
| Priority | Later |
| Batch | Not P1 implementation |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | No (unless owner wants M10 early — still not auto-authorised) |

Special notes:
- **M10** integration BLOCKED — connective layer pending P3 (`P1-GAP-039` within series).  
- **M12/M16** register `partially-implemented` but still ModuleLanding + PartialBody — do not claim complete.  
- **M08** purpose mentions Best Practice-derived pay — operational aggregate only; no BP patient records (`P1-GAP-060`).

---

## F. Minor / presentation inconsistencies

### P1-GAP-049 — Family accent vs global theme discipline
Source: `DEC-BRANDED-THEMES` closed — Light/Dark/System only. Current accents as nav cues allowed. Ensure P1 does not reintroduce Executive Blue / Medical Emerald globals. Classification **Accepted difference** (closed) + **Minor** watch item. Batch P1-B1. Status **P1-B1 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` (no banned globals on accepted tip).

### P1-GAP-050 — Density / typography residual vs contract
Source: design-system-contract typography/spacing. Classification **Minor**. Batch P1-B5/B6. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-051 — Detail panel width band 320–420
Source: design contract. Classification **Minor**. Batch P1-B1. Status **P1-B1 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` (default 360; band 320–420 evidenced).

### P1-GAP-052 — Prefers-reduced-motion coverage uneven
Source: design contract; M07 evidence exists. Classification **Minor**. Batch P1-B4. Status **Partial (2026-08-14)** — shared P1 reduced-motion hardening closed at `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); **residual:** broader platform-wide reduced-motion coverage / full WCAG motion certification not claimed.

### P1-GAP-053 — Print stylesheet / print parity incomplete
Source: BRD outputs / reports. Classification **Minor** / Future for full packs. Batch Later / P1-B7 honesty only. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-054 — Prototype-reference route vs production portal dual surface
Source: `/prototype` → `/prototype-reference`. Classification **Accepted difference** (reference retained). Status `P1 — PLANNED, NOT AUTHORISED`. Owner clarification: No.

### P1-GAP-055 — Screen count 143 vs 194 variance
Source: ACCOUNTING_SUMMARY explanation. Classification **Accepted difference** (143 was minimum baseline). Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-056 — Owner acceptance ≠ production readiness
Source: GLOBAL axes; all wave reports. Classification **Accepted difference**. Status `P1 — PLANNED, NOT AUTHORISED`.

---

## G. Exclusions / prohibited / N/A

### P1-GAP-057 — Patient records / appointments / clinical notes / prescriptions / referrals
Classification **Duplicate or prohibited clinical scope**. Priority Exclude. Sources: firewall; OWN-PATIENT-FIREWALL. Status `P1 — PLANNED, NOT AUTHORISED` (explicitly not to implement).

### P1-GAP-058 — Patient billing / Medicare claims
Classification **Duplicate or prohibited clinical scope**. Exclude.

### P1-GAP-059 — Best Practice patient-record duplication
Classification **Duplicate or prohibited clinical scope**. Exclude. (M08 “Best Practice-derived” wording is workforce/pay context only — do not expand.)

### P1-GAP-060 — Payment execution / bank file / STP / super / mark-as-paid / Xero production
Classification **Duplicate or prohibited clinical scope** / product boundary (`OWN-NO-PAY-EXEC`). Exclude.

### P1-GAP-061 — M07 PPA product implementation
Classification **Future scope** (separate auth) / not P1. Sources: OWN-PPA-SEPARATE; docs/plans PPA. Unlock≠PPA. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-062 — M25 print fleet
Classification **Not applicable** (parked branch; not in M01–M24 register). Exclude from P1.

### P1-GAP-063 — DB redesign / dependency upgrades / production secrets / live integrations
Classification **Not applicable** to P1 parity. Exclude unless unavoidable verified gap (none identified that require these).

### P1-GAP-064 — Production deployment / merge to main / PR
Classification **Not applicable**. Exclude unless owner expressly asks.

### P1-GAP-065 — Historical P0 evidence alteration
Classification **Not applicable** / prohibited. Exclude.

---

## H. Additional moderate gaps (forms/filters/drill-downs/alerts)

### P1-GAP-066 — Shared filter/search semantics inconsistent (Topbar nav search vs module filters)
Classification **Moderate**. Priority P1-rec. Batch P1-B2/B5. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-067 — Drill-down / detail panel patterns inconsistent across M01–M03 vs domain modules
Classification **Moderate**. Priority P1-rec. Batch P1-B1/B5. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-068 — Alert/notification chrome vs M02 domain notifications
Classification **Moderate**. Priority P2+ for domain; P1 for chrome honesty. Batch P1-B5 / P2. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-069 — Form field schema adoption incomplete outside accepted modules
Classification **Future scope** / P2+. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-070 — Business-rule engine parity for non-accepted modules
Classification **Future scope**. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-071 — Prototype-only features still visible as if live (seed titles, demo packs)
Classification **Moderate**. Priority P1-rec. Batch P1-B2. Status **P1-B2 — OWNER ACCEPTED FOR DEMO/SEED HONESTY (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a`; broader residual presentation/demo cleanup may remain later. Owner clarification **Yes** on seed copy cleanup vs retain for QA.

### P1-GAP-072 — Material dashboard difference: stacked strips removed (Batch1) vs prototype density
Classification **Accepted difference** (owner visual remediation). Preserve unless Decision A requires revisit. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-073 — Online toggle demo (`pulse.v31.online`)
Classification **Minor**. Priority P1-rec honesty. Batch P1-B2. Status **P1-B2 — OWNER ACCEPTED WITH QUALIFICATIONS — CLOSED (2026-08-13)** at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (Online gated + labelled browser demo simulation).

### P1-GAP-074 — Hydration observations (historical M04/M05/M07)
Classification **Minor** / Observation. Note: tooling debt from Batch1 partially superseded by tip `9142ec30` clean tsc. Re-verified during P1-B4. Status **Closed (2026-08-14)** — historical observation re-verified on tested routes at `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); **no M04/M05/M07 domain behaviour accepted or changed**.

### P1-GAP-075 — next-dev transient residual risk (Batch1 IV)
Classification **Minor** Observation for QA environment. Batch P1-B8 gates. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-076 — Performance evidence rewrite by tests
Classification **Moderate** (process). Tests rewrote wave3/4/5 evidence JSON during this planning run; restored via `git checkout --`. Acceptance process must restore or isolate. Batch P1-B8. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-077 — Atomic services NONE — NOT IMPLEMENTED count 510
Classification **Future scope** aggregate. Priority Later / P2+. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-078 — Production controls only 28 genuine in code
Classification **Accepted difference** relative to prototype button volume; remaining are Future/P2. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-079 — M07 Adjustments “PPA-1 foundation” wording risk
Classification **Major** (scope confusion). Must not be treated as authorised PPA. Batch P1-B3 honesty. Owner clarification **Yes**. Status **Partial (2026-08-13)** — accepted Adjustments/PPA honesty boundary (preparation/foundation only; unlock/reopen ≠ PPA). **Residual:** future PPA-product scope remains under **OWN-P1-011** (open).

### P1-GAP-080 — BLOCKED-M10 remains informational outside M07 totals
Classification **Future scope** (P3). Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-081 — Wave freeze alteration risk if P1 touches domain
Classification **Major** (risk control). P1 batches must prohibit domain behaviour changes on frozen waves. Batch all. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-082 — Self-approval prohibition for Visual/Work-Step QA
Classification **Accepted difference** / process control from GLOBAL design. Batch P1-B8. Status `P1 — PLANNED, NOT AUTHORISED`.

### P1-GAP-083 — Narrow Programme P1 vs broad readiness-scope contradiction
| Field | Value |
| --- | --- |
| Module / screen | Programme definition |
| Source | `prompts/p1.md` + roadmap (SHARED only) vs this readiness brief (all remaining gaps) |
| Current | Both artefacts exist |
| Required | Owner chooses: (A) P1 = SHARED only (recommended), or (B) P1 includes B1–B8 presentation/hygiene |
| Classification | **Blocker** for scope clarity (paired with P1-GAP-001) |
| Priority | P0-gate |
| Batch | Entry gate |
| Implementation status | `P1 — PLANNED, NOT AUTHORISED` |
| Owner clarification | **Yes** |

---

## Totals by classification

| Classification | Count |
| --- | ---: |
| Blocker | 2 |
| Major | 14 |
| Moderate | 22 |
| Minor | 10 |
| Accepted difference | 7 |
| Future scope | 20 |
| Not applicable | 3 |
| Duplicate or prohibited clinical scope | 5 |
| **Total** | **83** |

## Totals by recommended priority

| Priority | Count |
| --- | ---: |
| P0-gate | 2 |
| P1-rec | 35 |
| P2+ | 8 |
| Later | 20 |
| Exclude | 18 |

(Some rows carry dual notes; counts follow primary Priority field used in sequencing.)
