/**
 * Exclusive production-enforcement browser shot for P1-B2.
 *
 * Next.js allows only one `next dev` per project dir. Run this AFTER stopping the
 * ordinary demo server and starting:
 *
 *   AUTH_ENFORCEMENT=production NEXT_PUBLIC_AUTH_ENFORCEMENT=production
 *   node node_modules/next/dist/bin/next dev --webpack -p 3000
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b2-production-enforcement-shot.mjs
 *
 * Local evidence only — not GitHub CI.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
const OUT = join(process.cwd(), "docs/audits/p1/b2-shell-truthfulness");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const failures = [];
function fail(msg) {
  failures.push(msg);
  console.error("FAIL:", msg);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  try {
    page.setDefaultTimeout(120000);
    await page.goto(`${BASE}/dashboard?qaDemo=1`, { waitUntil: "commit", timeout: 120000 });
    await page.waitForSelector('[data-testid="shell-topbar"]', { timeout: 120000 });
    await page.evaluate(() => {
      localStorage.setItem("pulse.platform.qaDemoMode", JSON.stringify({ enabled: true }));
      window.dispatchEvent(new Event("pulse.platform.qa-demo-mode-change"));
    });
    await page.reload({ waitUntil: "commit", timeout: 120000 });
    await page.waitForSelector('[data-testid="shell-topbar"]', { timeout: 120000 });
    await page.waitForTimeout(1500);

    const prodOnline = await page.locator('[data-testid="shell-online-demo-toggle"]').count();
    const prodToggle = await page.locator('[data-testid="shell-qa-demo-mode-toggle"]').count();
    const prodBanner = await page.locator('[data-testid="shell-qa-demo-banner"]').count();
    if (prodOnline !== 0) fail("Online demo toggle visible under production enforcement");
    if (prodBanner !== 0) fail("QA banner visible under production enforcement");
    // Toggle must not enable tools; absence or forced-off is acceptable
    const shotPath = join(SHOTS, "18-production-enforcement-qa-refused-1440-light.png");
    await page.screenshot({ path: shotPath, fullPage: false });
    writeFileSync(
      join(OUT, "production-enforcement-shot-report.json"),
      JSON.stringify(
        {
          ok: failures.length === 0,
          failures,
          prodOnline,
          prodToggle,
          prodBanner,
          shot: shotPath,
          at: new Date().toISOString(),
          note: "Browser evidence against AUTH_ENFORCEMENT=production build/process",
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
  if (failures.length) process.exit(1);
  console.log(JSON.stringify({ ok: true, failures: 0 }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
