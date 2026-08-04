# Implementation notes — owner-inspection contradiction correction v1

## Task A — Complete clipping gate restored

In `scripts/ui-batch1-iv-findings-remediation-validate.mjs`:

- Removed blanket bypass `if (!h.chromeScoped) return false` from `elementClipFails`.
- Hard-fail now applies to **every** visible meaningful control with centre in viewport, subject only to:
  - `noisyScrollContainer`
  - `legitimateScrollRegionExemption`
  - `stickyFooterScrollOcclusion`
  - `belowViewportPageScroll`
  - `horizontalScrollEscape`
- Remaining candidates fail on: `outsideViewport` | `clippedByAncestor` | `occluded` | `unintendedTruncation`.
- `chromeScoped` still recorded on each hit for reporting.
- Header comment documents the complete gate (chrome-only language removed).
- Summary JSON adds (existing fields retained):
  - `controlsInspected`
  - `controlsWithDefectFlags`
  - `justifiedExemptions`
  - `unresolvedDefects` (alias of fail count)
  - `chromeDefects` / `nonChromeDefects`
  - `elementClipFailCount` unchanged

Test `ui-batch1-iv-findings-remediation.test.ts` updated to assert the complete gate and reject the non-chrome bypass.

## Task B — Presentation-only layout

Primary containment:

1. Table overflow wrapper: `min-w-0 max-w-full` (table keeps `min-w-[800px]` for intentional scroll).
2. Workspace nav cards (M04/M05/M06): `min-w-0 max-w-full`.
3. `.module-section-nav` / `__scroller` / `__desktop-only`: `width:100%; min-width:0; max-width:100%`.
4. M05/M06 `SectionFrame`: `grid min-w-0 gap-4`.
5. Form grids and controls on listed sections: `min-w-0` + `w-full max-w-full` on inputs/selects/buttons; M06 action buttons wrapped with `w-auto max-w-full` so they do not stretch with a blown grid track.

No handler, store, permission, route, schema, or dependency changes.

## Commits (local; Coordinator pushes)

1. `fix(ui): correct m04 m05 m06 responsive control clipping`
2. `test(ui): restore complete meaningful-control clipping gate`

## Verification deferred

Full 338 matrix not run here. Unit test for the gate script assertions run via `tsx --test`.
