import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1000);

await page.evaluate(() => {
  localStorage.setItem("pulse.cc.appearance", JSON.stringify("dark"));
  localStorage.setItem("pulse.sidebarCollapsed", JSON.stringify(true));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const r = await page.evaluate(() => ({
  dark: document.body.classList.contains("theme-dark"),
  sel: document.querySelector('select[aria-label="Appearance"]')?.value,
  side: document.querySelector("aside")?.getAttribute("data-collapsed"),
  app: localStorage.getItem("pulse.cc.appearance"),
  sideLs: localStorage.getItem("pulse.sidebarCollapsed"),
}));

console.log(JSON.stringify({ r, logs: logs.filter((l) => /error|hydrat|Appearance|sidebar/i.test(l)).slice(0, 20) }, null, 2));
await browser.close();
