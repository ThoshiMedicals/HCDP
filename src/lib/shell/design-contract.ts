/**
 * Decision A / design-system-contract shell constants (P1-B1).
 * Values mirror docs/architecture/prototype-parity/design-system-contract.json.
 * Do not invent dimensions — keep in sync with that contract.
 */

export const SHELL_DIMENSIONS_PX = {
  sidebarExpanded: 240,
  sidebarCollapsed: 72,
  topbarHeight: 48,
  moduleHeaderHeight: 56,
  sectionNavHeight: 40,
  kpiStripMinHeight: 88,
  toolbarHeight: 44,
  detailPanelWidth: 360,
  detailPanelMinWidth: 320,
  detailPanelMaxWidth: 420,
  contentMaxWidth: 1440,
  drawerWidth: 420,
} as const;

export const SHELL_BREAKPOINTS_PX = {
  desktopMin: 1280,
  tabletMin: 768,
  mobileMax: 767,
} as const;

export const APPEARANCE_MODES = ["light", "dark", "system"] as const;
export type AppearanceMode = (typeof APPEARANCE_MODES)[number];

/** Clean-storage default per FINAL_DESIGN_SYSTEM_CONTRACT / design-system-contract.json */
export const APPEARANCE_CLEAN_DEFAULT: AppearanceMode = "system";

export const DP_SEMANTIC_COLORS = {
  light: {
    "--dp-bg-canvas": "#F3F5F7",
    "--dp-bg-surface": "#FFFFFF",
    "--dp-bg-nav": "#0B1F33",
    "--dp-bg-topbar": "#FFFFFF",
    "--dp-text-primary": "#0F172A",
    "--dp-text-secondary": "#475569",
    "--dp-text-on-nav": "#E2E8F0",
    "--dp-border-subtle": "#E2E8F0",
    "--dp-border-strong": "#CBD5E1",
    "--dp-accent-primary": "#2563EB",
    "--dp-accent-primary-hover": "#1D4ED8",
    "--dp-status-critical": "#DC2626",
    "--dp-status-urgent": "#EA580C",
    "--dp-status-ontrack": "#16A34A",
    "--dp-status-overdue": "#7C3AED",
    "--dp-focus-ring": "#2563EB",
  },
  dark: {
    "--dp-bg-canvas": "#0B1220",
    "--dp-bg-surface": "#111827",
    "--dp-bg-nav": "#020617",
    "--dp-bg-topbar": "#111827",
    "--dp-text-primary": "#F8FAFC",
    "--dp-text-secondary": "#94A3B8",
    "--dp-text-on-nav": "#E2E8F0",
    "--dp-border-subtle": "#1F2937",
    "--dp-border-strong": "#334155",
    "--dp-accent-primary": "#3B82F6",
    "--dp-accent-primary-hover": "#60A5FA",
    "--dp-status-critical": "#F87171",
    "--dp-status-urgent": "#FB923C",
    "--dp-status-ontrack": "#4ADE80",
    "--dp-status-overdue": "#A78BFA",
    "--dp-focus-ring": "#60A5FA",
  },
} as const;

export const SCREENSHOT_HARNESS_VIEWPORTS = [
  { name: "desktop-1440", w: 1440, h: 900 },
  { name: "desktop-1280", w: 1280, h: 900 },
  { name: "tablet-1024", w: 1024, h: 768 },
  { name: "tablet-768", w: 768, h: 1024 },
  { name: "mobile-430", w: 430, h: 932 },
  { name: "mobile-390", w: 390, h: 844 },
] as const;

export const SCREENSHOT_REGIONS = [
  "shell-nav",
  "topbar",
  "module-title-tabs",
  "kpi-strip",
  "toolbar",
  "main-pane",
  "detail-pane",
] as const;

/** Aurora Phase A recommended geometry (deferred vs Decision A operational contract). */
export const AURORA_RECOMMENDED_DIMENSIONS_PX = {
  sidebarExpandedMin: 264,
  sidebarExpandedMax: 288,
  sidebarCollapsedMin: 72,
  sidebarCollapsedMax: 80,
  topbarMin: 60,
  topbarMax: 68,
} as const;

/** Aurora spacing scale (8px grid + 4px half-steps). */
export const AURORA_SPACE_PX = [4, 8, 12, 16, 24, 32, 40, 48, 64] as const;

export const AURORA_MOTION_MS = {
  micro: { min: 100, max: 160, token: 120 },
  surface: { min: 140, max: 180, token: 160 },
  drawer: { min: 180, max: 240, token: 200 },
  context: { min: 220, max: 300, token: 240 },
} as const;

export const AURORA_PRINCIPLE = "Glass for navigation; clarity for work." as const;

export const AURORA_NAV_FAMILIES_PROPOSED = [
  "My Work",
  "Executive",
  "Operations",
  "People",
  "Rostering",
  "Finance",
  "Governance",
  "Assets & Facilities",
  "Communications",
  "Digital & Security",
  "Platform",
] as const;

export function effectiveSidebarCollapsed(
  viewportWidth: number,
  userCollapsed: boolean
): boolean {
  if (viewportWidth < SHELL_BREAKPOINTS_PX.tabletMin) return false;
  if (viewportWidth < SHELL_BREAKPOINTS_PX.desktopMin) return true;
  return userCollapsed;
}

export function sidebarWidthPx(viewportWidth: number, userCollapsed: boolean): number {
  if (viewportWidth < SHELL_BREAKPOINTS_PX.tabletMin) {
    return SHELL_DIMENSIONS_PX.sidebarExpanded;
  }
  return effectiveSidebarCollapsed(viewportWidth, userCollapsed)
    ? SHELL_DIMENSIONS_PX.sidebarCollapsed
    : SHELL_DIMENSIONS_PX.sidebarExpanded;
}
