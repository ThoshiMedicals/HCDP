/**
 * P1-B1 — Shell dimension / collapse contract at 1280 / 768 / 390.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SHELL_DIMENSIONS_PX,
  effectiveSidebarCollapsed,
  sidebarWidthPx,
} from "@/lib/shell/design-contract";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B1 shell dimensions — 1280 / 768 / 390", () => {
  it("declares Decision A shell CSS variables", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /--sidebar-expanded:\s*240px/);
    assert.match(css, /--sidebar-collapsed:\s*72px/);
    assert.match(css, /--sidebar:\s*240px/);
    assert.match(css, /--topbar-height:\s*48px/);
    assert.match(css, /--module-header-height:\s*56px/);
    assert.match(css, /--section-nav-height:\s*40px/);
    assert.match(css, /--kpi-strip-min-height:\s*88px/);
    assert.match(css, /--toolbar-height:\s*44px/);
    assert.match(css, /--detail-panel-width:\s*360px/);
    assert.match(css, /--detail-panel-min-width:\s*320px/);
    assert.match(css, /--detail-panel-max-width:\s*420px/);
    assert.match(css, /--drawer-width:\s*420px/);
  });

  it("computes sidebar 240 at 1280 expanded and 72 when collapsed", () => {
    assert.equal(sidebarWidthPx(1280, false), SHELL_DIMENSIONS_PX.sidebarExpanded);
    assert.equal(sidebarWidthPx(1280, true), SHELL_DIMENSIONS_PX.sidebarCollapsed);
    assert.equal(effectiveSidebarCollapsed(1280, false), false);
    assert.equal(effectiveSidebarCollapsed(1280, true), true);
  });

  it("computes icon rail 72 at tablet 768 regardless of user preference", () => {
    assert.equal(sidebarWidthPx(768, false), SHELL_DIMENSIONS_PX.sidebarCollapsed);
    assert.equal(sidebarWidthPx(768, true), SHELL_DIMENSIONS_PX.sidebarCollapsed);
    assert.equal(effectiveSidebarCollapsed(768, false), true);
  });

  it("computes expanded overlay width 240 at mobile 390", () => {
    assert.equal(sidebarWidthPx(390, false), SHELL_DIMENSIONS_PX.sidebarExpanded);
    assert.equal(sidebarWidthPx(390, true), SHELL_DIMENSIONS_PX.sidebarExpanded);
    assert.equal(effectiveSidebarCollapsed(390, true), false);
  });

  it("wires Topbar/PageHeader/Sidebar/Drawer to contract dimensions", () => {
    const topbar = read("src/components/shell/Topbar.tsx");
    assert.match(topbar, /--topbar-height/);
    assert.match(topbar, /data-shell-region="topbar"/);
    assert.match(topbar, /data-testid="shell-mobile-menu"/);
    assert.match(topbar, /aria-expanded=\{sidebarOpen\}/);
    assert.doesNotMatch(topbar, /min-h-\[52px\]/);

    const header = read("src/components/shell/PageHeader.tsx");
    assert.match(header, /--module-header-height/);
    assert.match(header, /data-shell-region="module-title-tabs"/);

    const sidebar = read("src/components/shell/Sidebar.tsx");
    assert.match(sidebar, /data-shell-region="shell-nav"/);
    assert.match(sidebar, /data-collapsed=/);
    assert.match(sidebar, /setSidebarCollapsed/);
    assert.match(sidebar, /md:translate-x-0/);
    assert.match(sidebar, /data-mobile-nav/);
    assert.match(sidebar, /shell-mobile-nav-overlay/);
    assert.match(sidebar, /Escape/);

    const drawer = read("src/components/ui/Drawer.tsx");
    assert.match(drawer, /--drawer-width/);
    assert.doesNotMatch(drawer, /760px/);

    const portal = read("src/lib/portal-context.tsx");
    assert.match(portal, /syncShellSidebarWidth/);
    assert.doesNotMatch(portal, /288px/);
  });

  it("exposes shared KPI / toolbar / detail panel primitives", () => {
    const kpi = read("src/components/shell/KpiStrip.tsx");
    const toolbar = read("src/components/shell/PrimaryToolbar.tsx");
    const detail = read("src/components/shell/DetailPanel.tsx");
    assert.match(kpi, /data-shell-region="kpi-strip"/);
    assert.match(toolbar, /data-shell-region="toolbar"/);
    assert.match(detail, /data-shell-region="detail-pane"/);
    assert.match(detail, /detailPanelMinWidth/);
    assert.match(detail, /detailPanelMaxWidth/);
  });
});
