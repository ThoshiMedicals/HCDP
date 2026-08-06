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

describe("IV findings remediation — Phase 3 abort allowlist precision (D6)", () => {
  it("narrows ERR_ABORTED allowlist to same-origin _rsc= or verified prefetch headers", () => {
    const script = read("scripts/ui-batch1-iv-findings-remediation-validate.mjs");
    assert.match(script, /_rsc=/);
    assert.match(script, /next-router-prefetch/i);
    assert.match(script, /prefetchSig|Purpose\|Sec-Purpose|purpose/);
    // Bare disjuncts must not remain as sufficient allowlist conditions.
    assert.doesNotMatch(
      script,
      /url\.includes\("_rsc="\)\s*\|\|\s*url\.includes\("\/_next\/"\)\s*\|\|\s*req\.resourceType\(\)\s*===\s*"fetch"/
    );
    assert.doesNotMatch(script, /resourceType\(\)\s*===\s*"fetch"\s*\)/);
    assert.match(
      script,
      /Bare resourceType\(\)===["']fetch["'] or bare \/_next\//i
    );
  });
});

describe("IV findings remediation — Phase 3 element-clip probe (D5)", () => {
  it("probes chrome controls with clip/occlusion fields and chrome-scoped adjudication", () => {
    const script = read("scripts/ui-batch1-iv-findings-remediation-validate.mjs");
    assert.match(script, /CLIP_PROBE_SELECTOR/);
    assert.match(script, /\.cc-pulse\.cc-surface-danger button/);
    assert.match(script, /\.brand-compact/);
    assert.match(script, /header \.page-title h1/);
    assert.match(script, /\.sidebar-user/);
    assert.match(script, /\.v27-sidebar-role/);
    assert.match(script, /elementFromPoint/);
    assert.match(script, /nearestClippingAncestor/);
    assert.match(script, /elementClipFails/);
    assert.match(script, /element-clip-/);
    assert.match(script, /noisyScrollContainer/);
    assert.match(script, /isInsideClosedDrawer/);
  });

  it("exempts only narrow scroll/occlusion cases — never centre-outside-viewport", () => {
    const script = read("scripts/ui-batch1-iv-findings-remediation-validate.mjs");
    assert.match(script, /legitimateScrollRegionExemption/);
    assert.match(script, /nearestVerticalScrollport/);
    assert.match(script, /stickyFooterScrollOcclusion/);
    assert.match(script, /belowViewportPageScroll/);
    assert.match(script, /verticalOnlyScrollClip/);
    assert.match(script, /horizontalScrollEscape/);
    assert.match(script, /centreInViewport/);
    assert.match(script, /visibleScrollportBox/);
    assert.match(script, /function isJustifiedExemption/);
    assert.match(script, /h\.legitimateScrollRegionExemption/);
    assert.match(script, /h\.stickyFooterScrollOcclusion/);
    assert.match(script, /h\.belowViewportPageScroll/);
    assert.match(script, /h\.horizontalScrollEscape/);
    // Correction 2: global centre-outside-viewport hard-fail bypass MUST be absent.
    assert.doesNotMatch(script, /if\s*\(\s*!h\.centreInViewport\s*\)\s*return false/);
    assert.match(
      script,
      /MUST NOT suppress hard-fails \(Correction 2\)/
    );
    // chromeScoped retained on hits for reporting (not a hard-fail bypass).
    assert.match(script, /h\.chromeScoped/);
    assert.match(script, /chromeScoped:\s*isChromeScoped\(el\)/);
    assert.match(script, /\.pulse-top-ribbon/);
    assert.match(script, /\.cc-pulse\.cc-surface-danger/);
  });

  it("hard-fails element-clip for every meaningful control with row-level accounting identity", () => {
    const script = read("scripts/ui-batch1-iv-findings-remediation-validate.mjs");
    assert.match(script, /const elementClipFails = defectFlagged\.filter/);
    assert.match(script, /function hasDefectFlags/);
    assert.match(script, /clipAccounting/);
    assert.match(script, /elementClipLedger/);
    assert.match(script, /element-clip-ledger\.json/);
    assert.match(script, /accountingEquationHolds/);
    assert.match(
      script,
      /controlsWithDefectFlags = justifiedExemptions \+ unresolvedDefects/
    );
    // Blanket non-chrome bypass must NOT be present.
    assert.doesNotMatch(script, /if\s*\(\s*!h\.chromeScoped\s*\)\s*return false/);
    assert.doesNotMatch(
      script,
      /if\s*\(\s*!h\.chromeScoped\s*\)\s*\{\s*return\s*\(\s*\(h\.outsideViewport/
    );
    // Centre bypass must NOT be present.
    assert.doesNotMatch(script, /if\s*\(\s*!h\.centreInViewport\s*\)\s*return false/);
    // Defect-flag disjunct includes clippedByAncestor for all remaining candidates.
    assert.match(
      script,
      /h\.outsideViewport\s*\|\|\s*\n?\s*h\.clippedByAncestor\s*\|\|\s*\n?\s*h\.occluded\s*\|\|\s*\n?\s*h\.unintendedTruncation/
    );
    // Exit hard when unresolved defects or accounting identity fails.
    assert.match(
      script,
      /summary\.unresolvedDefects\s*>\s*0/
    );
    assert.match(script, /summary\.accountingEquationHolds\s*===\s*false/);
    // Summary reports chrome / non-chrome defect splits among fails.
    assert.match(script, /chromeDefects/);
    assert.match(script, /nonChromeDefects/);
    assert.match(script, /controlsInspected/);
    assert.match(script, /controlsWithDefectFlags/);
    assert.match(script, /justifiedExemptions/);
    assert.match(script, /unresolvedDefects/);
    assert.match(script, /nonChromeElementClipHits/);
    // Probe selectors still cover chrome + module controls.
    assert.match(script, /\.pulse-top-ribbon/);
    assert.match(script, /\.brand-compact/);
    assert.match(script, /\.seg-mini/);
    assert.match(script, /\.cc-pulse\.cc-surface-danger/);
    assert.match(script, /\.sidebar-user/);
    assert.match(script, /page-title h1/);
  });
});

describe("IV findings remediation — Phase 3 hydration governance (D7)", () => {
  it("suppressHydrationWarning appears only once in layout.tsx", () => {
    const layout = read("src/app/layout.tsx");
    const matches = layout.match(/suppressHydrationWarning/g) || [];
    assert.equal(matches.length, 1);
    assert.match(layout, /<html[^>]*suppressHydrationWarning/);
  });

  it("theme-init mutates documentElement for class, data-appearance, and colorScheme", () => {
    const init = read("src/components/shell/theme-init-script.ts");
    assert.match(init, /document\.documentElement/);
    assert.match(init, /classList\.toggle\("theme-dark"/);
    assert.match(init, /setAttribute\("data-appearance"/);
    assert.match(init, /style\.colorScheme/);
    assert.doesNotMatch(init, /document\.body\.classList/);
  });

  it("M04–M07 workspaces never use suppressHydrationWarning", () => {
    for (const file of [
      "src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx",
      "src/modules/m05-roster/RosterWorkspace.tsx",
      "src/modules/m06-time-attendance/AttendanceWorkspace.tsx",
      "src/modules/m07-staff-pay/StaffPayWorkspace.tsx",
    ]) {
      const src = read(file);
      assert.doesNotMatch(src, /suppressHydrationWarning/);
    }
  });
});
