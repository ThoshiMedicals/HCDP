import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
for (let i = 0; i < 3; i++) await page.keyboard.press("Escape");
const btn = page.getByRole("button", { name: /View Health Breakdown/i });
console.log("health btn", await btn.count());
await btn.first().click();
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], aside, [class*="Drawer"], [class*="drawer"]'));
  return {
    dialogCount: document.querySelectorAll('[role="dialog"]').length,
    textSample: (document.body.innerText || "").includes("Temporary manager override"),
    labels: Array.from(document.querySelectorAll("label"))
      .map((l) => (l.textContent || "").trim().slice(0, 50))
      .filter((t) => /reason|expiry|override|Written/i.test(t))
      .slice(0, 20),
    buttons: Array.from(document.querySelectorAll("button"))
      .map((b) => (b.textContent || "").trim())
      .filter((t) => /override|Apply|Withdraw|Health/i.test(t))
      .slice(0, 20),
    dialogTitles: Array.from(document.querySelectorAll('[role="dialog"]')).map((d) =>
      (d.querySelector("h2,h3")?.textContent || d.getAttribute("aria-label") || "").slice(0, 80)
    ),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
