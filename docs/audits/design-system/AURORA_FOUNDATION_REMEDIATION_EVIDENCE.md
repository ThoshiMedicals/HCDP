# AURORA Foundation Remediation Evidence

**Branch:** `cursor/aurora-design-foundation`
**Starting tip:** `a5f22d5f422703766c459f6cf7855b44b5bcec28`
**Original Aurora baseline:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8`
**Archive of original evidence:** `docs/audits/design-system/aurora-foundation/archive-a5f22d5f/`
**Principle:** Glass for navigation; clarity for work.

This remediation independently separates **live application** proofs from **synthetic harness** proofs and corrects accessibility gaps in shared Drawer/Modal primitives.

## Live application versus harness-only capability matrix

| Capability | Evidence class | Notes |
| --- | --- | --- |
| Light | **Live application** + harness | Live shell captured from `/dashboard` with `pulse.cc.appearance=light` |
| Dark | **Live application** + harness | Live shell captured with `appearance=dark` / `theme-dark` |
| System + OS Light | **Harness only** (requested appearance) / live path exists in product | Product supports System; this remediation harness proves OS-light emulation on the static primitive page. Live System resolution is product behaviour (P1-B1), not re-proven in every Aurora shot. |
| System + OS Dark | **Harness only** for Aurora shots | Same as above — System mode is product-supported; Aurora matrix marks synthetic OS-dark harness captures as harness-only. |
| Executive Blue | **Harness only** | Token/personality demonstration via `data-aurora-personality`. **Not** selectable, persisted, or product-themed. |
| Medical Emerald | **Harness only** | Same — demonstration only. Must not be reported as a live theme. |
| Reduced motion | **Harness only** (media emulation) + global CSS present in live app | Live app includes `prefers-reduced-motion` rules in `globals.css` / tokens; Aurora shots prove harness under `reducedMotion: reduce`. |
| Mobile navigation open/closed | **Live application** (shell hamburger) + **Harness only** (synthetic Today/Actions model deferred) | Live mobile uses existing drawer/overlay. Today/Actions/Search/More remains deferred. |
| Drawer/focus behaviour | **Live shared primitives** (Drawer/Modal source) + harness demo | Focus trap remediated in `useFocusTrap` and wired into shared Drawer/Modal. Harness proves Escape/open UI; unit/source tests prove Tab cycle + restore. |

### Authority rules

- Screenshots named `shell-*` are **authoritative for live shell chrome**.
- Screenshots named `harness-*` are **authoritative for shared primitive surfaces only**.
- Do not treat harness Executive Blue / Medical Emerald / synthetic mobile nav as shipped product features.
- Do not claim WCAG 2.2 AA or pixel parity from this evidence.

## Defects found and corrected

### Evidence honesty
- Original README listed themes without separating live vs harness.
- Corrected: this matrix, updated README, and regenerated report fields `source: live|harness`.

### Accessibility — Drawer/Modal focus containment
- Gap: Escape + initial focus + restore existed; **Tab cycle trap did not**.
- Corrected: added `src/lib/a11y/use-focus-trap.ts` and wired into Drawer/Modal.
- Close controls now keep ~44px mobile targets.

### Shared primitives
- Button: `forwardRef`; `type="button"` default retained; small variant grows to 44px on mobile.
- Input: `forwardRef`; optional `label` / `hint` / `error` with `aria-invalid`, describedby, and `role="alert"`.

### Tokens
- Personality hooks remain accent-only (do not overwrite success/warning/danger).
- Decision A shell dimensions unchanged.
- No branded selectable themes introduced.

### Visual
- Reaffirmed glass only on sidebar/topbar chrome; operational cards/critical surfaces stay solid.
- No module redesigns.

## Accessibility status (foundation)

| Class | Items |
| --- | --- |
| Proven in foundation source/tests | Visible focus tokens; Button default type; Input label/error wiring; Drawer/Modal dialog roles; Escape; focus restore; Tab cycle trap; reduced-motion global CSS; Decision A 44px mobile nav rows |
| Partially tested | Live System appearance resolution under Aurora harness; 200% text resize (not automated here); screen-reader end-to-end |
| Deferred formal audit | Full WCAG 2.2 AA; DetailPanel trap parity with Drawer; module-level forms/tables; mobile Today/Actions IA |

Shared Drawer/Modal are **integration candidates for focus behaviour** after later-P1 compatibility assessment — they are no longer “trap deferred”, but they are **not** named merge-ready while later P1 shell a11y overlap remains unassessed in a fresh tip.

## Validation snapshot

- Harness assertions: **170/170** passed
- Screenshots: **72** (live + harness)
- Console/page errors: **0**
- Original evidence archived: archive-a5f22d5f/ (60 shots from a5f22d5)
- Meaningful assertion groups: harnessOverflow, harnessCriticalSolid, harnessFocus, harnessDrawer, harnessReducedMotion, harnessMobileNav, liveShellPresent, liveOverflow (shell chrome), liveThemeResolved
