import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(
  process.cwd(),
  "docs/audits/ui-batch1-owner-visual-remediation/before"
);
mkdirSync(outDir, { recursive: true });

const base = process.env.HCDP_BASE_URL || "http://localhost:3000";
const shots = [
  ["dashboard", "/dashboard"],
  ["sidebar-via-dashboard", "/dashboard"],
  ["m04", "/staff-doctors"],
  ["m05", "/roster"],
  ["m06", "/time-attendance"],
  ["m07-overview", "/staffpay?section=overview"],
  ["m07-adjustments", "/staffpay?section=adjustments"],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const [name, url] of shots) {
  await page.goto(base + url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: join(outDir, `${name}-1440.png`),
    fullPage: false,
  });
}

await page.setViewportSize({ width: 390, height: 844 });
for (const [name, url] of shots) {
  await page.goto(base + url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(outDir, `${name}-390.png`),
    fullPage: false,
  });
}

// Dark mode samples
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => {
  document.body.classList.add("theme-dark");
  try {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify("dark"));
  } catch {
    /* ignore */
  }
});
await page.waitForTimeout(500);
await page.screenshot({
  path: join(outDir, "dashboard-dark-1440.png"),
  fullPage: false,
});

await browser.close();
console.log("before screenshots written to", outDir);
