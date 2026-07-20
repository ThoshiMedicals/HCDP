import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);

const before = await page.evaluate(() => ({
  app: localStorage.getItem("pulse.cc.appearance"),
  side: localStorage.getItem("pulse.sidebarCollapsed"),
}));
console.log("before", before);

const count = await page.locator('select[aria-label="Appearance"]').count();
const opts = await page.locator('select[aria-label="Appearance"] option').allTextContents();
console.log("count", count, "options", opts);

await page.locator('select[aria-label="Appearance"]').first().selectOption("dark");
await page.waitForTimeout(1200);

const mid = await page.evaluate(() => ({
  app: localStorage.getItem("pulse.cc.appearance"),
  dark: document.body.classList.contains("theme-dark"),
  select: document.querySelector('select[aria-label="Appearance"]')?.value,
}));
console.log("mid", mid);

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const after = await page.evaluate(() => ({
  app: localStorage.getItem("pulse.cc.appearance"),
  dark: document.body.classList.contains("theme-dark"),
  select: document.querySelector('select[aria-label="Appearance"]')?.value,
  sideAttr: document.querySelector("aside")?.getAttribute("data-collapsed"),
  sideStored: localStorage.getItem("pulse.sidebarCollapsed"),
}));
console.log("afterReload", after);

await browser.close();
