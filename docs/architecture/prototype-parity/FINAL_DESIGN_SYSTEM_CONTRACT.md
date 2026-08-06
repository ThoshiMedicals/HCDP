# Final Product Design Contract

**Canonical images:** Decision A normalised PNG set @ `66e6e64` (do not rehash/replace).  
**Token samples:** `design-token-samples.json` (PIL samples from the nine images).

## Shared shell (all modules)

- Dark navy global left navigation with grouped, collapsible module families; one nav only
- Compact global top ribbon: clinic scope, global search (⌘K), Dashboard, Action Inbox, New Entry, Export, connection, role
- Compact module title, description, horizontal section tabs
- High-density KPI strip bound to real module data
- Primary toolbar: search, filters, sorting, saved views, key actions
- Principal table/list/schedule/dashboard/matrix workspace
- Contextual right detail panel on desktop; drawer/stacked on tablet/mobile
- Sticky headers; deliberate scrolling; no body-level horizontal overflow
- Concise accessible status badges; Light / Dark / System appearance
- Dense above-the-fold use without illegible type or hidden controls
- Visible focus rings on interactive controls; keyboard operable tabs/toolbars

## Dimensions & density targets (1920×1080 / 100%)

- Show title, section nav, KPI strip, toolbar and main work area without excessive initial scroll
- Tables/lists show ≥8–10 useful rows when data exists
- Desktop: one main-pane scroll + one detail-panel scroll
- Mobile: one page scroll + modal/drawer
- Only designed grids/matrices (e.g. roster) may scroll horizontally inside the component
- No more than two obvious simultaneous module scrollbars

## Responsive matrix

1920×1080, 1672×941 (reference), 1440×900, 1366×768, 1280×900, 1024×768, 768×1024, 430×932, 390×844; desktop short-height 900/768/720; 125% zoom.

## Screenshot comparison

- Compare shell, title/tabs, KPI, toolbar, main pane, detail pane
- Fail horizontal overflow, clipping ancestors, unintended truncation, occlusion
- No global centre-point or chrome-only bypass
- Tolerances: anti-alias ≤2px edge; colour delta documented per theme

## Module-specific patterns

See Design Reference Map pattern table (M01/M02/M04/M05/M06/M10/M11/M12/M15).

## Appearance

Light; Dark; System(OS light/dark); reload persistence; clean-storage default. Optional Executive Blue / Medical Emerald only if confirmed — never replace System.

## No-placeholder / no-fake-success

Service-backed transitions, permission enforcement, clinic/tenant isolation, validation/failure states, audit, source links, persistence/reload proof, tests and work-step evidence.
