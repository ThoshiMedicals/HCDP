# VQA-C-001 — Topbar Export clipped at 1024

| Field | Value |
| --- | --- |
| Finding ID | VQA-C-001 |
| Title | Topbar Export control clipped at 1024px viewport width |
| Status | **OPEN** |
| Severity | Medium |
| Frozen app SHA | `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1` |
| Live base | `http://127.0.0.1:3501` |
| Themes | light, dark, system |
| Viewports | 1024x768, 1024x600 |

## Observation

Shared shell topbar Export button overflows the viewport (~right 1039.8 > 1024) with no horizontal scroll parent. Trailing chrome (Enterprise Sign-In · MFA, Online) is fully off-viewport at the same width. Not present at 1280/1440; mobile shell hides Export.

At 1024×768 the Export control geometry is approximately `x=971.7, w=68.2, right=1039.8` (viewport width 1024). Screenshot crop shows label truncated to **"Expor"**. No scroll parent. Enterprise Sign-In · MFA and Online are fully beyond the right edge.

## Evidence

- `screenshots/light-1024x768-roster_section_coverage.png`
- `screenshots/light-1024x600-dashboard.png`
- `screenshots/light-1024x768-time-attendance_section_settings.png`
- `defect-crops/VQA-C-001-light-1024x768-topbar-export-clip.png`
- `defect-crops/VQA-C-001-light-1024x768-topbar-right-edge.png`
- `defect-crops/VQA-C-001-dark-1024x768-topbar-export-clip.png`
- `defect-crops/VQA-C-001-system-1024x768-topbar-export-clip.png`
- `geometry/topbar-export-probe.json`

## Expected correction

Topbar actions at mid-desktop widths (≈1024) must remain fully inside the viewport via wrap, priority hiding, overflow menu, or equivalent — without clipping Export mid-label.

## Close criteria

CLOSE only with new screenshots at 1024×768 (Light + Dark at minimum) showing Export fully visible with intact border/label, plus geometry `right ≤ viewport width`.
