/**
 * P1-B4 — Responsive / a11y / appearance / reduced-motion contracts.
 * Local validation only — no product runtime acceptance hooks.
 * Does not claim WCAG certification, pixel parity, CI, or production approval.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B4 appearance initialization and System settle (GAP-008)", () => {
  const storage = read("src/lib/command-centre/storage.ts");
  const themeInit = read("src/components/shell/theme-init-script.ts");
  const portal = read("src/lib/portal-context.tsx");

  it("pre-hydration snapshot matches System default (not false Light)", () => {
    assert.match(storage, /if \(!appearanceHydrated\) return "system"/);
    assert.doesNotMatch(storage, /if \(!appearanceHydrated\) return "light"/);
    assert.match(storage, /getAppearanceServerSnapshot\(\): CcAppearance \{\s*return "system"/);
  });

  it("theme-init resolves Light / Dark / System before paint", () => {
    assert.match(themeInit, /pulse\.cc\.appearance/);
    assert.match(themeInit, /JSON\.parse\(raw\):"system"/);
    assert.match(themeInit, /prefers-color-scheme:\s*dark/);
    assert.match(themeInit, /data-appearance/);
    assert.match(themeInit, /theme-dark/);
  });

  it("OS preference changes re-apply only when stored preference is System", () => {
    assert.match(storage, /subscribeSystemAppearance/);
    assert.match(portal, /subscribeSystemAppearance/);
    assert.match(portal, /getAppearanceSnapshot\(\) === "system"/);
    assert.match(portal, /applyAppearance\("system"\)/);
  });

  it("resolveIsDark and applyAppearance keep preference vs resolved theme separate", () => {
    assert.match(storage, /export function resolveIsDark/);
    assert.match(storage, /value === "dark"/);
    assert.match(storage, /value === "system" && window\.matchMedia/);
    assert.match(storage, /root\.dataset\.appearance = value/);
    assert.match(storage, /classList\.toggle\("theme-dark", dark\)/);
  });
});

describe("P1-B4 keyboard / focus / ARIA baselines (GAP-009)", () => {
  const sidebar = read("src/components/shell/Sidebar.tsx");
  const topbar = read("src/components/shell/Topbar.tsx");
  const drawer = read("src/components/ui/Drawer.tsx");
  const detail = read("src/components/shell/DetailPanel.tsx");
  const sectionNav = read("src/components/shell/ModuleSectionNav.tsx");
  const focusTrap = read("src/lib/shell/focus-trap.ts");

  it("shares focus-trap helpers for Tab containment", () => {
    assert.equal(existsSync(join(root, "src/lib/shell/focus-trap.ts")), true);
    assert.match(focusTrap, /handleFocusTrapKeydown/);
    assert.match(focusTrap, /focusFirst/);
    assert.match(drawer, /handleFocusTrapKeydown/);
    assert.match(detail, /handleFocusTrapKeydown/);
    assert.match(sidebar, /handleFocusTrapKeydown/);
  });

  it("mobile sidebar Escape, focus restore, inert when closed, aria-controls on menu", () => {
    assert.match(sidebar, /Escape/);
    assert.match(sidebar, /prev\.focus/);
    assert.match(sidebar, /inert=\{isMobile && !sidebarOpen/);
    assert.match(sidebar, /aria-hidden=\{isMobile \? !sidebarOpen/);
    assert.match(topbar, /aria-expanded=\{sidebarOpen\}/);
    assert.match(topbar, /aria-controls="shell-sidebar-nav"/);
    assert.match(topbar, /min-h-\[44px\]/);
    assert.match(topbar, /min-w-\[44px\]/);
  });

  it("Drawer and DetailPanel Escape, focus restore, dialog labelling, 44px close targets", () => {
    assert.match(drawer, /role="dialog"/);
    assert.match(drawer, /aria-modal="true"/);
    assert.match(drawer, /Escape/);
    assert.match(drawer, /prev\?\.focus/);
    assert.match(drawer, /min-h-\[44px\]/);
    assert.match(detail, /Escape/);
    assert.match(detail, /prev\?\.focus/);
    assert.match(detail, /min-h-\[44px\]/);
    assert.match(detail, /role=\{resolvedMode === "drawer" \? "dialog" : "complementary"\}/);
  });

  it("ModuleSectionNav implements ARIA tabs arrow-key pattern without inventing roving elsewhere", () => {
    assert.match(sectionNav, /role="tablist"/);
    assert.match(sectionNav, /role="tab"/);
    assert.match(sectionNav, /ArrowRight/);
    assert.match(sectionNav, /ArrowLeft/);
    assert.match(sectionNav, /tabIndex=\{selected \? 0 : -1\}/);
    assert.match(sectionNav, /Home/);
    assert.match(sectionNav, /End/);
  });
});

describe("P1-B4 responsive shell geometry contracts (GAP-031)", () => {
  const sidebar = read("src/components/shell/Sidebar.tsx");
  const topbar = read("src/components/shell/Topbar.tsx");
  const harness = read("scripts/p1-b4-responsive-a11y-appearance-harness.mjs");

  it("mobile closed nav is non-interactive and harness covers required widths", () => {
    assert.match(sidebar, /pointer-events-none/);
    assert.match(sidebar, /data-mobile-nav=\{sidebarOpen \? "open" : "closed"\}/);
    assert.match(topbar, /data-testid="shell-mobile-menu"/);
    for (const w of [1440, 1280, 1024, 768, 430, 390]) {
      assert.match(harness, new RegExp(String(w)));
    }
  });

  it("harness asserts open/closed mobile geometry and no horizontal overflow", () => {
    assert.match(harness, /sidebarOffscreenLeft/);
    assert.match(harness, /docOverflowX/);
    assert.match(harness, /mobile-nav-open/);
    assert.match(harness, /mobile-nav-closed/);
  });
});

describe("P1-B4 reduced-motion (GAP-052)", () => {
  const globals = read("src/app/globals.css");
  const sidebar = read("src/components/shell/Sidebar.tsx");
  const drawer = read("src/components/ui/Drawer.tsx");
  const harness = read("scripts/p1-b4-responsive-a11y-appearance-harness.mjs");

  it("globals force near-zero animation/transition under prefers-reduced-motion: reduce", () => {
    assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(globals, /animation-duration:\s*0\.01ms\s*!important/);
    assert.match(globals, /transition-duration:\s*0\.01ms\s*!important/);
    assert.match(globals, /transition-delay:\s*0s\s*!important/);
    assert.match(globals, /scroll-behavior:\s*auto\s*!important/);
  });

  it("shared overlays opt into motion-safe transitions and harness asserts reduce", () => {
    assert.match(sidebar, /motion-safe:transition-transform/);
    assert.match(drawer, /motion-safe:transition-transform/);
    assert.match(harness, /reducedMotion/);
    assert.match(harness, /prefers-reduced-motion/);
  });
});

describe("P1-B4 historical hydration re-verification scope (GAP-074)", () => {
  const harness = read("scripts/p1-b4-responsive-a11y-appearance-harness.mjs");

  it("harness re-checks M04/M05/M07 routes for shared appearance hydration only", () => {
    assert.match(harness, /\/staff/);
    assert.match(harness, /\/roster/);
    assert.match(harness, /\/staffpay|\/staff-pay/);
    assert.match(harness, /hydration/);
    assert.match(harness, /consoleErrors|hydrationWarnings|Hydration/);
  });
});

describe("P1-B4 preservation and unauthorised later batches", () => {
  const evidence = read("docs/audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md");
  const batches = read("docs/architecture/prototype-parity/phase1/P1_EXECUTION_BATCHES.md");
  const pkg = read("package.json");

  it("adds test:p1-b4 without lockfile/dependency churn in package.json scripts", () => {
    assert.match(pkg, /"test:p1-b4":\s*"tsx --test \\"src\/components\/shell\/tests\/p1-b4-\*\.test\.ts\\"/);
  });

  it("documents B1–B3 accepted, B4 acceptance pending, B5–B8 unauthorised", () => {
    assert.match(evidence, /acceptance pending|Owner acceptance remains pending/i);
    assert.match(evidence, /P1-B5/);
    assert.match(evidence, /NOT AUTHORISED|unauthorised/i);
    assert.match(batches, /P1-B4[\s\S]*acceptance pending/i);
    assert.match(batches, /P1-B5[\s\S]*PLANNED, NOT AUTHORISED/);
    assert.match(batches, /P1-B8[\s\S]*PLANNED, NOT AUTHORISED/);
  });

  it("keeps OWN-P1-011 and OWN-P1-016 open and Aurora isolated", () => {
    assert.match(evidence, /OWN-P1-011/);
    assert.match(evidence, /OWN-P1-016/);
    assert.match(evidence, /Aurora/);
    assert.match(evidence, /isolated|not integrated|not touched/i);
  });
});
