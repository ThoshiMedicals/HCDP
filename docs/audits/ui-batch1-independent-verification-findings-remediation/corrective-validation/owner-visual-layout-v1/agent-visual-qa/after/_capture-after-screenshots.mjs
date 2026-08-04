/**
 * Visual QA Phase 4 — AFTER screenshot capture (evidence-only).
 * Does not edit application source. Targets http://127.0.0.1:3490.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Resolve playwright from the live server worktree
const { chromium: chromiumFromApp } = require("/tmp/hcdp-fix/ui-batch1-vqa-3490/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
const CROPS = path.join(__dirname, "defect-crops");
const GEO = path.join(__dirname, "geometry");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3490";
const APP_SHA = "d822dfd4a80ed0c98635a0ff8631f9e39fe781f0";

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CROPS, { recursive: true });
fs.mkdirSync(GEO, { recursive: true });

async function setAppearance(page, mode) {
  await page.evaluate((m) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
  }, mode);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
}

async function gotoReady(page, route) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1100);
}

function shotPath(name) {
  return path.join(OUT, name);
}

async function captureViewport(page, name) {
  const file = shotPath(name);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function clipElement(page, selector, outName, pad = 4) {
  const loc = page.locator(selector).first();
  if ((await loc.count()) === 0) return null;
  const box = await loc.boundingBox();
  if (!box) return null;
  const vp = page.viewportSize();
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: Math.min(vp.width - Math.max(0, box.x - pad), box.width + pad * 2),
    height: Math.min(vp.height - Math.max(0, box.y - pad), box.height + pad * 2),
  };
  if (clip.width < 2 || clip.height < 2) return null;
  const file = path.join(CROPS, outName);
  await page.screenshot({ path: file, clip });
  return file;
}

async function clipRect(page, rect, outName) {
  const vp = page.viewportSize();
  const clip = {
    x: Math.max(0, rect.x),
    y: Math.max(0, rect.y),
    width: Math.min(vp.width - Math.max(0, rect.x), rect.width),
    height: Math.min(vp.height - Math.max(0, rect.y), rect.height),
  };
  if (clip.width < 2 || clip.height < 2) return null;
  const file = path.join(CROPS, outName);
  await page.screenshot({ path: file, clip });
  return file;
}

async function geometryProbe(page) {
  return page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
      };
    };
    const overflowX = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const parent = el.parentElement?.getBoundingClientRect();
      return {
        text: text(el).slice(0, 80),
        right: Math.round(r.right),
        viewportW: window.innerWidth,
        overflowsViewport: r.right > window.innerWidth + 0.5,
        overflowsParent: parent ? r.right > parent.right + 0.5 : null,
        parentRight: parent ? Math.round(parent.right) : null,
      };
    };

    const h1 = document.querySelector("h1");
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const emergencyBtn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    const emergencyCard = emergencyBtn
      ? emergencyBtn.closest("section,article,div")
      : Array.from(document.querySelectorAll("section,div")).find((el) =>
          /EMERGENCY ANNOUNCEMENT/i.test(el.textContent || "")
        );
    const topbar = document.querySelector(".pulse-top-ribbon") || document.querySelector("header");
    const brand = Array.from(document.querySelectorAll("span,a,div,p")).find((el) =>
      /^Doctors Pulse$/i.test(text(el))
    );
    const dashCtrl = Array.from(document.querySelectorAll("a,button")).find((el) =>
      /^Dashboard$/i.test(text(el))
    );
    const sidebar = document.querySelector("aside.pulse-sidebar");
    const footer = sidebar?.querySelector(".sidebar-user");
    const actAs = sidebar?.querySelector('select[aria-label="Act as User / Role"]');
    const demoAct = Array.from(sidebar?.querySelectorAll("*") || []).find((el) =>
      /Demo Act-as|not production/i.test(text(el))
    );

    const brandR = rect(brand);
    const dashR = rect(dashCtrl);
    let brandOverlap = null;
    if (brandR && dashR) {
      const overlap =
        brandR.x < dashR.x + dashR.w &&
        brandR.x + brandR.w > dashR.x &&
        brandR.y < dashR.y + dashR.h &&
        brandR.y + brandR.h > dashR.y;
      brandOverlap = { overlap, brand: brandR, dashboardControl: dashR, brandText: text(brand) };
    }

    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      appearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      h1: {
        text: text(h1),
        rect: rect(h1),
        textOverflow: h1Style?.textOverflow || null,
        whiteSpace: h1Style?.whiteSpace || null,
        overflow: h1Style?.overflow || null,
        clientWidth: h1?.clientWidth ?? null,
        scrollWidth: h1?.scrollWidth ?? null,
        truncatedByEllipsis:
          !!h1 &&
          (h1Style?.textOverflow === "ellipsis" || (h1.scrollWidth > h1.clientWidth + 1)),
      },
      emergency: {
        present: !!emergencyBtn,
        btn: overflowX(emergencyBtn),
        cardRect: rect(emergencyCard),
      },
      topbar: {
        present: !!topbar,
        brandOverlap,
      },
      sidebarFooter: {
        present: !!footer,
        rect: rect(footer),
        fullyInViewport: footer
          ? (() => {
              const r = footer.getBoundingClientRect();
              return r.top >= 0 && r.bottom <= window.innerHeight + 0.5 && r.height > 0;
            })()
          : false,
        userName: text(footer?.querySelector(".user-name")),
        userRole: text(footer?.querySelector(".user-role")),
        actAsPresent: !!actAs,
        actAsRect: rect(actAs),
        demoActText: demoAct ? text(demoAct).slice(0, 80) : null,
        demoActRect: rect(demoAct),
        nameRoleOverlap: (() => {
          const n = footer?.querySelector(".user-name");
          const r = footer?.querySelector(".user-role");
          if (!n || !r) return null;
          const a = n.getBoundingClientRect();
          const b = r.getBoundingClientRect();
          const overlap =
            a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
          const gap = Math.round(b.top - a.bottom);
          return { overlap, gapPx: gap, name: rect(n), role: rect(r) };
        })(),
      },
    };
  });
}

async function ensureSidebarFooterVisible(page) {
  await page.evaluate(() => {
    const sidebar = document.querySelector("aside.pulse-sidebar");
    const footer = sidebar?.querySelector(".sidebar-user");
    if (footer) footer.scrollIntoView({ block: "end", inline: "nearest" });
    if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
  });
  await page.waitForTimeout(300);
}

const captures = [];
const geometry = [];

const browser = await chromiumFromApp.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext();
const page = await context.newPage();

const jobs = [
  // Desktop dashboard
  { route: "/dashboard", w: 1440, h: 900, ap: "light", name: "light-1440-_dashboard.png" },
  { route: "/dashboard", w: 1440, h: 900, ap: "dark", name: "dark-1440-_dashboard.png" },
  // Mobile suite
  { route: "/dashboard", w: 390, h: 844, ap: "light", name: "light-390-_dashboard.png" },
  { route: "/dashboard", w: 390, h: 844, ap: "dark", name: "dark-390-_dashboard.png" },
  { route: "/action-inbox", w: 390, h: 844, ap: "light", name: "light-390-_action-inbox.png" },
  { route: "/action-inbox", w: 390, h: 844, ap: "dark", name: "dark-390-_action-inbox.png" },
  { route: "/settings", w: 390, h: 844, ap: "light", name: "light-390-_settings.png" },
  { route: "/settings", w: 390, h: 844, ap: "dark", name: "dark-390-_settings.png" },
  { route: "/staffpay?section=overview", w: 390, h: 844, ap: "light", name: "light-390-_staffpay_section_overview.png" },
  { route: "/staffpay?section=overview", w: 390, h: 844, ap: "dark", name: "dark-390-_staffpay_section_overview.png" },
  { route: "/staffpay?section=adjustments", w: 390, h: 844, ap: "light", name: "light-390-_staffpay_section_adjustments.png" },
  { route: "/staffpay?section=adjustments", w: 390, h: 844, ap: "dark", name: "dark-390-_staffpay_section_adjustments.png" },
  // Sidebar footer viewports light
  { route: "/dashboard", w: 1024, h: 768, ap: "light", name: "light-1024x768-_dashboard-sidebar-footer.png", sidebarFooter: true },
  { route: "/dashboard", w: 1440, h: 720, ap: "light", name: "light-1440x720-_dashboard-sidebar-footer.png", sidebarFooter: true },
  // Staffpay desktop for footer parity
  { route: "/staffpay?section=overview", w: 1440, h: 900, ap: "light", name: "light-1440-_staffpay_section_overview.png", sidebarFooter: true },
  { route: "/staffpay?section=overview", w: 1440, h: 900, ap: "dark", name: "dark-1440-_staffpay_section_overview.png", sidebarFooter: true },
];

for (const job of jobs) {
  await page.setViewportSize({ width: job.w, height: job.h });
  await gotoReady(page, job.route);
  await setAppearance(page, job.ap);
  if (job.sidebarFooter || (job.w >= 1024 && job.route === "/dashboard")) {
    await ensureSidebarFooterVisible(page);
  }
  const file = await captureViewport(page, job.name);
  const geo = await geometryProbe(page);
  geometry.push({ shot: job.name, ...geo });
  captures.push({ ...job, file, finalUrl: page.url() });
  console.log("captured", job.name, page.url());
}

// Defect-focused crops on key states
await page.setViewportSize({ width: 390, height: 844 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await clipElement(page, "button:has-text('View All Announcements'), a:has-text('View All Announcements')", "VQA-001-after-light-390-view-all.png", 24).catch(() => null);
// emergency action row wider crop
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
    /View All Announcements/i.test(el.textContent || "")
  );
  if (btn) btn.scrollIntoView({ block: "center" });
}).catch(() => null);
await page.waitForTimeout(200);
{
  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test((el.textContent || "").replace(/\s+/g, " "))
    );
    if (!btn) return null;
    const row = btn.parentElement;
    const r = (row || btn).getBoundingClientRect();
    return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(window.innerWidth, r.width + 16), height: Math.min(200, r.height + 16) };
  });
  if (box) await clipRect(page, box, "VQA-001-after-light-390-emergency-actions.png");
}
await clipRect(page, { x: 0, y: 0, width: 390, height: 72 }, "VQA-002-after-light-390-dashboard-topbar.png");

await setAppearance(page, "dark");
{
  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test((el.textContent || "").replace(/\s+/g, " "))
    );
    if (!btn) return null;
    const row = btn.parentElement;
    const r = (row || btn).getBoundingClientRect();
    return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(window.innerWidth, r.width + 16), height: Math.min(200, r.height + 16) };
  });
  if (box) await clipRect(page, box, "VQA-001-after-dark-390-emergency-actions.png");
}
await clipRect(page, { x: 0, y: 0, width: 390, height: 72 }, "VQA-002-after-dark-390-dashboard-topbar.png");

await gotoReady(page, "/settings");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 90, width: 390, height: 120 }, "VQA-003-after-light-390-settings-h1.png");
await gotoReady(page, "/staffpay?section=overview");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 90, width: 390, height: 120 }, "VQA-003-after-light-390-staffpay-h1.png");
await setAppearance(page, "dark");
await clipRect(page, { x: 0, y: 90, width: 390, height: 120 }, "VQA-003-after-dark-390-staffpay-h1.png");

await page.setViewportSize({ width: 1440, height: 900 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 720, width: 300, height: 180 }, "VQA-004-after-light-1440-sidebar-footer.png");
await setAppearance(page, "dark");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 720, width: 300, height: 180 }, "VQA-004-after-dark-1440-sidebar-footer.png");

await page.setViewportSize({ width: 1024, height: 768 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 580, width: 280, height: 188 }, "VQA-004-after-light-1024x768-sidebar-footer.png");

await page.setViewportSize({ width: 1440, height: 720 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 530, width: 300, height: 190 }, "VQA-004-after-light-1440x720-sidebar-footer.png");

fs.writeFileSync(path.join(GEO, "probe.json"), JSON.stringify({ appSha: APP_SHA, base: BASE, capturedAt: new Date().toISOString(), captures, geometry }, null, 2));
fs.writeFileSync(path.join(__dirname, "_capture-manifest.json"), JSON.stringify({ appSha: APP_SHA, base: BASE, captures, cropDir: CROPS }, null, 2));

await browser.close();
console.log("DONE", captures.length, "screenshots");
