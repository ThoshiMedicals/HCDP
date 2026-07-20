import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(15000);
page.on("dialog", async (d) => {
  try {
    await d.accept();
  } catch {
    await d.dismiss().catch(() => null);
  }
});

async function dismiss(page) {
  for (let i = 0; i < 6; i++) await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(100);
}

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => {
  // reset demo day to today so rollover is clean
  const d = new Date().toISOString().slice(0, 10);
  localStorage.setItem("pulse.cc.demoDay", JSON.stringify(d));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await dismiss(page);

await page.getByRole("button", { name: /Open Full Action/i }).first().click();
await page.waitForTimeout(500);
const adlg = page.getByRole("dialog", { name: /ACT-/i });
const ref = ((await adlg.locator("h2").first().textContent()) || "").trim();
const before = await page.evaluate((r) => {
  const actions = JSON.parse(localStorage.getItem("pulse.cc.m1.actions") || "[]");
  const a = actions.find((x) => x.reference === r);
  return { demoDay: JSON.parse(localStorage.getItem("pulse.cc.demoDay") || '""'), action: a && { id: a.id, stage: a.stage, priority: a.priority, completedAt: a.completedAt } };
}, ref);
console.log("before", before);
await adlg.getByRole("button", { name: /Mark Complete/i }).click();
await page.waitForTimeout(500);
await dismiss(page);
const mid = await page.evaluate((r) => {
  const actions = JSON.parse(localStorage.getItem("pulse.cc.m1.actions") || "[]");
  const a = actions.find((x) => x.reference === r);
  return a && { id: a.id, stage: a.stage, priority: a.priority, completedAt: a.completedAt };
}, ref);
console.log("after complete", mid);

await page.getByRole("button", { name: /QA Demo/i }).click();
await page.getByRole("button", { name: /Simulate Next Day/i }).click();
await page.waitForTimeout(800);
await dismiss(page);
const after = await page.evaluate((r) => {
  const actions = JSON.parse(localStorage.getItem("pulse.cc.m1.actions") || "[]");
  const a = actions.find((x) => x.reference === r);
  return {
    demoDay: JSON.parse(localStorage.getItem("pulse.cc.demoDay") || '""'),
    action: a && { id: a.id, stage: a.stage, priority: a.priority, completedAt: a.completedAt },
  };
}, ref);
console.log("after simulate", after);

// open by setting open via search click carefully
await page.getByPlaceholder(/Search or ask/i).fill(ref);
await page.waitForTimeout(800);
const results = await page.locator(".cc-surface-info button, [class*='Search'] button").allTextContents().catch(() => []);
console.log("search texts", (await page.locator("text=Search results").count()), await page.evaluate(() => {
  const panel = Array.from(document.querySelectorAll("strong")).find((s) => /Search results/i.test(s.textContent || ""));
  if (!panel) return "no panel";
  const root = panel.closest("div")?.parentElement;
  return Array.from(root?.querySelectorAll("button") || []).map((b) => b.innerText.slice(0, 80));
}));

await page.locator("strong:has-text('Search results')").locator("..").locator("..").locator("button").filter({ hasText: ref }).first().click().catch(async () => {
  await page.getByRole("button", { name: new RegExp(ref) }).first().click();
});
await page.waitForTimeout(600);
const stageUi = await page.evaluate(() => {
  const d = Array.from(document.querySelectorAll('[role="dialog"]')).find((el) => el.getAttribute("aria-hidden") !== "true" && /ACT-/.test(el.textContent || ""));
  return {
    title: d?.querySelector("h2")?.textContent,
    snippet: (d?.innerText || "").match(/Stage[^\n]{0,60}|Priority[^\n]{0,60}|Closed|Completed|Reopened|Escalated/gi)?.slice(0, 15),
  };
});
console.log("ui", stageUi);
await browser.close();
