# MCOP Aurora Integration Readiness

**Status:** Assessment only — **not** authorisation to integrate, merge, or deploy.
**Aurora branch:** `cursor/aurora-design-foundation`
**Aurora baseline:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8`
**Aurora published tip (pre-remediation):** `a5f22d5f422703766c459f6cf7855b44b5bcec28`
**Later P1 stream:** advanced beyond Aurora baseline (includes P1-B4 responsive/a11y/appearance work in other worktrees).

Aurora must **not** be named production-ready or merge-ready until a compatibility assessment is performed against the latest accepted P1 tip on a fresh integration branch.

## Likely overlap / conflicts with later P1 work

| Area | Aurora foundation touch | Later P1 risk |
| --- | --- | --- |
| Appearance hydration | Uses existing `theme-init-script` / `pulse.cc.appearance`; no branded themes | Later P1 may harden hydration / FOUC / system resolution — reapply Aurora tokens without regressing that |
| Sidebar focus trap / inert | Aurora glass presentation on `.pulse-sidebar`; mobile overlay behaviour preserved | Later P1 may add sidebar inert/focus-trap — preserve later behaviour; keep Aurora chrome CSS additive |
| Drawer / DetailPanel focus | Aurora adds `useFocusTrap` to shared Drawer/Modal | Later P1 may have improved DetailPanel/Sidebar traps — reconcile to one shared utility; do not duplicate conflicting listeners |
| ModuleSectionNav keyboard | Untouched in Aurora Phase A | Later P1 keyboard patterns must win if conflict |
| Reduced-motion rules | Aurora motion tokens + existing global reduce media | Prefer single global reduce policy; avoid stacked `!important` fights |
| Mobile navigation target size | Aurora enforces 44px on close controls / small buttons on mobile | Align with later P1 mobile target work; keep Decision A nav row rules |
| Shared focus-trap utilities | New `src/lib/a11y/use-focus-trap.ts` | If later P1 introduces another trap helper, merge semantically into one module |
| Evidence harnesses | `scripts/aurora-foundation-harness.mjs` + `docs/audits/design-system/aurora-foundation/` | Keep separate from P1-B1/B2 harness paths; do not overwrite P1 evidence |
| `package.json` test scripts | Adds `test:aurora` / `test:aurora-harness` | Re-apply script entries carefully if later tip already changed `package.json` |

## Recommended future integration method

1. Create a **fresh integration branch from the latest accepted P1 tip** (not from Aurora tip).
2. **Selectively reapply** Aurora artefacts by semantic review:
   - `src/styles/aurora-tokens.css` + `globals.css` import
   - Additive shell chrome CSS in `tokens.css` (glass nav/topbar only)
   - Shared primitives (`Button`, `Input`, `Panel`/`Surface`, `Badge`/`StatusBadge`, `Skeleton`, Drawer/Modal + `useFocusTrap`)
   - Docs under `docs/architecture/design-system/` and Aurora evidence under `docs/audits/design-system/`
3. **Do not** blind-merge or full-cherry-pick the Aurora branch onto P1.
4. **Preserve later P1 accessibility behaviour** wherever it is stricter or more complete.
5. Run independent regression (P1-B1–B3 + later P1 suites) and a new visual review before any acceptance claim.
6. Keep Decision A dimensions and light/dark/system appearance unless an owner CR revises the contract.

## Explicit non-claims

- Aurora branch is an isolated design-review branch.
- This document does not authorise P1-B4+ work, PPA, Module 8, or production approval.
- Executive Blue / Medical Emerald remain deferred as selectable product themes.
