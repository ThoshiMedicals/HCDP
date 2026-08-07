# Final Product Design Contract

**Canonical images:** Decision A normalised PNG set @ `66e6e6488b27b9098dadd8962473fedea5053614` (do not rehash/replace).  
**Machine contract:** `design-system-contract.json`  
**PIL palette samples:** `design-token-samples.json` (supporting evidence only — not a complete contract).

## Appearance (owner-closed DEC-BRANDED-THEMES)

- **Allowed global modes:** Light, Dark, System (OS `prefers-color-scheme`)
- **Persistence:** reload-safe user preference; clean-storage default = System
- **Forbidden as global themes:** Executive Blue, Medical Emerald
- **Allowed:** module-family accent colours as sidebar/navigation identification cues only; accents must not replace or interfere with Light/Dark/System surfaces

## Semantic colour tokens

### Light
| Token | Value |
| --- | --- |
| `--dp-bg-canvas` | `#F3F5F7` |
| `--dp-bg-surface` | `#FFFFFF` |
| `--dp-bg-nav` | `#0B1F33` |
| `--dp-bg-topbar` | `#FFFFFF` |
| `--dp-text-primary` | `#0F172A` |
| `--dp-text-secondary` | `#475569` |
| `--dp-text-on-nav` | `#E2E8F0` |
| `--dp-border-subtle` | `#E2E8F0` |
| `--dp-border-strong` | `#CBD5E1` |
| `--dp-accent-primary` | `#2563EB` |
| `--dp-accent-primary-hover` | `#1D4ED8` |
| `--dp-status-critical` | `#DC2626` |
| `--dp-status-urgent` | `#EA580C` |
| `--dp-status-ontrack` | `#16A34A` |
| `--dp-status-overdue` | `#7C3AED` |
| `--dp-focus-ring` | `#2563EB` |

### Dark
| Token | Value |
| --- | --- |
| `--dp-bg-canvas` | `#0B1220` |
| `--dp-bg-surface` | `#111827` |
| `--dp-bg-nav` | `#020617` |
| `--dp-bg-topbar` | `#111827` |
| `--dp-text-primary` | `#F8FAFC` |
| `--dp-text-secondary` | `#94A3B8` |
| `--dp-text-on-nav` | `#E2E8F0` |
| `--dp-border-subtle` | `#1F2937` |
| `--dp-border-strong` | `#334155` |
| `--dp-accent-primary` | `#3B82F6` |
| `--dp-accent-primary-hover` | `#60A5FA` |
| `--dp-status-critical` | `#F87171` |
| `--dp-status-urgent` | `#FB923C` |
| `--dp-status-ontrack` | `#4ADE80` |
| `--dp-status-overdue` | `#A78BFA` |
| `--dp-focus-ring` | `#60A5FA` |

## Typography

Font stack: `IBM Plex Sans`, `Source Sans 3`, `Segoe UI`, sans-serif (mono: `IBM Plex Mono`).

| Role | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Display | 28px | 600 | 1.25 |
| Title | 20px | 600 | 1.30 |
| Subtitle | 16px | 600 | 1.35 |
| Body | 14px | 400 | 1.45 |
| Body strong | 14px | 600 | 1.45 |
| Label | 12px | 600 | 1.30 |
| Caption | 11px | 500 | 1.30 |
| KPI value | 24px | 650 | 1.20 |

## Spacing & density

Scale: 0/4/8/12/16/20/24/32/40 px. Density: high operational workbench.  
Table row 36px (compact 32px); control height 32px (large 36px); card padding 12px; section gap 16px.

## Shell dimensions (px)

| Element | Value |
| --- | ---: |
| Sidebar expanded | 240 |
| Sidebar collapsed | 72 |
| Topbar height | 48 |
| Module header | 56 |
| Section nav | 40 |
| KPI strip min height | 88 |
| Toolbar | 44 |
| Detail panel | 360 (min 320 / max 420) |

KPI card min width 160 / height 84; filter chip 28; table header 36; drawer 420; modal 480/640/800.

## Collapse behaviour

- Desktop ≥1280: expanded sidebar; docked detail; dual scroll (main + detail)
- Tablet 768–1279: icon rail; detail drawer; filter sheet
- Mobile ≤767: hamburger; full-screen detail sheet; tables→cards; one page scroll + modal/drawer

## Focus, keyboard, contrast

- Focus ring: 2px solid `--dp-focus-ring`, 2px offset
- Keyboard: tabs, toolbars, row activation, dialogs, drawers; Esc closes overlays
- Contrast: WCAG 2.2 AA (≥4.5:1 text; ≥3:1 large/UI)
- Targets ≥24×24 (preferred 32×32 primary)
- Respect `prefers-reduced-motion`

## Screenshot viewports & tolerances

Viewports: 1672×941 (ref), 1920×1080, 1440×900, 1366×768, 1280×900, 1024×768, 768×1024, 430×932, 390×844, 1440×720, 1536×864@125%.  
Regions: shell-nav, topbar, module-title-tabs, kpi-strip, toolbar, main-pane, detail-pane.  
Tolerances: edge antialias ≤2px; colour ΔRGB ≤8; layout shift ≤4px; fail overflow/clipping/occlusion; no centre-point or chrome-only bypass.

## Module-specific patterns

Shared rules above; pattern mapping in `DESIGN_REFERENCE_MAP.md` (M01/M02/M04/M05/M06/M10/M11/M12/M15).

## No-placeholder / no-fake-success

Service-backed transitions, permission enforcement, clinic/tenant isolation, validation/failure states, audit, source links, persistence/reload proof, tests and work-step evidence.
