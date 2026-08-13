# P1 Test and Acceptance-Evidence Plan

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` (local validation; no GitHub CI). **P1-B2–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`.  
**Framework:** [`../GLOBAL_ACCEPTANCE_TEST_DESIGN.md`](../GLOBAL_ACCEPTANCE_TEST_DESIGN.md)  
**P1-B1 evidence:** [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md)

## Mandatory proof types (every authorised batch)

1. Automated tests (theme/shell/a11y/regression as applicable)  
2. Visual QA vs Decision A PNGs / design-system-contract (exact viewports/regions/tolerances)  
3. Work-Step QA for every named in-scope action  
4. Immutable SHA evidence commit under `docs/audits/` (new paths; do not alter historical P0 evidence)  
5. Localhost handoff on port **3000** for the exact reported tip  

## Fail conditions (instant fail)

- Toast/alert-only success presented as completion  
- Missing service transition claimed complete  
- Missing permission / clinic isolation  
- Fake seed treated as production truth  
- Patient/clinical/payment boundary breach  
- Self-approval by implementing agent  
- Source change after final QA without re-QA  
- Historical evidence rewritten without restore  

## Baseline quality gates (entry to each batch)

| Gate | Command / check | Pass criteria |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | Exit 0 |
| Lint | `npm run lint` | 0 errors (warnings documented) |
| Unit/integration | `npm test` | All pass; restore any rewritten evidence JSON |
| Production build | `npm run build` | Exit 0 |
| Registers | `node scripts/prototype-parity/validate-registers.mjs` | `failures: []` |
| Clean tree policy | `git status` | Only authorised paths dirty |
| Runtime module count | module-register | Remains 24 (M01–M24); no M25 |

## Batch-specific tests (planned)

| Batch | Named tests / evidence |
| --- | --- |
| P1-B1 | Theme token resolution L/D/S; shell 240/72 + topbar 48 at 1280/768/390; screenshot harness smoke |
| P1-B2 | Inactive control labelling; no toast-as-success; demo badge visibility |
| P1-B3 | M11 section list matches workspace; M07 history planned honesty; validator green |
| P1-B4 | Focus-ring/keyboard chrome; reduced-motion; System hydrate settle; width matrix |
| P1-B5 | Visual QA M01/M02 Decision A regions; domain status still NOT-STARTED |
| P1-B6 | Focused M04/M05/M06/M07/M11 regression; behaviour unchanged assertions |
| P1-B7 | Empty/loading/error/denied matrix; role/permission denied matrix; export honesty |
| P1-B8 | Evidence pack completeness; tip SHA match; localhost checklist; stop checkpoint |

## Browser widths and appearance modes

| Mode | Required |
| --- | --- |
| Light | Yes |
| Dark | Yes |
| System | Yes (incl. OS dark settle) |
| Widths | At least 390, 768, 1280; prefer full contract list (incl. 430, 1024, 1440, 1672×941 ref, 125% zoom where specified) |

## Role / permission scenarios

| Role class | Scenarios |
| --- | --- |
| Executive | Dashboard chrome + clinic scope |
| Operational | Action inbox chrome |
| Manager | Settings/org chrome; denied where unclassified |
| Restricted | Permission-denied UI (not blank failure) |
| Auditor | Read/audit visibility where applicable — no elevated mutate |

## Evidence path convention (planned)

```text
docs/audits/p1/
  P1_B1_<topic>_EVIDENCE.md
  P1_B1_<topic>_EVIDENCE.json
  ...
  P1_STOP_CHECKPOINT.md
```

Do **not** modify:

- `docs/architecture/prototype-parity/` P0 generated registers except via authorised regenerate + owner process  
- Historical `docs/audits/WAVE*` / UI Batch1 evidence  
- P0 programme-reset tip content  

## Test side-effect control

Observed on tip `9142ec30…`: `npm test` rewrote:

- `docs/audits/wave3-m11-performance-evidence.json`  
- `docs/audits/wave4-m05-performance-evidence.json`  
- `docs/audits/wave5-m06-performance-evidence.json`  
- `docs/audits/wave5-m06-workflow-evidence.json`  

**Required process:** after tests, `git checkout --` those paths unless the batch expressly authorises new evidence files. Gap: P1-GAP-076.

## Acceptance agents

Separate Visual QA / Work-Step QA / Regression agents — **no self-approval** (P1-GAP-082).
