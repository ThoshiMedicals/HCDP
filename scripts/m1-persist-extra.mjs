import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem("pulse.cc.appearance", "{not-json");
  localStorage.setItem("pulse.cc.layouts", "null");
  localStorage.setItem("pulse.cc.selectedClinics", "\"bad\"");
  localStorage.setItem("pulse.cc.period", "999");
  localStorage.setItem("pulse.cc.healthOverrides", "{");
  localStorage.setItem("pulse.sidebarCollapsed", "maybe");
  localStorage.setItem("pulse.cc.privateNotes", "not-an-array");
  localStorage.setItem("pulse.cc.m1.actions", "null");
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
console.log("malformed recovery", {
  crashed: /Application error/i.test(await page.locator("body").innerText()),
  pageErrors: errors,
  hasCommand: await page.getByRole("tab", { name: "Command Centre" }).count(),
});

// collapsed sections + resized cards via Customise
for (let i = 0; i < 4; i++) await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^More$/i }).click();
await page.getByRole("button", { name: /Customise Dashboard/i }).click();
await page.waitForTimeout(500);
const modal = page.getByRole("dialog", { name: /Customise|Dashboard/i });
const collapseCb = modal.locator('input[type="checkbox"]').nth(1);
if (await collapseCb.count()) await collapseCb.check().catch(() => null);
const sizeSel = modal.locator("select").first();
if (await sizeSel.count()) await sizeSel.selectOption({ label: /Large/i }).catch(() => sizeSel.selectOption({ index: 2 }).catch(() => null));
await modal.getByRole("button", { name: /Save|Apply|Update/i }).first().click().catch(() => null);
await page.waitForTimeout(400);
const layoutBefore = await page.evaluate(() => localStorage.getItem("pulse.cc.layouts"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const layoutAfter = await page.evaluate(() => localStorage.getItem("pulse.cc.layouts"));
console.log("layouts persist", Boolean(layoutBefore && layoutAfter && layoutAfter.length > 10), "errors after customise", errors.length);

// private reminder
await page.getByRole("tab", { name: "Command Centre" }).click().catch(() => null);
for (let i = 0; i < 3; i++) await page.keyboard.press("Escape");
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
const noteArea = page.getByPlaceholder(/Personal reminder/i);
console.log("note area", await noteArea.count());
if (await noteArea.count()) {
  await noteArea.fill("Persist note for acceptance");
  await page.getByRole("button", { name: /Save private note/i }).click();
  await page.waitForTimeout(300);
  const dt = page.locator('input[type="datetime-local"]').last();
  if (await dt.count()) {
    await dt.fill("2026-07-21T09:00");
    await page.getByRole("button", { name: /Add reminder/i }).click();
  }
}
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const notes = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem("pulse.cc.privateNotes") || "[]");
  } catch {
    return [];
  }
});
console.log("notes after", notes.map((n) => ({ note: n.note?.slice(0, 40), reminderAt: n.reminderAt })));
console.log("final errors", errors);
await browser.close();
