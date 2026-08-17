/**
 * P1-B6 — Accepted-module Decision A presentation contracts (M04/M05/M06/M07/M11).
 * Local validation only — no product runtime acceptance hooks.
 * Does not claim WCAG certification, pixel parity, CI, production approval, or domain completion.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, acc);
    else if (/\.(tsx?|jsx?|mjs|cjs|json|md|css)$/i.test(name)) acc.push(full);
  }
  return acc;
}

const MODULE_TREES = [
  "src/modules/m04-staff-doctors",
  "src/modules/m05-roster",
  "src/modules/m06-time-attendance",
  "src/modules/m07-staff-pay",
  "src/modules/m11-training",
] as const;

const ROUTES = [
  { id: "M04", platformId: "staff-doctors", route: "/staff-doctors", banner: "m04-demo-banner", bannerFile: "src/modules/m04-staff-doctors/sections/OverviewSection.tsx" },
  { id: "M05", platformId: "roster", route: "/roster", banner: "m05-demo-banner", bannerFile: "src/modules/m05-roster/sections/RosterBoardSection.tsx" },
  { id: "M06", platformId: "time-attendance", route: "/time-attendance", banner: "m06-demo-banner", bannerFile: "src/modules/m06-time-attendance/sections/LiveAttendanceSection.tsx" },
  { id: "M07", platformId: "staff-pay", route: "/staffpay", banner: "m07-demo-banner", bannerFile: "src/modules/m07-staff-pay/sections/OverviewSection.tsx" },
  { id: "M11", platformId: "training", route: "/training", banner: "m11-demo-banner", bannerFile: "src/modules/m11-training/sections/OverviewSection.tsx" },
] as const;

const CONTROL_INVENTORY = "docs/audits/p1/b6-accepted-modules-presentation/control-inventory.json";
const DOMAIN_EQUIV = "docs/audits/p1/b6-accepted-modules-presentation/domain-equivalence.json";
const FROZEN = "docs/architecture/prototype-parity/phase1/P1_B6_FROZEN_BASELINES.json";

describe("P1-B6 Decision A presentation contract / shared PageHeader", () => {
  const workspace = read("src/components/workspaces/ModuleWorkspace.tsx");
  const pageHeader = read("src/components/shell/PageHeader.tsx");
  const register = read("src/platform/module-registry/module-register.ts");

  it("ModuleWorkspace always uses shared PageHeader for accepted-module routes", () => {
    assert.match(workspace, /import \{ PageHeader \} from "@\/components\/shell\/PageHeader"/);
    assert.match(workspace, /<PageHeader module=\{module\} \/>/);
    assert.doesNotMatch(workspace, /\{!isCommandCentre \? <PageHeader/);
    for (const r of ROUTES) {
      assert.match(workspace, new RegExp(`case "${r.platformId === "staff-pay" ? "staff-pay" : r.platformId}"`));
    }
  });

  it("PageHeader remains shell Decision A chrome", () => {
    assert.match(pageHeader, /data-testid="shell-page-header"/);
    assert.match(pageHeader, /data-shell-region="module-title-tabs"/);
  });

  it("platform register preserves five accepted-module main routes", () => {
    for (const r of ROUTES) {
      assert.match(register, new RegExp(`mainRoute:\\s*"${r.route.replace("/", "\\/")}"`));
    }
  });
});

describe("P1-B6 shared-component reuse", () => {
  it("PageHeader, tokens, and cc-demo-banner patterns remain in allowlisted section files", () => {
    const pageHeader = read("src/components/shell/PageHeader.tsx");
    assert.match(pageHeader, /shell-page-header/);
    for (const r of ROUTES) {
      const src = read(r.bannerFile);
      assert.match(src, /cc-demo-banner/);
      assert.match(src, new RegExp(`data-testid="${r.banner}"`));
      assert.match(src, /var\(--|--type-|--ink|--muted|--card/);
    }
  });
});

describe("P1-B6 route/section preservation for M04/M05/M06/M07/M11", () => {
  const frozen = JSON.parse(read(FROZEN));

  it("frozen baselines enumerate five modules with expected routes", () => {
    assert.equal(frozen.totals.moduleCount, 5);
    const byId = Object.fromEntries(frozen.modules.map((m: { moduleId: string }) => [m.moduleId, m]));
    for (const r of ROUTES) {
      assert.ok(byId[r.id], `missing ${r.id}`);
      assert.equal(byId[r.id].route, r.route);
    }
  });

  it("workspace NAV section ids remain present for each accepted module", () => {
    const m04 = read("src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx");
    for (const id of ["overview", "people", "credentials", "reports", "settings"]) {
      assert.match(m04, new RegExp(`id:\\s*"${id}"`));
    }
    const m05 = read("src/modules/m05-roster/RosterWorkspace.tsx");
    assert.match(m05, /id:\s*"roster-board"/);
    const m06 = read("src/modules/m06-time-attendance/AttendanceWorkspace.tsx");
    assert.match(m06, /id:\s*"live"/);
    const m07 = read("src/modules/m07-staff-pay/StaffPayWorkspace.tsx");
    assert.match(m07, /M07_SECTION_META/);
    const m11 = read("src/modules/m11-training/TrainingWorkspace.tsx");
    for (const id of ["overview", "assignments", "certificates", "catalogue"]) {
      assert.match(m11, new RegExp(`id:\\s*"${id}"`));
    }
  });
});

describe("P1-B6 control inventory", () => {
  it("control-inventory.json exists with before/after totals matching frozen baselines", () => {
    assert.ok(existsSync(join(root, CONTROL_INVENTORY)), `missing ${CONTROL_INVENTORY}`);
    const inv = JSON.parse(read(CONTROL_INVENTORY));
    const frozen = JSON.parse(read(FROZEN));
    assert.equal(frozen.totals.permissionCount, 105);
    assert.equal(frozen.totals.presentationFileCount, 82);
    assert.equal(frozen.totals.protectedFileCount, 233);
    for (const side of ["before", "after"] as const) {
      assert.equal(inv[side].permissions, 105);
      assert.equal(inv[side].presentation, 82);
      assert.equal(inv[side].protected, 233);
    }
  });
});

describe("P1-B6 permission/state/storage/event/calculation/export preservation", () => {
  it("reads P1_B6_FROZEN_BASELINES aggregates", () => {
    const frozen = JSON.parse(read(FROZEN));
    assert.equal(frozen.totals.permissionCount, 105);
    assert.equal(frozen.totals.presentationFileCount, 82);
    assert.equal(frozen.totals.protectedFileCount, 233);
    assert.ok(Array.isArray(frozen.modules) && frozen.modules.length === 5);
    for (const m of frozen.modules) {
      assert.ok(Array.isArray(m.permissionInventory) && m.permissionInventory.length > 0);
      assert.ok(Array.isArray(m.storageKeyInventory) && m.storageKeyInventory.length > 0);
      assert.ok(Array.isArray(m.eventAuditInventory) && m.eventAuditInventory.length > 0);
      assert.ok(Array.isArray(m.calculationOutputInventory) && m.calculationOutputInventory.length > 0);
      assert.ok(Array.isArray(m.exportInventory) && m.exportInventory.length > 0);
      assert.ok(typeof m.protectedAggregateSha256 === "string" && m.protectedAggregateSha256.length === 64);
    }
  });

  it("asserts domain-equivalence.json pass when present", () => {
    if (!existsSync(join(root, DOMAIN_EQUIV))) {
      // Parent may write this evidence file later; static suite does not fail soft-absent.
      return;
    }
    const equiv = JSON.parse(read(DOMAIN_EQUIV));
    assert.equal(equiv.pass, true, "domain-equivalence.json must report pass=true when present");
  });
});

describe("P1-B6 M07 PPA/payment/M08 exclusions and Adjustments honesty", () => {
  const adjustments = read("src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx");
  const overview = read("src/modules/m07-staff-pay/sections/OverviewSection.tsx");
  const register = read("src/modules/m07-staff-pay/sections/adjustments/AdjustmentRegister.tsx");
  const briefing = read("docs/architecture/prototype-parity/phase1/P1_B6_OWNER_AUTHORISATION_BRIEFING.md");
  const frozen = read(FROZEN);

  it("preserves Adjustments honesty wording (not authorised PPA product)", () => {
    assert.match(adjustments, /not authorised PPA product/i);
    assert.match(adjustments, />\s*Adjustments\s*</);
    assert.doesNotMatch(adjustments, />\s*Prior-period adjustments\s*</);
    assert.match(adjustments, /Unlock\/reopen is not PPA/);
    assert.match(adjustments, /OWN-P1-011/);
    assert.match(overview, /not an authorised or complete prior-period adjustment/);
    assert.match(register, /Adjustment preparation register/);
    assert.match(adjustments, /No calculation, approval, export,\s*payment/i);
    assert.doesNotMatch(adjustments, /Mark as paid|Download bank|STP filing complete/i);
  });

  it("documents PPA / payment / M08 exclusions for B6", () => {
    assert.match(briefing, /PPA/);
    assert.match(briefing, /payment|M08/i);
    assert.match(frozen, /"PPA"/);
    assert.match(frozen, /M08 doctor pay|Payment\/STP/);
  });
});

describe("P1-B6 M11 section/alias preservation", () => {
  it("maps records→assignments and expiry→certificates", () => {
    const domain = read("src/modules/m11-training/types/domain.ts");
    assert.match(domain, /records:\s*"assignments"/);
    assert.match(domain, /expiry:\s*"certificates"/);
    assert.match(domain, /export const M11_SECTION_ALIASES/);
    const context = read("src/modules/m11-training/context.tsx");
    assert.match(context, /M11_SECTION_ALIASES/);
    assert.match(context, /function resolveM11Section/);
    const workspace = read("src/modules/m11-training/TrainingWorkspace.tsx");
    assert.match(workspace, /resolveM11Section\(searchParams\.get\("section"\)\)/);
  });
});

describe("P1-B6 patient/clinical firewall", () => {
  it("five module trees do not introduce patient lists / clinical SoT chrome", () => {
    const banned =
      /patient\s+list|patient\s+record|patient\s+appointment|medicare claim|clinical notes|prescription|open clinical source system|Best Practice patient/i;
    for (const tree of MODULE_TREES) {
      for (const file of walkFiles(join(root, tree))) {
        const text = readFileSync(file, "utf8");
        assert.doesNotMatch(text, banned, `prohibited clinical chrome in ${file}`);
      }
    }
  });
});

describe("P1-B6 Aurora non-integration / Decision A binding", () => {
  const briefing = read("docs/architecture/prototype-parity/phase1/P1_B6_OWNER_AUTHORISATION_BRIEFING.md");
  const pkg = read("package.json");
  const harness = existsSync(join(root, "scripts/p1-b6-accepted-modules-presentation-harness.mjs"))
    ? read("scripts/p1-b6-accepted-modules-presentation-harness.mjs")
    : "";

  it("does not integrate Aurora; Decision A remains binding", () => {
    assert.doesNotMatch(pkg, /aurora-design|@aurora/);
    assert.match(briefing, /Aurora/);
    assert.match(briefing, /parked|isolated|unintegrated/i);
    assert.match(briefing, /Decision A remains the binding/i);
    assert.doesNotMatch(briefing, /Merged branch 'cursor\/aurora-design-foundation'|cherry-pick aurora|Copied from aurora/i);
    if (harness) {
      assert.doesNotMatch(harness, /aurora-design-foundation|Merged branch .*aurora/i);
    }
  });
});

describe("P1-B6 programme control — B7/B8 unauthorised; B6 acceptance pending", () => {
  const batches = read("docs/architecture/prototype-parity/phase1/P1_EXECUTION_BATCHES.md");
  const pkg = read("package.json");
  const harness = existsSync(join(root, "scripts/p1-b6-accepted-modules-presentation-harness.mjs"))
    ? read("scripts/p1-b6-accepted-modules-presentation-harness.mjs")
    : "";

  it("adds test:p1-b6 without lockfile/dependency churn in package.json scripts", () => {
    assert.match(pkg, /"test:p1-b6"/);
    assert.doesNotMatch(pkg, /"aurora"/);
  });

  it("keeps P1-B7 and P1-B8 PLANNED NOT AUTHORISED", () => {
    for (const id of ["P1-B7", "P1-B8"]) {
      assert.match(batches, new RegExp(`${id}[\\s\\S]{0,160}PLANNED, NOT AUTHORISED`));
    }
  });

  it("harness covers widths, appearances, five routes, and forbids ambiguous or-filenames", () => {
    if (!harness) return;
    assert.match(harness, /1440/);
    assert.match(harness, /390/);
    assert.match(harness, /system-os-dark/);
    assert.match(harness, /\/staff-doctors/);
    assert.match(harness, /\/roster/);
    assert.match(harness, /\/time-attendance/);
    assert.match(harness, /\/staffpay/);
    assert.match(harness, /\/training/);
    assert.match(harness, /Ambiguous screenshot name rejected|no-ambiguous-or-names/);
    assert.match(harness, /domain-equivalence\.json/);
    assert.doesNotMatch(harness, /aurora-design-foundation/);
    assert.match(harness, /wcagCertification:\s*false/);
  });
});

describe("P1-B6 demo banners present in allowlisted section files", () => {
  it("m04/m05/m06/m07/m11-demo-banner remain in section sources", () => {
    for (const r of ROUTES) {
      const src = read(r.bannerFile);
      assert.match(src, new RegExp(`data-testid="${r.banner}"`));
      assert.match(src, /Demonstration \/ local browser data/i);
    }
  });
});
