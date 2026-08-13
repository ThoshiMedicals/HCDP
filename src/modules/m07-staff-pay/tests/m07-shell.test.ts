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
    assert.ok(!planned.includes("approval"));
    assert.ok(!planned.includes("export"));
    assert.ok(!planned.includes("reconciliation"));
    assert.ok(!planned.includes("adjustments"));
    assert.equal(M07_SECTION_META.approval.batch1, "available");
    assert.equal(M07_SECTION_META.export.batch1, "available");
    assert.equal(M07_SECTION_META.reconciliation.batch1, "available");
    assert.equal(M07_SECTION_META.adjustments.batch1, "available");
    assert.match(
      M07_SECTION_META.adjustments.batchNote ?? "",
      /Adjustment preparation\/foundation only/i
    );
    assert.match(M07_SECTION_META.adjustments.batchNote ?? "", /not an authorised prior-period adjustment/i);
    assert.match(M07_SECTION_META.adjustments.batchNote ?? "", /Unlock\/reopen is not PPA/i);
    assert.ok(planned.includes("history"));
    assert.equal(M07_SECTION_META.overview.batch1, "available");
    assert.equal(M07_SECTION_META.settings.batch1, "available");
    assert.equal(M07_SECTION_META.people.batch1, "available");
    assert.equal(M07_SECTION_META.leave.batch1, "available");
  });

  it("resolves legacy section aliases", () => {
    assert.equal(resolveM07Section("pay-prep"), "overview");
    assert.equal(resolveM07Section("exports"), "export");
    assert.equal(resolveM07Section("bogus"), "overview");
  });

  it("planned section UI disables actions and does not claim parity", () => {
    const plannedPath = join(process.cwd(), "src/modules/m07-staff-pay/sections/PlannedSection.tsx");
    const src = readFileSync(plannedPath, "utf8");
    assert.match(src, /Planned — not yet available/);
    assert.match(src, /aria-disabled="true"/);
    assert.match(src, /not operational/i);
    assert.match(src, /not prototype parity/);
    assert.doesNotMatch(src, /pushToast|Export complete|History ready/);
  });

  it("workspace declares responsive shell attribute and a11y affordances", () => {
    const ws = readFileSync(join(process.cwd(), "src/modules/m07-staff-pay/StaffPayWorkspace.tsx"), "utf8");
    const sectionNav = readFileSync(join(process.cwd(), "src/components/shell/ModuleSectionNav.tsx"), "utf8");
    assert.match(ws, /data-m07-shell="batch6-export"/);
    assert.match(ws, /ModuleSectionNav/);
    assert.match(ws, /ariaLabel="Staff Pay sections"/);
    assert.match(sectionNav, /module-section-nav__compact-only/);
    assert.match(readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8"), /max-width:\s*768px/);
    assert.match(ws, /:focus-visible/);
    assert.match(ws, /prefers-reduced-motion/);
    assert.match(ws, /overflow-x-hidden/);
    assert.match(ws, /ConnectedAdjustmentsSection/);
    assert.match(ws, /case "adjustments"/);
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

  it("overview copy distinguishes ordinary prep availability from adjustment-preparation limits (GAP-PAR-003 / OWN-P1-007)", () => {
    const overview = readFileSync(
      join(process.cwd(), "src/modules/m07-staff-pay/sections/OverviewSection.tsx"),
      "utf8"
    );
    assert.doesNotMatch(overview, /Export, reconciliation and lock remain unavailable/i);
    assert.match(overview, /Ordinary payroll preparation/i);
    assert.match(overview, /export preparation/i);
    assert.match(overview, /package reconciliation/i);
    assert.match(overview, /period\s+lock/i);
    assert.match(overview, /adjustment register/i);
    assert.match(overview, /draft cancellation/i);
    assert.match(overview, /not an authorised or complete prior-period adjustment/i);
    assert.match(overview, /Unlock\/reopen is not PPA/i);
    assert.match(overview, /PPA calculation lines/i);
    assert.doesNotMatch(overview, /PPA-2/);
    assert.doesNotMatch(overview, /PPA-1 foundation/i);
  });
});
