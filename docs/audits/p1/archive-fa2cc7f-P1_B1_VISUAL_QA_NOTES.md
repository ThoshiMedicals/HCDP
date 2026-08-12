# P1-B1 Visual QA notes (implementer capture — not self-approval)

**Owner acceptance:** pending  
**Separate Visual QA agent approval:** required before owner tip acceptance  
**Base URL:** `http://localhost:3000`  
**Harness:** `scripts/p1-b1-shell-harness-smoke.mjs` → `docs/audits/p1/b1-shell/`

## Captured states (representative)

| File | State inspected |
| --- | --- |
| `shots/dashboard-1440-light.png` | Desktop expanded sidebar (~240), topbar 48, Decision A blue accents, no clipping of primary chrome |
| `shots/dashboard-1280-dark.png` | Desktop dark appearance; nav/surfaces use Decision A dark tokens |
| `shots/dashboard-768-light.png` | Tablet icon rail (~72); labels collapsed; topbar single-row |
| `shots/action-inbox-390-system.png` | Mobile hamburger; topbar compact; shell chrome present (module content may still load) |

Full matrix: 2 routes × 6 widths × 3 appearances = 36 PNGs under `docs/audits/p1/b1-shell/shots/`.

## Implementer observation checklist

- No parallel shell systems introduced  
- Champagne retained as sidebar nav cue only (not global branded theme)  
- No Executive Blue / Medical Emerald global theme controls  
- Topbar fixed to contract height 48 (horizontal scroll for dense controls)  
- Detail/drawer contract widths available via shared primitives  
- Horizontal overflow harness gate: pass on captured matrix  

## Residual for later batches / separate agents

- Full pixel-diff vs Decision A PNGs / tolerances (P1-GAP-010 close / B8)  
- Broader a11y keyboard matrix (P1-B4)  
- Stub honesty / inactive control disposition (P1-B2)  
- Module presentation parity M01/M02 (P1-B5)
