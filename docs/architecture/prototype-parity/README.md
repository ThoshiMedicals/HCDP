# Prototype-Parity Programme Control Pack (Programme Gate P0)

**Authority:** planning / extraction / design-reference staging / prompt pack only.  
**Does not authorise:** Programme Wave P1 implementation, PPA, M08–M24 bulk work, PR, merge, or production release.

| Pin | SHA |
| --- | --- |
| Accepted Phase 0 application baseline | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Evidence-bearing tip (programme-reset base) | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Prototype (`public/pulse-html-prototype.html`) | `8843dbb315a6e82b5df628c51f68e3eb904b794aca928823bab99bfa57758760` |

## Controlling documents

| Document | Role |
| --- | --- |
| `phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md` | Owner Phase 0 acceptance + preflight |
| `PROTOTYPE_EXTRACTION_MANIFEST.json` | Hash-pinned extract totals |
| `MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md` (+ JSON/CSV) | Master parity rows |
| `CANONICAL_SCREEN_REGISTER.md` (+ JSON) | Canonical screens (186 vs 143 baseline) |
| `WORKFLOW_AND_ACTION_REGISTER.md` (+ JSON) | Buttons / workflows / modals |
| `SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md` | Precedence + product boundaries |
| `CONFLICT_AND_OWNER_DECISION_REGISTER.md` | Open decisions |
| `CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.md` | Ownership contracts |
| `CURRENT_IMPLEMENTATION_REAUDIT.md` | Multi-axis M01–M24 status |
| `FINAL_DESIGN_SYSTEM_CONTRACT.md` | Shared workbench contract |
| `DESIGN_REFERENCE_MAP.md` | Image → screen map |
| `REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md` | P0–P9 pathway |
| `PROPOSED_WAVE_CONTROL_UPDATE.md` | Suggested rule text (not applied) |
| `GLOBAL_ACCEPTANCE_TEST_DESIGN.md` | Progressive gate design |
| `prompts/` | Copy-ready per-batch Cursor prompts |
| `VALIDATION_RECONCILIATION.md` | Totals reconciliation |
| `FIRST_RUN_STOP_CHECKPOINT.md` | First-run stop report |

## Tooling

```bash
node scripts/prototype-parity/extract-prototype.mjs
python3 scripts/prototype-parity/build-parity-registers.py
node scripts/prototype-parity/validate-registers.mjs
```

Historical `docs/architecture/hcdp-prototype-parity-register.json` (11 rows) is **superseded** as SoT.

## Design references

Exact owner PNGs install to `docs/design-references/final/` with SHA-256 manifest. First-run status may be **MISSING** until originals are uploaded — do not substitute.
