# VQA-C-017 — CLOSED at 05f0711

**Title:** Topbar ribbon search field crushed at mid-desktop width  
**Status:** CLOSED  
**Severity:** Medium

## Criteria (owner)

- At 1024 / 1280 / 1440: ribbon search width **≥160px**
- At 1536: search **usable** (full placeholder readable; ≥120px)

## Observation

Shared shell ribbon search (`aria-label="Search modules and sections"`) is no longer crushed. Measured input widths (all modes):

| Viewport | Search width | Pass (≥160 mid / usable 2xl) |
| --- | ---: | --- |
| 1024 | **476px** (wraps to second ribbon row below `xl`) | PASS |
| 1280 | **300.5px** | PASS |
| 1440 | **396px** | PASS |
| 1536 | **212.5px** | PASS |

Placeholder reads fully: “Search modules and sections…”. **84/84** search probes `pass=true`. Closes the OPEN finding from `final-b1d0683` (~44px / “Sear”).

## Evidence

- `../defect-crops/VQA-C-017-light-1024x768-topbar-search-zone-tall.png`
- `../defect-crops/VQA-C-017-light-1024x768-ribbon-search-usable.png`
- `../defect-crops/VQA-C-017-light-1280x900-ribbon-search-usable.png`
- `../defect-crops/VQA-C-017-light-1536x900-ribbon-search-usable.png`
- `../screenshots/light-1024x768-dashboard.png`
- `../geometry/ribbon-search-probe.json`
- `../geometry/ribbon-search-visual-supplement.json`
