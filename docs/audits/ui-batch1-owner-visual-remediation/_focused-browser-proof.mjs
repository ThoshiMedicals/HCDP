import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "docs/audits/ui-batch1-owner-visual-remediation");
const AFTER = join(OUT, "after");
mkdirSync(AFTER, { recursive: true });
const BASE = process.env.HCDP_BASE_URL || "http://localhost:3463";

const checks = [
  ["dashboard", 1440, "/dashboard"],
  ["dashboard", 390, "/dashboard"],
  ["m04", 1440, "/staff-doctors"],
  ["m04", 390, "/staff-doctors"],
  ["m05", 1440, "/roster"],
  ["m05", 390, "/roster"],
  ["m06", 1440, "/time-attendance"],
  ["m06", 390, "/time-attendance"],
  ["m07-overview", 1440, "/staffpay?section=overview"],
  ["m07-overview", 390, "/staffpay?section=overview"],
  ["m07-adjustments", 1440, "/staffpay?section=adjustments"],
  ["m07-adjustments", 390, "/staffpay?section=adjustments"],
];

async function auditPage(page) {
  return page.evaluate(() => {
    const fav = Array.from(document.querySelectorAll(".v33-aux-head")).some((el) =>
      /Favourites|Recent/i.test(el.textContent || "")
    );
    const ids = Array.from(document.querySelectorAll("[data-canonical-module]")).map((el) =>
      el.getAttribute("data-canonical-module")
    );
    const rails = Array.from(document.querySelectorAll("aside")).filter((a) => {
      if (a.classList.contains("pulse-sidebar")) return false;
      if (a.getAttribute("role") === "dialog") return false;
      const r = a.getBoundingClientRect();
      return r.width > 160 && r.width < 280 && r.left < 400;
    }).length;
    const familyEl = document.querySelector(".v33-family-palette");
    const familyVisible = Boolean(familyEl && getComputedStyle(familyEl).display !== "none");
    const sb = document.querySelector(".pulse-sidebar");
    const active = sb?.querySelector(".nav-row.active");
    return {
      sidebars: document.querySelectorAll(".pulse-sidebar").length,
      familyVisible,
      fav,
      nested: document.querySelectorAll(".pulse-sidebar a .v33-fav-star").length,
      h1: Array.from(document.querySelectorAll("h1")).map((h) => (h.textContent || "").trim()),
      desktop: (() => {
        const el = document.querySelector('[data-module-section-nav="desktop"]');
        return Boolean(el && getComputedStyle(el).display !== "none");
      })(),
      compact: (() => {
        const el = document.querySelector('[data-module-section-nav="compact"]');
        return Boolean(el && getComputedStyle(el).display !== "none");
      })(),
      rails,
      primary: Boolean(document.querySelector('[data-dashboard-area="indicators"]')),
      secondary: Boolean(document.querySelector('[data-dashboard-area="secondary-detail"]')),
      unique: ids.length === new Set(ids).size,
      bg: sb ? getComputedStyle(sb).backgroundColor : null,
      activeBorder: active ? getComputedStyle(active).borderLeftColor : null,
      gradientActive: active
        ? getComputedStyle(active).backgroundImage !== "none"
        : false,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const rows = [];

for (const [name, w, route] of checks) {
  await page.setViewportSize({ width: w, height: w <= 430 ? 844 : 900 });
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  if (!route.includes("dashboard")) {
    try {
      await page.waitForSelector("[data-module-section-nav]", { timeout: 8000 });
    } catch {
      /* recorded */
    }
  }
  const a = await auditPage(page);
  const isDash = route.includes("dashboard");
  const ok =
    a.sidebars === 1 &&
    !a.familyVisible &&
    !a.fav &&
    a.nested === 0 &&
    a.rails === 0 &&
    a.unique &&
    a.h1.length === 1 &&
    !a.gradientActive &&
    (isDash ? a.primary && a.secondary : w > 768 ? a.desktop : a.compact);
  rows.push({ name, w, route, ok, audit: a });
  await page.screenshot({ path: join(AFTER, `${name}-${w}.png`), fullPage: false });
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  document.body.classList.add("theme-dark");
  localStorage.setItem("pulse.cc.appearance", JSON.stringify("dark"));
});
await page.waitForTimeout(400);
await page.screenshot({ path: join(AFTER, "dashboard-dark-1440.png"), fullPage: false });
await page.screenshot({ path: join(AFTER, "sidebar-dark-1440.png"), fullPage: false });

const result = { pass: rows.every((r) => r.ok), rows, finishedAt: new Date().toISOString() };
writeFileSync(join(OUT, "focused-browser-proof.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.pass ? 0 : 1);
