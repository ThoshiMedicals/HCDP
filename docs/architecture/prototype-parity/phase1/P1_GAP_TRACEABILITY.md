# P1 Gap Traceability (Source → Gap → Acceptance)

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **P1-B2–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`.  
**Rule:** No proposed change without source, gap ID, and acceptance method.

## P1-B1 gap disposition (2026-08-13)

| Gap ID | Disposition |
| --- | --- |
| P1-GAP-002 | Owner accepted / closed for P1-B1 |
| P1-GAP-003 | Owner accepted / closed for P1-B1 |
| P1-GAP-004 | Partial — B1 dimension evidence accepted; residual B4 remains open |
| P1-GAP-010 | Partial / not closed — harness start accepted; pixel-diff / Programme P1 exit remain (B8) |
| P1-GAP-049 | Owner accepted / closed for P1-B1 |
| P1-GAP-051 | Owner accepted / closed for P1-B1 |

| Gap ID | Source IDs / artefacts | Acceptance method | Batch |
| --- | --- | --- | --- |
| P1-GAP-001 | OWN-NO-P1-YET; SRC-P0-STOP; SRC-PROMPT-P1 | Owner written acceptance | Entry |
| P1-GAP-002 | SRC-PROMPT-P1; SRC-DESIGN; SRC-DEC-A; imgctrl-* | Theme/shell tests + Decision A Visual QA | P1-B1 |
| P1-GAP-003 | imgctrl-*-kpi-strip/toolbar/detail-panel; SRC-DESIGN | Component tests + visual regions | P1-B1 |
| P1-GAP-004 | SRC-DESIGN shell dimensions; prompts/p1 §9 | Dimension tests 1280/768/390 | P1-B1/B4 |
| P1-GAP-005 | SRC-SHELL Topbar.tsx; GLOBAL toast-fail | Labelling/visibility tests; no toast-success | P1-B2 |
| P1-GAP-006 | Topbar clinic scope; CC ControlBar | Role/clinic scenarios; owner disposition | P1-B2 |
| P1-GAP-007 | DashboardShellControls; UI Batch1 owner visual | Copy honesty checks | P1-B2 |
| P1-GAP-008 | theme-init-script; UI Batch1 colour QUALIFIED | Theme tests + screenshot settle | P1-B4 |
| P1-GAP-009 | SRC-DESIGN a11y; prompts/p1 §9 | Focus/keyboard tests | P1-B4 |
| P1-GAP-010 | SRC-DESIGN viewports; prompts/p1 §10–11 | Screenshot harness + SHA evidence | P1-B1/B8 |
| P1-GAP-011 | SRC-MODREG vs TrainingWorkspace; SRC-REAUDIT | Register/nav assertions; validator | P1-B3 |
| P1-GAP-012 | M07 section-meta; WAVE6_BATCH6_*; SRC-REAUDIT | UI honesty + register text | P1-B3 |
| P1-GAP-013 | SRC-LEGACY-PARITY vs SRC-REAUDIT | Doc pointer / superseded banner | P1-B3 |
| P1-GAP-014 | SRC-ACCT unresolved=298; SRC-WAR | Mapping counts for in-scope IDs | P1-B3/P2 |
| P1-GAP-015 | SRC-REAUDIT placeholderShell; ModuleLanding | Landing-only confirmation | P1-B3 |
| P1-GAP-016 | SRC-REAUDIT M01 NONE services | P2 service/audit/isolation tests | P2 |
| P1-GAP-017 | SRC-REAUDIT M02; workflow dossiers P2 | P2 Work-Step per workflow ID | P2 |
| P1-GAP-018 | prod-ctrl-m03-*; OrganisationWorkspace | P1 labels; P2 persistence/audit | P1-B2/P2 |
| P1-GAP-019 | SRC-REAUDIT integrations; SRC-XMAP | P2 integration tests | P2 |
| P1-GAP-020 | Decision A; UI Batch1 M01 | Visual QA M01 regions | P1-B5 |
| P1-GAP-021 | Decision A; M02 screens | Visual QA M02 regions | P1-B5 |
| P1-GAP-022 | SRC-REAUDIT M04; WAVE2_* | Design apply + focused regression | P1-B6 |
| P1-GAP-023 | SRC-REAUDIT M05; WAVE4_* | Design apply + focused regression | P1-B6 |
| P1-GAP-024 | SRC-REAUDIT M06; WAVE5_* | Design apply + focused regression | P1-B6 |
| P1-GAP-025 | SRC-REAUDIT M07; WAVE6_BATCH6_* | Design apply; no PPA/pay; regression | P1-B6 |
| P1-GAP-026 | SRC-REAUDIT M11; WAVE3_* | After 011; design apply + regression | P1-B6 |
| P1-GAP-027 | GLOBAL axes; UxStateDemo patterns | State matrix evidence | P1-B7 |
| P1-GAP-028 | Firewall; accessClassification | Role/permission scenarios | P1-B7 |
| P1-GAP-029 | Wave audit evidence; GLOBAL | No fake audit; regression | P1-B7 |
| P1-GAP-030 | Topbar export stub; report sections | Honesty tests | P1-B2/B7 |
| P1-GAP-031 | SRC-DESIGN breakpoints; UI Batch1 | Width matrix | P1-B4 |
| P1-GAP-032 | QaDemoMenu; GLOBAL fake-seed fail | Demo labelling / flag | P1-B2 |
| P1-GAP-033–048 | SRC-REAUDIT PH modules; ModuleLanding | Not P1 build; honesty only | Later |
| P1-GAP-049 | DEC-BRANDED-THEMES; SRC-DESIGN | Theme tests forbid banned globals | P1-B1 |
| P1-GAP-050 | SRC-DESIGN typography/spacing | Visual QA density | P1-B5/B6 |
| P1-GAP-051 | SRC-DESIGN detail panel band | Layout tests | P1-B1 |
| P1-GAP-052 | SRC-DESIGN reduced-motion | a11y motion tests | P1-B4 |
| P1-GAP-053 | BRD outputs / reports | Honesty; later print packs | P1-B7/Later |
| P1-GAP-054 | `/prototype` routes | Accepted difference | N/A |
| P1-GAP-055 | SRC-ACCT 143 vs 194 | Accepted difference | N/A |
| P1-GAP-056 | GLOBAL axis 5; wave reports | Non-claim in evidence | All |
| P1-GAP-057–059 | SRC-FIREWALL; OWN-PATIENT-FIREWALL | Exclusion verification | Exclude |
| P1-GAP-060 | OWN-NO-PAY-EXEC; M07 exclusions | Exclusion verification | Exclude |
| P1-GAP-061 | OWN-PPA-SEPARATE; SRC-PPA | Separate auth only | Exclude/PPA |
| P1-GAP-062 | M25 parked branch | Confirm absent from runtime | Exclude |
| P1-GAP-063–065 | Owner brief prohibitions | Process gates | Exclude |
| P1-GAP-066 | Topbar search vs module filters | UX consistency checks | P1-B2/B5 |
| P1-GAP-067 | Drawer vs module panels | Shared primitive adoption | P1-B1/B5 |
| P1-GAP-068 | Alert chrome vs M02 | Chrome honesty; domain P2 | P1-B5/P2 |
| P1-GAP-069 | field-schemas outside accepted modules | Later wave form Work-Steps | Later |
| P1-GAP-070 | BRD business rules non-accepted | Later | Later |
| P1-GAP-071 | Seed/demo copy | Labelling cleanup per owner | P1-B2 |
| P1-GAP-072 | UI Batch1 de-crowding | Preserve Accepted difference unless Decision A conflicts | P1-B5 |
| P1-GAP-073 | Online toggle demo | Honesty label | P1-B2 |
| P1-GAP-074 | UI Batch1 hydration notes; tip 9142ec30 | Re-verify in B4 | P1-B4 |
| P1-GAP-075 | UI Batch1 IV next-dev residual | QA environment note in B8 | P1-B8 |
| P1-GAP-076 | Observed test evidence rewrite | checkout restore process | P1-B8 |
| P1-GAP-077 | SRC-ACCT atomicNoneNotImplemented=510 | Aggregate later | Later |
| P1-GAP-078 | SRC-ACCT productionControls=28 | Accepted volume difference | N/A |
| P1-GAP-079 | M07 Adjustments PPA-1 foundation UI | Honesty; not PPA auth | P1-B3 |
| P1-GAP-080 | BLOCKED-M10 wave-control | P3 plan | Later |
| P1-GAP-081 | Wave freeze rules | B6 presentation-only gates | P1-B6 |
| P1-GAP-082 | GLOBAL self-approval fail | Separate QA agents | P1-B8 |
| P1-GAP-083 | prompts/p1.md vs readiness pack breadth | Owner OWN-P1-002 | Entry |

## Completeness check

| Requirement | Status |
| --- | --- |
| Every gap has ID | Yes (83 preserved) |
| Every proposed P1-rec item has source | Yes |
| Every proposed P1-rec item has acceptance method | Yes |
| Eight batches accounted for | Yes — only P1-B1 accepted/closed with qualifications |
| P1-B2–P1-B8 stamped not authorised | Yes |
| Exclusions traced | Yes (057–065, 061–062) |
