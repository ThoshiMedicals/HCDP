# VQA-C-001 — CLOSED at 05f0711

**Title:** Topbar Export / New Entry / Enterprise MFA / Online responsive containment  
**Status:** CLOSED  
**Severity:** Medium

## Criteria (owner)

- At 1024 / 1280 / 1440: Export and New Entry **hidden until 2xl**; Online in viewport
- At 1536: Export, New Entry, Enterprise MFA, Online **all fully in viewport**

## Observation

Intentional `2xl:inline-flex` hide for Export / + New Entry / Enterprise MFA. At 1024–1440 those three are `display:none`; Online remains fully inside the viewport (right ≤ viewport − 1). At 1536 all four controls render fully with shortened visible label **Enterprise MFA** (accessible name retained via `aria-label` / `title`). **84/84** topbar probes `passAll=true`.

## Evidence

- `../defect-crops/VQA-C-001-light-1024x768-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1280x900-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1440x900-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1536x900-topbar-right.png`
- `../screenshots/light-1024x768-dashboard.png`
- `../screenshots/light-1536x900-dashboard.png`
- `../geometry/topbar-export-probe.json`
