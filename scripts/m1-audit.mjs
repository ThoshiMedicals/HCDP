import { chromium } from "playwright";

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const BASE = "http://localhost:3000/dashboard";

const browser = await chromium.launch({ headless: true });
const results = [];

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const consoleMsgs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      const t = msg.text();
      if (!/Fast Refresh|Download the React DevTools|data-cursor-ref/i.test(t)) {
        consoleMsgs.push(`${msg.type()}: ${t.slice(0, 240)}`);
      }
    }
  });
  page.on("pageerror", (err) => consoleMsgs.push(`pageerror: ${err.message.slice(0, 240)}`));
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const buttons = Array.from(document.querySelectorAll("button, [role='button'], a.cc-ctrl, select"));
    return {
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      clientWidth: doc.clientWidth,
      overflowX: Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth,
      withdraw: !!buttons.find((b) => /Withdraw notice/i.test(b.textContent || "")),
      createAction: !!buttons.find((b) => /Create Action/i.test(b.textContent || "")),
      qaDemo: !!buttons.find((b) => /QA Demo/i.test(b.textContent || "")),
      emergency: /EMERGENCY/i.test(document.body.innerText),
      hamburger: !!document.querySelector('button[aria-label="Open menu"]'),
      sidebarVisible:
        !!document.querySelector('aside[data-collapsed]') &&
        !document.querySelector("aside")?.className.includes("-translate-x-full"),
      interactiveCount: buttons.length,
    };
  });

  let darkOk = false;
  const appearance = page.locator('select[aria-label="Appearance"], select[aria-label*="Light or Dark" i], select[aria-label*="Appearance" i]');
  if (await appearance.count()) {
    await appearance.first().selectOption({ label: "Dark" }).catch(async () => {
      await appearance.first().selectOption("dark").catch(() => null);
    });
    await page.waitForTimeout(250);
    darkOk = await page.evaluate(() => document.body.classList.contains("theme-dark"));
    await appearance.first().selectOption({ label: "Light" }).catch(async () => {
      await appearance.first().selectOption("light").catch(() => null);
    });
  }

  // period change smoke
  const period = page.locator('select[aria-label="Period"]');
  let periodChanged = false;
  if (await period.count()) {
    const before = await page.locator("text=Last updated").first().textContent().catch(() => "");
    await period.first().selectOption({ label: "This Month" }).catch(() => period.first().selectOption("This Month"));
    await page.waitForTimeout(400);
    periodChanged = true;
  }

  results.push({
    width: w,
    ...metrics,
    darkOk,
    periodChanged,
    hydrationErrors: consoleMsgs.filter((m) => /hydrat/i.test(m)).length,
    consoleSample: consoleMsgs.slice(0, 6),
  });
  await page.close();
}

// Button presence audit at 1280
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1000);
const labels = await page.evaluate(() => {
  const wanted = [
    "Select Clinics",
    "Urgent only",
    "Save clinic group",
    "Create Action",
    "Publish",
    "Refresh",
    "Withdraw notice",
    "Acknowledge",
    "View as Table",
    "QA Demo",
    "End-of-Day",
    "Review RCA",
    "Approve",
    "Open Full Briefing",
    "Mobile urgent",
  ];
  const text = Array.from(document.querySelectorAll("button, a, summary, label, select option"))
    .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
    .join(" || ");
  return Object.fromEntries(wanted.map((w) => [w, text.toLowerCase().includes(w.toLowerCase())]));
});

// Click Create Action → expect modal
await page.getByRole("button", { name: "Create Action" }).first().click();
await page.waitForTimeout(300);
const createModal = await page.getByRole("dialog", { name: /Create Action/i }).count();
await page.keyboard.press("Escape");

// Dark contrast spot: theme class
await page.locator('select[aria-label="Appearance"], select[aria-label*="Light or Dark" i]').first().selectOption("dark").catch(() => null);
await page.waitForTimeout(200);
const darkClass = await page.evaluate(() => document.body.classList.contains("theme-dark"));

console.log(
  JSON.stringify(
    {
      widths: results,
      buttonPresence1280: labels,
      createActionModalOpens: createModal > 0,
      darkClassAfterSelect: darkClass,
    },
    null,
    2
  )
);
await browser.close();
