import { chromium } from "playwright";
const BASE = "http://localhost:3000";

async function dismiss(page) {
  for (let i = 0; i < 6; i++) await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(120);
}
async function confirmPassword(page) {
  const pwd = page.locator('[role="dialog"]').filter({ has: page.locator('input[type="password"]') });
  if ((await pwd.count()) === 0) return false;
  await pwd.locator('input[type="password"]').fill("demo");
  await pwd.getByRole("button", { name: /Confirm|Continue|Submit/i }).click().catch(() => pwd.getByRole("button").last().click());
  await page.waitForTimeout(400);
  return true;
}
function readAudit(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("pulse.cc.m1.audit") || "[]"));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(15000);
page.on("dialog", async (d) => {
  try {
    await d.accept("gap");
  } catch {
    await d.dismiss().catch(() => null);
  }
});

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => localStorage.removeItem("pulse.cc.m1.audit"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.getByRole("tab", { name: "Command Centre" }).click().catch(() => null);
await dismiss(page);

console.log("=== OVERRIDE ===");
await page.getByRole("button", { name: /View Health Breakdown/i }).first().click();
await page.waitForTimeout(600);
const hdlg = page.getByRole("dialog", { name: /Health Breakdown/i });
console.log("health dlg", await hdlg.count());
await hdlg.getByLabel(/Written reason/i).fill("Acceptance override reason with enough detail");
await hdlg.getByLabel(/Expiry date and time/i).fill("2026-12-31T17:00");
console.log("apply enabled", await hdlg.getByRole("button", { name: /Apply override/i }).isEnabled());
await hdlg.getByRole("button", { name: /Apply override/i }).click();
console.log("pwd", await confirmPassword(page));
await dismiss(page);
let audits = await readAudit(page);
console.log("override", audits.filter((a) => /override/i.test(a.event)).map((a) => a.event));

console.log("=== WITHDRAW ===");
await page.getByRole("button", { name: /View Health Breakdown/i }).first().click();
await page.waitForTimeout(500);
const h2 = page.getByRole("dialog", { name: /Health Breakdown/i });
console.log("withdraw", await h2.getByRole("button", { name: /Withdraw override/i }).count());
await h2.getByRole("button", { name: /Withdraw override/i }).click();
console.log("pwd", await confirmPassword(page));
await dismiss(page);
audits = await readAudit(page);
console.log("withdraw", audits.filter((a) => /withdraw/i.test(a.event)).map((a) => a.event));

console.log("=== EXPORT ===");
await page.getByRole("tab", { name: "Reports" }).click();
await page.waitForTimeout(700);
await page.getByLabel(/confidential/i).first().check();
await page.getByRole("button", { name: /Export PDF/i }).first().click();
console.log("pwd", await confirmPassword(page));
audits = await readAudit(page);
console.log("export", audits.filter((a) => /export/i.test(a.event)).map((a) => a.event));

console.log("=== COMPLETE+REOPEN ===");
await page.getByRole("tab", { name: "Command Centre" }).click();
await dismiss(page);
await page.getByRole("button", { name: /Open Full Action/i }).first().click();
await page.waitForTimeout(500);
const adlg = page.getByRole("dialog", { name: /ACT-/i });
const ref = ((await adlg.locator("h2").first().textContent()) || "").trim();
console.log("ref", ref);
await adlg.getByRole("button", { name: /Mark Complete/i }).click();
await confirmPassword(page);
await dismiss(page);
await page.getByRole("button", { name: /QA Demo/i }).click();
await page.getByRole("button", { name: /Simulate Next Day/i }).click();
await dismiss(page);
await page.waitForTimeout(800);
await page.getByPlaceholder(/Search or ask/i).fill(ref);
await page.waitForTimeout(700);
await page.locator("button").filter({ hasText: ref }).first().click();
await page.waitForTimeout(600);
const rdlg = page.getByRole("dialog", { name: new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
console.log("reopen dlg", await rdlg.count(), "disabled?", await rdlg.getByRole("button", { name: /^Reopen$/i }).isDisabled());
await rdlg.getByLabel(/Reopen reason/i).fill("Reopen after completion for acceptance");
await rdlg.getByRole("button", { name: /^Reopen$/i }).click();
await dismiss(page);
audits = await readAudit(page);
console.log("reopen", audits.filter((a) => /Reopen/i.test(a.event)).map((a) => a.event));

console.log("=== INCIDENT ===");
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
await page.waitForTimeout(400);
const cs = page.getByRole("button", { name: /Close serious/i });
console.log("close serious", await cs.count());
if (await cs.count()) {
  await cs.first().click();
  await confirmPassword(page);
}
audits = await readAudit(page);
console.log("incident", audits.filter((a) => /incident/i.test(a.event)).map((a) => a.event));

console.log("=== PAUSE ===");
await dismiss(page);
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole("button", { name: /^More$/i }).click();
await page.getByRole("button", { name: /Templates & Recurring/i }).click();
await page.waitForTimeout(500);
const modal = page.getByRole("dialog", { name: /Templates & Recurring/i });
await modal.getByRole("button", { name: /Recurring schedules/i }).click();
await page.waitForTimeout(300);
if (!(await modal.getByRole("button", { name: /^Pause$/i }).count())) {
  await modal.getByRole("button", { name: /Save recurring schedule/i }).click();
  await page.waitForTimeout(400);
}
await modal.getByPlaceholder(/Pause reason/i).first().fill("Acceptance pause reason");
await modal.getByRole("button", { name: /^Pause$/i }).first().click();
await dismiss(page);
audits = await readAudit(page);
console.log("pause", audits.filter((a) => /Recurring|pause/i.test(a.event)).map((a) => a.event));
console.log("ALL", audits.map((a) => a.event));
await browser.close();
