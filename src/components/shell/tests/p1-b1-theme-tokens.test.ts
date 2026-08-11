/**
 * P1-B1 — Theme token resolution (light/dark/system) vs design-system-contract.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPEARANCE_CLEAN_DEFAULT,
  APPEARANCE_MODES,
  DP_SEMANTIC_COLORS,
} from "@/lib/shell/design-contract";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B1 theme tokens — Decision A contract", () => {
  it("exposes Light/Dark/System modes with System clean-storage default", () => {
    assert.deepEqual([...APPEARANCE_MODES], ["light", "dark", "system"]);
    assert.equal(APPEARANCE_CLEAN_DEFAULT, "system");
    const init = read("src/components/shell/theme-init-script.ts");
    assert.match(init, /JSON\.parse\(raw\):"system"/);
    assert.match(init, /a!=="system"\)a="system"/);
    const storage = read("src/lib/command-centre/storage.ts");
    assert.match(storage, /readJson<CcAppearance>\(CC_STORAGE\.appearance, "system"\)/);
    assert.match(storage, /getAppearanceServerSnapshot\(\): CcAppearance \{\s*return "system"/);
  });

  it("defines --dp-* light tokens matching design-system-contract values", () => {
    const css = read("src/styles/tokens.css");
    for (const [token, value] of Object.entries(DP_SEMANTIC_COLORS.light)) {
      assert.match(
        css,
        new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*${value}`, "i"),
        `missing light ${token}=${value}`
      );
    }
  });

  it("defines --dp-* dark tokens under html.theme-dark / body.theme-dark", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /html\.theme-dark,\s*body\.theme-dark\s*\{/);
    for (const [token, value] of Object.entries(DP_SEMANTIC_COLORS.dark)) {
      assert.match(
        css,
        new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*${value}`, "i"),
        `missing dark ${token}=${value}`
      );
    }
  });

  it("maps legacy --hcdp-* surfaces to Decision A --dp-* tokens", () => {
    const css = read("src/styles/tokens.css");
    assert.match(css, /--hcdp-canvas:\s*var\(--dp-bg-canvas\)/);
    assert.match(css, /--hcdp-surface:\s*var\(--dp-bg-surface\)/);
    assert.match(css, /--hcdp-action:\s*var\(--dp-accent-primary\)/);
    assert.match(css, /--hcdp-focus:\s*var\(--dp-focus-ring\)/);
    assert.match(css, /--hcdp-sidebar:\s*var\(--dp-bg-nav\)/);
  });

  it("does not reintroduce Executive Blue / Medical Emerald as selectable global themes", () => {
    const css = read("src/styles/tokens.css");
    assert.doesNotMatch(css, /body\.theme-emerald\s*\{/);
    const controlBar = read("src/components/workspaces/command-centre/ControlBar.tsx");
    assert.doesNotMatch(controlBar, /theme-emerald|Executive Blue|Medical Emerald/i);
    assert.match(controlBar, /value="light"/);
    assert.match(controlBar, /value="dark"/);
    assert.match(controlBar, /value="system"/);
  });

  it("JSON contract and TS constants stay aligned for appearance + shell dims", () => {
    const contract = JSON.parse(
      read("docs/architecture/prototype-parity/design-system-contract.json")
    ) as {
      appearanceModes: string[];
      brandedGlobalThemesAllowed: boolean;
      shellDimensionsPx: Record<string, number>;
      semanticColors: { light: Record<string, string>; dark: Record<string, string> };
    };
    assert.deepEqual(contract.appearanceModes, ["light", "dark", "system"]);
    assert.equal(contract.brandedGlobalThemesAllowed, false);
    assert.equal(contract.shellDimensionsPx.sidebarExpanded, 240);
    assert.equal(contract.shellDimensionsPx.sidebarCollapsed, 72);
    assert.equal(contract.shellDimensionsPx.topbarHeight, 48);
    assert.equal(contract.shellDimensionsPx.detailPanelMinWidth, 320);
    assert.equal(contract.shellDimensionsPx.detailPanelMaxWidth, 420);
    assert.equal(contract.semanticColors.light["--dp-accent-primary"], "#2563EB");
    assert.equal(contract.semanticColors.dark["--dp-accent-primary"], "#3B82F6");
  });
});
