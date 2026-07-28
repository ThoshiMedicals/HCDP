import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { M07_SECTION_META, resolveM07Section } from "../section-meta";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("M07 shell smoke (Batch 1)", () => {
  it("marks unfinished sections as planned", () => {
    const planned = (Object.keys(M07_SECTION_META) as Array<keyof typeof M07_SECTION_META>).filter(
      (k) => M07_SECTION_META[k].batch1 === "planned"
    );
    assert.ok(planned.includes("approval"));
    assert.ok(planned.includes("export"));
    assert.ok(planned.includes("reconciliation"));
    assert.equal(M07_SECTION_META.overview.batch1, "available");
    assert.equal(M07_SECTION_META.settings.batch1, "available");
  });

  it("resolves legacy section aliases", () => {
    assert.equal(resolveM07Section("pay-prep"), "overview");
    assert.equal(resolveM07Section("exports"), "export");
    assert.equal(resolveM07Section("bogus"), "overview");
  });

  it("planned section UI disables actions and does not claim parity", () => {
    const plannedPath = join(process.cwd(), "src/modules/m07-staff-pay/sections/PlannedSection.tsx");
    const src = readFileSync(plannedPath, "utf8");
    assert.match(src, /Planned — not operational in Batch 1/);
    assert.match(src, /disabled/);
    assert.match(src, /not prototype parity/);
  });

  it("workspace declares responsive shell attribute and a11y affordances", () => {
    const ws = readFileSync(join(process.cwd(), "src/modules/m07-staff-pay/StaffPayWorkspace.tsx"), "utf8");
    assert.match(ws, /data-m07-shell="batch1-foundation"/);
    assert.match(ws, /max-width: 768px/);
    assert.match(ws, /aria-label="Staff Pay sections"/);
    assert.match(ws, /:focus-visible/);
    assert.match(ws, /prefers-reduced-motion/);
    assert.match(ws, /overflow-x-hidden/);
  });

  it("overview and settings expose labelled controls and non-colour status", () => {
    const overview = readFileSync(
      join(process.cwd(), "src/modules/m07-staff-pay/sections/OverviewSection.tsx"),
      "utf8"
    );
    const settings = readFileSync(
      join(process.cwd(), "src/modules/m07-staff-pay/sections/SettingsSection.tsx"),
      "utf8"
    );
    assert.match(overview, /htmlFor="m07-legal-entity"/);
    assert.match(overview, /role="alert"/);
    assert.match(overview, /role="status"/);
    assert.match(settings, /requires \{action\.permission\}/);
    assert.match(settings, /role="status"/);
  });
});
