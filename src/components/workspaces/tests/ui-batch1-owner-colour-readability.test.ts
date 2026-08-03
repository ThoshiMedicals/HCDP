/**
 * UI Batch 1 — owner colour / contrast / typography readability tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Owner colour readability — semantic tokens", () => {
  it("defines one semantic theme layer and maps legacy variables", () => {
    const css = read("src/styles/tokens.css");
    for (const token of [
      "--hcdp-canvas",
      "--hcdp-surface",
      "--hcdp-surface-raised",
      "--hcdp-text",
      "--hcdp-text-secondary",
      "--hcdp-text-muted",
      "--hcdp-divider",
      "--hcdp-control-border",
      "--hcdp-action",
      "--hcdp-on-action",
      "--hcdp-focus",
      "--hcdp-selection",
      "--hcdp-status-success-text",
      "--hcdp-status-info-surface",
      "--hcdp-status-critical-border",
    ]) {
      assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(css, /--ink:\s*var\(--hcdp-text\)/);
    assert.match(css, /--text:\s*var\(--hcdp-text-secondary\)/);
    assert.match(css, /--muted:\s*var\(--hcdp-text-muted\)/);
    assert.match(css, /--card:\s*var\(--hcdp-surface\)/);
    assert.match(css, /--theme-primary:\s*var\(--hcdp-action\)/);
    assert.match(css, /body\.theme-dark\s*\{[\s\S]*--card:\s*var\(--hcdp-surface\)/);
    assert.match(css, /body\.theme-dark\s*\{[\s\S]*--ink:\s*var\(--hcdp-text\)/);
    assert.match(css, /body\.theme-dark\s*\{[\s\S]*--theme-primary:\s*var\(--hcdp-action\)/);
    assert.doesNotMatch(css, /body\.theme-dark\s*\{[\s\S]*--theme-primary:\s*#3b82f6/i);
  });

  it("fixes active tabs, brand ribbon and badge teal surface tokens", () => {
    const css = read("src/styles/tokens.css");
    assert.match(
      css,
      /\.cc-view-tabs button\.active\s*\{[\s\S]*background:\s*var\(--hcdp-action\)[\s\S]*color:\s*var\(--hcdp-on-action\)/
    );
    assert.match(css, /\.brand-compact strong\s*\{[\s\S]*color:\s*var\(--hcdp-action\)/);
    assert.doesNotMatch(css, /\.brand-compact strong\s*\{[^}]*#0f3f7a/);
    assert.doesNotMatch(css, /\.brand-dot\s*\{[^}]*linear-gradient/);
    const badge = read("src/components/ui/Badge.tsx");
    assert.match(badge, /tone[\s\S]*teal:[\s\S]*--hcdp-status-info-surface/);
    assert.doesNotMatch(badge, /--teal-3/);
    const button = read("src/components/ui/Button.tsx");
    assert.match(button, /--hcdp-on-action/);
    assert.match(button, /--hcdp-action/);
  });

  it("enforces readable typography minima in tokens and globals", () => {
    const css = read("src/styles/tokens.css");
    const globals = read("src/app/globals.css");
    assert.match(css, /--type-body:\s*0\.9375rem/);
    assert.match(css, /--type-label:\s*0\.875rem/);
    assert.match(css, /--type-meta:\s*0\.75rem/);
    assert.match(css, /--type-control:\s*0\.8125rem/);
    assert.match(globals, /line-height:\s*1\.5/);
    assert.doesNotMatch(css, /font-size:\s*9px/);
    assert.doesNotMatch(css, /font-size:\s*10px/);
    assert.doesNotMatch(css, /font-size:\s*11px/);
  });
});

describe("Owner colour readability — hard-coded leak guards", () => {
  const ownerFiles = [
    "src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx",
    "src/modules/m05-roster/RosterWorkspace.tsx",
    "src/modules/m06-time-attendance/AttendanceWorkspace.tsx",
    "src/modules/m07-staff-pay/StaffPayWorkspace.tsx",
    "src/modules/m07-staff-pay/sections/ExportSection.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Metric.tsx",
  ];

  it("removes light-surface and slate hard-codes from owner inspection modules", () => {
    for (const file of ownerFiles) {
      const src = read(file);
      assert.doesNotMatch(src, /\bbg-white\b/);
      assert.doesNotMatch(src, /text-\[#64748b\]/i);
      assert.doesNotMatch(src, /text-slate-600/);
    }
  });
});
