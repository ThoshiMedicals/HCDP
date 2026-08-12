# P1-B1 Visual QA notes (remediated capture — not self-approval)

**Owner acceptance:** pending  
**Separate Visual QA / owner inspection:** **still required**  
**Supersedes:** `archive-fa2cc7f-P1_B1_VISUAL_QA_NOTES.md` and `b1-shell/archive-fa2cc7f/`  
**Starting SHA:** `fa2cc7f401fab95d1320f00897bca4438207191b`  
**Base URL:** `http://localhost:3000` (local production `next start`)  
**Harness:** `scripts/p1-b1-shell-harness-smoke.mjs` → `docs/audits/p1/b1-shell/`  
**GitHub CI:** none for this branch — local evidence only  

## Screenshot inventory (current)

Matrix normals: 2 routes × 6 widths × 4 appearances = **48** `*-normal.png` files.

Interaction / state shots (representative):

| File | State |
| --- | --- |
| `interaction-mobile-nav-closed-390.png` | Mobile nav closed |
| `interaction-mobile-nav-open-390.png` | Mobile nav open + overlay |
| `interaction-mobile-menu-keyboard-focus-390.png` | Menu control focus |
| `interaction-mobile-nav-after-escape-390.png` | Escape close + focus return |
| `interaction-drawer-closed-action-inbox-1280.png` | Drawer closed |
| `interaction-drawer-open-action-inbox-1280.png` | Drawer open (review panel) |
| `interaction-drawer-after-escape-1280.png` | Drawer Escape closed |
| `interaction-detail-panel-*-1280.png` | DetailPanel closed/open/Escape via harness probe |
| `interaction-keyboard-focus-*-1440.png` | Topbar / sidebar keyboard focus |
| `state-action-inbox-390-intentional-loading.png` | Loading (labelled as loading) |
| `state-action-inbox-1280-empty-filtered.png` | Filtered empty |
| `state-action-inbox-1280-error.png` | Error (harness force) |
| `state-action-inbox-1280-access-denied*.png` | Restricted/access-denied where present |

## Implementer visual inspection (honest)

**Pass observations**

- Action Inbox mobile **completed** screens no longer mislabelled as loading.  
- Mobile nav open shows usable 240px sidebar + dimmed overlay.  
- Desktop/tablet shell regions present; active route indicators visible.  
- Dark / system-os-dark surfaces use Decision A dark tokens without Executive Blue / Medical Emerald globals.  
- Drawer and DetailPanel open states captured distinctly from closed.  
- No patient/clinical prohibited content observed in shell shots.  

**Residual visual notes (not claimed fixed / not owner-accepted)**

- Mobile topbar search text truncates via intentional horizontal scroll container.  
- Some sidebar group titles truncate at 240px (“EXECUTIVE COMMA…”).  
- Demo Act-as identity honesty (Sarah vs Neil greeting) remains a B2 concern.  
- Pixel tolerance vs Decision A PNG baselines not performed here.  
- Full WCAG compliance **not** claimed.  

## Residual for later batches / separate agents

- Full pixel-diff vs Decision A PNGs / tolerances (P1-GAP-010 close / B8)  
- Broader a11y keyboard matrix beyond shell chrome (P1-B4)  
- Stub honesty / inactive control disposition (P1-B2)  
- Module presentation parity M01/M02 (P1-B5)  
- `OWN-P1-016` remains open  
- P1-B2–P1-B8 remain unauthorised  
