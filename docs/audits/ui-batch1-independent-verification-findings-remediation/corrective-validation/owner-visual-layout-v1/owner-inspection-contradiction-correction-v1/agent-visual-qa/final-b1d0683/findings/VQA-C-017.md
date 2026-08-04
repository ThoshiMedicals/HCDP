# VQA-C-017 — OPEN at b1d0683

**Status:** OPEN  
**Severity:** Medium  
**Frozen SHA:** `b1d0683057882546b68c73b1ae679630d8dbbcb8`

## Observation

Topbar ribbon search (`input[aria-label="Search modules and sections"]`) collapses under mid-desktop chrome pressure:

| Viewport | Input content width | Placeholder readability |
| --- | --- | --- |
| 1024 | ~44.5px | “Sear” only — unusable |
| 1280 | ~109.7px | tight / truncated |
| 1440 | ~269.7px | readable |
| 1536 | ~150.9px | degraded again when Enterprise returns |

## Evidence

- `../defect-crops/VQA-C-017-light-1024x768-ribbon-search-crush.png`
- `../defect-crops/VQA-C-017-dark-1024x768-ribbon-search-crush.png`
- `../defect-crops/VQA-C-017-system-1024x768-ribbon-search-crush.png`
- `../geometry/ribbon-search-probe.json`

## Notes

Distinct from closed VQA-C-001 (Export/Enterprise/Online). Remains OPEN after Export hide-until-xl remediation.
