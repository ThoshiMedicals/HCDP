# Visual Inspection Matrix — Phase 2 Baseline

| Field | Value |
| --- | --- |
| Worktree | `/tmp/hcdp-fix/ui-batch1-vf-fixes` |
| Input SHA | `f837bdd08e1db30e68c63cfb2542e3120bc40d00` |
| Application source SHA | `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742` |
| Method | Visual open/inspect of original-resolution baseline PNGs via Read tool |
| Live render | BLOCKED / not used (:3490 not started; owner :3000 preserved read-only) |
| Scope | Phase 2 baseline screenshot inspection only — not independent verification, merge readiness, or production approval |

## Legend

- **Overlap / Clipping / Truncation / Spacing / Typography / Contrast / Responsive**: `PASS` / `FAIL` / `N/A` / `BLOCKED`
- **Focus**: `N/A` (keyboard focus not tested in screenshot phase)
- **Row verdict**: Visual FAIL if any Critical/Major visual defect applies to that screenshot; PASS only when no listed defect applies

## Matrix

| # | Route | Final URL (from filename) | Source SHA | Viewport WxH | Appearance | Screenshot path | Overlap | Clipping | Truncation | Spacing/alignment | Typography/readability | Contrast | Focus | Responsive-layout | Finding IDs | PASS/FAIL |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dashboard | `/dashboard` | e6e2f90 | 390×844 | Light | `baseline/light-390-_dashboard.png` | FAIL (brand under Dashboard/Action Inbox) | FAIL (View All Announcements past card/viewport) | PASS (H1 readable) | FAIL (topbar + emergency action row) | FAIL (brand obscured; CTA clipped) | PASS (content contrast OK) | N/A | FAIL | VQA-001, VQA-002 | **FAIL** |
| 2 | Dashboard | `/dashboard` | e6e2f90 | 390×844 | Dark | `baseline/dark-390-_dashboard.png` | FAIL | FAIL | PASS (H1 readable) | FAIL | FAIL | PASS | N/A | FAIL | VQA-001, VQA-002 | **FAIL** |
| 3 | Action Inbox | `/action-inbox` | e6e2f90 | 390×844 | Light | `baseline/light-390-_action-inbox.png` | FAIL (brand under nav controls) | N/A (no emergency card) | PASS (H1 full) | FAIL (topbar) | FAIL (brand obscured) | PASS | N/A | FAIL | VQA-002 | **FAIL** |
| 4 | Action Inbox | `/action-inbox` | e6e2f90 | 390×844 | Dark | `baseline/dark-390-_action-inbox.png` | FAIL | N/A | PASS | FAIL | FAIL | PASS | N/A | FAIL | VQA-002 | **FAIL** |
| 5 | Settings / Organisation | `/settings` | e6e2f90 | 390×844 | Light | `baseline/light-390-_settings.png` | FAIL | N/A | FAIL (`Organisation, Locations, U...`) | FAIL (topbar + H1 vs bell) | FAIL (H1 ellipsis) | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 6 | Settings / Organisation | `/settings` | e6e2f90 | 390×844 | Dark | `baseline/dark-390-_settings.png` | FAIL | N/A | FAIL | FAIL | FAIL | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 7 | Staff Pay Overview | `/staffpay/section/overview` | e6e2f90 | 390×844 | Light | `baseline/light-390-_staffpay_section_overview.png` | FAIL | N/A | FAIL (`Staff Pay & Payroll Prepara...`) | FAIL | FAIL | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 8 | Staff Pay Overview | `/staffpay/section/overview` | e6e2f90 | 390×844 | Dark | `baseline/dark-390-_staffpay_section_overview.png` | FAIL | N/A | FAIL | FAIL | FAIL | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 9 | Staff Pay Adjustments | `/staffpay/section/adjustments` | e6e2f90 | 390×844 | Light | `baseline/light-390-_staffpay_section_adjustments.png` | FAIL | N/A | FAIL (`Staff Pay & Payroll Prepara...`) | FAIL | FAIL | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 10 | Staff Pay Adjustments | `/staffpay/section/adjustments` | e6e2f90 | 390×844 | Dark | `baseline/dark-390-_staffpay_section_adjustments.png` | FAIL | N/A | FAIL | FAIL | FAIL | PASS | N/A | FAIL | VQA-002, VQA-003 | **FAIL** |
| 11 | Dashboard | `/dashboard` | e6e2f90 | 1440×900 | Light | `baseline/light-1440-_dashboard.png` | FAIL (sidebar footer identity/role/Act-as) | FAIL (footer crop) | PASS (page H1 full; emergency CTAs in view) | FAIL (sidebar footer stack) | FAIL (footer illegible) | PASS (main content) | N/A | FAIL | VQA-004 | **FAIL** |
| 12 | Dashboard | `/dashboard` | e6e2f90 | 1440×900 | Dark | `baseline/dark-1440-_dashboard.png` | FAIL | FAIL | PASS | FAIL | FAIL | PASS | N/A | FAIL | VQA-004 | **FAIL** |
| 13 | Staff Pay Overview | `/staffpay/section/overview` | e6e2f90 | 1440×900 | Light | `baseline/light-1440-_staffpay_section_overview.png` | FAIL (sidebar footer) | FAIL (footer crop) | PASS (H1 full) | FAIL | FAIL | PASS | N/A | FAIL | VQA-004 | **FAIL** |
| 14 | Staff Pay Overview | `/staffpay/section/overview` | e6e2f90 | 1440×900 | Dark | `baseline/dark-1440-_staffpay_section_overview.png` | FAIL | FAIL | PASS | FAIL | FAIL | PASS | N/A | FAIL | VQA-004 | **FAIL** |

## Totals

| Verdict | Count |
| --- | --- |
| PASS | 0 |
| FAIL | 14 |
| BLOCKED (screenshot rows) | 0 |
| Live-render | BLOCKED (not started; screenshot findings still filed) |
| Screenshots inspected | 14 |
| VQA findings filed | 4 (all OPEN) |

## Defect crop index

| Finding | Crop paths |
| --- | --- |
| VQA-001 | `baseline/defect-crops/VQA-001-light-390-dashboard-emergency-cta.png`, `baseline/defect-crops/VQA-001-dark-390-dashboard-emergency-cta.png` |
| VQA-002 | `baseline/defect-crops/VQA-002-light-390-dashboard-topbar.png`, `baseline/defect-crops/VQA-002-dark-390-settings-topbar.png`, `baseline/defect-crops/VQA-002-light-390-staffpay-topbar.png` |
| VQA-003 | `baseline/defect-crops/VQA-003-light-390-settings-h1.png`, `baseline/defect-crops/VQA-003-dark-390-staffpay-h1.png`, `baseline/defect-crops/VQA-003-light-390-staffpay-adjustments-h1.png` |
| VQA-004 | `baseline/defect-crops/VQA-004-light-1440-dashboard-sidebar-footer.png`, `baseline/defect-crops/VQA-004-dark-1440-dashboard-sidebar-footer.png`, `baseline/defect-crops/VQA-004-light-1440-staffpay-sidebar-footer.png`, `baseline/defect-crops/VQA-004-dark-1440-staffpay-sidebar-footer.png` |

## Explicit non-claims

- No independent verification claim
- No merge readiness claim
- No production approval claim
- No application source edited
