/**
 * P1-B3 — Register hygiene and payroll-history truthfulness contracts.
 * Local validation only — no product runtime acceptance hooks.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PLATFORM_MODULES,
  conditionLabel,
  getPlatformModule,
} from "@/platform/module-registry/module-register";
import { M07_SECTION_META } from "@/modules/m07-staff-pay/section-meta";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

/** Verified TrainingWorkspace NAV — do not invent section names. */
const TRAINING_RUNTIME_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "catalogue", label: "Course Catalogue" },
  { id: "assignments", label: "Assignments" },
  { id: "sessions", label: "Sessions" },
  { id: "assessments", label: "Assessments" },
  { id: "competencies", label: "Competencies" },
  { id: "certificates", label: "Certificates" },
  { id: "exemptions", label: "Exemptions" },
  { id: "evidence", label: "Evidence" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Policy & Settings" },
] as const;

describe("P1-B3 M11 register synchronisation (OWN-P1-006)", () => {
  const training = getPlatformModule("training");
  const workspace = read("src/modules/m11-training/TrainingWorkspace.tsx");

  it("registers the verified TrainingWorkspace section list", () => {
    assert.ok(training);
    assert.equal(training!.sections.length, 11);
    assert.deepEqual(
      training!.sections.map((s) => ({ id: s.id, label: s.label })),
      TRAINING_RUNTIME_SECTIONS.map((s) => ({ id: s.id, label: s.label }))
    );
    for (const s of TRAINING_RUNTIME_SECTIONS) {
      assert.match(workspace, new RegExp(`id:\\s*"${s.id}"`));
      assert.match(workspace, new RegExp(`label:\\s*"${s.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    }
  });

  it("uses valid strong-existing condition (not legacy-html-fallback)", () => {
    assert.equal(training!.condition, "strong-existing");
    assert.equal(conditionLabel("strong-existing"), "Strong existing module");
    assert.notEqual(training!.condition, "legacy-html-fallback");
    assert.match(training!.purpose, /not production-approved/i);
    assert.match(training!.purpose, /metadata|register/i);
  });

  it("does not claim production approval or domain expansion in purpose text", () => {
    assert.match(training!.purpose, /not production-approved/i);
    assert.doesNotMatch(training!.purpose, /production ready|certified for production|production approval granted/i);
    assert.match(training!.purpose, /metadata\/register correction only/i);
  });
});

describe("P1-B3 M07 History honesty (OWN-P1-007 / GAP-012)", () => {
  const planned = read("src/modules/m07-staff-pay/sections/PlannedSection.tsx");
  const workspace = read("src/modules/m07-staff-pay/StaffPayWorkspace.tsx");

  it("marks History as planned / non-operational", () => {
    assert.equal(M07_SECTION_META.history.batch1, "planned");
    assert.match(M07_SECTION_META.history.batchNote ?? "", /not yet available|not operational/i);
    assert.match(planned, /Planned — not yet available/);
    assert.match(planned, /not operational/i);
    assert.match(planned, /aria-disabled="true"/);
    assert.match(planned, /aria-describedby=/);
    assert.match(planned, /role="status"/);
    assert.doesNotMatch(planned, /\sdisabled(=|\s|>)/);
    assert.doesNotMatch(planned, /pushToast|History ready|History complete/);
  });

  it("nav exposes Planned badge and honest aria label for History", () => {
    assert.match(workspace, /badge: .*=== "planned" \? "Planned"/);
    assert.match(workspace, /planned — not operational/);
    assert.match(workspace, /default:\s*\n\s*return <PlannedSection/);
    assert.match(workspace, /PlannedSection/);
    assert.equal(M07_SECTION_META.history.batch1, "planned");
  });
});

describe("P1-B3 M07 Adjustments honesty (OWN-P1-007 / GAP-079)", () => {
  const adjustments = read("src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx");
  const overview = read("src/modules/m07-staff-pay/sections/OverviewSection.tsx");
  const register = read("src/modules/m07-staff-pay/sections/adjustments/AdjustmentRegister.tsx");

  it("uses honesty-only labels — not authorised PPA product", () => {
    assert.match(M07_SECTION_META.adjustments.batchNote ?? "", /Adjustment preparation\/foundation only/);
    assert.match(M07_SECTION_META.adjustments.batchNote ?? "", /not an authorised prior-period adjustment/i);
    assert.match(adjustments, /not authorised PPA product/i);
    assert.match(adjustments, />\s*Adjustments\s*</);
    assert.doesNotMatch(adjustments, />\s*Prior-period adjustments\s*</);
    assert.doesNotMatch(adjustments, /PPA-1 foundation · available/);
    assert.match(adjustments, /Unlock\/reopen is not PPA/);
    assert.match(adjustments, /OWN-P1-011/);
    assert.match(overview, /not an authorised or complete prior-period adjustment/);
    assert.match(register, /Adjustment preparation register/);
  });

  it("does not imply payment, M08, or PPA product authorisation", () => {
    assert.match(adjustments, /No calculation, approval, export,\s*payment/i);
    assert.doesNotMatch(adjustments, /Mark as paid|Download bank|STP filing complete/i);
    assert.doesNotMatch(M07_SECTION_META.adjustments.batchNote ?? "", /authorised PPA product complete/i);
  });
});

describe("P1-B3 placeholder honesty (GAP-015)", () => {
  const landing = read("src/components/workspaces/ModuleLanding.tsx");

  it("does not score placeholder / legacy-html modules as interactive rebuild complete", () => {
    assert.match(landing, /Placeholder — not implemented/);
    assert.match(landing, /must not be scored as implemented/);
    const placeholders = PLATFORM_MODULES.filter(
      (m) =>
        m.number >= 8 &&
        m.number !== 11 &&
        (m.condition === "legacy-html-fallback" || m.condition === "placeholder" || m.condition === "missing")
    );
    assert.ok(placeholders.length >= 10);
    for (const m of placeholders) {
      assert.notEqual(m.condition, "complete-interactive-rebuild");
      assert.notEqual(m.condition, "strong-existing");
    }
  });
});

describe("P1-B3 historic register supersession (GAP-013)", () => {
  it("historic parity register carries supersession banner", () => {
    const historic = read("docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md");
    assert.match(historic, /SUPERSEDED FOR CURRENT PLANNING/);
    assert.match(historic, /P1-GAP-013/);
  });
});

describe("P1-B3 M11 legacy aliases / deep links", () => {
  it("maps records→assignments and expiry→certificates without inventing sections", () => {
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

describe("P1-B3 programme control preserves open decisions and later batches", () => {
  const decisions = read("docs/architecture/prototype-parity/phase1/P1_OWNER_DECISION_REGISTER.md");
  const batches = read("docs/architecture/prototype-parity/phase1/P1_EXECUTION_BATCHES.md");
  const wave = read(".cursor/rules/hcdp-wave-control.mdc");

  it("keeps OWN-P1-011 and OWN-P1-016 open", () => {
    assert.match(decisions, /OWN-P1-011 \|[\s\S]*?Open \(deferred\)/);
    assert.match(decisions, /OWN-P1-016 \|[\s\S]*?\*\*Open\*\*/);
  });

  it("keeps P1-B6 through P1-B8 PLANNED NOT AUTHORISED; B5 acceptance pending", () => {
    assert.match(batches, /P1-B5[\s\S]{0,220}acceptance pending/i);
    for (const id of ["P1-B6", "P1-B7", "P1-B8"]) {
      assert.match(batches, new RegExp(`${id}[\\s\\S]{0,160}PLANNED, NOT AUTHORISED`));
    }
    assert.match(wave, /P1-B6 through P1-B8|P1-B6–P1-B8/);
    assert.match(wave, /acceptance pending/i);
  });

  it("preserves inventory totals 83 / 8 / 24", () => {
    const readme = read("docs/architecture/prototype-parity/phase1/README.md");
    assert.match(readme, /83 gaps/);
    assert.match(readme, /8 batches/);
    assert.equal(PLATFORM_MODULES.length, 24);
  });
});
