# P1 Proposed Execution Batches

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **P1-B2** implemented on `cursor/p1-b2-shell-truthfulness` — **owner acceptance pending** (not closed). **P1-B3–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`. Overall Programme P1 is **not** complete.  
**Rule:** No batch auto-starts. `OWN-NO-P1-YET` cleared and **P1-B1** named (OWN-P1-001…003, 2026-08-11). Owner must still **expressly authorise** each later batch before coding; B3–B8 never auto-start (OWN-P1-002). P1-B1 acceptance / P1-B2 implementation do **not** authorise automatic progression.

## Batch index

| Batch | Objective | Gap IDs (primary) | Status |
| --- | --- | --- | --- |
| P1-B1 | SHARED Decision A shell foundation | 002, 003, 004, 010, 049, 051 | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| P1-B2 | Shell truthfulness / inactive controls / demo honesty | 005, 006, 007, 018*, 030*, 032, 071, 073 | `P1 — IMPLEMENTED, OWNER ACCEPTANCE PENDING` |
| P1-B3 | Register / navigation hygiene | 011, 012, 013, 014*, 015, 079 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B4 | Responsive / a11y / appearance evidence | 008, 009, 031, 052, 074 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B5 | M01/M02 Decision A presentation (no domain services) | 020, 021, 066, 067, 068* | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B6 | Accepted-module final-design apply (preserve domain) | 022–026, 050, 081 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B7 | Permission / state / report honesty completeness | 027–030, 028, 053* | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B8 | P1 closure evidence + stop checkpoint | 010, 075, 076, 082 | `P1 — PLANNED, NOT AUTHORISED` |

\*Partial — honesty/labels only; durable domain remains P2+.

---

## P1-B1 — SHARED Decision A shell foundation

| Field | Value |
| --- | --- |
| Status | **Owner accepted with qualifications — CLOSED (2026-08-13)** |
| Accepted tip | `fdb2beb5b0e786e42d358efa9875b6bba52666cd` |
| Accepted scope | P1-B1 shared Decision A shell foundation only |
| Validation basis | Verified local tests, validators, build and visual harness |
| GitHub CI | None — not passed; local validation only |
| Objective | Establish tokenised Light/Dark/System shell + shared chrome primitives per design-system-contract and Decision A |
| Included gaps | 002, 003, 004, 010 (harness start), 049, 051 |
| Gap disposition | 002, 003, 049, 051 closed for B1; 004 partial (B4 residual); 010 partial / not closed (pixel-diff / P1 exit later) |
| Modules/screens | SHARED; reference surfaces `/dashboard`, `/action-inbox` |
| Dependencies | Owner clears P1-GAP-001 / 083; Decision A PNGs remain `66e6e64…` |
| Exact authorised changes (when named) | CSS variables/tokens; Sidebar/Topbar/ModuleSectionNav/PageHeader/Drawer primitives; shell dimensions; screenshot harness smoke |
| Prohibited | Domain services; M08–M24 rebuilds; PPA; payment; patient/clinical; theme Executive Blue/Medical Emerald; PR/merge |
| Expected files/areas | `src/components/shell/*`, `src/components/ui/*`, theme CSS, design-contract consumers, new shell tests |
| Required tests | Theme token; shell dimensions 1280/768/390; harness smoke |
| Browser widths / appearance | Contract viewports; Light, Dark, System |
| Role scenarios | Authenticated user sees chrome; role gating unchanged |
| Acceptance evidence | `docs/audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md` (+ harness artefacts) |
| Rollback | Revert batch branch tip to pre-batch SHA |
| Entry gate | P0 accepted; batch named; tip clean; validators green |
| Exit gate | Named tests green; owner decision recorded with qualifications (2026-08-13) |
| Owner decision point | Accept B1 tip before B2 — **met with qualifications; B2 remains unauthorised** |
| Qualifications | No GitHub CI; pixel-diff deferred; Sarah/Neil → B2; `OWN-P1-016` open; no PR/merge/deploy; no automatic progression; not overall P1/production acceptance |

## P1-B2 — Shell truthfulness

| Field | Value |
| --- | --- |
| Status | `P1 — IMPLEMENTED, OWNER ACCEPTANCE PENDING` |
| Objective | Remove or truthfully label inactive/stub shell controls and demo surfaces |
| Included gaps | 005, 006, 007, 018 (labels), 030 (honesty), 032, 071, 073 (+ identity via OWN-P1-017) |
| Owner decisions (disposition) | **OWN-P1-004, OWN-P1-005, OWN-P1-008, OWN-P1-017 closed 2026-08-13** — gaps not owner-closed |
| Dependencies | P1-B1 closed; honesty dispositions recorded; express B2 authorisation **met by named implementation prompt** |
| Authorised changes (when named) | Copy, visibility, disablement, demo badges / QA gate, identity-chrome alignment — **no fake backends** |
| Prohibited | Implementing payment/export backends as silent scope; enabling emergency/auth as toast-success; MFA/IdP; SQL; PR/merge/deploy |
| Tests | Control labelling; no toast-as-success assertions; demo gate; identity chrome consistency |
| Entry gate | P1-B1 accepted; OWN-P1-004/005/008/017 closed; validators green; **express owner authorisation of P1-B2** — met |
| Exit gate | Named honesty tests green; **owner accepts B2 tip** (pending); gaps dispositioned by evidence (not by decision alone) |
| Implementation evidence | [`../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md) |
| Remaining blocker before close | **Owner acceptance of implementation tip** |

## P1-B3 — Register / navigation hygiene

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Align registers/badges with reality; prevent false “implemented” scoring |
| Included gaps | 011, 012, 013, 014 (SHARED subset), 015, 079 |
| Authorised changes | `module-register.ts` metadata; doc pointers; M07 history/PPA-foundation labelling honesty |
| Prohibited | Domain behaviour changes; historical evidence rewrite; M11 domain edits beyond register sync |
| Tests | Register validator; nav section list assertions for M11 |
| Owner decision | Confirm M11/M07 register sync authorised |

## P1-B4 — Responsive / a11y / appearance evidence

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Harden shell a11y/keyboard/responsive/System appearance evidence |
| Included gaps | 008, 009, 031, 052, 074 |
| Widths | 390, 430, 768, 1024, 1280, 1440 (+ contract list) |
| Appearance | Light / Dark / System |
| Prohibited | Visual redesign unrelated to contract; dependency upgrades |
| Exit | Named a11y + dimension + theme tests green |

## P1-B5 — M01/M02 presentation parity

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Apply Decision A chrome to M01/M02 **without** durable domain services |
| Included gaps | 020, 021, 066, 067, 068 (chrome) |
| Prohibited | Claiming domain complete; workflow dossier completion (P2); patient mock → real patient data |
| Exit | Visual QA vs Decision A for listed screens; domain status remains NOT-STARTED |

## P1-B6 — Accepted modules design apply

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Apply shared final design to M04–M07/M11 presentation only |
| Included gaps | 022–026, 050, 081 |
| Prohibited | Changing frozen domain SoT/permissions/events; PPA; payment; M08 |
| Required tests | Focused regression per module wave suite; 252+ baseline must not regress; restore any evidence JSON rewritten by tests |
| Exit | Owner accepts “presentation-only” tip; domain behaviour unchanged |

## P1-B7 — States / permissions / report honesty

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Complete empty/loading/error/denied and permission UX on P1 surfaces; keep reports/export honest |
| Included gaps | 027–030, 028, 053 (honesty) |
| Role scenarios | Executive, operational, manager, restricted, auditor |
| Prohibited | New payment/PPA/patient capabilities |
| Exit | State matrix evidence + role matrix evidence |

## P1-B8 — Closure evidence pack

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Immutable SHA evidence, localhost handoff checklist, stop checkpoint for Programme P1 |
| Included gaps | 010 (close), 075, 076, 082 |
| Prohibited | Starting P2 automatically; rewriting P0 historical evidence |
| Exit | Owner acceptance of Programme P1 tip; explicit stop |

---

## Explicitly not batched under P1 implementation

| Work | Disposition |
| --- | --- |
| M01–M03 durable services/workflows | Programme P2 |
| M10 unblock/rebuild | Programme P3 |
| M08/M09/M12–M24 rebuilds | P4–P8 |
| PPA | Separate authorisation |
| M25 | Parked branch only |
| Payment execution | Excluded |

See also: [recommended first batch](./P1_RECOMMENDED_FIRST_BATCH.md) · [sequencing](./P1_DEPENDENCY_AND_SEQUENCING_PLAN.md)
