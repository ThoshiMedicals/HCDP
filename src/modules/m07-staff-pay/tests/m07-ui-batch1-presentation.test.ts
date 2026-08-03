/**
 * UI Batch 1 — Premium Clinical token + shared component presentation tests.
 * Presentation only; does not assert domain behaviour.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("UI Batch 1 — Premium Clinical tokens and shared presentation", () => {
  it("defines Premium Clinical canvas and Champagne accent tokens (UI-TOK-01)", () => {
    const tokens = read("src/styles/tokens.css");
    assert.match(tokens, /--pce-canvas:\s*#fbfbfa/i);
    assert.match(tokens, /--v34-canvas:\s*#fbfbfa/i);
    assert.match(tokens, /--accent-champagne:\s*#c5a880/i);
    assert.match(tokens, /--status-success:/);
    assert.match(tokens, /--status-warning:/);
    assert.match(tokens, /--status-critical:/);
    assert.match(tokens, /--status-info:/);
    assert.match(tokens, /body\.theme-dark/);
    assert.match(tokens, /--focus-ring:/);
    // Champagne used sparingly for selected nav accent — not as table fill utility
    assert.match(tokens, /\.nav-row\.active[\s\S]*border-left-color:\s*var\(--sidebar-champagne\)/);
    assert.doesNotMatch(tokens, /\.v32-nav-group\s+\.nav-btn\.active\s*\{[^}]*linear-gradient/);
    assert.doesNotMatch(tokens, /tr\s*\{[^}]*--accent-champagne/);
  });

  it("standardises portal typography on the existing production font stack", () => {
    const globals = read("src/app/globals.css");
    assert.match(globals, /ui-sans-serif,\s*system-ui/);
    assert.doesNotMatch(globals, /fonts\.googleapis/);
    assert.match(globals, /\.hcdp-type-display/);
    assert.match(globals, /\.hcdp-type-heading/);
    assert.match(globals, /\.hcdp-type-label/);
    assert.match(globals, /\.hcdp-type-table/);
    assert.match(globals, /\.hcdp-type-numeric/);
    assert.match(globals, /\.hcdp-type-meta/);
    assert.match(globals, /prefers-reduced-motion/);
  });

  it("shared Tabs use Champagne selected accent and accessible tab roles", () => {
    const tabs = read("src/components/ui/Tabs.tsx");
    assert.match(tabs, /role="tablist"/);
    assert.match(tabs, /role="tab"/);
    assert.match(tabs, /aria-selected/);
    assert.match(tabs, /accent-champagne/);
    assert.match(tabs, /focus-ring/);
  });

  it("PageHeader removes decorative mock-refresh toast action (UI-FAKE-01)", () => {
    const header = read("src/components/shell/PageHeader.tsx");
    assert.doesNotMatch(header, /extracted HTML mock data/i);
    assert.doesNotMatch(header, /pushToast\(/);
    assert.match(header, /href="\/action-inbox"/);
    assert.match(header, /aria-label="Open Action Inbox"/);
  });

  it("shared Table remains neutral denseness without Champagne row fills", () => {
    const table = read("src/components/ui/Table.tsx");
    assert.match(table, /hcdp-type-table/);
    assert.match(table, /var\(--card\)/);
    assert.doesNotMatch(table, /accent-champagne/);
  });
});
