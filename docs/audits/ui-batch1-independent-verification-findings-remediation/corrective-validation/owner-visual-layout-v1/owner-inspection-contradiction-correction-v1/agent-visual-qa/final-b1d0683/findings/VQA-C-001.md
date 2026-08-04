# VQA-C-001 — CLOSED at b1d0683

**Status:** CLOSED  
**Frozen SHA:** `b1d0683057882546b68c73b1ae679630d8dbbcb8`

## Acceptance criteria (this pass)

| Width | Expected | Observed |
| --- | --- | --- |
| 1024 | Export hidden until xl; Online fully in viewport; Enterprise not shown | Pass — Export `display:none`; Online right≈1010; Enterprise hidden |
| 1280 | Export visible unclipped; Enterprise hidden; Online in viewport | Pass — Export right≈1193.5; full label “Export” |
| 1440 | Export visible unclipped; Enterprise hidden; Online in viewport | Pass — Export right≈1353.5 |
| 1536 | Enterprise visible (`2xl`); Export/Online unclipped | Pass — Enterprise right≈1449.5; Online right≈1522 |

## Screenshot proof

- `../defect-crops/VQA-C-001-light-1024x768-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1280x900-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1440x900-topbar-right.png`
- `../defect-crops/VQA-C-001-light-1536x900-topbar-right.png`
- `../geometry/topbar-export-probe.json` (84 probes, 0 fails)
