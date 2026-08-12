# P1-B1 — Shared Decision A shell foundation — implementation evidence

**Batch:** P1-B1  
**Branch:** `cursor/p1-b1-shared-shell-foundation`  
**Source tip:** `c960a397fbec94edb55cbd377f65a5df4eac4fa9` (`cursor/p1-scope-readiness-plan`)  
**Owner acceptance:** **pending**  
**Engineering status:** complete within authorised P1-B1 scope (objective validators/tests green)  
**Not claimed:** owner-accepted, closed, production-approved, B2–B8 start, merge, deploy

## Authorised gaps addressed

| Gap ID | Outcome |
| --- | --- |
| P1-GAP-002 | Decision A `--dp-*` tokens + shell chrome regions wired |
| P1-GAP-003 | Shared `KpiStrip`, `PrimaryToolbar`, `DetailPanel` primitives added |
| P1-GAP-004 | Sidebar 240/72 + topbar 48 asserted (1280/768/390) |
| P1-GAP-010 | Harness smoke started (`scripts/p1-b1-shell-harness-smoke.mjs`) — not Programme P1 exit |
| P1-GAP-049 | No Executive Blue / Medical Emerald globals; champagne retained as nav cue only |
| P1-GAP-051 | Detail panel width band 320–420 (default 360); drawer width 420 |

## Checklist (evidence-derived)

- Gap IDs: 002, 003, 004, 010 (start), 049, 051  
- Shell elements: Sidebar, Topbar, PageHeader, ModuleSectionNav, Drawer, KpiStrip, PrimaryToolbar, DetailPanel  
- Routing reference surfaces: `/dashboard`, `/action-inbox`  
- Responsive widths: 1440, 1280, 1024, 768, 430, 390  
- Appearance: Light / Dark / System (clean-storage default = System)  
- a11y: focus-visible retained; Escape/focus restore on Drawer/DetailPanel; reduced-motion harness context — AA-oriented only, no full WCAG claim  
- Org/clinic/role: Topbar clinic scope + sidebar demo Act-as unchanged (honesty preserved; no B2 stub disposition)  
- Exclusions: B2–B8, DB/SQL, OWN-P1-016 resolution, PPA, payment, clinical/patient, M25, CI/CD, PR/merge/deploy  
- Unresolved (non-blocking for B1): OWN-P1-016 open (explicitly not a B1 product-coding blocker)

## Key files

- `src/styles/tokens.css` — Decision A `--dp-*`, shell dimension vars, collapse CSS mirror  
- `src/lib/shell/design-contract.ts` — contract constants  
- `src/lib/portal-context.tsx` — sidebar width sync 240/72  
- `src/components/shell/*` — Sidebar/Topbar/PageHeader + new primitives  
- `src/components/ui/Drawer.tsx` — contract drawer width  
- `src/components/shell/theme-init-script.ts` + `src/lib/command-centre/storage.ts` — System default  
- `scripts/p1-b1-shell-harness-smoke.mjs`  
- `src/components/shell/tests/p1-b1-*.test.ts`

## Validation

| Check | Result |
| --- | --- |
| `node scripts/prototype-parity/validate-registers.mjs` | `failures: []` |
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass (0 errors; pre-existing warnings only) |
| `npm test` | 252 pass |
| `npm run test:p1-b1` | pass |
| UI Batch1 chrome/colour/visual unit tests | pass (assertions updated to Decision A where superseded) |
| `npm run build` | pass |
| Harness smoke (`HCDP_BASE_URL=http://localhost:3000`) | 0 failures / 36 shots |
| Runtime module count | **24** (unchanged) |

## Evidence artefacts

- `docs/audits/p1/b1-shell/harness-smoke-report.json`  
- `docs/audits/p1/b1-shell/harness-smoke-summary.md`  
- `docs/audits/p1/b1-shell/shots/*.png` (one state per image)  
- `docs/audits/p1/P1_B1_VISUAL_QA_NOTES.md`

## Explicit non-claims

- Not owner-accepted / not closed  
- Not production approval  
- Not B2–B8  
- Not PPA / payment / patient / M25  
- Not full Decision A module presentation parity (B5/B6)  
- Visual QA vs Decision A PNG pixel tolerances remains for separate Visual QA agent / owner inspection
