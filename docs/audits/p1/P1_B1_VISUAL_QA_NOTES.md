# P1-B1 Visual QA notes (qualified owner acceptance — 2026-08-13)

**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-13)**  
**Accepted implementation tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Accepted scope:** P1-B1 shared Decision A shell foundation only  
**Separate Decision A pixel-difference validation:** **deferred** to controlled later batch (does not reopen B1 closure)  
**Base URL:** `http://localhost:3000` (local)  
**Harness:** `scripts/p1-b1-shell-harness-smoke.mjs` → `docs/audits/p1/b1-shell/`  
**GitHub CI:** none for this branch — local evidence only; **no CI pass claimed**  

## Qualifications (acceptance-bound)

| Qualification | Record |
| --- | --- |
| GitHub CI | No Actions/check status; local validation only |
| Pixel comparison | Deferred to controlled later batch |
| Demo identity consistency | Sarah/Neil remains P1-B2 |
| Data architecture | `OWN-P1-016` remains open |
| Later batches | P1-B2–P1-B8 remain unauthorised |
| Production | No production approval |
| Delivery | No PR, merge or deployment authorised |
| Progression | No automatic progression to P1-B2 |

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

## Residual notes after qualified acceptance

- Full Decision A pixel-diff still outstanding (GAP-010 not closed)  
- Sarah/Neil identity honesty remains P1-B2  
- `OWN-P1-016` open; P1-B2–B8 unauthorised  
- Overall Programme P1 / production acceptance **not** claimed  
- Full WCAG compliance not claimed  
