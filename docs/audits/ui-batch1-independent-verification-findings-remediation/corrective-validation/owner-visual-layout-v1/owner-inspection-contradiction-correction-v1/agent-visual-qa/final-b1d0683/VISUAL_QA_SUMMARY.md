# Visual QA Summary — final-b1d0683

**Verdict: FAIL**

VQA-C-001 is **CLOSED** with screenshot proof at `b1d0683` (Export intentionally hidden until `xl`; Online in viewport; Enterprise only at `2xl+`). Prior 110 content-control clipping defects remain visually closed. New OPEN finding **VQA-C-017** (ribbon search crush at 1024) keeps the pass at FAIL.

| Metric | Value |
| --- | --- |
| Frozen app SHA | `b1d0683057882546b68c73b1ae679630d8dbbcb8` |
| Live base | `http://127.0.0.1:3501` |
| CSS preflight | `aef84fda6bfb6c30.css` HTTP **200**, contains `.hidden` |
| Screens inspected (new captures) | **858** |
| Routes | 46 |
| Viewports | 8 primary + short-height shell + dedicated **1536×900** for VQA-C-001 |
| Modes | light, dark, system |
| Capture errors | 0 |
| Topbar probes | 84 / fails 0 |
| VQA findings OPEN | **1** (VQA-C-017) |
| VQA findings CLOSED | **8** (VQA-C-001, VQA-C-010…016) |
| Prior 110 defects visually OPEN | **0** |
| Prior 110 defects visually CLOSED | **110** |
| Adjudication resolution | original viewport pixels (`deviceScaleFactor=1`, no downscale) |
| Captured at | 2026-08-04T06:07:21.258Z |
| Prior VQA preserved | `../revalidation-b661b6c/` (not overwritten) |

## Coverage

- Routes: `/dashboard`, `/action-inbox`, `/settings`
- M04: every section via `/staff-doctors` + `?section=`
- M05: every section via `/roster` + `?section=`
- M06: every section via `/time-attendance` + `?section=`
- M07: every section via `/staffpay` + `?section=`
- Shared shell: topbar, sidebar (incl. short-height footer checks), emergency banner (dashboard)
- Modes × viewports: Light / Dark / System at 1440×900, 1280×900, 1024×768, 768×1024, 430×932, 390×844 + 1024×600 / 768×500 shell + 1536×900 VQA-C-001 set

## VQA-C-001 status — CLOSED

| Width | Export | + New Entry | Enterprise | Online |
| --- | --- | --- | --- | --- |
| 1024 | hidden (intentional until xl) | hidden | hidden | fully in viewport |
| 1280 | visible, unclipped | visible | hidden | fully in viewport |
| 1440 | visible, unclipped | visible | hidden | fully in viewport |
| 1536 | visible, unclipped | visible | visible (`2xl`) | fully in viewport |

## Must-recapture prior-fail surfaces

| Surface | Result |
| --- | --- |
| `/staff-doctors` @430 KPI buttons | PASS (closed) |
| `/staff-doctors?section=people` @430 form | PASS (closed) |
| `/staff-doctors?section=credentials` @430 | PASS (closed) |
| `/roster?section=open-shifts` @390/@430 | PASS (closed) |
| M05 coverage / availability / conflicts / settings Evaluate·Clinic·Create Draft | PASS (closed) |
| M06 refresh / bulk / correction / filter / publish @1024/1280/1440 | PASS (closed) |

## Open finding

**VQA-C-017** — Topbar ribbon search crushed at 1024 (~44px; placeholder “Sear”). See `FINDINGS.md`.

## Intentional exemptions (not OPEN)

- Module section-nav desktop horizontal scroll (`.module-section-nav__scroller`)
- Table `min-w-[800px]` internal horizontal scroll

## Evidence paths

- `screenshots/` — 858 full viewport PNGs
- `defect-crops/` — VQA-C-001 + VQA-C-017 focused crops
- `geometry/` — manifests, clip signals, topbar probe, ribbon search probe, prior-defect reprobe
- `FINDINGS.json` / `FINDINGS.md`
- `CONFIRMATION.md` / `SHA_VERIFICATION.md` / `preflight.txt`
