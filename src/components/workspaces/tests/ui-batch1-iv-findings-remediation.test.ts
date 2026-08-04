/**
 * UI Batch 1 — independent-verification findings remediation guards.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("IV findings remediation — hydration", () => {
  it("M07 shell always renders deterministic bootstrap status markup", () => {
    const ws = read("src/modules/m07-staff-pay/StaffPayWorkspace.tsx");
    assert.match(ws, /BOOTSTRAP_STATUS_PLACEHOLDER/);
    assert.match(ws, /data-m07-bootstrap-status="1"/);
    assert.match(ws, /role="status"/);
    assert.match(ws, /useHydrated/);
    assert.doesNotMatch(ws, /\{bootstrap\s*\?\s*\n?\s*<p/);
    assert.doesNotMatch(ws, /suppressHydrationWarning/);
  });

  it("root html allows theme-init attribute divergence via suppressHydrationWarning", () => {
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /suppressHydrationWarning/);
    assert.match(layout, /THEME_INIT_SCRIPT/);
  });

  it("M04 workforce counts stay zero through hydration", () => {
    const ctx = read("src/modules/m04-staff-doctors/context.tsx");
    assert.match(ctx, /EMPTY_WORKFORCE_COUNTS/);
    assert.match(ctx, /useState<WorkforceCounts>\(EMPTY_WORKFORCE_COUNTS\)/);
    assert.match(ctx, /setCounts\(getWorkforceCounts\(\)\)/);
  });

  it("M05 offline banner uses server snapshot false", () => {
    const offline = read("src/modules/m05-roster/components/ux/OfflineState.tsx");
    assert.match(offline, /useSyncExternalStore/);
    assert.match(offline, /getOfflineServerSnapshot/);
  });
});

describe("IV findings remediation — typography tokens", () => {
  it("nav toggles, favourites and section captions use ≥13px control token", () => {
    const css = read("src/styles/tokens.css");
    assert.match(
      css,
      /\.v32-nav-toggle\s*\{[\s\S]*font-size:\s*var\(--type-control\)/
    );
    assert.match(
      css,
      /\.v33-fav-star\s*\{[\s\S]*font-size:\s*var\(--type-control\)/
    );
    assert.match(
      css,
      /\.module-section-nav__select-caption\s*\{[\s\S]*font-size:\s*var\(--type-control\)/
    );
    assert.match(
      css,
      /\.module-section-nav__badge\s*\{[\s\S]*font-size:\s*var\(--type-control\)/
    );
    const globals = read("src/app/globals.css");
    assert.match(globals, /\.text-xs\s*\{[\s\S]*var\(--type-control/);
    assert.match(css, /--type-meta:\s*0\.75rem/);
    assert.match(css, /--type-control:\s*0\.8125rem/);
  });
});

describe("IV findings remediation — favourite contrast", () => {
  it("favourite active/hover colours use high-contrast champagne on navy", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /\.pulse-sidebar\s*\{[\s\S]*--sidebar-champagne:\s*#d6be97/);
    assert.match(css, /\.v33-fav-star\.is-fav\s*\{[\s\S]*color:\s*#d6be97/);
    assert.match(css, /\.v33-fav-star:hover\s*\{[\s\S]*color:\s*#d6be97/);
    assert.match(css, /\.v33-fav-star:focus-visible\s*\{[\s\S]*color:\s*#d6be97/);
  });
});

describe("IV findings remediation — dark surfaces", () => {
  it("settings and action-inbox drop near-white hard-coded surfaces", () => {
    for (const file of [
      "src/components/workspaces/OrganisationWorkspace.tsx",
      "src/components/workspaces/organisation/org-ui.tsx",
      "src/components/workspaces/organisation/LocationsSection.tsx",
      "src/components/workspaces/action-inbox/InboxList.tsx",
      "src/components/workspaces/action-inbox/FiltersBar.tsx",
      "src/components/workspaces/action-inbox/ActionInboxApp.tsx",
    ]) {
      const src = read(file);
      assert.doesNotMatch(src, /#fbfcfd/i);
      assert.doesNotMatch(src, /#fbfdff/i);
      assert.doesNotMatch(src, /bg-\[#eff6ff\]/i);
    }
  });
});

describe("IV findings remediation — appearance persistence host", () => {
  it("theme tokens key off html.theme-dark and init script exists", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /html\.theme-dark/);
    assert.match(css, /html\.theme-dark \.pulse-sidebar, body\.theme-dark \.pulse-sidebar/);
    const init = read("src/components/shell/theme-init-script.ts");
    assert.match(init, /pulse\.cc\.appearance/);
    assert.match(init, /classList\.toggle\("theme-dark"/);
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /THEME_INIT_SCRIPT/);
  });

  it("applyAppearance toggles html theme-dark and syncs body", () => {
    const storage = read("src/lib/command-centre/storage.ts");
    assert.match(storage, /document\.documentElement/);
    assert.match(storage, /classList\.toggle\("theme-dark"/);
    assert.match(storage, /document\.body\?\.classList\.toggle\("theme-dark"/);
    assert.match(storage, /colorScheme/);
  });
});
