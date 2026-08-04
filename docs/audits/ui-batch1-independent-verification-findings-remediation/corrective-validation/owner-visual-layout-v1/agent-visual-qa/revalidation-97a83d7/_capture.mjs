/**
 * Phase 4 FINAL spot-check REVALIDATION capture at 97a83d7 — evidence only.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/tmp/hcdp-fix/ui-batch1-vqa-3490/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
const CROPS = path.join(__dirname, "defect-crops");
const GEO = path.join(__dirname, "geometry");
const BASE = "http://127.0.0.1:3490";
const APP_SHA = "97a83d7beb219ce01a7b12c6f70a975a44614d59";

for (const d of [OUT, CROPS, GEO]) fs.mkdirSync(d, { recursive: true });

async function setAppearance(page, mode) {
  await page.evaluate((m) => localStorage.setItem("pulse.cc.appearance", JSON.stringify(m)), mode);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1100);
}

async function gotoReady(page, route) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1100);
}

async function ensureSidebarFooterVisible(page) {
  await page.evaluate(() => {
    const sidebar = document.querySelector("aside.pulse-sidebar");
    const footer = sidebar?.querySelector(".sidebar-user");
    if (footer) footer.scrollIntoView({ block: "end", inline: "nearest" });
    if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
  });
  await page.waitForTimeout(250);
}

async function clipRect(page, rect, name) {
  const vp = page.viewportSize();
  const clip = {
    x: Math.max(0, rect.x),
    y: Math.max(0, rect.y),
    width: Math.min(vp.width - Math.max(0, rect.x), rect.width),
    height: Math.min(vp.height - Math.max(0, rect.y), rect.height),
  };
  if (clip.width < 2 || clip.height < 2) return null;
  await page.screenshot({ path: path.join(CROPS, name), clip });
  return name;
}

const jobs = [
  { route: "/dashboard", w: 390, h: 844, ap: "light", name: "light-390-_dashboard.png" },
  { route: "/dashboard", w: 1024, h: 768, ap: "light", name: "light-1024x768-_dashboard.png", footer: true },
  { route: "/dashboard", w: 1440, h: 900, ap: "light", name: "light-1440-_dashboard.png", footer: true },
  { route: "/settings", w: 390, h: 844, ap: "light", name: "light-390-_settings.png" },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
const captures = [];

for (const job of jobs) {
  await page.setViewportSize({ width: job.w, height: job.h });
  await gotoReady(page, job.route);
  await setAppearance(page, job.ap);
  if (job.footer) await ensureSidebarFooterVisible(page);
  await page.screenshot({ path: path.join(OUT, job.name), fullPage: false });
  captures.push({ ...job, finalUrl: page.url() });
  console.log("captured", job.name);
}

// crops
await page.setViewportSize({ width: 390, height: 844 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 0, width: 390, height: 72 }, "VQA-002-spot-light-390-topbar.png");
{
  const box = await page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    if (!btn) return null;
    let n = btn.parentElement;
    while (n && n !== document.body) {
      if (/EMERGENCY ANNOUNCEMENT/i.test(n.textContent || "") && n.querySelectorAll("button").length >= 3) {
        const r = n.getBoundingClientRect();
        return {
          x: Math.max(0, r.x - 4),
          y: Math.max(0, r.y - 4),
          width: Math.min(window.innerWidth, r.width + 8),
          height: Math.min(520, r.height + 8),
        };
      }
      n = n.parentElement;
    }
    const r = btn.parentElement.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.y - 40), width: 390, height: 280 };
  });
  if (box) await clipRect(page, box, "VQA-001-spot-light-390-emergency.png");
}

await page.setViewportSize({ width: 1024, height: 768 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
{
  const box = await page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    let card = null;
    if (btn) {
      let n = btn.parentElement;
      while (n && n !== document.body) {
        if (/EMERGENCY ANNOUNCEMENT/i.test(n.textContent || "") && n.querySelectorAll("button").length >= 3) {
          card = n;
          break;
        }
        n = n.parentElement;
      }
    }
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 4),
      y: Math.max(0, r.y - 4),
      width: Math.min(window.innerWidth - Math.max(0, r.x - 4), r.width + 8),
      height: Math.min(window.innerHeight - Math.max(0, r.y - 4), Math.min(r.height + 8, 520)),
    };
  });
  if (box) await clipRect(page, box, "VQA-005-spot-light-1024-emergency.png");
}

await page.setViewportSize({ width: 1440, height: 900 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 720, width: 300, height: 180 }, "VQA-004-spot-light-1440-sidebar-footer.png");

await page.setViewportSize({ width: 390, height: 844 });
await gotoReady(page, "/settings");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 90, width: 390, height: 130 }, "VQA-003-spot-light-390-settings-h1.png");

fs.writeFileSync(
  path.join(GEO, "manifest.json"),
  JSON.stringify({ appSha: APP_SHA, base: BASE, capturedAt: new Date().toISOString(), captures }, null, 2)
);
await browser.close();
console.log("DONE", captures.length);
