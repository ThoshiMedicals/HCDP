# P1 Dependency and Sequencing Plan

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`

## Prioritisation order (mandatory)

1. Shared-shell / contract dependencies  
2. Multi-module blockers  
3. Permission / audit honesty  
4. Workflow completeness (**mostly beyond P1**)  
5. Missing controls / states  
6. Responsive / a11y  
7. Lower-risk presentation inconsistencies  

## Sequence diagram

```text
[Owner accepts P0 / clears OWN-NO-P1-YET]
        │
        ▼
   P1-B1 SHARED shell foundation
        │
        ├──────────────► P1-B2 truthfulness (can overlap after B1 entry)
        │
        ▼
   P1-B3 register hygiene (can start after B1 entry; preferred before B5/B6 scoring)
        │
        ▼
   P1-B4 responsive/a11y/appearance evidence
        │
        ▼
   P1-B5 M01/M02 presentation
        │
        ▼
   P1-B6 M04–M07/M11 design apply (preserve frozen domain)
        │
        ▼
   P1-B7 states/permissions/report honesty
        │
        ▼
   P1-B8 P1 closure evidence → STOP
        │
        ▼
   Programme P2+ (separate authorisation)
```

## Hard dependencies

| Item | Depends on | Blocks |
| --- | --- | --- |
| Any P1 batch | P1-GAP-001 + owner scope decision 083 | All implementation |
| P1-B1 | Decision A PNGs installed; design-system-contract | B4–B7 quality |
| P1-B5/B6 | B1 primitives/tokens | Consistent chrome |
| P1-B6 | Wave freeze rules; no domain CR | Accidental SoT rewrite |
| P1-B7 | B1 + honesty decisions from B2 | State matrix |
| P1-B8 | B1–B7 accepted (or owner-truncated scope) | P2 start |
| M01/M02 domain (P2) | Producer modules + P1 shell | Integration completeness |
| M10 (P3) | Unblock plan | Tasks module |
| PPA | Separate owner auth | Not sequenced in P1 |
| M25 | Parked branch only | Not sequenced in P1 |

## Soft dependencies / parallelisation

| Pair | Note |
| --- | --- |
| B2 ∥ B3 after B1 starts | Honesty + register sync are largely independent |
| B3 before B5/B6 | Prevents false readiness scoring during design apply |
| B4 after B1 | Evidence harness needs stable tokens/dimensions |

## Distinctions for owner

### Recommended P1 scope
- B1–B8 as presentation/shell/hygiene/evidence  
- No durable domain completion for M01–M03  
- No placeholder rebuilds  

### Deferred beyond P1
- Programme P2 domain for M01–M07/M11 workflows  
- P3 M10  
- P4–P8 placeholder rebuilds  
- P6-PPA  
- P9 production verification  

### Owner decisions before P1
- Accept P0 pack  
- Confirm SHARED-only vs B1–B8 breadth  
- Name first batch (recommend B1)  
- Stub disposition (hide vs label)  
- Demo visibility  
- Register sync for M11/M07  

### Owner decisions that can wait
- Per-module P2 workflow authorisations  
- M10 unblock approach  
- PPA batch naming  
- M25 future planning acceptance  
- Production deployment  

## Rollback strategy

Each batch on its own branch from the last owner-accepted tip. Rollback = discard unmerged batch branch / reset to previous accepted SHA. Do not rewrite historical P0 evidence commits.
