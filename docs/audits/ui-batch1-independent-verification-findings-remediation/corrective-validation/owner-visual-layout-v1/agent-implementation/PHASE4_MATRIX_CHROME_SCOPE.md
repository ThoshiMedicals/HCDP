# Phase 4 Loop 3 — Chrome-scope element-clip hard fails

**Agent:** Implementation Agent  
**Prior matrix SHA (still noisy):** `fe8bc37fa370b299a4fbe721209761272f27265f`  
**Symptom:** `matrixFail` 77 / `elementClipFailCount` 110 — all remaining fails were **non-chrome** module buttons/inputs clipped by `overflow-x-hidden` (M04/M05/M06 content).  
**Authorised approach:** Correction map D5 — hard-fail **chrome-scoped** controls only.

## Change

`scripts/ui-batch1-iv-findings-remediation-validate.mjs` `elementClipFails` filter:

- Hard-fail **only** when `h.chromeScoped === true` AND (`outsideViewport` | `clippedByAncestor` | `occluded` | `unintendedTruncation`)
- Existing exemptions retained: centre-in-viewport, scroll-region, sticky sidebar-footer, below-fold page scroll, horizontal scroll escape
- Non-chrome hits remain in `elementClipHits` / `overflowHits` for evidence
- Summary counter: `nonChromeElementClipHits`
- Do **not** alter M04–M06 module button layouts in this lane

## Chrome gates (unchanged)

`.pulse-top-ribbon`, `.brand-compact`, `.seg-mini`, `.cc-pulse.cc-surface-danger`, `.sidebar-user` / `.v27-sidebar-role`, page H1

## New application source SHA

See commit `test(ui): chrome-scope element-clip hard fails only` on this branch.
