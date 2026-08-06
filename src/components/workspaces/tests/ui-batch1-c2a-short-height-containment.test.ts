/**
 * Correction 2A — short-height dashboard horizontal overflow containment.
 * Guards VQA-C2-SHORT-001..009 (1024×600, 768×500, 1536×900 × light/dark/system).
 *
 * Presentation/structure only — no business-logic assertions.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

/** Exact Visual QA short-height / wide viewports that must stay width-contained. */
const SHORT_VIEWPORTS = [
  { id: "VQA-C2-SHORT-001/003/005", w: 1024, h: 600 },
  { id: "VQA-C2-SHORT-002/004/006", w: 768, h: 500 },
  { id: "VQA-C2-SHORT-007/008/009", w: 1536, h: 900 },
] as const;

const APPEARANCES = ["light", "dark", "system"] as const;

describe("C2A short-height containment — clinic operations grid", () => {
  const sections = read("src/components/workspaces/command-centre/Sections.tsx");
  const clinicFn = sections.slice(sections.indexOf("export function ClinicOperationsPanel"));
  const clinic = clinicFn.slice(0, clinicFn.indexOf("function rollupStaffing"));

  it("collapses clinic-ops to 1 col until lg (not sm:grid-cols-2)", () => {
    assert.match(clinic, /grid grid-cols-1 gap-3 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-4/);
    assert.doesNotMatch(clinic, /sm:grid-cols-2 xl:grid-cols-4/);
  });

  it("puts min-w-0 max-w-full on group columns and clinic health cards", () => {
    assert.match(clinic, /className="min-w-0 max-w-full"/);
    assert.match(
      clinic,
      /min-w-0 max-w-full overflow-hidden rounded-xl border border-\[var\(--cc-card-line\)\] bg-\[var\(--cc-soft\)\]/
    );
  });

  it("ranked comparison table scrolls inside min-w-0 wrapper (does not widen executive grid)", () => {
    assert.match(clinic, /min-w-0 max-w-full overflow-x-auto/);
    assert.match(clinic, /min-w-\[820px\]/);
    // Forbidden: bare overflow-x-auto that expands to table min-content (~854px at 768).
    assert.doesNotMatch(clinic, /<div className="overflow-x-auto">\s*<table className="w-full min-w-\[820px\]/);
  });
});

describe("C2A short-height containment — cards / expandable / filter bar", () => {
  it("CcCard roots carry min-w-0 max-w-full", () => {
    const ui = read("src/components/workspaces/command-centre/cc-ui.tsx");
    const cardFn = ui.slice(ui.indexOf("export function CcCard"));
    const card = cardFn.slice(0, cardFn.indexOf("export function CcCardHeader"));
    assert.match(card, /min-w-0 max-w-full rounded-2xl/);
  });

  it("ExpandableBlock cannot exceed parent width", () => {
    const ui = read("src/components/workspaces/command-centre/cc-ui.tsx");
    const blockFn = ui.slice(ui.indexOf("export function ExpandableBlock"));
    assert.match(blockFn, /min-w-0 max-w-full overflow-hidden rounded-xl/);
    assert.match(blockFn, /flex w-full min-w-0 max-w-full/);
    assert.match(blockFn, /min-w-0 flex-1 overflow-hidden/);
    assert.match(blockFn, /block truncate/);
  });

  it("FilterSentenceBar stays within pane (wrap + break-words, no overflow-x-hidden)", () => {
    const src = read("src/components/workspaces/command-centre/CcStates.tsx");
    const barFn = src.slice(src.indexOf("export function FilterSentenceBar"));
    assert.match(barFn, /data-cc-filter-sentence="true"/);
    assert.match(barFn, /flex w-full min-w-0 max-w-full flex-wrap/);
    assert.match(barFn, /break-words/);
    assert.match(barFn, /Clear filters/);
    assert.doesNotMatch(barFn, /overflow-x-hidden/);
  });
});

describe("C2A short-height containment — executive dashboard wrappers", () => {
  it("executive / urgent primary grids and sections use min-w-0 max-w-full", () => {
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    assert.match(cc, /grid w-full min-w-0 max-w-full gap-3" data-dashboard-primary="executive"/);
    assert.match(cc, /grid w-full min-w-0 max-w-full gap-3" data-dashboard-primary="urgent"/);
    assert.match(cc, /data-dashboard-area="indicators"/);
    assert.match(cc, /className="min-w-0 max-w-full" aria-label="Executive indicators"/);
    assert.match(cc, /className="min-w-0 max-w-full" aria-label="Priority actions"/);
    assert.match(cc, /className="min-w-0 max-w-full" aria-label="Operational health"/);
    assert.match(cc, /id=\{`cc-panel-\$\{id\}`\} className="min-w-0 max-w-full"/);
  });

  it("DashboardWorkspace and Priority Summary stay width-safe", () => {
    const dash = read("src/components/workspaces/DashboardWorkspace.tsx");
    assert.match(dash, /className="min-w-0 max-w-full" data-dashboard-hierarchy="executive-v2"/);
    const pri = read("src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx");
    const summaryFn = pri.slice(pri.indexOf("export function PrioritySummary"));
    assert.match(summaryFn, /gridTemplateColumns: `repeat\(\$\{Math\.min\(keys\.length, 4\)\}, minmax\(0, 1fr\)\)`/);
    assert.match(summaryFn, /grid min-w-0 max-w-full gap-2 p-3/);
    assert.match(summaryFn, /min-w-0 max-w-full flex-col/);
  });

  it("inbox / action-list wide tables use min-w-0 overflow wrappers", () => {
    const inbox = read("src/components/workspaces/command-centre/InboxProjectionSummary.tsx");
    assert.match(inbox, /min-w-0 max-w-full overflow-x-auto/);
    const actions = read("src/components/workspaces/command-centre/ActiveActionList.tsx");
    assert.match(actions, /min-w-0 max-w-full overflow-auto/);
  });
});

describe("C2A short-height containment — viewport / appearance matrix contract", () => {
  it("documents exact short-height viewports that must not exceed available width", () => {
    // Structural contract for Visual QA re-run: containers must be able to shrink
    // to these widths; vertical scroll remains allowed.
    for (const vp of SHORT_VIEWPORTS) {
      assert.ok(vp.w > 0 && vp.h > 0, `${vp.id} viewport dims`);
      // Available main-pane width is always ≤ viewport width (sidebar may reduce it further).
      assert.ok(vp.w <= 1536 || vp.w === 1536);
    }
    assert.equal(SHORT_VIEWPORTS.length, 3);
    assert.deepEqual(
      SHORT_VIEWPORTS.map((v) => `${v.w}x${v.h}`),
      ["1024x600", "768x500", "1536x900"]
    );
  });

  it("containment classes are appearance-agnostic (light/dark/system)", () => {
    // Appearance only toggles theme tokens; width classes must not be theme-gated.
    const files = [
      "src/components/workspaces/command-centre/Sections.tsx",
      "src/components/workspaces/command-centre/cc-ui.tsx",
      "src/components/workspaces/command-centre/CcStates.tsx",
      "src/components/workspaces/command-centre/CommandCentre.tsx",
      "src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx",
    ];
    for (const file of files) {
      const src = read(file);
      assert.match(src, /min-w-0/);
      for (const appearance of APPEARANCES) {
        assert.doesNotMatch(
          src,
          new RegExp(`${appearance}:.*overflow-x-hidden`),
          `${file} must not gate overflow-x-hidden on ${appearance}`
        );
      }
    }
    assert.equal(APPEARANCES.length, 3);
  });

  it("does not use blanket overflow-x-hidden on FilterSentenceBar / ExpandableBlock / clinic grid as the fix", () => {
    const filter = read("src/components/workspaces/command-centre/CcStates.tsx");
    const bar = filter.slice(filter.indexOf("export function FilterSentenceBar"));
    assert.doesNotMatch(bar, /overflow-x-hidden/);

    const ui = read("src/components/workspaces/command-centre/cc-ui.tsx");
    const block = ui.slice(ui.indexOf("export function ExpandableBlock"));
    assert.doesNotMatch(block, /overflow-x-hidden/);

    const sections = read("src/components/workspaces/command-centre/Sections.tsx");
    const clinic = sections.slice(sections.indexOf("export function ClinicOperationsPanel"));
    const clinicBody = clinic.slice(0, clinic.indexOf("function rollupStaffing"));
    assert.doesNotMatch(clinicBody, /overflow-x-hidden/);
  });

  it("short-height retains vertical page scroll (no overflow-y-hidden on dashboard root)", () => {
    const cc = read("src/components/workspaces/command-centre/CommandCentre.tsx");
    const rootOpen = cc.indexOf('className="cc-root min-w-0 max-w-full"');
    assert.ok(rootOpen >= 0, "cc-root keeps min-w-0 max-w-full");
    assert.doesNotMatch(cc, /cc-root[^"]*overflow-y-hidden/);
    const dash = read("src/components/workspaces/DashboardWorkspace.tsx");
    assert.doesNotMatch(dash, /overflow-y-hidden/);
  });
});

describe("C2A short-height containment — dashboard More menus", () => {
  /**
   * Chromium lays out absolute children inside CLOSED <details>, so left-0
   * w-[220px] panels report overflowsViewportX at 1024×600 / 768×500 even when
   * closed. right-0 + hidden/group-open:block keeps Add Comment (and siblings)
   * out of closed-state layout and inside the viewport when open.
   */
  function assertMoreMenuClosedNonLayout(src: string, label: string) {
    assert.match(src, /<details className="group relative">/, `${label}: details uses group`);
    assert.match(
      src,
      /absolute right-0 top-\[110%\] z-20 hidden w-\[220px\].*group-open:block/,
      `${label}: panel uses right-0 + hidden + group-open:block`
    );
    assert.doesNotMatch(
      src,
      /<details className="group relative">[\s\S]*?absolute left-0 top-\[110%\] z-20 w-\[220px\]/,
      `${label}: must not use bare left-0 for dashboard More menus`
    );
  }

  it("Sections More menu anchors right and hides panel until open", () => {
    const sections = read("src/components/workspaces/command-centre/Sections.tsx");
    // Scope to the More menu that contains Add Comment (priority-action row).
    const addCommentIdx = sections.indexOf('"Add Comment"');
    assert.ok(addCommentIdx >= 0, "Sections includes Add Comment in More menu");
    const window = sections.slice(Math.max(0, addCommentIdx - 800), addCommentIdx + 200);
    assertMoreMenuClosedNonLayout(window, "Sections");
  });

  it("ActiveActionList More menu anchors right and hides panel until open", () => {
    const actions = read("src/components/workspaces/command-centre/ActiveActionList.tsx");
    const moreIdx = actions.indexOf(">More</summary>");
    assert.ok(moreIdx >= 0, "ActiveActionList includes More menu");
    const window = actions.slice(Math.max(0, moreIdx - 200), moreIdx + 400);
    assertMoreMenuClosedNonLayout(window, "ActiveActionList");
  });
});
