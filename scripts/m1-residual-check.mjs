import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith("pulse.")) localStorage.removeItem(k);
  }
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const scan = async (label, fn) => {
  try {
    const ok = await fn();
    console.log(label, ok ? "FOUND" : "MISSING");
  } catch (e) {
    console.log(label, "ERR", e.message.slice(0, 80));
  }
};

await scan("Approve with Conditions", () => page.getByRole("button", { name: /Approve with Conditions/i }).count().then((n) => n > 0));
await page.getByRole("button", { name: /More/i }).first().click();
await page.waitForTimeout(200);
await scan("Customise (in More)", () => page.getByRole("button", { name: /Customise/i }).count().then((n) => n > 0));
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /Select Clinics/i }).click();
await page.waitForTimeout(200);
await scan("Save clinic group", () => page.getByRole("button", { name: /Save clinic group/i }).count().then((n) => n > 0));
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /Open Full Action/i }).first().click();
await page.waitForTimeout(400);
await scan("Change Priority", () => page.getByRole("button", { name: /Change Priority|Priority/i }).count().then((n) => n > 0));
await scan("Send Reminder", () => page.getByRole("button", { name: /Send Reminder|Reminder/i }).count().then((n) => n > 0));
await scan("Dismiss", () => page.getByRole("button", { name: /^Dismiss$/i }).count().then((n) => n > 0));
const names = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role=dialog] button'))
    .map((b) => (b.textContent || "").trim())
    .filter(Boolean)
    .slice(0, 40)
);
console.log("full action buttons", names);
await browser.close();
