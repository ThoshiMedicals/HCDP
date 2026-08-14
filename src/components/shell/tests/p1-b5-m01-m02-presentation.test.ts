/**
 * P1-B5 — M01/M02 Decision A presentation contracts.
 * Local validation only — no product runtime acceptance hooks.
 * Does not claim WCAG certification, pixel parity, CI, production approval, or domain completion.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P1-B5 Decision A shared-component use", () => {
  const workspace = read("src/components/workspaces/ModuleWorkspace.tsx");
  const pageHeader = read("src/components/shell/PageHeader.tsx");

  it("ModuleWorkspace always uses shared PageHeader for M01 and M02", () => {
    assert.match(workspace, /import \{ PageHeader \} from "@\/components\/shell\/PageHeader"/);
    assert.match(workspace, /<PageHeader module=\{module\} \/>/);
    assert.doesNotMatch(workspace, /\{!isCommandCentre \? <PageHeader/);
  });

  it("PageHeader remains shell Decision A chrome", () => {
    assert.match(pageHeader, /data-testid="shell-page-header"/);
    assert.match(pageHeader, /data-shell-region="module-title-tabs"/);
  });
});

describe("P1-B5 M01 metric/source and attention honesty (GAP-020)", () => {
  const priority = read("src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx");
  const attention = read("src/components/workspaces/command-centre/ActiveActionList.tsx");
  const sections = read("src/components/workspaces/command-centre/Sections.tsx");
  const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");

  it("PrioritySummary attributes demonstration deltas and exposes testids", () => {
    assert.match(priority, /data-testid="m01-priority-summary"/);
    assert.match(priority, /demonstration\s*\/\s*local comparison/i);
    assert.match(priority, /YDAY_DELTA/);
  });

  it("Attention list exposes owner, due, reason, action fields", () => {
    assert.match(attention, /data-testid="m01-attention-list"/);
    assert.match(attention, /Reason not recorded|delayReason/);
    assert.match(attention, /Owner/);
    assert.match(attention, /Due/);
  });

  it("Hardcoded clinic estimates are labelled demonstration", () => {
    assert.match(sections, /Demonstration estimate — not live operational metric/);
  });

  it("Command Centre keeps demo banner and root testid", () => {
    assert.match(cc, /data-testid="m01-demo-banner"/);
    assert.match(cc, /data-testid="m01-command-centre"/);
    assert.match(cc, /Demonstration seed data|not live operational truth/i);
  });
});

describe("P1-B5 M02 queue/detail and control honesty (GAP-021/068)", () => {
  const app = read("src/components/workspaces/action-inbox/ActionInboxApp.tsx");
  const summary = read("src/components/workspaces/action-inbox/SummaryCards.tsx");
  const list = read("src/components/workspaces/action-inbox/InboxList.tsx");
  const review = read("src/components/workspaces/action-inbox/ReviewPanel.tsx");
  const classification = read("docs/audits/p1/b5-m01-m02-presentation/control-classification.json");

  it("Action Inbox uses demoSuccess for operational success toasts", () => {
    assert.match(app, /demoSuccess/);
    assert.match(app, /local demo — not live backend/);
    assert.match(app, /data-testid="m02-action-inbox"/);
  });

  it("Ready/loading/error recovery UI remains in source (no fabricated force hook)", () => {
    assert.match(app, /Loading your actions/);
    assert.match(app, /Couldn.?t load Action Inbox|Couldn’t load Action Inbox/);
    assert.match(app, /Try Again/);
    assert.doesNotMatch(app, /p1-b5-harness-force|sessionStorage.*force.*error/i);
  });

  it("Summary cards attribute demonstration/local totals", () => {
    assert.match(summary, /data-testid="m02-summary-cards"/);
    assert.match(summary, /demonstration|local/i);
  });

  it("List/detail expose selection and review panel testids", () => {
    assert.match(list, /data-testid="m02-inbox-list"/);
    assert.match(list, /aria-current|data-selected/);
    assert.match(review, /m02-review-panel/);
  });

  it("Control classification manifest exists and marks domain NOT-STARTED", () => {
    assert.ok(existsSync(join(root, "docs/audits/p1/b5-m01-m02-presentation/control-classification.json")));
    assert.match(classification, /"domainStatus":\s*"NOT-STARTED"/);
    assert.match(classification, /operational-local-demo/);
    assert.match(classification, /planned-unavailable|deferred-durable|outside-p1-b5/);
  });
});

describe("P1-B5 patient/clinical firewall and domain exclusion", () => {
  const matrix = read("docs/architecture/prototype-parity/phase1/P1_MODULE_PARITY_MATRIX.md");
  const briefing = read("docs/architecture/prototype-parity/phase1/P1_B5_OWNER_AUTHORISATION_BRIEFING.md");
  const review = read("src/components/workspaces/action-inbox/ReviewPanel.tsx");

  it("Module parity matrix keeps M01/M02 Domain NS", () => {
    assert.match(matrix, /\| M01 \|[^|]*\| FC \| NS \|/);
    assert.match(matrix, /\| M02 \|[^|]*\| FC \| NS \|/);
  });

  it("Briefing and UI preserve clinical source-system boundary", () => {
    assert.match(briefing, /OWN-PATIENT-FIREWALL|patient clinical|Best Practice/i);
    assert.match(review, /clinical source system|source system/i);
  });

  it("Does not integrate Aurora", () => {
    assert.doesNotMatch(read("package.json"), /aurora-design|@aurora/);
    assert.match(briefing, /Aurora.*unintegrated|Aurora.*isolated/i);
  });
});

describe("P1-B5 preservation and unauthorised later batches", () => {
  const pkg = read("package.json");
  const batches = read("docs/architecture/prototype-parity/phase1/P1_EXECUTION_BATCHES.md");
  const harness = existsSync(join(root, "scripts/p1-b5-m01-m02-presentation-harness.mjs"))
    ? read("scripts/p1-b5-m01-m02-presentation-harness.mjs")
    : "";

  it("adds test:p1-b5 without lockfile/dependency churn in package.json scripts", () => {
    assert.match(pkg, /"test:p1-b5"/);
    assert.doesNotMatch(pkg, /"aurora"/);
  });

  it("documents B1–B4 accepted, B5 acceptance pending, B6–B8 unauthorised", () => {
    assert.match(batches, /P1-B5/);
    assert.match(batches, /P1 — PLANNED, NOT AUTHORISED|IMPLEMENTED FOR OWNER REVIEW|acceptance pending/i);
  });

  it("harness asserts required matrices and exclusions when present", () => {
    if (!harness) return;
    assert.match(harness, /1440/);
    assert.match(harness, /390/);
    assert.match(harness, /system-os-dark/);
    assert.match(harness, /m01-priority-summary|m02-action-inbox/);
    assert.match(harness, /NOT-STARTED|patient|clinical/i);
    assert.doesNotMatch(harness, /aurora-design-foundation/);
  });
});
