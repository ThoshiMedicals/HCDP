import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem("pulse.cc.appearance", "{not-json");
  localStorage.setItem("pulse.cc.m1.actions", "[]");
  localStorage.setItem("pulse.cc.layouts", "null");
  localStorage.setItem("pulse.cc.selectedClinics", "\"bad\"");
  localStorage.setItem("pulse.cc.period", "999");
  localStorage.setItem("pulse.cc.healthOverrides", "{");
  localStorage.setItem("pulse.sidebarCollapsed", "maybe");
  localStorage.setItem("pulse.cc.notes", "not-an-array");
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const ok = await page.evaluate(() => {
  return {
    hasBody: !!document.body,
    title: document.title,
    crashed: /Application error|Unhandled|Something went wrong/i.test(document.body?.innerText || ""),
    hasNav: !!document.querySelector("aside, nav, [data-sidebar]"),
  };
});
console.log(JSON.stringify({ ok, pageErrors: errors.slice(0, 5) }, null, 2));

// collapsed section + resize + reminders if present
await page.getByRole("tab", { name: "Command Centre" }).click().catch(() => null);
for (let i = 0; i < 4; i++) await page.keyboard.press("Escape").catch(() => null);

const collapse = page.getByRole("button", { name: /Collapse|Expand/i }).first();
console.log("collapse/expand controls", await collapse.count());
if (await collapse.count()) {
  await collapse.click().catch(() => null);
  await page.waitForTimeout(200);
}

// private reminders
const rem = page.getByPlaceholder(/reminder/i);
console.log("reminder fields", await rem.count());
if (await rem.count()) {
  await rem.first().fill("Acceptance reminder 9am");
  const add = page.getByRole("button", { name: /Add reminder|Save reminder|Add/i }).first();
  if (await add.count()) await add.click().catch(() => null);
}

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const after = await page.evaluate(() => ({
  notes: localStorage.getItem("pulse.cc.notes")?.slice(0, 80),
  layouts: localStorage.getItem("pulse.cc.layouts")?.slice(0, 40),
  crashed: /Application error/i.test(document.body?.innerText || ""),
}));
console.log("after reload", after, "errors", errors.length);
await browser.close();
