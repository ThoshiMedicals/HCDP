# Visual QA Summary — contradiction correction v1

**Verdict: FAIL**

Prior 110 content-control clipping defects are visually closed at b661b6c, but new shell finding VQA-C-001 (topbar Export clip at 1024) remains OPEN.

| Metric | Value |
| --- | --- |
| Frozen app SHA | `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1` |
| Live base | `http://127.0.0.1:3501` |
| Screens inspected (new captures) | **840** |
| Routes | 46 |
| Viewports | 8 (6 primary + 2 short-height shell) |
| Modes | light, dark, system |
| Capture errors | 0 |
| VQA findings OPEN | **1** (VQA-C-001) |
| VQA findings CLOSED | **7** (VQA-C-010, VQA-C-011, VQA-C-012, VQA-C-013, VQA-C-014, VQA-C-015, VQA-C-016) |
| Prior 110 defects visually OPEN | **0** |
| Prior 110 defects visually CLOSED | **110** |
| Adjudication resolution | original viewport pixels (`deviceScaleFactor=1`, no downscale) |
| Captured at | 2026-08-04T05:44:18.610Z |

## Coverage

- Routes: `/dashboard`, `/action-inbox`, `/settings`
- M04: every section via `/staff-doctors` + `?section=`
- M05: every section via `/roster` + `?section=`
- M06: every section via `/time-attendance` + `?section=`
- M07: every section via `/staffpay` + `?section=`
- Shared shell: topbar, sidebar (incl. short-height footer checks), emergency banner (dashboard)
- Modes × viewports: Light / Dark / System at 1440×900, 1280×900, 1024×768, 768×1024, 430×932, 390×844 + 1024×600 / 768×500 shell

## Must-recapture prior-fail surfaces

All re-captured and visually inspected (Light primary; Dark/System also in matrix):

| Surface | Result |
| --- | --- |
| `/staff-doctors` @430 KPI buttons | PASS (closed) |
| `/staff-doctors?section=people` @430 form | PASS (closed) |
| `/staff-doctors?section=credentials` @430 | PASS (closed) |
| `/roster?section=open-shifts` @390/@430 | PASS (closed) |
| M05 coverage / availability / conflicts / settings Evaluate·Clinic·Create Draft | PASS (closed) |
| M06 Refresh / Bulk Approve / Request Correction / Clear Filter / Publish @1024/1280/1440 | PASS (closed) |

## Open finding

**VQA-C-001** — Topbar **Export** clipped at 1024×768 / 1024×600 (text reads “Expor…”); trailing chrome off-viewport. See `FINDINGS.md`.

## Intentional exemptions (not OPEN)

- Module section-nav desktop horizontal scroll (`.module-section-nav__scroller`)
- Table `min-w-[800px]` internal horizontal scroll

## Evidence paths

- `screenshots/` — 840 full viewport PNGs
- `defect-crops/` — focused crops including VQA-C-001
- `geometry/` — manifests, clip signals, prior-defect reprobe, topbar probe
- `FINDINGS.json` / `FINDINGS.md`
- `CONFIRMATION.md` / `SHA_VERIFICATION.md`
