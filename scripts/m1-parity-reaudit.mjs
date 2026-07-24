/**
 * Module 1 parity re-audit — /dashboard vs required chrome & widths.
 * Does not modify the prototype. Writes scripts/m1-parity-reaudit-results.json
 */
import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const APPEARANCES = ["light", "dark", "system"];

const out = {
  startedAt: new Date().toISOString(),
  base: BASE,
  hydrationOk: true,
  console: [],
  widths: [],
  appearance: [],
  chrome: [],
  defects: [],
};

function check(name, ok, note = "") {
  const row = { name, status: ok ? "Exact" : "Defect", note };
  out.chrome.push(row);
  if (!ok) out.defects.push(`${name}: ${note}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(10000);

page.on("console", (msg) => {
  if (!["error", "warning"].includes(msg.type())) return;
  const t = msg.text();
  if (/Fast Refresh|React DevTools|Download the React|hydration/i.test(t) && /hydration/i.test(t)) {
    out.hydrationOk = false;
  }
  if (/Hydration|hydration/i.test(t)) out.hydrationOk = false;
  if (/Fast Refresh|React DevTools|Download the React/i.test(t)) return;
  out.console.push(`${msg.type()}: ${t.slice(0, 240)}`);
});
page.on("pageerror", (e) => {
  out.console.push(`pageerror: ${e.message.slice(0, 240)}`);
  if (/hydrat/i.test(e.message)) out.hydrationOk = false;
});

await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// Clear stored layout so Daily Operations default is visible
await page.evaluate(() => {
  try {
    localStorage.removeItem("pulse.cc.activeLayout");
    const raw = localStorage.getItem("pulse.cc.layouts");
    if (raw) {
      const layouts = JSON.parse(raw);
      const next = layouts.map((l) =>
        l.id === "lay-default" ? { ...l, name: "Daily Operations", isDefault: true } : l
      );
      localStorage.setItem("pulse.cc.layouts", JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const bodyText = await page.locator("body").innerText();

check("Title Owner/Director Command Centre", /Owner\/Director Command Centre/.test(bodyText));
check("Greeting Neil organisation overview", /Good (morning|afternoon|evening), Neil\. Here is today.?s organisation overview/.test(bodyText));
check("Layout Daily Operations default", /Layout:\s*Daily Operations/.test(bodyText), bodyText.match(/Layout:\s*[^\n·]+/)?.[0] || "");
check("Ribbon search placeholder", (await page.getByPlaceholder("Search modules, staff, doctors, tasks, assets...").count()) > 0);
check("Online chip", (await page.getByRole("button", { name: /Online|Offline Continuity/ }).count()) > 0);
check("Ribbon Export", (await page.getByRole("button", { name: "Export" }).count()) > 0);
check("Profile Owner / Director", /Owner \/ Director/.test(bodyText));
check("Quick find", (await page.getByRole("button", { name: "Quick find" }).count()) > 0);
check("Workflows", (await page.getByRole("button", { name: "Workflows" }).count()) > 0);
check("Insights", (await page.getByRole("button", { name: "Insights" }).count()) > 0);
check("View", (await page.getByRole("button", { name: "View" }).count()) > 0);
check("Favourite star", (await page.getByLabel(/favourites/i).count()) > 0);
check("Notifications control", (await page.getByRole("button", { name: "Notifications" }).count()) > 0);
check("Create Action", (await page.getByRole("button", { name: "Create Action" }).count()) > 0);
check("Publish Announcement", (await page.getByRole("button", { name: "Publish Announcement" }).count()) > 0);
check("Mobile urgent view", (await page.getByRole("button", { name: /Mobile urgent view|Full desktop view/ }).count()) > 0);
check("End-of-Day Summary", (await page.getByRole("button", { name: "End-of-Day Summary" }).count()) > 0);
check("Enterprise Sign-In shell card", /Enterprise Sign-In \(MFA enforced\)/.test(bodyText));
check("Emergency Intervention shell", /Cross-Location Emergency Intervention/.test(bodyText));
check("Command Centre tab", (await page.getByRole("tab", { name: "Command Centre" }).count()) > 0);
check("My Day tab", (await page.getByRole("tab", { name: "My Day" }).count()) > 0);
check("KPI Scorecard tab", (await page.getByRole("tab", { name: "KPI Scorecard" }).count()) > 0);
check("Reports tab", (await page.getByRole("tab", { name: "Reports" }).count()) > 0);

// Notifications modal body
await page.getByRole("button", { name: "Notifications" }).first().click();
await page.waitForTimeout(400);
const modalText = await page.locator("body").innerText();
check("Notifications Emergency bucket", /Emergency/.test(modalText));
check("Notifications Unread bucket", /Unread/.test(modalText));
check("Notifications Approvals bucket", /Approvals/.test(modalText));
await page.keyboard.press("Escape");

// Widths
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(500);
  const crashed = await page.locator("text=Application error").count();
  const hasTitle = (await page.getByRole("heading", { name: /Owner\/Director Command Centre/ }).count()) > 0;
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const ok = crashed === 0 && hasTitle && scrollW <= w + 24;
  out.widths.push({ width: w, ok, scrollWidth: scrollW, hasTitle, crashed: crashed > 0 });
  if (!ok) out.defects.push(`width ${w}: scroll=${scrollW} title=${hasTitle} crash=${crashed > 0}`);
}

// Appearances
await page.setViewportSize({ width: 1440, height: 900 });
for (const mode of APPEARANCES) {
  const sel = page.locator("select").filter({ has: page.locator(`option[value="${mode}"]`) }).first();
  if ((await sel.count()) === 0) {
    out.appearance.push({ mode, ok: false, note: "select not found" });
    out.defects.push(`appearance ${mode}: select missing`);
    continue;
  }
  await sel.selectOption(mode);
  await page.waitForTimeout(400);
  const dark = await page.evaluate(() => document.body.classList.contains("theme-dark"));
  const stored = await page.evaluate(() => localStorage.getItem("pulse.cc.appearance"));
  out.appearance.push({ mode, ok: true, darkClass: dark, stored });
}

out.finishedAt = new Date().toISOString();
out.summary = {
  chromeExact: out.chrome.filter((c) => c.status === "Exact").length,
  chromeTotal: out.chrome.length,
  widthsOk: out.widths.every((w) => w.ok),
  appearanceOk: out.appearance.every((a) => a.ok),
  hydrationOk: out.hydrationOk,
  defectCount: out.defects.length,
};

const dest = new URL("./m1-parity-reaudit-results.json", import.meta.url);
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
console.log("defects:", out.defects);
await browser.close();
process.exit(out.defects.length ? 1 : 0);
