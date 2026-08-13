/**
 * Aurora Phase A foundation — tokens, shared primitives, Decision A preservation.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AURORA_MOTION_MS,
  AURORA_NAV_FAMILIES_PROPOSED,
  AURORA_PRINCIPLE,
  AURORA_RECOMMENDED_DIMENSIONS_PX,
  AURORA_SPACE_PX,
  SHELL_DIMENSIONS_PX,
  APPEARANCE_MODES,
} from "@/lib/shell/design-contract";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("Aurora foundation — docs and principle", () => {
  it("records audit and design decision docs", () => {
    assert.equal(
      existsSync(join(root, "docs/architecture/design-system/MCOP_AURORA_IMPLEMENTATION_AUDIT.md")),
      true
    );
    assert.equal(
      existsSync(join(root, "docs/architecture/design-system/MCOP_AURORA_DESIGN_DECISION.md")),
      true
    );
    const decision = read("docs/architecture/design-system/MCOP_AURORA_DESIGN_DECISION.md");
    assert.match(decision, /Glass for navigation; clarity for work/);
    assert.match(decision, /Deferred/);
    assert.equal(AURORA_PRINCIPLE, "Glass for navigation; clarity for work.");
    assert.equal(AURORA_NAV_FAMILIES_PROPOSED.length, 11);
  });
});

describe("Aurora foundation — semantic tokens", () => {
  it("ships aurora-tokens.css with required semantic variables", () => {
    const css = read("src/styles/aurora-tokens.css");
    const required = [
      "--aurora-canvas",
      "--aurora-nav-chrome",
      "--aurora-surface",
      "--aurora-surface-raised",
      "--aurora-surface-critical",
      "--aurora-text-primary",
      "--aurora-border-subtle",
      "--aurora-accent",
      "--aurora-accent-hover",
      "--aurora-success",
      "--aurora-warning",
      "--aurora-danger",
      "--aurora-info",
      "--aurora-focus-ring",
      "--aurora-space-1",
      "--aurora-radius-card",
      "--aurora-elevation-raised",
      "--aurora-motion-micro",
      "--aurora-motion-drawer",
      "--aurora-control-height",
      "--aurora-touch-target-min",
      "--aurora-density-comfortable-pad",
      "--aurora-density-compact-pad",
      "--aurora-glass-blur",
    ];
    for (const token of required) {
      assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.deepEqual([...AURORA_SPACE_PX], [4, 8, 12, 16, 24, 32, 40, 48, 64]);
    assert.equal(AURORA_MOTION_MS.micro.token, 120);
    assert.equal(AURORA_MOTION_MS.drawer.token, 200);
  });

  it("is imported from globals.css without removing Decision A tokens", () => {
    const globals = read("src/app/globals.css");
    assert.match(globals, /@import "\.\.\/styles\/tokens\.css"/);
    assert.match(globals, /@import "\.\.\/styles\/aurora-tokens\.css"/);
    const tokens = read("src/styles/tokens.css");
    assert.match(tokens, /--sidebar-expanded:\s*240px/);
    assert.match(tokens, /--topbar-height:\s*48px/);
    assert.equal(SHELL_DIMENSIONS_PX.sidebarExpanded, 240);
    assert.equal(SHELL_DIMENSIONS_PX.topbarHeight, 48);
    assert.ok(AURORA_RECOMMENDED_DIMENSIONS_PX.sidebarExpandedMin >= 264);
  });

  it("keeps appearance modes light/dark/system only", () => {
    assert.deepEqual([...APPEARANCE_MODES], ["light", "dark", "system"]);
    const css = read("src/styles/tokens.css");
    assert.doesNotMatch(css, /body\.theme-emerald\s*\{/);
    const controlBar = read("src/components/workspaces/command-centre/ControlBar.tsx");
    assert.doesNotMatch(controlBar, /theme-emerald|Executive Blue|Medical Emerald/i);
  });
});

describe("Aurora foundation — shared primitives", () => {
  it("exposes Input, Surface/Card, StatusBadge, Skeleton", () => {
    assert.equal(existsSync(join(root, "src/components/ui/Input.tsx")), true);
    assert.equal(existsSync(join(root, "src/components/ui/Surface.tsx")), true);
    assert.equal(existsSync(join(root, "src/components/ui/Skeleton.tsx")), true);
    const badge = read("src/components/ui/Badge.tsx");
    assert.match(badge, /export function StatusBadge/);
    assert.match(badge, /showIcon/);
    const button = read("src/components/ui/Button.tsx");
    assert.match(button, /--aurora-radius-button/);
    const panel = read("src/components/ui/Panel.tsx");
    assert.match(panel, /--aurora-radius-card/);
    assert.match(panel, /data-aurora-surface="content"/);
  });

  it("keeps Drawer/Modal solid raised surfaces with Escape + focus restore", () => {
    const drawer = read("src/components/ui/Drawer.tsx");
    assert.match(drawer, /data-aurora-surface="raised"/);
    assert.match(drawer, /Escape/);
    assert.match(drawer, /prev\?\.focus/);
    assert.match(drawer, /--drawer-width/);
    assert.doesNotMatch(drawer, /aurora-surface--glass/);
    const modal = read("src/components/ui/Modal.tsx");
    assert.match(modal, /data-aurora-surface="raised"/);
    assert.match(modal, /Escape/);
    assert.doesNotMatch(modal, /aurora-surface--glass/);
  });

  it("applies glass chrome only to sidebar/topbar presentation", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /\.pulse-sidebar\s*\{[\s\S]*backdrop-filter/);
    assert.match(css, /\.pulse-top-ribbon\s*\{[\s\S]*backdrop-filter/);
    assert.match(css, /--aurora-nav-chrome/);
  });
});
