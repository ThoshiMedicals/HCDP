# P1-B1 Visual QA notes (post hook-cleanup — not self-approval)

**Owner acceptance:** pending  
**Separate Visual QA / owner inspection:** **still required**  
**Remediation tip:** `4069ed429072138c81eeca85e14f879d4bfb6cf6`  
**Base URL:** `http://localhost:3000` (local)  
**Harness:** `scripts/p1-b1-shell-harness-smoke.mjs` → `docs/audits/p1/b1-shell/`  
**GitHub CI:** none for this branch — local evidence only  

## Historical / synthetic (not ordinary runtime evidence)

Moved under `docs/audits/p1/b1-shell/historical-synthetic-4069ed4/shots/`:

- `interaction-detail-panel-*-1280.png` — produced via removed `ShellHarnessProbe`
- `state-action-inbox-1280-error.png` — produced via removed `p1-b1-harness-force-inbox-error`

Do **not** treat these as naturally occurring product states.

## Live screenshot inventory (ordinary runtime)

Matrix normals and product interaction shots remain under `docs/audits/p1/b1-shell/shots/` (mobile nav, drawer, keyboard, loading, filtered empty, access-denied where present). Regenerated after hook removal where applicable.

## Replacement primitive coverage

- Unit/contract: `src/components/shell/tests/p1-b1-shell-primitives.test.ts`
- Product `Drawer` browser evidence retained (`interaction-drawer-*`)

## Residual notes

- Separate Decision A pixel-diff still outstanding  
- Sarah/Neil identity honesty remains P1-B2  
- `OWN-P1-016` open; P1-B2–B8 unauthorised; owner acceptance pending  
- Full WCAG compliance not claimed  
