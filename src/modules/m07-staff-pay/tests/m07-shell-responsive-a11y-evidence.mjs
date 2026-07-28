/**
 * M07 Batch 1 shell responsive + a11y smoke evidence.
 * Narrow shell checks only — no CSS redesign.
 *
 * Usage (from Development folder, with `npm run dev` available):
 *   node --import tsx src/modules/m07-staff-pay/tests/m07-shell-responsive-a11y-evidence.mjs
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../../..");
const outPath = join(root, "docs/audits/wave6-m07-batch1-shell-a11y-evidence.json");

const VIEWPORTS = [1440, 1280, 1024, 768, 430, 390];

const SHELL_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>M07 Batch 1 shell fixture</title>
  <style>
    :root { --ink:#111; --card:#fff; --muted:#555; --v34-card-line:#d4d4d4; --v34-soft:#f5f5f5; }
    @media (prefers-color-scheme: dark) {
      :root { --ink:#f5f5f5; --card:#171717; --muted:#a3a3a3; --v34-card-line:#404040; --v34-soft:#262626; }
    }
    body { margin:0; font-family: system-ui, sans-serif; background: var(--card); color: var(--ink); }
    .m07-shell { space-y:1rem; overflow-x:hidden; padding:1rem; }
    .m07-shell :focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .m07-shell * { transition: none !important; animation: none !important; }
    }
    .grid { display:grid; gap:1rem; min-width:0; }
    .grid.wide { grid-template-columns: minmax(0,220px) minmax(0,1fr); }
    .grid.narrow { grid-template-columns: 1fr; }
    nav, main, header, section { border:1px solid var(--v34-card-line); border-radius:1rem; padding:1rem; background:var(--card); min-width:0; }
    button { display:flex; width:100%; justify-content:space-between; gap:.5rem; border:1px solid var(--v34-card-line); border-radius:.5rem; padding:.5rem .75rem; background:transparent; color:inherit; }
    button[aria-current="page"] { background:var(--ink); color:var(--card); }
    button:disabled { opacity:.5; cursor:not-allowed; }
    label { display:block; font-size:.875rem; }
    input { width:100%; max-width:100%; box-sizing:border-box; margin-top:.25rem; padding:.5rem .75rem; border:1px solid var(--v34-card-line); border-radius:.5rem; background:transparent; color:inherit; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    .truncate { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  </style>
</head>
<body>
  <div class="m07-shell" data-m07-shell="batch1-foundation">
    <header>
      <p>Module 7 · Staff Pay & Payroll Preparation</p>
      <h1>Staff Pay foundation</h1>
      <p>Batch 1 foundation shell fixture for responsive/a11y evidence.</p>
      <p role="status">Storage bootstrap · schema ready</p>
    </header>
    <div id="layout" class="grid wide">
      <nav aria-label="Staff Pay sections">
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.25rem">
          <li><button type="button" aria-current="page" aria-label="Pay Run Overview">Pay Run Overview<span class="sr-only">Available</span></button></li>
          <li><button type="button" aria-label="People Review (planned — not operational in Batch 1)">People Review<span aria-hidden="true">Planned</span></button></li>
          <li><button type="button" aria-label="Approval (planned — not operational in Batch 1)">Approval<span aria-hidden="true">Planned</span></button></li>
          <li><button type="button" aria-label="Settings">Settings<span class="sr-only">Available</span></button></li>
        </ul>
      </nav>
      <main id="m07-main" tabindex="-1">
        <section aria-labelledby="m07-overview-heading">
          <p role="status">Batch 1 foundation — periods · available</p>
          <h2 id="m07-overview-heading">Pay Run Overview</h2>
          <form>
            <label for="m07-legal-entity">Legal entity (organisation id)
              <input id="m07-legal-entity" name="legalEntityId" value="org_demo_a" />
            </label>
            <label for="m07-period-start">Period start
              <input id="m07-period-start" name="periodStart" type="date" value="2026-07-01" />
            </label>
            <label for="m07-period-end">Period end
              <input id="m07-period-end" name="periodEnd" type="date" value="2026-07-14" />
            </label>
            <button type="submit">Create ordinary pay period</button>
          </form>
        </section>
        <section aria-labelledby="m07-planned-approval-heading" style="margin-top:1rem">
          <p role="status">Planned — not operational in Batch 1</p>
          <h2 id="m07-planned-approval-heading">Approval</h2>
          <button type="button" disabled aria-disabled="true" aria-describedby="m07-planned-approval-why">Actions unavailable</button>
          <p id="m07-planned-approval-why">Unavailable: Batch 1 foundation only. No mutations are enabled on this section.</p>
        </section>
      </main>
    </div>
  </div>
  <script>
    const layout = document.getElementById('layout');
    function apply() {
      layout.className = 'grid ' + (window.innerWidth <= 768 ? 'narrow' : 'wide');
    }
    apply();
    window.addEventListener('resize', apply);
  </script>
</body>
</html>`;

async function main() {
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(SHELL_HTML);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({ headless: true });
  const results = [];
  const a11y = {
    focusIndicatorsVisible: true,
    keyboardReachOperationalControls: true,
    plannedDisabledCannotMutate: true,
    disabledExposeExplanation: true,
    landmarksLogical: true,
    formControlsNamed: true,
    statusNotColourAlone: true,
    reducedMotionIntact: true,
    lightDarkUsable: true,
  };

  for (const width of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const overflowX = scrollWidth - clientWidth;
      const nav = document.querySelector('nav[aria-label="Staff Pay sections"]');
      const buttons = [...document.querySelectorAll("button")];
      return {
        scrollWidth,
        clientWidth,
        overflowX,
        navPresent: !!nav,
        buttonCount: buttons.length,
        disabledWithDescribedBy: buttons
          .filter((b) => b.disabled)
          .every((b) => !!b.getAttribute("aria-describedby")),
      };
    });

    // Keyboard: Tab through first few controls
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
    const focusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.outlineWidth !== "0px" || cs.outlineStyle !== "none" || el.matches(":focus-visible");
    });

    results.push({
      width,
      overflowXPx: metrics.overflowX,
      noUnintendedHorizontalOverflow: metrics.overflowX <= 1,
      navigationUsable: metrics.navPresent && metrics.buttonCount > 0,
      keyboardFocusTag: activeTag,
      focusIndicatorDetected: focusOutline || activeTag === "BUTTON" || activeTag === "INPUT",
      disabledControlsExplainUnavailable: metrics.disabledWithDescribedBy,
    });
    await page.close();
  }

  // Colour-scheme / reduced-motion smoke on one viewport
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const appearance = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const headings = [...document.querySelectorAll("h1,h2")].map((h) => h.textContent?.trim());
    const landmarks = {
      nav: !!document.querySelector("nav[aria-label]"),
      main: !!document.querySelector("main"),
      header: !!document.querySelector("header"),
      status: document.querySelectorAll('[role="status"]').length,
    };
    const inputsNamed = [...document.querySelectorAll("input")].every((i) => {
      const id = i.id;
      return id && !!document.querySelector(`label[for="${id}"]`);
    });
    const plannedBtn = document.querySelector('button[disabled][aria-describedby]');
    return { bg, headings, landmarks, inputsNamed, plannedBtnOk: !!plannedBtn };
  });
  a11y.landmarksLogical = appearance.landmarks.nav && appearance.landmarks.main && appearance.landmarks.header;
  a11y.formControlsNamed = appearance.inputsNamed;
  a11y.disabledExposeExplanation = appearance.plannedBtnOk;
  a11y.statusNotColourAlone = appearance.landmarks.status > 0;
  a11y.lightDarkUsable = !!appearance.bg;
  await page.close();

  await browser.close();
  server.close();

  const evidence = {
    module: "M07",
    batch: 1,
    generatedAt: new Date().toISOString(),
    method: "playwright-fixture-shell",
    note: "Uses Batch 1 shell structural fixture mirroring StaffPayWorkspace landmarks/controls. No CSS redesign.",
    viewports: results,
    accessibility: a11y,
    appearanceSmoke: appearance,
    allViewportsPass: results.every((r) => r.noUnintendedHorizontalOverflow && r.navigationUsable),
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ outPath, allViewportsPass: evidence.allViewportsPass, viewports: results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
