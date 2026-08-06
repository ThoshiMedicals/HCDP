/**
 * Correction 2 — individual after-geometry + screenshot for prior 110 defects.
 * Frozen app SHA 31b3111 against :3502. Read-only against production source.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3502";
const APP_SHA = "31b31115fa1bab99e2cea47c8526a4c8011e2fe2";
const WORKTREE = "/tmp/hcdp-fix/ui-batch1-vf-fixes";
const SRC = path.join(
  WORKTREE,
  "docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/owner-inspection-contradiction-correction-v1/phase1-reproduction/DEFECT_RECONCILIATION_110.json"
);
const OUT = path.join(__dirname, "prior-110-after");
const GEO = path.join(OUT, "geometry");
const SHOTS = path.join(OUT, "screenshots");
for (const d of [OUT, GEO, SHOTS]) fs.mkdirSync(d, { recursive: true });

const head = execSync("git rev-parse HEAD", { cwd: WORKTREE }).toString().trim();
const shaMatch = head === APP_SHA;
const diffBytes = Number(
  execSync(`git diff ${APP_SHA} -- src scripts | wc -c`, { cwd: WORKTREE, shell: "/bin/bash" })
    .toString()
    .trim()
);

const payload = JSON.parse(fs.readFileSync(SRC, "utf8"));
const defects = payload.defects || [];

function normLabel(s) {
  return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-dev-shm-usage"] });
const results = [];
let stillBad = 0;
let cleared = 0;
let missing = 0;

for (const d of defects) {
  const width = d.viewport || 1440;
  const height = width <= 430 ? 844 : width <= 768 ? 1024 : 900;
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: d.appearance === "dark" ? "dark" : "light",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + d.route, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(700);
  const probe = await page.evaluate(
    ({ tag, label }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const want = (label || "").replace(/\s+/g, " ").trim().toLowerCase();
      const nodes = [...document.querySelectorAll(tag || "*")];
      let best = null;
      function isClosedSurface(el) {
        if (el.closest('[role="dialog"][aria-hidden="true"], aside[aria-modal][aria-hidden="true"], [inert]')) return true;
        const sb = el.closest(".pulse-sidebar");
        if (!sb) return false;
        const t = getComputedStyle(sb).transform || "";
        const m = t.match(/matrix\(([^)]+)\)/);
        const tx = m ? Number(m[1].split(",")[4]) : 0;
        const r = sb.getBoundingClientRect();
        return (Number.isFinite(tx) && Math.abs(tx) > 8) || r.right <= 1;
      }
      for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue;
        if (isClosedSurface(el)) continue;
        const text = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
        if (!want) {
          if (tag === "input" && el.matches("input:not([type=hidden])")) {
            // Prefer module workspace inputs over global chrome search.
            if (el.closest("main, .content, [data-module], form")) {
              best = el;
              break;
            }
            if (!best) best = el;
          }
          continue;
        }
        if (text === want || text.startsWith(want.slice(0, Math.min(12, want.length)))) {
          best = el;
          break;
        }
      }
      if (!best) return { found: false };
      const r = best.getBoundingClientRect();
      const cs = getComputedStyle(best);
      const closed = !!best.closest('[role="dialog"][aria-hidden="true"], [inert], aside[aria-modal][aria-hidden="true"]');
      const overflowsX = r.right > vw + 1 || r.left < -1;
      const overflowsY = r.bottom > vh + 1 || r.top < -1;
      const belowViewportPageScroll = !overflowsX && overflowsY;
      const centreInViewport =
        r.left + r.width / 2 >= 0 &&
        r.top + r.height / 2 >= 0 &&
        r.left + r.width / 2 <= vw &&
        r.top + r.height / 2 <= vh;
      let clippedByAncestor = false;
      let n = best.parentElement;
      while (n && n !== document.body) {
        const ncs = getComputedStyle(n);
        const ox = ncs.overflowX;
        const oy = ncs.overflowY;
        const clips =
          ox === "hidden" || ox === "clip" || oy === "hidden" || oy === "clip" || ncs.overflow === "hidden";
        if (clips) {
          const pr = n.getBoundingClientRect();
          const scrollableX = n.scrollWidth > n.clientWidth + 2;
          const scrollableY = n.scrollHeight > n.clientHeight + 2;
          const intentional =
            (r.right > pr.right + 1 && scrollableX && (ox === "auto" || ox === "scroll")) ||
            (r.bottom > pr.bottom + 1 && scrollableY && (oy === "auto" || oy === "scroll"));
          if (!intentional && (r.right > pr.right + 1 || r.bottom > pr.bottom + 1 || r.left < pr.left - 1)) {
            clippedByAncestor = true;
            break;
          }
        }
        n = n.parentElement;
      }
      const defect =
        !closed &&
        ((overflowsX && !belowViewportPageScroll) || (clippedByAncestor && overflowsX));
      return {
        found: true,
        closed,
        centreInViewport,
        overflowsX,
        overflowsY,
        belowViewportPageScroll,
        clippedByAncestor,
        defect,
        rect: {
          x: +r.x.toFixed(2),
          y: +r.y.toFixed(2),
          width: +r.width.toFixed(2),
          height: +r.height.toFixed(2),
        },
        visibility: cs.visibility,
        display: cs.display,
      };
    },
    { tag: d.tag, label: d.label }
  );

  const shotName = `${d.id}-${width}.png`;
  const shotPath = path.join(SHOTS, shotName);
  await page.screenshot({ path: shotPath, fullPage: false });
  const status = !probe.found ? "MISSING" : probe.defect ? "STILL_BAD" : "CLEARED";
  if (status === "STILL_BAD") stillBad++;
  else if (status === "CLEARED") cleared++;
  else missing++;

  const row = {
    id: d.id,
    route: d.route,
    viewport: width,
    appearance: d.appearance,
    tag: d.tag,
    label: d.label,
    status,
    afterGeometry: probe,
    screenshot: path.relative(OUT, shotPath),
  };
  results.push(row);
  fs.writeFileSync(path.join(GEO, `${d.id}.json`), JSON.stringify(row, null, 2));
  await ctx.close();
}

await browser.close();

const summary = {
  frozenAppSha: APP_SHA,
  headSha: head,
  shaMatch,
  appTreeCleanVsFreeze: diffBytes === 0,
  diffBytes,
  base: BASE,
  total: defects.length,
  cleared,
  stillBad,
  missing,
  identityNote: "Individual after-geometry + screenshot per prior defect id",
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT, "SUMMARY.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(OUT, "RESULTS.json"), JSON.stringify({ summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(stillBad > 0 || !shaMatch || diffBytes !== 0 ? 2 : 0);
