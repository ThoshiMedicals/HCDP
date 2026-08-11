# P1 Proposed Execution Batches

**Stamp:** Every batch below is `P1 — PLANNED, NOT AUTHORISED`  
**Rule:** No batch auto-starts. `OWN-NO-P1-YET` cleared and **P1-B1** named (OWN-P1-001…003, 2026-08-11). Owner must still **expressly authorise** each batch before coding; B2–B8 never auto-start (OWN-P1-002).

## Batch index

| Batch | Objective | Gap IDs (primary) |
| --- | --- | --- |
| P1-B1 | SHARED Decision A shell foundation | 002, 003, 004, 010, 049, 051 |
| P1-B2 | Shell truthfulness / inactive controls / demo honesty | 005, 006, 007, 018*, 030*, 032, 071, 073 |
| P1-B3 | Register / navigation hygiene | 011, 012, 013, 014*, 015, 079 |
| P1-B4 | Responsive / a11y / appearance evidence | 008, 009, 031, 052, 074 |
| P1-B5 | M01/M02 Decision A presentation (no domain services) | 020, 021, 066, 067, 068* |
| P1-B6 | Accepted-module final-design apply (preserve domain) | 022–026, 050, 081 |
| P1-B7 | Permission / state / report honesty completeness | 027–030, 028, 053* |
| P1-B8 | P1 closure evidence + stop checkpoint | 010, 075, 076, 082 |

\*Partial — honesty/labels only; durable domain remains P2+.

---

## P1-B1 — SHARED Decision A shell foundation

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Establish tokenised Light/Dark/System shell + shared chrome primitives per design-system-contract and Decision A |
| Included gaps | 002, 003, 004, 010 (harness start), 049, 051 |
| Modules/screens | SHARED; reference surfaces `/dashboard`, `/action-inbox` |
| Dependencies | Owner clears P1-GAP-001 / 083; Decision A PNGs remain `66e6e64…` |
| Exact authorised changes (when named) | CSS variables/tokens; Sidebar/Topbar/ModuleSectionNav/PageHeader/Drawer primitives; shell dimensions; screenshot harness smoke |
| Prohibited | Domain services; M08–M24 rebuilds; PPA; payment; patient/clinical; theme Executive Blue/Medical Emerald; PR/merge |
| Expected files/areas | `src/components/shell/*`, `src/components/ui/*`, theme CSS, design-contract consumers, new shell tests |
| Required tests | Theme token; shell dimensions 1280/768/390; harness smoke |
| Browser widths / appearance | Contract viewports; Light, Dark, System |
| Role scenarios | Authenticated user sees chrome; role gating unchanged |
| Acceptance evidence | Screenshots + tests + SHA tip evidence under `docs/audits/` (new, not rewriting P0) |
| Rollback | Revert batch branch tip to pre-batch SHA |
| Entry gate | P0 accepted; batch named; tip clean; validators green |
| Exit gate | Named tests green; visual QA agent (not implementer) PASS; owner decision point |
| Owner decision point | Accept B1 tip before B2 |

## P1-B2 — Shell truthfulness

| Field | Value |
| --- | --- |
| Status | `P1 — PLANNED, NOT AUTHORISED` |
| Objective | Remove or truthfully label inactive/stub shell controls and demo surfaces |
| Included gaps | 005, 006, 007, 018 (labels), 030 (honesty), 032, 071, 073 |
| Dependencies | P1-B1 preferred; owner decisions on stub disposition |
| Authorised changes | Copy, visibility, disablement, demo badges — **no fake backends** |
| Prohibited | Implementing payment/export backends as silent scope; enabling emergency/auth as toast-success |
| Tests | Control labelling; no toast-as-success assertions |
| Entry/exit | After B1 acceptance; owner accepts honesty disposition |

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
