/**
 * Capture before screenshots from preserved visual-remediation localhost:3000.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
const OUT = join(
  process.cwd(),
  "docs/audits/ui-batch1-owner-colour-readability-remediation/before"
);
mkdirSync(OUT, { recursive: true });

const shots = [
  ["dashboard", "/dashboard"],
  ["sidebar", "/dashboard"],
  ["m04", "/staff-doctors"],
  ["m05", "/roster"],
  ["m06", "/time-attendance"],
  ["m07-overview", "/staffpay?section=overview"],
  ["m07-adjustments", "/staffpay?section=adjustments"],
];
const widths = [1440, 390];
const modes = ["light", "dark"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const mode of modes) {
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: w <= 430 ? 844 : 900 });
    for (const [name, route] of shots) {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.evaluate((m) => {
        try {
          localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
        } catch {
          /* ignore */
        }
        if (m === "dark") document.body.classList.add("theme-dark");
        else document.body.classList.remove("theme-dark");
      }, mode);
      try {
        await page.reload({ waitUntil: "networkidle", timeout: 90000 });
      } catch {
        /* tolerate idle timeout */
      }
      await page.waitForTimeout(700);
      const file = join(OUT, `${mode}-${name}-${w}.png`);
      if (name === "sidebar") {
        const sb = await page.$(".pulse-sidebar");
        if (sb) await sb.screenshot({ path: file });
        else await page.screenshot({ path: file, fullPage: false });
      } else {
        await page.screenshot({ path: file, fullPage: false });
      }
      console.log("wrote", file);
    }
  }
}

await browser.close();
console.log("before screenshots done");
