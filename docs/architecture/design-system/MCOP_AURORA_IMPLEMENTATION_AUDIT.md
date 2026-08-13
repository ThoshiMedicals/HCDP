# MCOP Aurora Implementation Audit

**Branch:** `cursor/aurora-design-foundation`
**Baseline:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8`
**Reference:** MCOP/HCDP UX/UI Design Direction (Apple-Inspired, Modern, Operational and Development-Ready)
**Scope:** Phase A — design-system foundation + shared shell/primitives only
**Date:** 2026-08-13

## Audit method

Inspected Decision A contract (`docs/architecture/prototype-parity/design-system-contract.json`), `src/styles/tokens.css`, `src/app/globals.css`, shared shell (`src/components/shell/*`), shared UI (`src/components/ui/*`), P1-B1/B2/B3 tests, and portal layout behaviour. Classification keys:

| Tag | Meaning |
| --- | --- |
| **Already compliant** | Aligns with Aurora direction without change |
| **Targeted refinement** | Safe Phase A presentation update on shared surfaces |
| **Later migration** | Desirable Aurora direction; deferred to avoid Decision A / P1 regressions |
| **Must remain unchanged** | Operational, accessibility, or acceptance risk if altered now |

---

## 1. Design tokens

| Finding | Classification | Notes |
| --- | --- | --- |
| Decision A `--dp-*` semantic colours (light/dark) | **Must remain unchanged** | Locked by P1-B1 theme-token tests and `design-system-contract.json` |
| `--hcdp-*` / legacy `--teal` / `--card` / `--v34-*` aliases | **Already compliant** | Compatibility layer; keep aliases |
| Shell dimension tokens (`--sidebar-*` 240/72, `--topbar-height` 48) | **Must remain unchanged** | Decision A + P1-B1 dimension tests; Aurora 264–288 / 60–68 deferred |
| Spacing / radius / motion / density semantic scale | **Targeted refinement** | Add `--aurora-*` scale; do not rewrite Decision A dims |
| Raw colour literals in ordinary shared components | **Targeted refinement** | Replace where a semantic token already exists |
| Executive Blue / Medical Emerald selectable themes | **Later migration** | Explicitly unused (`DEC-BRANDED-THEMES` / P1-GAP-049); Light already uses Executive Blue accents (`#2563EB`) |

## 2. Theme implementation

| Finding | Classification | Notes |
| --- | --- | --- |
| Appearance modes: light / dark / system | **Must remain unchanged** | Clean-storage default `system`; P1-B1 locked |
| `theme-init-script` + `pulse.cc.appearance` | **Must remain unchanged** | Behaviour preserved |
| Branded global themes in ControlBar | **Must remain unchanged** | Must not reintroduce selectable Executive Blue / Medical Emerald |
| Default personality = Light with Executive Blue accents | **Already compliant** | Decision A accent is `#2563EB` |

## 3. Shared buttons and inputs

| Finding | Classification | Notes |
| --- | --- | --- |
| `Button` (`src/components/ui/Button.tsx`) | **Targeted refinement** | Map radius/height/motion to Aurora tokens; keep variants |
| No shared `Input` / `SearchField` primitive | **Targeted refinement** | Add minimal shared Input/Search |
| Module-local inputs with hard-coded styles | **Later migration** | Out of Phase A shared-foundation scope |

## 4. Cards and status badges

| Finding | Classification | Notes |
| --- | --- | --- |
| `Panel` solid operational card | **Targeted refinement** | Align radius/elevation to Aurora content surface (16px standard) |
| `Badge` tone + `role="status"` | **Targeted refinement** | Extend to StatusBadge with text+icon; keep Badge API |
| KPI / financial / compliance cards in modules | **Later migration** | Must stay solid; no glass; module restyle deferred |
| `.cc-pulse` continuous pulse on warnings | **Must remain unchanged** (behaviour) / **Later migration** (design) | Aurora discourages pulsing warnings; reduced-motion already disables it; do not remove module usage in Phase A |

## 5. Sidebar and top context bar

| Finding | Classification | Notes |
| --- | --- | --- |
| Role-aware nav, clinic scope, identity honesty, QA gating | **Must remain unchanged** | P1-B1/B2 accepted behaviour |
| Collapse / tablet icon-rail / mobile drawer + Escape | **Must remain unchanged** | Contract widths and a11y wiring |
| Solid navy nav (`--dp-bg-nav`) | **Targeted refinement** | Keep token; apply restrained glass *presentation* over nav chrome only |
| Topbar solid surface | **Targeted refinement** | Restrained translucent chrome; keep 48px height |
| Navigation family regroup (~11 families) | **Later migration** | Routes/permissions/ownership must not change in Phase A |
| Mobile Today / Actions / Search / More | **Later migration** | Cannot introduce without behavioural risk; document only |

## 6. Drawers, modals, popovers

| Finding | Classification | Notes |
| --- | --- | --- |
| `Drawer` / `Modal` Escape + focus restore | **Already compliant** | Preserve; refine solid surface + motion tokens |
| Drawer width `--drawer-width` 420 | **Must remain unchanged** | Decision A |
| Glass on operational drawer/modal content | **Must remain unchanged** | Forbidden — solid raised surfaces only |
| Full focus trap (Tab cycle) | **Later migration** | Current restore/Escape present; deeper trap can be a later a11y batch |

## 7. Tables and forms

| Finding | Classification | Notes |
| --- | --- | --- |
| Shared `Table` primitive | **Later migration** | Quiet density / compact·comfortable modes — foundation tokens only in Phase A |
| Form workspaces / module forms | **Later migration** | Keep solid high-contrast fields |
| Density tokens (comfortable/compact) | **Targeted refinement** | Expose CSS variables for later consumers |

## 8. Responsive behaviour

| Finding | Classification | Notes |
| --- | --- | --- |
| Decision A breakpoints (1280 / 768 / mobile overlay) | **Must remain unchanged** | |
| ~44px mobile nav targets | **Already compliant** | Present under `max-width: 700px` |
| Do not shrink dense analytics into unusable phone layout | **Must remain unchanged** | |
| Content max-width 1440 | **Already compliant** | Aurora fluid 1440–1600 noted as later option |

## 9. Loading, empty, error, denied, offline

| Finding | Classification | Notes |
| --- | --- | --- |
| `EmptyState` | **Targeted refinement** | Keep; align typography/spacing tokens |
| Shared Skeleton / LoadingBlock | **Targeted refinement** | Add minimal Skeleton |
| Permission-denied / offline patterns | **Later migration** | Exist in modules/workspaces; not all centralized |
| No unauthorised content flash | **Must remain unchanged** | Access checks remain as accepted |

## 10. Motion and reduced motion

| Finding | Classification | Notes |
| --- | --- | --- |
| Global `prefers-reduced-motion` in `globals.css` | **Already compliant** | |
| Aurora duration bands (micro/surface/drawer/context) | **Targeted refinement** | Add tokens; wire shared chrome transitions |
| Floating cards / animated KPI counters | **Must remain unchanged** | Do not introduce |

## 11. Accessibility primitives

| Finding | Classification | Notes |
| --- | --- | --- |
| `:focus-visible` global outline | **Already compliant** | Refine to Aurora focus-ring token alias |
| `aria-expanded` / `aria-controls` on mobile menu | **Already compliant** | Preserve |
| Status colour + text | **Targeted refinement** | StatusBadge adds optional icon |
| Full WCAG 2.2 AA claim | **Later migration** | Phase A builds foundation only — no compliance claim |

## 12. Module-specific duplication

| Finding | Classification | Notes |
| --- | --- | --- |
| Module section nav / KPI / toolbar CSS in `tokens.css` | **Already compliant** | Shared shell; leave logic intact |
| Module-local button/card copies | **Later migration** | Do not create module-specific replacements in Phase A |
| HTML prototype frames | **Must remain unchanged** | Outside Aurora shared foundation |

---

## Phase A implementation map

| Work item | Action in Phase A |
| --- | --- |
| Audit + design decision docs | Create |
| `--aurora-*` semantic tokens + aliases | Create / wire |
| Glass nav + topbar presentation | Refine CSS only |
| Button, Input, Surface/Card, StatusBadge, Skeleton | Refine / create shared |
| Drawer / Modal solid + motion tokens | Refine presentation |
| Shared focus / reduced-motion tokens | Refine |
| Navigation family regroup | Document deferred |
| Mobile Today/Actions/Search/More | Document deferred |
| Sidebar 264–288 / topbar 60–68 | Document deferred (Decision A wins) |
| Executive Blue / Medical Emerald selectable themes | Document deferred |
| Module redesigns / tables density modes UI | Deferred |

## Conflicts with PDF (accepted behaviour wins)

1. **Shell geometry** — Aurora recommends expanded 264–288px and topbar 60–68px; Decision A / P1-B1 require 240 / 72 / 48. **Preserve Decision A.**
2. **Four selectable themes** — Aurora recommends Light/Dark/Executive Blue/Medical Emerald; P1-B1 forbids branded selectable themes. **Preserve light/dark/system;** Light already carries Executive Blue accents.
3. **~11 navigation families** — Document only; do not migrate routes/permissions.
4. **Mobile tab model** — Document only unless proven regression-free (not Phase A).
