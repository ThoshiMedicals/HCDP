/**
 * P1-B1 — Shared shell primitive contracts (DetailPanel / KpiStrip / PrimaryToolbar).
 * Replaces former runtime harness probe mounting in the product shell.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SHELL_DIMENSIONS_PX } from "@/lib/shell/design-contract";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B1 shell primitives — contract (no runtime probe)", () => {
  it("DetailPanel enforces 320–420 band, Escape close, focus restore, detail-pane region", () => {
    const src = read("src/components/shell/DetailPanel.tsx");
    assert.match(src, /data-shell-region="detail-pane"/);
    assert.match(src, /data-testid="shell-detail-panel"/);
    assert.match(src, /detailPanelMinWidth/);
    assert.match(src, /detailPanelMaxWidth/);
    assert.match(src, /Escape/);
    assert.match(src, /prev\?\.focus/);
    assert.match(src, /aria-labelledby/);
    assert.match(src, /Close detail panel/);
    assert.equal(SHELL_DIMENSIONS_PX.detailPanelWidth, 360);
    assert.equal(SHELL_DIMENSIONS_PX.detailPanelMinWidth, 320);
    assert.equal(SHELL_DIMENSIONS_PX.detailPanelMaxWidth, 420);
  });

  it("KpiStrip and PrimaryToolbar expose Decision A regions and test ids", () => {
    const kpi = read("src/components/shell/KpiStrip.tsx");
    const toolbar = read("src/components/shell/PrimaryToolbar.tsx");
    assert.match(kpi, /data-shell-region="kpi-strip"/);
    assert.match(kpi, /data-testid="shell-kpi-strip"/);
    assert.match(toolbar, /data-shell-region="toolbar"/);
    assert.match(toolbar, /data-testid="shell-primary-toolbar"/);
    assert.match(toolbar, /role="toolbar"/);
  });

  it("Drawer retains Escape, dialog labelling, and contract width", () => {
    const drawer = read("src/components/ui/Drawer.tsx");
    assert.match(drawer, /role="dialog"/);
    assert.match(drawer, /aria-modal="true"/);
    assert.match(drawer, /aria-labelledby/);
    assert.match(drawer, /Escape/);
    assert.match(drawer, /prev\?\.focus/);
    assert.match(drawer, /--drawer-width/);
    assert.match(drawer, /data-testid="shell-drawer"/);
  });

  it("Action Inbox error UI remains in source without sessionStorage force hook", () => {
    const inbox = read("src/components/workspaces/action-inbox/ActionInboxApp.tsx");
    assert.match(inbox, /loadState === "error"/);
    assert.match(inbox, /Couldn.?t load Action Inbox/);
    assert.doesNotMatch(inbox, /p1-b1-harness-force-inbox-error/);
  });

  it("product portal layout does not mount ShellHarnessProbe or harness session keys", () => {
    const layout = read("src/app/(portal)/layout.tsx");
    assert.doesNotMatch(layout, /ShellHarnessProbe/);
    assert.doesNotMatch(layout, /p1-b1-harness-probe/);
    assert.equal(existsSync(join(root, "src/components/shell/ShellHarnessProbe.tsx")), false);
    const harness = read("scripts/p1-b1-shell-harness-smoke.mjs");
    assert.doesNotMatch(harness, /p1-b1-harness-probe/);
    assert.doesNotMatch(harness, /p1-b1-harness-force-inbox-error/);
    assert.doesNotMatch(harness, /shell-harness-open-detail/);
  });
});
