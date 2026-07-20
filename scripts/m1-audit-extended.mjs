/**
 * Extended Module 1 control + persistence re-check after fixes
 */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3000";
const rows = [];
const defects = [];

function log(name, status, note = "") {
  rows.push({ name, status, note });
  if (status === "Defect found") defects.push(`${name}: ${note}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
page.on("dialog", async (d) => {
  await d.accept("Audit group").catch(() => d.dismiss());
});

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);

// Appearance persistence
await page.locator('select[aria-label="Appearance"]').selectOption("dark");
await page.waitForTimeout(400);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
let dark = await page.evaluate(() => document.body.classList.contains("theme-dark"));
log("Appearance Dark persists after refresh", dark ? "Working" : "Defect found", `theme-dark=${dark}`);
await page.locator('select[aria-label="Appearance"]').selectOption("light");

// Tabs via role=tab
for (const tab of ["My Day", "KPI Scorecard", "Reports", "Command Centre"]) {
  try {
    await page.getByRole("tab", { name: tab }).click();
    await page.waitForTimeout(350);
    log(`Tab ${tab}`, "Working");
  } catch (e) {
    log(`Tab ${tab}`, "Defect found", e.message.slice(0, 100));
  }
}

// Mobile urgent
try {
  await page.getByRole("button", { name: "Mobile urgent" }).click();
  log("Mobile urgent", "Working");
  await page.getByRole("button", { name: "Desktop view" }).click();
  log("Desktop view", "Working");
} catch (e) {
  log("Mobile urgent", "Defect found", e.message.slice(0, 100));
}

await page.getByRole("tab", { name: "Command Centre" }).click();

// Category filters (buttons with category names)
for (const cat of ["Clinic Operations", "Staffing", "Compliance", "Finance & Pay"]) {
  const b = page.getByRole("button", { name: cat });
  if (await b.count()) {
    await b.first().click();
    log(`Category ${cat}`, "Working");
  } else log(`Category ${cat}`, "Defect found", "missing");
}
await page.getByRole("button", { name: /Clear filters|Clear Filter/i }).first().click().catch(() => null);

// Health + override fields present
if (await page.getByRole("button", { name: /View Health Breakdown/i }).count()) {
  await page.getByRole("button", { name: /View Health Breakdown/i }).first().click();
  await page.waitForTimeout(400);
  log("Health drawer", "Working");
  for (const n of ["Request Update", "Assign Follow-up", "Mark Not Required", "Create Action"]) {
    log(n, (await page.getByRole("button", { name: n }).count()) ? "Working as local demonstration" : "Defect found");
  }
  log(
    "Override form fields",
    (await page.getByText(/Proposed override|Automatic calculated|Approving manager/i).count())
      ? "Working as local demonstration"
      : "Defect found"
  );
  await page.keyboard.press("Escape");
}

// Finance / Incidents / Staffing actions after scrolling
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
await page.waitForTimeout(300);
log("Review (finance)", (await page.getByRole("button", { name: "Review" }).count()) ? "Working as local demonstration" : "Defect found");
log("Review RCA", (await page.getByRole("button", { name: "Review RCA" }).count()) ? "Working as local demonstration" : "Defect found");
log("Create follow-up", (await page.getByRole("button", { name: /Create follow-up/i }).count()) ? "Working as local demonstration" : "Defect found");

// Full action
await page.evaluate(() => window.scrollTo(0, 0));
if (await page.getByRole("button", { name: /Open Full Action/i }).count()) {
  await page.getByRole("button", { name: /Open Full Action/i }).first().click();
  await page.waitForTimeout(400);
  log("Open Full Action", "Working");
  log("Audit History section", (await page.getByText(/Audit History/i).count()) ? "Working as local demonstration" : "Defect found");
  await page.keyboard.press("Escape");
}

// Reports schedule list
await page.getByRole("tab", { name: "Reports" }).click();
await page.waitForTimeout(400);
log("Demo export", (await page.getByRole("button", { name: /Demo export|Sensitive export/i }).count()) ? "Working as local demonstration" : "Defect found");
log("Schedule controls", (await page.getByRole("button", { name: /Schedule|Pause|Resume|Delete|Edit/i }).count()) ? "Working as local demonstration" : "Defect found");

// Mention/Attach labelled disabled
await page.getByRole("tab", { name: "Command Centre" }).click();
await page.waitForTimeout(300);
const mention = page.getByRole("button", { name: /Mention/i });
if (await mention.count()) {
  log("Mention User", (await mention.first().isDisabled()) ? "Backend required and clearly labelled" : "Working as local demonstration");
}
const attach = page.getByRole("button", { name: /Attach/i });
if (await attach.count()) {
  log("Attach File", (await attach.first().isDisabled()) ? "Backend required and clearly labelled" : "Working as local demonstration");
}

// QA card states
await page.getByRole("button", { name: /QA Demo/i }).click();
await page.waitForTimeout(200);
for (const s of ["Loading", "Error", "Current Data", "Data Incomplete", "Permission"]) {
  if (await page.getByRole("button", { name: new RegExp(s, "i") }).count()) {
    log(`QA state ${s}`, "Working as local demonstration");
  }
}
await page.keyboard.press("Escape");

// Sidebar collapsed persistence
await page.getByRole("button", { name: /Collapse navigation/i }).click().catch(() => page.getByRole("button", { name: /^Collapse$/i }).click());
await page.waitForTimeout(300);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const collapsed = await page.evaluate(() => document.querySelector("aside")?.getAttribute("data-collapsed") === "true");
log("Sidebar collapsed persists", collapsed ? "Working" : "Defect found", `data-collapsed=${collapsed}`);
// expand again
await page.getByRole("button", { name: /Expand navigation/i }).click().catch(() => null);

// Module routes batch
for (const slug of [
  "/dashboard",
  "/action-inbox",
  "/risk-centre",
  "/compliance-centre",
  "/executive-analytics",
  "/emergency-control",
  "/tasks",
  "/checklists",
  "/staff",
  "/doctors",
  "/inventory",
  "/staff-pay",
  "/settings",
  "/organisation",
]) {
  const res = await page.goto(`${BASE}${slug}`, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => null);
  const status = res?.status() ?? 0;
  const bad = status >= 500 || /Application error/i.test(await page.content().catch(() => ""));
  log(`Route ${slug}`, !bad && status && status < 500 ? "Working" : "Defect found", `status=${status}`);
}

const summary = {
  total: rows.length,
  working: rows.filter((r) => r.status === "Working").length,
  localDemo: rows.filter((r) => r.status === "Working as local demonstration").length,
  backend: rows.filter((r) => r.status === "Backend required and clearly labelled").length,
  defects: rows.filter((r) => r.status === "Defect found").length,
};
fs.writeFileSync("scripts/m1-audit-extended.json", JSON.stringify({ summary, defects, rows }, null, 2));
console.log(JSON.stringify({ summary, defects, sample: rows.slice(0, 40) }, null, 2));
await browser.close();
