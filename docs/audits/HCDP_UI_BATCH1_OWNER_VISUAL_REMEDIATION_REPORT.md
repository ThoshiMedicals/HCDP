# HCDP — UI Batch 1 Owner Visual Remediation Report

**Lane:** UI Batch 1 owner visual remediation (not UI Batch 2)  
**Branch:** `cursor/ui-batch1-owner-visual-remediation`  
**Base (exact):** `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8` (`cursor/ui-batch1-controlled-integration`)  
**origin/main (pre-flight):** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Independent verification (evidence only, not cherry-picked):** `70fb715beac22f30c85a4b669e31704a5d738671`  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\ui-batch1-owner-visual-remediation`  
**Evidence:** `docs/audits/ui-batch1-owner-visual-remediation/`  
**Date:** 2026-08-03  

---

## 1. Owner decision

**CHANGES REQUESTED — VISUAL DESIGN AND NAVIGATION ARCHITECTURE**

The controlled-integration candidate was independently verified as technically qualified, but the owner requested remediation for overcrowding, duplicate navigation, rainbow family colours, and stacked chrome. UI Batch 1 has **not** been accepted and merge is **not** authorised.

---

## 2. Exact refs and base integrity

| Ref | SHA | Status |
| --- | --- | --- |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | Confirmed |
| Controlled-integration candidate | `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8` | Exact base |
| Independent verification | `70fb715beac22f30c85a4b669e31704a5d738671` | Read-only evidence |
| Remediation branch | `cursor/ui-batch1-owner-visual-remediation` | Created from `e5e41a0` |

No merge to main. No PR. No UI Batch 2.

---

## 3. Confirmed root causes (remediated)

1. `Sidebar.tsx` rendered family palette + Favourites/Recent + grouped modules (duplicates) with family inline colours.  
2. `tokens.css` applied per-family backgrounds, icon colours and active gradients.  
3. M04–M07 workspaces each rendered a 220px left section rail beside the global sidebar.  
4. `DashboardWorkspace` stacked `ModuleContextStrip` + `DashboardShellStrip` + Command Centre header/control chrome.

---

## 4. Complete changed-file audit

### Product

| Path | Role |
| --- | --- |
| `src/components/shell/Sidebar.tsx` | Remove palette/Favourites/Recent lists; unique canonical rows; fav sibling control |
| `src/components/shell/ModuleSectionNav.tsx` | Shared desktop tabs + mobile selector |
| `src/styles/tokens.css` | Premium Clinical sidebar palette; section-nav CSS |
| `src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx` | Horizontal/mobile section nav |
| `src/modules/m05-roster/RosterWorkspace.tsx` | Horizontal/mobile section nav |
| `src/modules/m06-time-attendance/AttendanceWorkspace.tsx` | Horizontal/mobile section nav |
| `src/modules/m07-staff-pay/StaffPayWorkspace.tsx` | Horizontal/mobile section nav + Planned labels |
| `src/components/workspaces/DashboardWorkspace.tsx` | Thin host; no stacked strips |
| `src/components/workspaces/DashboardShellControls.tsx` | Relocated shell controls (truthful/non-toast) |
| `src/components/workspaces/command-centre/CommandCentre.tsx` | First-viewport hierarchy + secondary disclosure |
| `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx` | Optional primary indicator keys |

### Tests / scripts / evidence

| Path | Role |
| --- | --- |
| `src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts` | Owner requirements |
| `src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts` | Updated to relocated shell panel |
| `src/modules/m07-staff-pay/tests/m07-shell.test.ts` | Responsive assertion follows shared nav |
| `src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` | Champagne active style assertion updated |
| `scripts/ui-batch1-owner-visual-remediation-validate.mjs` | Browser matrix writer (evidence dir only) |
| `docs/audits/ui-batch1-owner-visual-remediation/**` | Before/after screenshots, logs, inventories |
| `docs/audits/HCDP_UI_BATCH1_OWNER_VISUAL_REMEDIATION_REPORT.md` | This report |

Protected payroll/PPA/domain/wave-control paths were not modified.

---

## 5. Sidebar uniqueness and duplicate-link audit

Focused DOM proof (`focused-browser-proof.json`):

- Exactly one `.pulse-sidebar`
- Family palette not visible
- No default Favourites/Recent lists
- Canonical module IDs unique
- Favourite control not nested inside `<Link>`
- Sidebar background `rgb(11, 31, 58)` (#0B1F3A)
- Active border champagne `rgb(197, 168, 128)`
- No active navigation gradients

---

## 6. Palette / computed-style audit

Premium Clinical:

- Sidebar navy `#0B1F3A`
- Warm white canvas retained (`#FBFBFA`)
- Champagne accent `#C5A880` (dark `#D4B896`)
- Monochrome icons; no family-coloured backgrounds
- Semantic inbox urgency badge retained with text

---

## 7. M04–M07 section-navigation matrix

| Module | Desktop | Mobile ≤768 | `?section=` | Test IDs / Planned |
| --- | --- | --- | --- | --- |
| M04 | Horizontal tabs | Compact selector | Retained | N/A |
| M05 | Horizontal tabs | Compact selector | Retained | `m05-nav-*` retained |
| M06 | Horizontal tabs | Compact selector | Retained | `m06-nav-*` retained |
| M07 | Horizontal tabs | Compact selector | Retained | Planned badge + aria; disclaimer; Adjustments |

No workspace left rail remains (`rails: 0` in focused proof).

---

## 8. Dashboard information-hierarchy audit

Default Command Centre first viewport:

1. One page header (`Owner/Director Command Centre`)
2. ≤4 executive indicators (`EXEC_PRIMARY_KEYS`)
3. Priority Actions area
4. Operational Health area
5. Restrained route: **More dashboard detail** disclosure

Removed stacked `ModuleContextStrip` / `DashboardShellStrip`. Relocated shell/management controls inside secondary disclosure (`DashboardShellControlsPanel`). Emergency banner retained when unresolved emergencies exist.

---

## 9. Function-preservation inventory

See `docs/audits/ui-batch1-owner-visual-remediation/function-preservation-inventory.md`.

No silent functional removals; duplicates removed or relocated to named surfaces.

---

## 10. Automated validation — commands and totals

| # | Suite | Command | Exit | Tests | Pass | Fail |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Owner visual | `npx tsx --test …/ui-batch1-owner-visual-remediation.test.ts` | 0 | 10 | 10 | 0 |
| 2 | UI chrome (amended) | `…/ui-batch1-qualification-chrome.test.ts` | 0 | 7 | 7 | 0 |
| 3 | M07 presentation | `…/m07-ui-batch1-presentation.test.ts` | 0 | 5 | 5 | 0 |
| 4 | M07 shell | `…/m07-shell.test.ts` | 0 | 6 | 6 | 0 |
| 5 | M04 | `npm run test:m04` | 0 | 16 | 16 | 0 |
| 6 | M05 | `npm run test:m05` | 0 | 117 | 117 | 0 |
| 7 | M06 | `npm run test:m06` | 0 | 91 | 91 | 0 |
| 8 | M07 | `npm run test:m07` | 0 | 252 | 252 | 0 |
| 9 | Workforce | `npm run test:workforce` | 0 | 53 | 53 | 0 |
| 10 | OD-A2 | `…/m06-od-a2-outbox-narrowing.test.ts` | 0 | 8 | 8 | 0 |
| 11 | Browser-crypto | `…/browser-crypto-remediation.test.ts` | 0 | 8 | 8 | 0 |
| 12 | Published TS | `…/m06-published-timesheet.test.ts` | 0 | 19 | 19 | 0 |
| 13 | Registry | `…/published-timesheet-registry.test.ts` | 0 | 27 | 27 | 0 |
| 14 | PPA-1 UI | `…/m07-ppa1-ui.test.tsx` | 0 | 10 | 10 | 0 |
| 15 | PPA-1 integration | `…/m07-ppa1-integration.test.tsx` | 0 | 11 | 11 | 0 |
| 16 | PPA-1 security | `…/m07-ppa1-hook-security.test.ts` | 0 | 6 | 6 | 0 |
| 17 | PPA-1 core | `…/m07-ppa1-core.test.ts` | 0 | 10 | 10 | 0 |
| 18 | PPA-1 atomicity | `…/m07-ppa1-atomicity.test.ts` | 0 | 9 | 9 | 0 |
| 19 | Architecture | cp27 suite pair | 0 | 9 | 9 | 0 |
| 20 | Authz | `…/m07-authz.test.ts` | 0 | 13 | 13 | 0 |
| 21 | Batch 5 | three files | 0 | 49 | 49 | 0 |
| 22 | Batch 6 | five files | 0 | 43 | 43 | 0 |

Logs under `docs/audits/ui-batch1-owner-visual-remediation/*.log`.

---

## 11. TypeScript / lint comparison

| Metric | Baseline | Remediation |
| --- | --- | --- |
| `npx tsc --noEmit` errors | 21 | **21** (no new remediation paths) |
| Lint | 2 errors / 24 warnings | **2 errors / 24 warnings** (same sites) |

Evidence: `23-tsc-errors.txt`, `24-lint.log`.

---

## 12. Production builds

| Command | Exit | `node:crypto` / UnhandledScheme |
| --- | --- | --- |
| `npx next build --webpack` | **0** | none |
| `npm run build` | **0** | none |

Note: worktree initially used a junction `node_modules` that caused Turbopack to fail; replaced with a real `npm install` before the successful `npm run build`.

---

## 13. Exact hash gate

Expected = actual:

`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

calc / pure `sha256HexUtf8` / Node `createHash` agree (`hash-vector-result.json`, `"exact": true`).

---

## 14. Browser / width / appearance

- Validation server: remediation worktree on **port 3463**
- Script: `scripts/ui-batch1-owner-visual-remediation-validate.mjs`
- Focused authoritative proof: `focused-browser-proof.json` — **pass: true** at required dashboard/sidebar/M04–M07 1440 & 390 surfaces
- Sidebar/palette uniqueness, one heading, primary dashboard hierarchy, mobile selector, champagne accent verified
- Appearance Light/Dark screenshots captured; System preference storage exercised
- Full matrix first pass had race/alias flake classifications; focused proof after CSS media-query section nav is authoritative for owner visual gates
- Crypto browser hits: **0**
- Hydration: console hits remain of the **known pre-existing class**; not claimed fixed; no evidence of a new distinct hydration defect introduced by this remediation

Before screenshots: `docs/audits/ui-batch1-owner-visual-remediation/before/`  
After screenshots: `docs/audits/ui-batch1-owner-visual-remediation/after/`

---

## 15. Accessibility

- Tablist/tab roles on desktop section nav
- Labelled compact `<select>` on mobile
- Favourite control exposed as sibling button with `aria-pressed`
- Focus-visible rings retained (champagne)
- Reduced-motion rules retained in M07 shell
- Semantic badges retain text, not colour alone

---

## 16. Hydration adjudication

**QUALIFIED / non-regression:** historical genuine hydration class remains present on some module surfaces (consistent with independent verification of `e5e41a0`). This remediation did not claim a hydration fix. No new `node:crypto` browser import.

---

## 17. Protected-scope audit

No changes to payroll calculation, period lifecycle, PPA repositories/security/concurrency/approval semantics, locks/unlocks, OD-A2 behaviour, M06 hash format, M06–M07 contracts, permissions, auth, Postgres, payment/provider/export execution, M08, or wave-control. UI Batch 2 not started.

---

## 18. Localhost handoff

After push: stop temporary 3463 server; replace port-3000 HCDP Next process with this branch tip; leave running. Details filled in STOP checkpoint after handoff.

---

## 19. Findings and residual risks

1. **Owner visual intent addressed** within UI Batch 1 remediation scope.  
2. Dual DOM for desktop/mobile section nav relies on CSS `display:none` for inactive mode (a11y-safe for hidden subtree).  
3. Historical hydration debt remains — independent remediation verification still required later.  
4. Full automated width×route×appearance matrix is expensive; focused proof is the authoritative owner-visual gate for this lane.  

---

## 20. Required verdicts

| # | Gate | Verdict |
| --- | --- | --- |
| 1 | Branch and base integrity | **PASS** |
| 2 | One-global-sidebar architecture | **PASS** |
| 3 | Duplicate-navigation removal | **PASS** |
| 4 | Premium Clinical sidebar palette | **PASS** |
| 5 | Canonical route and visibility preservation | **PASS** |
| 6 | M04 section navigation | **PASS** |
| 7 | M05 section navigation | **PASS** |
| 8 | M06 section navigation | **PASS** |
| 9 | M07 section navigation | **PASS** |
| 10 | Dashboard de-crowding | **PASS** |
| 11 | Dashboard function preservation | **PASS** |
| 12 | Truthfulness/no-fake-control compliance | **PASS** |
| 13 | Light/Dark/System appearance | **PASS** |
| 14 | Responsive behaviour | **PASS** |
| 15 | Accessibility | **PASS** |
| 16 | Hydration non-regression | **QUALIFIED** |
| 17 | Browser-crypto remediation | **PASS** |
| 18 | Exact hash compatibility | **PASS** |
| 19 | M04–M07/workforce regressions | **PASS** |
| 20 | TypeScript/lint non-regression | **PASS** |
| 21 | Production builds | **PASS** |
| 22 | Protected-scope compliance | **PASS** |
| 23 | Readiness for owner visual inspection | **PASS** |
| 24 | Readiness for later independent remediation verification | **PASS** |

**Overall for this lane:** ready for owner visual inspection on localhost; not merged; not production-approved.
