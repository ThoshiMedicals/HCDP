# MCOP Aurora Design Decision (Phase A)

**Status:** Approved defaults recorded for design review on isolated branch `cursor/aurora-design-foundation`
**Baseline:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8`
**Core principle:** Glass for navigation; clarity for work.
**Design objective:** Apple-inspired clarity + enterprise operational density + healthcare-grade accessibility and trust.

This document records Aurora defaults. Where a default conflicts with accepted Decision A / P1-B1–B2 behaviour, **accepted behaviour is preserved** and the Aurora recommendation is marked **deferred**.

## Approved defaults

| Area | Direction | Phase A treatment |
| --- | --- | --- |
| Personality | Premium, calm, clinical-operational | Applied in shared chrome/primitives |
| Inspiration | Apple HIG principles, not Apple copying | Applied as doctrine; no marketing clone |
| Glass | Navigation and controls only | Applied to sidebar + topbar chrome |
| Operational content | Solid, accessible surfaces | Enforced on Panel/Surface/Drawer/Modal content |
| Navigation | Wide collapsible desktop sidebar | Behaviour preserved (Decision A) |
| Expanded width | Approximately 264–288px | **Deferred** — Decision A 240px retained |
| Collapsed width | Approximately 72–80px | Decision A 72px retained (within band) |
| Top context bar | Approximately 60–68px | **Deferred** — Decision A 48px retained |
| Mobile navigation | Today / Actions / Search / More | **Deferred** — current mobile drawer preserved |
| Dashboard | Attention and action before analytics | Doctrine only; no dashboard redesign |
| Tables | Quiet density with compact/comfortable modes | Tokens only; table UI migration deferred |
| Typography | System-first sans-serif | Already present; retained |
| Grid | 8px with 4px half-steps | `--aurora-space-*` added |
| Standard card radius | 16px | Applied via Aurora radius tokens / Panel |
| Primary actions | Usually one dominant action per view | Doctrine; Button hierarchy refined |
| Status | Text + icon + colour | StatusBadge supports icon + text |
| Motion | Subtle and reduced-motion compatible | Aurora duration tokens + existing reduce media |
| Accessibility | WCAG 2.2 AA target | Foundation only — **no compliance claim** |
| Themes | Light, Dark, Executive Blue, Medical Emerald | **Selectable branded themes deferred** (P1-GAP-049) |
| Default personality | Light with Executive Blue accents | Already true (`--dp-accent-primary: #2563EB`) |
| AI | Contextual assistant that cannot obstruct primary work | Doctrine preserved; no AI chrome redesign that covers work |

## Runtime architecture

- Preserve the existing **24-module** runtime architecture.
- Do **not** perform a final navigation-family migration in Phase A.
- Proposed ~11 navigation families (for a later controlled batch):

  1. My Work
  2. Executive
  3. Operations
  4. People
  5. Rostering
  6. Finance
  7. Governance
  8. Assets & Facilities
  9. Communications
  10. Digital & Security
  11. Platform

## Surface hierarchy (applied)

| Layer | Purpose | Treatment |
| --- | --- | --- |
| Canvas | Application background | Neutral solid (`--aurora-canvas` → Decision A canvas) |
| Navigation chrome | Sidebar, topbar, light toolbars | Restrained translucency / blur |
| Content surface | Cards, tables, forms | Solid |
| Raised surface | Drawer, modal, menu | Solid + elevation |
| Critical surface | Warnings, security, pay blockers | Solid semantic tint — never glass |

## Compatibility policy

- Decision A `--dp-*` tokens remain the contractual source for colours and shell dimensions.
- Aurora `--aurora-*` tokens are an additive semantic layer with aliases into `--dp-*` / `--hcdp-*`.
- Ordinary shared components prefer semantic tokens over raw colour literals when a token exists.
- Do not indiscriminately replace legacy aliases; keep them to prevent broad regressions.

## Explicit non-goals (Phase A)

- No P1 status / gap / owner-decision changes
- No business logic, permissions, routes, SQL, CI, lockfile, or env changes
- No module-by-module redesign
- No payment / payroll / PPA / Module 8 work
- No PR, merge, or deploy from this branch without later explicit authorisation

## Deferred recommendations (summary)

1. Widen sidebar to 264–288px and raise topbar to 60–68px under a Decision A contract revision.
2. Reintroduce Executive Blue / Medical Emerald as *optional* selectable personalities only after P1-GAP-049 owner revision.
3. Migrate navigation IA to ~11 families without changing module ownership.
4. Introduce mobile Today / Actions / Search / More when proven regression-free.
5. Compact/comfortable table density UI and broader form-template migration.
6. Deeper focus-trap utilities and formal WCAG audit.
