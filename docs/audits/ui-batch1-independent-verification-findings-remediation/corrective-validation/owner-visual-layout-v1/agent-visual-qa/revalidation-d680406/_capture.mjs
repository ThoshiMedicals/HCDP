/**
 * Phase 4 REVALIDATION capture at d680406 — evidence only.
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
const APP_SHA = "d68040688cbf76fb1f8715c27aa06ad6ff72242c";

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CROPS, { recursive: true });
fs.mkdirSync(GEO, { recursive: true });

async function setAppearance(page, mode) {
  await page.evaluate((m) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
  }, mode);
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
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
      };
    };
    const h1 = document.querySelector("h1");
    const viewAll = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    // Prefer a card that contains both EMERGENCY and the View All button
    let card = null;
    if (viewAll) {
      let n = viewAll.parentElement;
      while (n && n !== document.body) {
        if (/EMERGENCY ANNOUNCEMENT/i.test(n.textContent || "") && n.querySelectorAll("button").length >= 3) {
          card = n;
          break;
        }
        n = n.parentElement;
      }
    }
    const bodyCandidates = card
      ? Array.from(card.querySelectorAll("p,div,span")).filter((el) =>
          /Beachmere is temporarily|Patients are being redirected|Owner acknowledgement/i.test(text(el))
        )
      : [];
    // pick the widest body-like element
    let body = null;
    let bodyW = 0;
    for (const el of bodyCandidates) {
      const r = el.getBoundingClientRect();
      if (r.width > bodyW && r.height > 10) {
        bodyW = r.width;
        body = el;
      }
    }
    const buttons = card
      ? Array.from(card.querySelectorAll("button,a"))
          .filter((el) => /Previous|Next|View All|Open Full|Acknowledge|Withdraw/i.test(text(el)))
          .map((b) => ({ t: text(b).slice(0, 40), ...rect(b) }))
      : [];
    const bodyR = rect(body);
    const overlaps = [];
    if (bodyR) {
      for (const b of buttons) {
        const ov = b.x < bodyR.right && b.x + b.w > bodyR.x && b.y < bodyR.bottom && b.y + b.h > bodyR.y;
        if (ov) overlaps.push(b.t);
      }
    }
    const footer = document.querySelector("aside.pulse-sidebar .sidebar-user");
    const name = footer?.querySelector(".user-name");
    const role = footer?.querySelector(".user-role");
    let nameRoleOverlap = null;
    if (name && role) {
      const a = name.getBoundingClientRect();
      const b = role.getBoundingClientRect();
      nameRoleOverlap = {
        overlap: a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y,
        gapPx: Math.round(b.top - a.bottom),
      };
    }
    const topDash = Array.from(document.querySelectorAll("a,button")).find((el) => /^Dashboard$/i.test(text(el)));
    const brand = Array.from(document.querySelectorAll("span,a,div,p")).find((el) =>
      /^Doctors Pulse$/i.test(text(el))
    );
    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      appearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      h1: {
        text: text(h1),
        scrollWidth: h1?.scrollWidth ?? null,
        clientWidth: h1?.clientWidth ?? null,
        truncated: !!(h1 && h1.scrollWidth > h1.clientWidth + 1),
      },
      emergency: {
        viewAll: viewAll
          ? {
              ...rect(viewAll),
              overflowsViewport: viewAll.getBoundingClientRect().right > window.innerWidth + 0.5,
            }
          : null,
        bodyWidth: bodyR?.w ?? null,
        bodyText: body ? text(body).slice(0, 120) : null,
        cardWidth: card ? Math.round(card.getBoundingClientRect().width) : null,
        buttonOverlapsBody: overlaps,
        buttons,
      },
      topbarBrandOverlap: !!(
        brand &&
        topDash &&
        (() => {
          const a = brand.getBoundingClientRect();
          const b = topDash.getBoundingClientRect();
          return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        })()
      ),
      sidebarFooter: {
        present: !!footer,
        userName: text(name),
        userRole: text(role),
        nameRoleOverlap,
        demoAct: text(
          Array.from(footer?.parentElement?.querySelectorAll("*") || []).find((el) =>
            /Demo Act-as/i.test(text(el))
          )
        ).slice(0, 60),
      },
    };
  });
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
  const file = path.join(CROPS, name);
  await page.screenshot({ path: file, clip });
  return file;
}

const jobs = [
  { route: "/dashboard", w: 1024, h: 768, ap: "light", name: "light-1024x768-_dashboard.png", footer: true },
  { route: "/dashboard", w: 1024, h: 768, ap: "dark", name: "dark-1024x768-_dashboard.png", footer: true },
  { route: "/dashboard", w: 390, h: 844, ap: "light", name: "light-390-_dashboard.png" },
  { route: "/dashboard", w: 390, h: 844, ap: "dark", name: "dark-390-_dashboard.png" },
  { route: "/dashboard", w: 1440, h: 900, ap: "light", name: "light-1440-_dashboard.png", footer: true },
  { route: "/dashboard", w: 1440, h: 900, ap: "dark", name: "dark-1440-_dashboard.png", footer: true },
  { route: "/settings", w: 390, h: 844, ap: "light", name: "light-390-_settings.png" },
  { route: "/staffpay?section=overview", w: 390, h: 844, ap: "light", name: "light-390-_staffpay_section_overview.png" },
  { route: "/action-inbox", w: 390, h: 844, ap: "light", name: "light-390-_action-inbox.png" },
];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
const captures = [];
const geometry = [];

for (const job of jobs) {
  await page.setViewportSize({ width: job.w, height: job.h });
  await gotoReady(page, job.route);
  await setAppearance(page, job.ap);
  if (job.footer) await ensureSidebarFooterVisible(page);
  const file = path.join(OUT, job.name);
  await page.screenshot({ path: file, fullPage: false });
  const geo = await geometryProbe(page);
  geometry.push({ shot: job.name, ...geo });
  captures.push({ ...job, file, finalUrl: page.url() });
  console.log("captured", job.name);
}

// VQA-005 focused crops at 1024 light+dark
for (const ap of ["light", "dark"]) {
  await page.setViewportSize({ width: 1024, height: 768 });
  await gotoReady(page, "/dashboard");
  await setAppearance(page, ap);
  const box = await page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const viewAll = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    let card = null;
    if (viewAll) {
      let n = viewAll.parentElement;
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
  if (box) await clipRect(page, box, `VQA-005-${ap}-1024x768-emergency-card.png`);
  await clipRect(page, { x: 0, y: 560, width: 300, height: 208 }, `VQA-004-spot-${ap}-1024-sidebar-footer.png`);
}

// VQA-001 crop 390
await page.setViewportSize({ width: 390, height: 844 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
{
  const box = await page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const btn = Array.from(document.querySelectorAll("button,a")).find((el) =>
      /View All Announcements/i.test(text(el))
    );
    if (!btn) return null;
    const row = btn.parentElement;
    const r = (row || btn).getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 8),
      y: Math.max(0, r.y - 40),
      width: Math.min(window.innerWidth, r.width + 16),
      height: Math.min(280, r.height + 80),
    };
  });
  if (box) await clipRect(page, box, "VQA-001-spot-light-390-emergency-actions.png");
}
await clipRect(page, { x: 0, y: 0, width: 390, height: 72 }, "VQA-002-spot-light-390-topbar.png");

await gotoReady(page, "/settings");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 90, width: 390, height: 130 }, "VQA-003-spot-light-390-settings-h1.png");

await gotoReady(page, "/staffpay?section=overview");
await setAppearance(page, "light");
await clipRect(page, { x: 0, y: 90, width: 390, height: 130 }, "VQA-003-spot-light-390-staffpay-h1.png");

await page.setViewportSize({ width: 1440, height: 900 });
await gotoReady(page, "/dashboard");
await setAppearance(page, "light");
await ensureSidebarFooterVisible(page);
await clipRect(page, { x: 0, y: 720, width: 300, height: 180 }, "VQA-004-spot-light-1440-sidebar-footer.png");

fs.writeFileSync(
  path.join(GEO, "probe.json"),
  JSON.stringify({ appSha: APP_SHA, base: BASE, capturedAt: new Date().toISOString(), captures, geometry }, null, 2)
);
await browser.close();
console.log("DONE", captures.length);
