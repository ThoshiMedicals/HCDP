# P1 Authoritative-Source Register

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`

Sources inspected for this readiness pack. Precedence follows [`../SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md`](../SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md).

## A. Programme control and pins

| ID | Source | Path / ref | Role |
| --- | --- | --- | --- |
| SRC-P0-README | P0 control pack README | `docs/architecture/prototype-parity/README.md` | Pack claim, pins, regenerate command |
| SRC-P0-STOP | First-run stop checkpoint | `docs/architecture/prototype-parity/FIRST_RUN_STOP_CHECKPOINT.md` | P1 authorised = No |
| SRC-P0-WAVE | Proposed wave-control update | `docs/architecture/prototype-parity/PROPOSED_WAVE_CONTROL_UPDATE.md` | Wave sequencing |
| SRC-P0-ROADMAP | Dependency-led roadmap | `docs/architecture/prototype-parity/REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md` | P1→P9 sequence |
| SRC-P0-PHASE0 | Phase 0 acceptance | `docs/architecture/prototype-parity/phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md` | Application baseline acceptance |
| SRC-P0-TIP | Programme-reset branch tip | `cursor/prototype-parity-programme-reset` @ `b0c4c4d20de1cce7adac5d691c506122e30610a2` | Preserved P0 tip |
| SRC-BASELINE | Planning start tip | `cursor/baseline-quality-remediation` @ `9142ec30b3b2efea1e959ad85ce1406562cd5faa` | Clean quality baseline for planning |
| SRC-PROMPT-P1 | Existing P1 SHARED prompt | `docs/architecture/prototype-parity/prompts/p1.md` | Narrow Programme P1 scope |
| SRC-M25 | M25 parking | `cursor/m25-future-planning` | Future only — not P1 |

## B. Registers and accounting

| ID | Source | Path | Role |
| --- | --- | --- | --- |
| SRC-SCR | Canonical screen register | `…/CANONICAL_SCREEN_REGISTER.md` + `.json` | 194 screens |
| SRC-WAR | Workflow/action register | `…/WORKFLOW_AND_ACTION_REGISTER.md` + `.json` | 807 items |
| SRC-REAUDIT | Implementation re-audit | `…/CURRENT_IMPLEMENTATION_REAUDIT.md` + `.json` | M01–M24 status axes |
| SRC-ACCT | Accounting summary | `…/ACCOUNTING_SUMMARY.json` | Disposition totals |
| SRC-TRACE | Master BRD↔proto↔prod | `…/MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md` (+ json/csv) | 1982 rows |
| SRC-OWN | Conflict/owner decisions | `…/CONFLICT_AND_OWNER_DECISION_REGISTER.md` + `.json` | openCount=0 |
| SRC-XMAP | Cross-module ownership | `…/CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.md` + `.json` | Contracts |
| SRC-FIREWALL | Scope firewall | `…/SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md` | Patient/pay/PPA boundaries |
| SRC-DESIGN | Final design contract | `…/FINAL_DESIGN_SYSTEM_CONTRACT.md` + `design-system-contract.json` | Tokens, shell, a11y |
| SRC-DEC-A | Decision A acceptance | `…/DESIGN_REFERENCE_DECISION_A_ACCEPTANCE.md` | PNG baselines |
| SRC-GAT | Global acceptance design | `…/GLOBAL_ACCEPTANCE_TEST_DESIGN.md` | Five axes + fail conditions |
| SRC-MODREG | Runtime module register | `src/platform/module-registry/module-register.ts` | 24 modules, routes, conditions |
| SRC-LEGACY-PARITY | Historic parity register | `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` | Superseded in parts — use with caution |

## C. Prototype / BRD / UX extraction

| ID | Source | Path | Role |
| --- | --- | --- | --- |
| SRC-HTML | HTML prototype | `public/pulse-html-prototype.html` | Prototype runtime SoT for not-yet-built capability |
| SRC-BRD | Extracted BRD modules | `src/lib/extracted/brd-modules.json` | BRD modules/tabs/buttons/rules |
| SRC-BP | Module blueprints | `src/lib/extracted/module-blueprints.json` | Blueprint workflows/patterns |
| SRC-FIELDS | Field schemas | `src/lib/extracted/field-schemas.json` (+ related) | Forms/fields |
| SRC-PROTO-JSON | Prototype extraction set | `docs/architecture/prototype-parity/prototype-*.json` | Screens/tabs/workflows/themes |
| SRC-PNG | Decision A finals | `docs/design-references/final/` | Visual chrome reference |

## D. Application surfaces inspected

| ID | Source | Path | Role |
| --- | --- | --- | --- |
| SRC-APP-PORTAL | Portal layout/routes | `src/app/(portal)/`, `src/app/page.tsx` | `/dashboard` family |
| SRC-APP-PROTO | Prototype routes | `src/app/prototype/`, `src/app/prototype-reference/` | Reference only |
| SRC-SHELL | Shell chrome | `src/components/shell/*` | Nav, topbar, section nav, theme |
| SRC-WS | Workspaces | `src/components/workspaces/*` | M01–M03 host UIs + shell controls |
| SRC-MODS | Module packages | `src/modules/m01-*` … `m24-*` | Domain vs landing |
| SRC-UI | Shared UI | `src/components/ui/*` | Drawer/tabs/table primitives |

## E. Wave / UI acceptance evidence

| ID | Source | Path | Role |
| --- | --- | --- | --- |
| SRC-UI-B1 | UI Batch 1 reports | `docs/audits/HCDP_UI_BATCH1_*` | Chrome remediation evidence (not Decision A P1 complete) |
| SRC-W2 | M04 completion | `docs/audits/WAVE2_M04_*` | Frozen, not production |
| SRC-W3 | M11 completion | `docs/audits/WAVE3_M11_*` | Frozen, not production |
| SRC-W4 | M05 completion | `docs/audits/WAVE4_M05_*` | Frozen, not production |
| SRC-W5 | M06 completion | `docs/audits/WAVE5_M06_*` | Frozen, not production |
| SRC-W6 | M07 Batch 6 | `docs/audits/WAVE6_BATCH6_*` | Ordinary prep closed w/ qualifications |
| SRC-PPA | PPA planning (not auth) | `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md` | Separate from P1 |
| SRC-A11Y-M07 | Shell a11y evidence | `docs/audits/wave6-m07-batch1-shell-a11y-evidence.json` | Prior shell a11y |

## F. Validators / scripts

| ID | Source | Path | Role |
| --- | --- | --- | --- |
| SRC-VAL | Register validator | `scripts/prototype-parity/validate-registers.mjs` | `failures: []` required |
| SRC-PACK | Parity pack runner | `scripts/prototype-parity/run-parity-pack.mjs` | Deterministic regenerate (do not rewrite historical evidence in P1 planning) |

## Source-quality notes / contradictions

| Note | Detail |
| --- | --- |
| Nested vs branch tips | P0 README pins application baseline `b1152d3…` / evidence tip `e659dfc…` / Decision A `66e6e64…` inside pack content; branch tip for programme-reset is `b0c4c4d20…`. Both are valid at different layers — do not conflate. |
| Phase 0 vs P0 pack acceptance | Phase 0 baseline is recorded ACCEPTED; Programme Gate P0 control pack remains pending owner acceptance for P1 authorisation. |
| Stale historic register | `HCDP_PROTOTYPE_PARITY_REGISTER.md` still describes some modules (e.g. M07) as ModuleLanding stubs — **contradicted** by current `StaffPayWorkspace` / re-audit. Prefer `CURRENT_IMPLEMENTATION_REAUDIT.*`. |
| UI Batch1 residual debt | Batch1 reports cite historical tsc/lint debt; current tip `9142ec30…` has `tsc` pass and lint 0 errors / 24 warnings — treat Batch1 residual tooling claims as **superseded unless re-verified**. |
| PPA path alias | Some rows cite `Development folder/docs/plans/…`; worktree file is `docs/plans/…`. |
| Prompt “P1” vs readiness “P1” | `prompts/p1.md` = SHARED foundation only; this pack inventories all post-P0 gaps and classifies them. |

## Authority for planning (this pack)

Planning documents under `docs/architecture/prototype-parity/phase1/` are **readiness artefacts only**. They do not supersede frozen wave evidence, do not rewrite P0 registers, and do not authorise implementation.
