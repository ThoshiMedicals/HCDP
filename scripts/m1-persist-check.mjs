import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

await page.locator('select[aria-label="Appearance"]').selectOption("dark");
await page.waitForFunction(() => document.body.classList.contains("theme-dark"), null, { timeout: 5000 });
const stored1 = await page.evaluate(() => localStorage.getItem("pulse.cc.appearance"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(
  () => document.body.classList.contains("theme-dark") && document.querySelector('select[aria-label="Appearance"]')?.value === "dark",
  null,
  { timeout: 10000 }
);
const dark = await page.evaluate(() => ({
  classDark: document.body.classList.contains("theme-dark"),
  stored: localStorage.getItem("pulse.cc.appearance"),
  select: document.querySelector('select[aria-label="Appearance"]')?.value,
}));

await page.getByRole("button", { name: /Collapse navigation/i }).click();
await page.waitForTimeout(400);
const storedSide = await page.evaluate(() => localStorage.getItem("pulse.sidebarCollapsed"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelector("aside")?.getAttribute("data-collapsed") === "true", null, {
  timeout: 10000,
});
const side = await page.evaluate(() => ({
  attr: document.querySelector("aside")?.getAttribute("data-collapsed"),
  stored: localStorage.getItem("pulse.sidebarCollapsed"),
}));

await page.getByRole("tab", { name: "Reports" }).click();
await page.waitForTimeout(400);
const exportPdf = await page.getByRole("button", { name: /Export PDF/i }).count();
await page.getByRole("tab", { name: "Command Centre" }).click();
await page.waitForTimeout(400);
const follow = await page.getByRole("button", { name: /Create follow-up/i }).count();

console.log(JSON.stringify({ stored1, dark, storedSide, side, exportPdf, followUpVisible: follow }, null, 2));
await browser.close();
