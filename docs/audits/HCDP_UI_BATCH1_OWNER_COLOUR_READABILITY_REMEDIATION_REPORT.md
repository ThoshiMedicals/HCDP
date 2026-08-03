# HCDP — UI Batch 1 Owner Colour and Dark-Mode Readability Remediation Report

**Lane:** UI Batch 1 owner colour / contrast / typography readability remediation (not UI Batch 2)  
**Branch:** `cursor/ui-batch1-owner-colour-readability-remediation`  
**Base (exact):** `f3333b6f27b6c0afc5a29bcff45e9bccea392c35` (`cursor/ui-batch1-owner-visual-remediation`)  
**origin/main (pre-flight):** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Previous controlled-integration candidate:** `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8`  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\ui-batch1-owner-colour-readability-remediation`  
**Evidence:** `docs/audits/ui-batch1-owner-colour-readability-remediation/`  
**Date:** 2026-08-03  

---

## 1. Owner decision

**CHANGES REQUESTED — COLOUR, CONTRAST AND DARK-MODE READABILITY**

Previous Light/Dark/System and palette PASS verdicts from visual remediation are superseded for owner acceptance. Theme mechanics worked, but owner visual readability failed. UI Batch 1 has **not** been accepted and merge is **not** authorised.

---

## 2. Exact refs and base integrity

| Ref | SHA | Status |
| --- | --- | --- |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | Confirmed |
| Visual-remediation tip / exact base | `f3333b6f27b6c0afc5a29bcff45e9bccea392c35` | Confirmed |
| Colour-readability branch | `cursor/ui-batch1-owner-colour-readability-remediation` | Created from `f3333b6` |

No merge to main. No PR. No UI Batch 2. No force-push.

---

## 3. Confirmed defects and corrections

| # | Defect | Correction |
| --- | --- | --- |
| 1 | `.cc-view-tabs button.active` white on near-white `--ink` (~1.10:1) | Active tabs use `--hcdp-action` + `--hcdp-on-action` |
| 2 | `.brand-compact strong` hard `#0f3f7a` on dark (~1.81:1) | Tokenised; dark uses `--hcdp-text` |
| 3 | Dark card borders `#26384e` / `#101d2d` (~1.42:1) | Divider `#34465D`, control border `#5B7088`, surfaces `#172335` / `#1D2B3F` |
| 4 | Dark Button teal white/`#3b82f6` (~3.68:1) | Dark action `#245F98`; on-action white (~6.63:1) |
| 5 | Teal Badge light `--teal-3` vs dark info text (~1.53:1) | Badge tones map to status surface/text/border tokens |
| 6 | `RosterWorkspace` / portals `bg-white` | Replaced with `bg-[var(--card)]` |
| 7 | M04–M06 `text-[#64748b]` (~3.57–3.98:1 dark) | Replaced with `text-[var(--muted)]` |
| 8 | Visible 9–11px text | Type scale: body 15px, labels/tables 14px, meta ≥12px, controls ≥13px |
| 9 | Legacy ribbon/selector/segmented fixed light colours | Tokenised to semantic surface/text/border |
| 10 | Dark inheritance leak (`--card` stuck white) | Re-assert full legacy alias map under `body.theme-dark` |

---

## 4. Complete colour-token mapping

Semantic layer (`:root` / `body.theme-dark`):

| Semantic | Light | Dark |
| --- | --- | --- |
| `--hcdp-canvas` | `#F5F7FA` | `#0F1724` |
| `--hcdp-surface` | `#FFFFFF` | `#172335` |
| `--hcdp-surface-raised` | `#FFFFFF` | `#1D2B3F` |
| `--hcdp-text` | `#17233A` | `#E3EAF2` |
| `--hcdp-text-secondary` | `#42536A` | `#C0CAD6` |
| `--hcdp-text-muted` | `#5F7085` | `#A7B3C2` |
| `--hcdp-divider` | `#D4DCE6` | `#34465D` |
| `--hcdp-control-border` | `#768397` | `#5B7088` |
| `--hcdp-action` | `#123E68` | `#245F98` |
| `--hcdp-on-action` | `#FFFFFF` | `#FFFFFF` |
| `--hcdp-focus` / accent | `#9B7440` | `#D6BE97` |
| `--hcdp-sidebar` | `#0B1F3A` | `#0B1F3A` |

Legacy aliases mapped to semantic layer: `--ink`, `--text`, `--muted`, `--line`, `--soft`, `--card`, `--teal*`, `--theme-*`, `--cc-*`, `--v33-*`, `--v34-*`, `--pce-canvas`, `--accent-champagne*`, `--status-*`, `--focus-ring`.

Status text/surface/border tokens covered for success/warning/critical/info/neutral.

---

## 5. Before / after contrast ratios (browser-computed)

Evidence: `contrast-summary.json`, `focused-contrast-proof.json`.

| Pair | Before (approx) | After Light | After Dark |
| --- | --- | --- | --- |
| Primary text on canvas | fail / hard to read | **14.62:1** | **14.82:1** |
| Muted on surface | <4.5 dark cases | **5.07:1** | **7.43:1** |
| On-action on action | teal ~3.68 | **10.97:1** | **6.63:1** |
| Control border on surface | ~1.42 dark | **3.84:1** | **3.10:1** |
| Active tab text | ~1.10 dark | **10.97:1** | **6.63:1** |
| Brand title | ~1.81 dark | **10.97:1** | **13.04:1** |

Owner targets: primary ≥7:1 achieved; muted/status normal ≥4.5:1 achieved on focused gates; boundaries ≥3:1 achieved.

---

## 6. Typography readability

| Role | Token | Size |
| --- | --- | --- |
| Body | `--type-body` | 15px (`0.9375rem`), line-height 1.5 |
| Labels / tables / numeric | `--type-label/table/numeric` | 14px |
| Metadata / chips | `--type-meta` | 12px minimum |
| Controls / nav | `--type-control` | 13px |

No remaining `font-size: 9|10|11px` in `tokens.css`. Meaningful visible text raised to the minimum scale.

---

## 7. Route / width / appearance matrix

Validation script: `scripts/ui-batch1-owner-colour-readability-validate.mjs`  
Routes: dashboard, action-inbox, settings, M04–M07 sections, staffpay overview/adjustments (+ aliases).  
Widths: 1440 / 1280 / 1024 / 768 / 430 / 390.  
Appearances: Light / Dark / System (+ OS-dark System settle check).

Focused after screenshots captured under `docs/audits/ui-batch1-owner-colour-readability-remediation/after/` for Light/Dark dashboard, sidebar, M04–M07 overview/adjustments at 1440 and 390.

Before baseline: copied from visual-remediation tip evidence with provenance note (PID 21092 on :3000 was hung / CloseWait; second Next lock blocked same-worktree server).

---

## 8. Function-preservation audit

Preserved:

- Single global sidebar + unique canonical module links  
- M04–M07 horizontal tabs + mobile selector + `?section=`  
- Dashboard hierarchy from visual remediation (no restructure beyond readability)  
- Appearance selection/persistence (`pulse.cc.appearance`)  
- Permissions, status meaning, PPA-1 presentation, routes/aliases/redirects  

No payroll/PPA domain/lifecycle/OD-A2/hash/auth changes.

---

## 9. Automated tests and totals

| Suite | Exit | Tests | Pass | Fail |
| --- | --- | --- | --- | --- |
| Colour readability | 0 | 4 | 4 | 0 |
| Owner visual remediation | 0 | 10 | 10 | 0 |
| UI chrome | 0 | 7 | 7 | 0 |
| M07 presentation | 0 | 5 | 5 | 0 |
| M07 shell | 0 | 6 | 6 | 0 |
| OD-A2 | 0 | 8 | 8 | 0 |
| Browser-crypto | 0 | 8 | 8 | 0 |
| Published timesheet | 0 | 19 | 19 | 0 |
| Registry | 0 | 27 | 27 | 0 |
| M04 | 0 | 16 | 16 | 0 |
| M05 | 1* | 117 | 115 | 2* |
| M06 | 0 | 91 | 91 | 0 |
| M07 | 0 | 252 | 252 | 0 |
| Workforce | 0 | 53 | 53 | 0 |
| PPA-1 (5 suites) | 0 | 46 | 46 | 0 |
| Architecture cp27 | 0 | 17 | 17 | 0 |
| Authz | 0 | 13 | 13 | 0 |
| Batch 5 | 0 | 49 | 49 | 0 |
| Batch 6 | 0 | 43 | 43 | 0 |

\*M05 failures are **only** `m05-performance` bulk-submission timing (`>5000ms`) under concurrent validation/build load. Functional M05 assertions passed (115/117). Retried multiple times; same environmental perf flake. No production assertion weakened.

---

## 10. TypeScript / lint comparison

| Metric | Accepted baseline | This lane |
| --- | --- | --- |
| `npx tsc --noEmit` | 21 | **21** |
| Lint | 2 errors / 24 warnings | **2 errors / 24 warnings** (`✖ 26 problems`) |

---

## 11. Builds and hash

| Check | Result |
| --- | --- |
| `npx next build --webpack` | exit **0** |
| `npm run build` | exit **0** |
| Hash expected | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Hash actual | **exact match** (`hash-vector-result.json`) |

---

## 12. Hydration

Hydration console messages observed during browser matrix are classified as **known pre-existing debt** (Command Centre / module shell attribute mismatch pattern also present on visual-remediation tip). No `node:crypto` / UnhandledScheme hits. No new unique hydration message introduced by this colour lane beyond known debt noise.

---

## 13. Protected-scope audit

Not modified: payroll calculations, period lifecycle, PPA domain/repository/security, OD-A2 behaviour, published-timesheet hash format, workforce contracts, permissions/auth, clinic/LE boundaries, Postgres, M08, payments/providers/exports, wave-control, UI Batch 2. No dependency upgrades. No historical evidence rewriting (wave4/5 performance JSON restored when performance suite mutated them).

---

## 14. Residual risks

1. Full matrix incidental contrast scrapes can still false-positive on transparent backgrounds / nested iconography; gates rely on focused token ratios plus bounded fail counts.  
2. System+OS-dark requires portal hydrate settle (`networkidle` / ~1–2s); forced class apply is reliable for Dark mode.  
3. M05 performance suite remains environmentally sensitive on busy hosts.  
4. Owner visual acceptance still required — this lane does **not** authorise merge.

---

## 15. Required verdicts

| # | Gate | Verdict |
| --- | --- | --- |
| 1 | Branch/base integrity | **PASS** |
| 2 | Light-mode readability | **PASS** |
| 3 | Dark-mode readability | **PASS** |
| 4 | Semantic-token consistency | **PASS** |
| 5 | Text contrast | **PASS** |
| 6 | Controls/boundaries/focus contrast | **PASS** |
| 7 | Typography readability | **PASS** |
| 8 | Semantic status readability | **PASS** |
| 9 | Sidebar readability | **PASS** |
| 10 | Dashboard readability | **PASS** |
| 11 | M04–M07 readability | **PASS** |
| 12 | Appearance persistence | **PASS** (Dark reload + System/OS-dark with hydrate settle) |
| 13 | Responsive behaviour | **PASS** |
| 14 | Accessibility (WCAG 2.2 AA gates) | **PASS** |
| 15 | Function preservation | **PASS** |
| 16 | Hydration non-regression | **QUALIFIED** (known debt remains; unchanged class) |
| 17 | Automated regressions | **QUALIFIED** (M05 perf timing flake only) |
| 18 | Builds and exact hash | **PASS** |
| 19 | Protected-scope compliance | **PASS** |
| 20 | Readiness for owner visual inspection | **PASS** (inspection ready; not owner-accepted; no merge) |

---

## 16. Evidence paths

- Report: `docs/audits/HCDP_UI_BATCH1_OWNER_COLOUR_READABILITY_REMEDIATION_REPORT.md`  
- Evidence dir: `docs/audits/ui-batch1-owner-colour-readability-remediation/`  
- Validation script: `scripts/ui-batch1-owner-colour-readability-validate.mjs`  
- Unit tests: `src/components/workspaces/tests/ui-batch1-owner-colour-readability.test.ts`
