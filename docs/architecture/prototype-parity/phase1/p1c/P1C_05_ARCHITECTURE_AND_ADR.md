# P1C Architecture Completeness and ADR Posture

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Architecture artefacts present

| Artefact | Path | Completeness |
| --- | --- | --- |
| Connected workforce architecture / cursor plan | `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` | Partial–strong programme control |
| Scope firewall | `SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md` | Strong boundary |
| Cross-module ownership | `CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.*` | Strong contracts pattern |
| Design system contract | `FINAL_DESIGN_SYSTEM_CONTRACT.md` | Strong visual/shell |
| AUTH provisioning plan | `AUTH_PROVISIONING_MIGRATION_PLAN.md` | Partial (plan; not live IdP) |
| M07 boundary/workflow/permissions | WAVE6_M07_* | Strong for ordinary prep |
| P1A data/permissions/NFR | phase1/p1a | Planning complete unapproved |
| Platform storage | `PLATFORM_STORAGE_REGISTER.md` | Strong for client persistence |
| Integration plan | `PLATFORM_INTEGRATION_PLAN.md` | Partial historical |

## Architecture findings

| ID | Finding | Impact |
| --- | --- | --- |
| ARCH-01 | Client localStorage SoT vs portable SQL migration coexistence undocumented as runtime switch | Prod path unclear — owner decision **OWN-P1-016** (**Open**; see `../P1_OWNER_DECISION_REGISTER.md`) |
| ARCH-02 | No formal ADR log; decisions embedded in wave/owner docs | Traceability friction |
| ARCH-03 | Adapter/contract rule (“no cross-module repository imports”) stated and must be preserved | Good — enforce in reviews |
| ARCH-04 | M01/M02 projections IN-DEVELOPMENT until producers complete | Expected |
| ARCH-05 | Dual prototype/portal surfaces accepted but README confusing | CONF-P1C-001 |
| ARCH-06 | Placeholder modules registered in runtime nav | Honesty required |

## ADR posture

**Do not invent ADRs.** Proposed ADR titles for owner-authorised documentation batches only:

| Proposed ADR ID | Title | Status |
| --- | --- | --- |
| ADR-PROPOSE-001 | Next.js App Router + local-first persistence for demo/waves | Supported by code+AUTH plan — **draft only** |
| ADR-PROPOSE-002 | No cross-module repository imports; adapter/events only | Supported by architecture rules — **draft only** |
| ADR-PROPOSE-003 | Staff-pay preparation only; payment external | Supported by OWN-NO-PAY-EXEC — **draft only** |
| ADR-PROPOSE-004 | Patient/clinical SoR excluded | Supported by firewall — **draft only** |
| ADR-PROPOSE-005 | Appearance Light/Dark/System only | Supported by DEC-BRANDED-THEMES — **draft only** |
| ADR-PROPOSE-006 | Real IdP + `auth_identity_id` (no Supabase) | Supported by AUTH plan text — **draft only** |

Owner must accept ADR process (OWN-P1C-004) before treating drafts as binding.
