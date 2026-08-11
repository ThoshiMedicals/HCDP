/**
 * P1-B1 — Screenshot harness smoke (contract viewports/regions) — static gate.
 * Browser capture is exercised by scripts/p1-b1-shell-harness-smoke.mjs.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCREENSHOT_HARNESS_VIEWPORTS,
  SCREENSHOT_REGIONS,
} from "@/lib/shell/design-contract";

const root = process.cwd();

describe("P1-B1 screenshot harness smoke — contract wiring", () => {
  it("lists Decision A acceptance widths used by harness", () => {
    const widths = new Set<number>(SCREENSHOT_HARNESS_VIEWPORTS.map((v) => v.w));
    for (const w of [1440, 1280, 1024, 768, 430, 390]) {
      assert.ok(widths.has(w), `missing viewport width ${w}`);
    }
  });

  it("lists Decision A screenshot regions", () => {
    for (const region of [
      "shell-nav",
      "topbar",
      "module-title-tabs",
      "kpi-strip",
      "toolbar",
      "main-pane",
      "detail-pane",
    ] as const) {
      assert.ok(SCREENSHOT_REGIONS.includes(region), `missing region ${region}`);
    }
  });

  it("harness script exists and targets localhost:3000 + docs/audits/p1", () => {
    const rel = "scripts/p1-b1-shell-harness-smoke.mjs";
    assert.ok(existsSync(join(root, rel)), "missing harness script");
    const src = readFileSync(join(root, rel), "utf8");
    assert.match(src, /HCDP_BASE_URL \|\| "http:\/\/localhost:3000"/);
    assert.match(src, /Use localhost \(not 127\.0\.0\.1\)/);
    assert.match(src, /docs\/audits\/p1/);
    assert.match(src, /shell-nav/);
    assert.match(src, /topbar/);
    assert.match(src, /kpi-strip/);
  });

  it("Decision A canonical PNG set remains installed hash-OK", () => {
    const finalDir = join(root, "docs/design-references/final");
    const expected = [
      ["m01-command-centre-final.png", "f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236"],
      ["m02-action-inbox-final.png", "9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f"],
    ] as const;
    for (const [name, hash] of expected) {
      const buf = readFileSync(join(finalDir, name));
      const h = createHash("sha256").update(buf).digest("hex");
      assert.equal(h, hash, `PNG hash drift ${name}`);
    }
  });
});
