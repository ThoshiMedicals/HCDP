/**
 * UI Batch 1 — Owner visual remediation presentation tests.
 * Proves one global sidebar, no rainbow nav, unique canonical modules,
 * shared M04–M07 section nav, and dashboard hierarchy cleanup.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Owner visual remediation — global sidebar", () => {
  const sidebar = () => read("src/components/shell/Sidebar.tsx");
  const tokens = () => read("src/styles/tokens.css");

  it("keeps one pulse-sidebar and does not render family palette / Favourites / Recent lists", () => {
    const src = sidebar();
    assert.match(src, /pulse-sidebar/);
    assert.doesNotMatch(src, /v33-family-palette/);
    assert.doesNotMatch(src, /FAMILY_PALETTE/);
    assert.doesNotMatch(src, />Favourites</);
    assert.doesNotMatch(src, />Recent</);
    assert.doesNotMatch(src, /favMods/);
    assert.doesNotMatch(src, /recentMods/);
    assert.match(src, /readNavPrefs/);
    assert.match(src, /toggleFavorite/);
    assert.match(src, /pushRecent/);
  });

  it("renders search results instead of grouped modules when searching", () => {
    const src = sidebar();
    assert.match(src, /data-nav-mode="search"/);
    assert.match(src, /\{\s*q\s*\?/);
    assert.match(src, /Search results/);
  });

  it("keeps favourite control as sibling of Link (not nested interactive)", () => {
    const src = sidebar();
    assert.match(src, /className=\{cn\("nav-row"/);
    assert.match(src, /className=\{cn\("nav-btn"/);
    assert.match(src, /v33-fav-star/);
    // Fav button must not appear between Link open and Link close as a nested child pattern
    // with button before </Link>. Canonical structure: </Link> then <button ... fav.
    assert.match(src, /<\/Link>\s*<button[\s\S]*v33-fav-star/);
  });

  it("deduplicates canonical modules by platformId", () => {
    const src = sidebar();
    assert.match(src, /renderedIds\.has\(mod\.platformId\)/);
    assert.match(src, /data-canonical-module=\{mod\.platformId\}/);
    assert.match(src, /data-canonical-href=\{`\/\$\{mod\.id\}`\}/);
  });

  it("applies Premium Clinical sidebar palette without family gradients", () => {
    const css = tokens();
    assert.match(css, /\.pulse-sidebar\s*\{[\s\S]*#0b1f3a/i);
    // High-contrast champagne on navy (≥4.5:1 on active row #163456) — IV contrast fix
    assert.match(css, /\.pulse-sidebar\s*\{[\s\S]*--sidebar-champagne:\s*#d6be97/i);
    assert.match(css, /body\.theme-dark\s+\.pulse-sidebar[\s\S]*#d6be97/i);
    assert.doesNotMatch(css, /\.v32-nav-group\s+\.nav-btn\.active\s*\{[^}]*linear-gradient/);
    assert.doesNotMatch(css, /\.sidebar-user\s+\.avatar\s*\{[^}]*linear-gradient/);
    assert.match(css, /\.v33-family-palette,\s*\.v33-family-jump\s*\{[\s\S]*display:\s*none/);
  });
});

describe("Owner visual remediation — M04–M07 section navigation", () => {
  it("provides shared ModuleSectionNav with desktop tabs and mobile selector", () => {
    const nav = read("src/components/shell/ModuleSectionNav.tsx");
    const css = read("src/styles/tokens.css");
    assert.match(nav, /module-section-nav__desktop-only/);
    assert.match(nav, /module-section-nav__compact-only/);
    assert.match(nav, /role="tablist"/);
    assert.match(nav, /role="tab"/);
    assert.match(css, /max-width:\s*768px/);
    assert.match(nav, /module-section-nav__select/);
  });

  it("applies shared nav to M04–M07 without 220px left rails", () => {
    for (const file of [
      "src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx",
      "src/modules/m05-roster/RosterWorkspace.tsx",
      "src/modules/m06-time-attendance/AttendanceWorkspace.tsx",
      "src/modules/m07-staff-pay/StaffPayWorkspace.tsx",
    ]) {
      const src = read(file);
      assert.match(src, /ModuleSectionNav/);
      assert.match(src, /data-workspace-nav="horizontal"/);
      assert.doesNotMatch(src, /grid-cols-\[220px/);
      assert.doesNotMatch(src, /minmax\(0,220px\)/);
    }
  });

  it("preserves section query behaviour and M05/M06 test ids", () => {
    const m04 = read("src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx");
    const m05 = read("src/modules/m05-roster/RosterWorkspace.tsx");
    const m06 = read("src/modules/m06-time-attendance/AttendanceWorkspace.tsx");
    const m07 = read("src/modules/m07-staff-pay/StaffPayWorkspace.tsx");
    assert.match(m04, /params\.set\("section"/);
    assert.match(m05, /testIdPrefix="m05"/);
    assert.match(m06, /testIdPrefix="m06"/);
    assert.match(m07, /router\.replace\(`\$\{pathname\}\?section=\$\{id\}`\)/);
    assert.match(m07, /planned — not operational/);
    assert.match(m07, /M07_NON_CERTIFIED_DISCLAIMER/);
    assert.match(m07, /ariaLabel="Staff Pay sections"/);
  });
});

describe("Owner visual remediation — dashboard hierarchy", () => {
  it("exposes one Command Centre heading owner and primary areas only", () => {
    const dash = read("src/components/workspaces/DashboardWorkspace.tsx");
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    assert.match(dash, /data-dashboard-hierarchy="executive-v2"/);
    assert.equal((dash.match(/<h1\b/g) || []).length, 0);
    assert.match(cc, /Owner\/Director Command Centre/);
    assert.match(cc, /data-dashboard-area="indicators"/);
    assert.match(cc, /data-dashboard-area="priority-actions"/);
    assert.match(cc, /data-dashboard-area="operational-health"/);
    assert.match(cc, /data-dashboard-area="secondary-detail"/);
    assert.match(cc, /EXEC_PRIMARY_KEYS/);
    assert.match(cc, /DashboardShellControlsPanel/);
    assert.match(cc, /More dashboard detail/);
  });

  it("keeps secondary functions reachable including reports / eod / create action", () => {
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    assert.match(cc, /\["reports", "Reports"\]/);
    assert.match(cc, /End-of-Day Summary/);
    assert.match(cc, /onCreateAction/);
    assert.match(cc, /onExport/);
    assert.match(cc, /onNotifications/);
    assert.match(cc, /appearance/);
  });
});

describe("Owner visual remediation — Phase 3 chrome layout (D1–D4)", () => {
  it("EmergencyBanner uses responsive grid and wrap-safe action cluster without shrink-0", () => {
    const src = read("src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx");
    const bannerFn = src.slice(src.indexOf("export function EmergencyBanner"));
    const banner = bannerFn.slice(0, bannerFn.indexOf("export function AnnouncementCarousel"));
    assert.match(banner, /grid gap-3 md:grid-cols-\[minmax\(0,1fr\)_auto\]/);
    assert.match(banner, /flex w-full min-w-0 flex-wrap/);
    assert.doesNotMatch(banner, /shrink-0/);
  });

  it("PageHeader H1 allows wrap (no truncate) and keeps min-w-0", () => {
    const src = read("src/components/shell/PageHeader.tsx");
    assert.match(src, /<h1\b[^>]*className="[^"]*min-w-0/);
    assert.doesNotMatch(src, /<h1\b[^>]*truncate/);
    assert.match(src, /page-title min-w-0/);
  });

  it("brand wordmark hides below lg via brand-compact-text; seg-mini media-hides below 640px", () => {
    const css = read("src/styles/tokens.css");
    const topbar = read("src/components/shell/Topbar.tsx");
    assert.match(topbar, /brand-compact-text/);
    assert.match(topbar, /aria-label="Doctors Pulse Operations Portal"/);
    assert.match(css, /\.brand-compact-text\s*\{/);
    assert.match(
      css,
      /@media\s*\(\s*max-width:\s*1023px\s*\)\s*\{[\s\S]*\.brand-compact-text\s*\{[\s\S]*display:\s*none/
    );
    // Default .seg-mini (before sm media) must be display:none so it cannot override mobile hide.
    const segMiniDefault = css.match(/\/\*[\s\S]*?seg-mini[\s\S]*?\*\/\s*\.seg-mini\s*\{([^}]+)\}/);
    const segMiniBlock =
      segMiniDefault?.[1] ||
      css.match(/(?:^|\n)\.seg-mini\s*\{([^}]+)\}/)?.[1] ||
      "";
    assert.match(segMiniBlock, /display:\s*none/);
    assert.doesNotMatch(segMiniBlock, /display:\s*inline-flex/);
    assert.match(
      css,
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*\{[\s\S]*?\.seg-mini\s*\{[\s\S]*?display:\s*inline-flex/
    );
  });

  it("sidebar-user is a non-overlapping grid stack with full-width act-as row", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /\.sidebar-user\s*\{[\s\S]*display:\s*grid/);
    assert.match(css, /\.sidebar-user\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    assert.match(css, /\.sidebar-user\s*\{[\s\S]*flex-shrink:\s*0/);
    assert.match(
      css,
      /\.v27-sidebar-role\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1[\s\S]*width:\s*100%/
    );
    assert.match(css, /\.v27-sidebar-role select\s*\{[\s\S]*max-width:\s*100%/);
  });
});
