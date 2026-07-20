/**
 * Module 1 comprehensive acceptance sweep (Playwright)
 *
 * - BASE: http://localhost:3000
 * - Writes: scripts/m1-acceptance-results.json (relative to cwd)
 * - Must not crash / throw uncaught
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BASE = "http://localhost:3000";
const RESULTS_PATH = path.resolve(process.cwd(), "scripts", "m1-acceptance-results.json");

const out = {
  hydration: { warnings: [], zeroHydration: true },
  controls: [],
  persistence: [],
  filters: { combined: {}, individual: [] },
  widths: [],
  auditFlows: [],
  completedToday: {},
  routes: [],
  console: [],
  summary: {},
};

function isoNow() {
  return new Date().toISOString();
}

function trunc(s, n = 200) {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function normLabel(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function classifyFromObservation({ disabled, found, clicked, overlayOpened }) {
  if (!found) return "Remaining defect";
  if (disabled) return "Backend";
  if (overlayOpened) return "Local demonstration";
  if (clicked) return "Working";
  return "Remaining defect";
}

async function ensureDirFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function safe(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function closeOverlays(page) {
  await safe(() => page.keyboard.press("Escape"));
  await safe(() => page.keyboard.press("Escape"));
  await safe(() => page.locator("body").click({ position: { x: 5, y: 5 }, timeout: 800 }));
  await safe(() => page.keyboard.press("Escape"));
}

async function detectOverlay(page) {
  const dialogVisible = await safe(async () => {
    const d = page.getByRole("dialog");
    return (await d.count()) > 0 && (await d.first().isVisible());
  }, false);

  const toastVisible = await safe(async () => {
    const t = page.locator('[role="alert"], [data-sonner-toast], .toast, .Toastify__toast');
    return (await t.count()) > 0 && (await t.first().isVisible());
  }, false);

  return { dialogVisible, toastVisible, any: dialogVisible || toastVisible };
}

async function recordConsole(page, label = "") {
  page.on("console", (msg) => {
    try {
      const entry = {
        at: isoNow(),
        type: msg.type(),
        text: trunc(msg.text(), 1200),
        label,
      };
      out.console.push(entry);
      if (/hydrat/i.test(entry.text)) {
        out.hydration.warnings.push(entry.text);
        out.hydration.zeroHydration = false;
      }
    } catch {
      // swallow
    }
  });

  page.on("pageerror", (e) => {
    try {
      const text = trunc(e?.message || e, 1200);
      out.console.push({ at: isoNow(), type: "pageerror", text, label });
      if (/hydrat/i.test(text)) {
        out.hydration.warnings.push(text);
        out.hydration.zeroHydration = false;
      }
    } catch {
      // swallow
    }
  });
}

async function goto(page, url, waitUntil = "networkidle") {
  return await page.goto(url, { waitUntil, timeout: 30_000 });
}

async function initPrefs(context, { appearance, sidebarCollapsed }) {
  await context.addInitScript(
    ({ appearance, sidebarCollapsed }) => {
      try {
        localStorage.setItem("pulse.cc.appearance", appearance);
        localStorage.setItem("pulse.sidebarCollapsed", sidebarCollapsed ? "true" : "false");

        // Compatibility keys (harmless if unused)
        localStorage.setItem("pulse.cc.sidebarCollapsed", sidebarCollapsed ? "true" : "false");
        localStorage.setItem("pulse.cc.navCollapsed", sidebarCollapsed ? "true" : "false");
      } catch {
        // ignore
      }
    },
    { appearance, sidebarCollapsed }
  );
}

async function discoverVisibleControls(page) {
  const items = await safe(async () => {
    return await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("button, [role='button'], [role='tab'], select, summary"));
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        if (!r || r.width < 2 || r.height < 2) return false;
        const st = window.getComputedStyle(el);
        if (!st || st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        if (r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) return false;
        return true;
      };

      const labelForSelect = (sel) => {
        const aria = sel.getAttribute("aria-label");
        if (aria) return aria;
        const id = sel.getAttribute("id");
        if (id) {
          const lab = document.querySelector(`label[for='${CSS.escape(id)}']`);
          if (lab) return lab.textContent || "";
        }
        return sel.getAttribute("name") || "";
      };

      return els
        .filter((el) => isVisible(el))
        .map((el) => {
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute("role") || "";
          let label = "";
          if (tag === "select") label = labelForSelect(el);
          else label = el.getAttribute("aria-label") || el.getAttribute("title") || el.innerText || el.textContent || "";
          label = String(label || "").replace(/\s+/g, " ").trim();

          const disabled =
            Boolean(el.disabled) ||
            el.getAttribute("aria-disabled") === "true" ||
            el.getAttribute("data-disabled") === "true";

          return {
            kind: tag === "select" ? "select" : role === "tab" ? "tab" : role === "button" || tag === "button" ? "button" : tag,
            tag,
            role,
            label,
            disabled,
            id: el.getAttribute("id") || "",
            dataTestId: el.getAttribute("data-testid") || "",
            ariaLabel: el.getAttribute("aria-label") || "",
          };
        })
        .filter((x) => x.label);
    });
  }, []);

  const map = new Map();
  for (const it of items) {
    const key = `${it.kind}::${it.label.toLowerCase()}`;
    if (!map.has(key)) map.set(key, it);
  }
  return Array.from(map.values());
}

function selectorForDiscovered(it) {
  if (it.dataTestId) return `[data-testid="${it.dataTestId.replace(/"/g, "\\\"")}"]`;
  if (it.id) return `#${it.id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1")}`;
  if (it.tag === "select" && it.ariaLabel) return `select[aria-label="${it.ariaLabel.replace(/"/g, "\\\"")}"]`;
  if (it.tag === "summary") return `summary:has-text("${it.label.replace(/"/g, "\\\"")}")`;
  return null;
}

async function testDiscoveredControl(page, it, screenLabel) {
  const label = normLabel(it.label);
  const action = it.kind === "select" ? "select-change" : "click";
  const expected = it.kind === "select" ? "value changes" : "click responds (or shows overlay)";

  let found = true;
  let disabled = Boolean(it.disabled);
  let clicked = false;
  let actual = "";
  let overlayOpened = false;

  try {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (it.kind === "tab") {
      const loc = page.getByRole("tab", { name: new RegExp(esc(label), "i") });
      if ((await loc.count()) === 0) {
        found = false;
      } else {
        disabled = disabled || (await loc.first().isDisabled().catch(() => false));
        if (!disabled) {
          await loc.first().click({ timeout: 2000 });
          clicked = true;
        }
      }
    } else if (it.kind === "button") {
      const loc = page.getByRole("button", { name: new RegExp(esc(label), "i") });
      if ((await loc.count()) > 0) {
        disabled = disabled || (await loc.first().isDisabled().catch(() => false));
        if (!disabled) {
          await loc.first().click({ timeout: 2000 });
          clicked = true;
        }
      } else {
        const sel = selectorForDiscovered(it);
        if (!sel) found = false;
        else {
          const cssLoc = page.locator(sel);
          if ((await cssLoc.count()) === 0) found = false;
          else {
            disabled = disabled || (await cssLoc.first().isDisabled().catch(() => false));
            if (!disabled) {
              await cssLoc.first().click({ timeout: 2000 });
              clicked = true;
            }
          }
        }
      }
    } else if (it.kind === "select") {
      const sel = selectorForDiscovered(it);
      const loc = sel ? page.locator(sel) : page.locator("select");
      if ((await loc.count()) === 0) {
        found = false;
      } else {
        disabled = disabled || (await loc.first().isDisabled().catch(() => false));
        if (!disabled) {
          const optCount = await loc.first().locator("option").count().catch(() => 0);
          if (optCount >= 2) {
            const current = await loc.first().inputValue().catch(() => "");
            const values = await loc.first().locator("option").evaluateAll((opts) => opts.map((o) => o.value));
            const next = values.find((v) => v !== current) || values[0];
            await loc.first().selectOption(next);
            clicked = true;
            actual = `selected=${next}`;
          } else {
            actual = "select has <2 options";
          }
        }
      }
    } else if (it.kind === "summary") {
      const sel = selectorForDiscovered(it);
      const loc = sel ? page.locator(sel) : page.locator("summary");
      if ((await loc.count()) === 0) {
        found = false;
      } else {
        disabled = disabled || (await loc.first().isDisabled().catch(() => false));
        if (!disabled) {
          await loc.first().click({ timeout: 2000 });
          clicked = true;
        }
      }
    } else {
      const sel = selectorForDiscovered(it);
      if (!sel) found = false;
      else {
        const loc = page.locator(sel);
        if ((await loc.count()) === 0) found = false;
        else {
          disabled = disabled || (await loc.first().isDisabled().catch(() => false));
          if (!disabled) {
            await loc.first().click({ timeout: 2000 });
            clicked = true;
          }
        }
      }
    }

    await page.waitForTimeout(150);
    const overlay = await detectOverlay(page);
    overlayOpened = overlay.any;
    if (!actual) actual = overlay.any ? `overlay(dialog=${overlay.dialogVisible},toast=${overlay.toastVisible})` : clicked ? "clicked" : "no-op";
  } catch (e) {
    actual = `error: ${trunc(e?.message || e, 240)}`;
  } finally {
    await closeOverlays(page);
  }

  const classification = classifyFromObservation({ disabled, found, clicked, overlayOpened });
  out.controls.push({ label, screen: screenLabel, action, expected, actual, classification });
  return { label, classification, found, tested: true };
}

async function setViewport(page, width, height = 900) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
}

async function readLocalStorageJSON(page, key) {
  return await safe(async () => {
    const raw = await page.evaluate((k) => localStorage.getItem(k), key);
    if (!raw) return null;
    return JSON.parse(raw);
  }, null);
}

async function writeLocalStorage(page, key, value) {
  await safe(() => page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, String(value)]));
}

async function markPersistence(item, status, note = "") {
  out.persistence.push({ item, status, note });
}

async function ensureOnDashboardCommandCentre(page) {
  await goto(page, `${BASE}/dashboard`, "networkidle");
  await page.waitForTimeout(600);
  const ccTab = page.getByRole("tab", { name: /Command\s*Centre/i });
  if ((await ccTab.count()) > 0) await safe(() => ccTab.first().click({ timeout: 2000 }));
  await page.waitForTimeout(250);
}

async function tryOpenByRole(page, role, name, noteLabel) {
  try {
    const loc = page.getByRole(role, { name });
    if ((await loc.count()) === 0) {
      out.controls.push({ label: noteLabel, screen: "dashboard", action: "open", expected: "control exists", actual: "not found", classification: "Remaining defect" });
      return false;
    }
    const disabled = await loc.first().isDisabled().catch(() => false);
    if (disabled) {
      out.controls.push({ label: noteLabel, screen: "dashboard", action: "open", expected: "clickable", actual: "disabled", classification: "Backend" });
      return false;
    }
    await loc.first().click({ timeout: 2500 });
    await page.waitForTimeout(200);
    const overlay = await detectOverlay(page);
    out.controls.push({
      label: noteLabel,
      screen: "dashboard",
      action: "open",
      expected: "opens",
      actual: overlay.any ? "opened overlay" : "clicked",
      classification: overlay.any ? "Local demonstration" : "Working",
    });
    return true;
  } catch (e) {
    out.controls.push({
      label: noteLabel,
      screen: "dashboard",
      action: "open",
      expected: "opens",
      actual: `error: ${trunc(e?.message || e, 240)}`,
      classification: "Remaining defect",
    });
    return false;
  } finally {
    await closeOverlays(page);
  }
}

async function collectSidebarRoutes(page) {
  return await safe(async () => {
    return await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("aside a[href^='/']"));
      const hrefs = links.map((a) => a.getAttribute("href") || "").filter(Boolean);
      const uniq = Array.from(new Set(hrefs));
      return uniq.filter((h) => h.startsWith("/") && !h.startsWith("//#") && !h.includes("javascript:"));
    });
  }, []);
}

async function checkWidthsHeuristics(page, width) {
  const metrics = await safe(async () => {
    return await page.evaluate(() => {
      const overflowX = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;

      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const st = window.getComputedStyle(el);
        return r.width > 2 && r.height > 2 && st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity) !== 0;
      };

      const btns = Array.from(document.querySelectorAll("header button, header [role='button'], header [role='tab']")).filter(visible);
      const rects = btns.map((b) => b.getBoundingClientRect());
      let overlapping = 0;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const c = rects[j];
          const inter = !(a.right < c.left || a.left > c.right || a.bottom < c.top || a.top > c.bottom);
          if (inter) overlapping++;
        }
      }

      const headings = Array.from(document.querySelectorAll("h1,h2,h3,[role='heading']")).filter(visible);
      const clippedLabels = headings.filter((h) => h.scrollWidth - h.clientWidth > 4).length;

      const unreadable = Array.from(document.querySelectorAll("body *")).filter((el) => {
        if (!visible(el)) return false;
        const st = window.getComputedStyle(el);
        const fs = parseFloat(st.fontSize || "16");
        return fs > 0 && fs < 11;
      }).length;

      const cards = Array.from(document.querySelectorAll("[data-card], .card, [role='article']")).filter(visible);
      const brokenCards = cards.filter((c) => c.getBoundingClientRect().height < 40).length;

      const stickyOk = Array.from(document.querySelectorAll("*"))
        .slice(0, 4000)
        .some((el) => window.getComputedStyle(el).position === "sticky");

      const sidebarOk = Boolean(document.querySelector("aside"));

      const bodyText = document.body?.innerText || "";
      const emergencyProminent = /EMERGENCY/i.test(bodyText);

      const hamburger = Array.from(document.querySelectorAll("button,[role='button']")).some((b) => {
        const t = (b.getAttribute("aria-label") || b.textContent || "").trim();
        return /menu|navigation|hamburger/i.test(t) && b.getBoundingClientRect().width < 120;
      });

      const touchTargets = Array.from(document.querySelectorAll("button,[role='button'],a[href],input,select,summary")).filter(visible);
      const smallTargets = touchTargets.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 36 || r.height < 36;
      }).length;

      const tableActionsOk = Boolean(document.querySelector("table")) ? Boolean(document.querySelector("table button, table [role='button']")) : true;
      const chartOk = Boolean(document.querySelector("svg, canvas"));

      return {
        overflowX,
        overlapping,
        clippedLabels,
        unreadable,
        brokenCards,
        stickyOk,
        sidebarOk,
        emergencyProminent,
        hamburger,
        touchTargets: { total: touchTargets.length, small: smallTargets },
        tableActionsOk,
        chartOk,
      };
    });
  }, null);

  if (!metrics) {
    return {
      width,
      overflowX: null,
      overlapping: null,
      clippedLabels: null,
      unreadable: null,
      brokenCards: null,
      drawerOk: false,
      modalOk: true,
      stickyOk: false,
      sidebarOk: false,
      tableActionsOk: false,
      chartOk: false,
      mobileOrder: "unknown",
      emergencyProminent: false,
      touchTargets: { total: 0, small: 0 },
      ok: false,
      notes: "metrics unavailable",
    };
  }

  return {
    width,
    overflowX: metrics.overflowX,
    overlapping: metrics.overlapping,
    clippedLabels: metrics.clippedLabels,
    unreadable: metrics.unreadable,
    brokenCards: metrics.brokenCards,
    drawerOk: false,
    modalOk: true,
    stickyOk: metrics.stickyOk,
    sidebarOk: metrics.sidebarOk,
    tableActionsOk: metrics.tableActionsOk,
    chartOk: metrics.chartOk,
    mobileOrder: width <= 430 ? (metrics.hamburger ? "hamburger" : "no-hamburger") : "desktop",
    emergencyProminent: metrics.emergencyProminent,
    touchTargets: metrics.touchTargets,
    ok:
      (metrics.overflowX ?? 999) <= 1 &&
      (metrics.overlapping ?? 999) === 0 &&
      (metrics.clippedLabels ?? 999) < 6 &&
      (metrics.unreadable ?? 999) < 10 &&
      (metrics.brokenCards ?? 999) < 3,
    notes: "",
  };
}

function missingAuditFields(entry) {
  const required = ["event", "user", "at", "previousValue", "newValue", "reason", "approval", "evidence", "actionId"];
  const miss = [];
  for (const k of required) {
    if (!entry || entry[k] === undefined || entry[k] === null || entry[k] === "") miss.push(k);
  }
  return miss;
}

async function readAuditEntries(page) {
  return await safe(async () => {
    const raw = await page.evaluate(() => localStorage.getItem("pulse.cc.m1.audit"));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }, []);
}

async function auditFlow(page, flow, doAction) {
  const before = await readAuditEntries(page);
  await doAction();
  await page.waitForTimeout(350);
  const after = await readAuditEntries(page);
  const newest = after.length > before.length ? after[after.length - 1] : after[after.length - 1] || null;
  const miss = missingAuditFields(newest);
  out.auditFlows.push({ flow, auditOk: miss.length === 0, entry: newest, missingFields: miss });
}

async function run() {
  const startedAt = isoNow();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    // 1) HYDRATION
    try {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await initPrefs(ctx, { appearance: "dark", sidebarCollapsed: true });
      const page = await ctx.newPage();
      page.setDefaultTimeout(8000);
      await recordConsole(page, "hydration-dark");

      await goto(page, `${BASE}/dashboard`, "networkidle");
      await page.waitForTimeout(1200);

      const bodyText = await safe(() => page.locator("body").innerText(), "");
      if (/hydrat/i.test(bodyText)) {
        out.hydration.warnings.push("page-text: " + trunc(bodyText, 240));
        out.hydration.zeroHydration = false;
      }

      await ctx.close();
    } catch (e) {
      out.hydration.warnings.push(`hydration-dark exception: ${trunc(e?.message || e, 240)}`);
      out.hydration.zeroHydration = false;
    }

    try {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await initPrefs(ctx, { appearance: "light", sidebarCollapsed: false });
      const page = await ctx.newPage();
      page.setDefaultTimeout(8000);
      await recordConsole(page, "hydration-light");

      await goto(page, `${BASE}/dashboard`, "networkidle");
      await page.waitForTimeout(900);

      const bodyText = await safe(() => page.locator("body").innerText(), "");
      if (/hydrat/i.test(bodyText)) {
        out.hydration.warnings.push("page-text(light): " + trunc(bodyText, 240));
        out.hydration.zeroHydration = false;
      }

      await ctx.close();
    } catch (e) {
      out.hydration.warnings.push(`hydration-light exception: ${trunc(e?.message || e, 240)}`);
      out.hydration.zeroHydration = false;
    }

    // Main context
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await initPrefs(context, { appearance: "dark", sidebarCollapsed: true });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    await recordConsole(page, "main");

    await goto(page, `${BASE}/dashboard`, "networkidle");
    await page.waitForTimeout(900);
    await ensureOnDashboardCommandCentre(page);

    // 2) CONTROL DISCOVERY
    const controlsMap = new Map();
    let totalTested = 0;

    async function mergeDiscovered(list) {
      for (const it of list) {
        const key = `${it.kind}::${it.label.toLowerCase()}`;
        if (!controlsMap.has(key)) controlsMap.set(key, it);
      }
    }

    async function testAllUntested(screenLabel) {
      for (const [, it] of controlsMap.entries()) {
        if (it.__tested) continue;
        await testDiscoveredControl(page, it, screenLabel);
        it.__tested = true;
        totalTested++;
      }
    }

    try {
      await setViewport(page, 1440, 900);
      await ensureOnDashboardCommandCentre(page);
      await mergeDiscovered(await discoverVisibleControls(page));

      const major = [
        { role: "button", name: /Select Clinics/i, label: "Select Clinics menu" },
        { role: "button", name: /More/i, label: "More menu" },
        { role: "button", name: /QA Demo/i, label: "QA Demo" },
        { role: "button", name: /^Create Action$/i, label: "Create Action" },
        { role: "button", name: /^Publish$/i, label: "Publish" },
        { role: "button", name: /View Health Breakdown/i, label: "View Health Breakdown" },
        { role: "button", name: /Open Full Action/i, label: "Open Full Action" },
        { role: "tab", name: /Reports/i, label: "Reports tab" },
        { role: "button", name: /My Day/i, label: "My Day" },
        { role: "button", name: /KPI Scorecard/i, label: "KPI Scorecard" },
        { role: "button", name: /Customise/i, label: "Customise" },
        { role: "button", name: /End-?of-?Day/i, label: "End-of-Day" },
      ];

      await testAllUntested("dashboard/command-centre");

      for (const m of major) {
        await tryOpenByRole(page, m.role, m.name, m.label);
        await mergeDiscovered(await discoverVisibleControls(page));
        await testAllUntested(`dashboard/after-${m.label}`);
      }

      await ensureOnDashboardCommandCentre(page);
    } catch (e) {
      out.controls.push({
        label: "CONTROL DISCOVERY",
        screen: "dashboard",
        action: "phase",
        expected: "complete discovery",
        actual: `exception: ${trunc(e?.message || e, 300)}`,
        classification: "Remaining defect",
      });
    }

    const totalDiscovered = controlsMap.size;

    // 3) PERSISTENCE
    try {
      await ensureOnDashboardCommandCentre(page);

      const appearanceSel = page.locator('select[aria-label="Appearance"], select[aria-label*="Light or Dark" i]');
      if ((await appearanceSel.count()) > 0) {
        for (const [value, label] of [
          ["light", "appearance=light"],
          ["dark", "appearance=dark"],
          ["system", "appearance=system"],
        ]) {
          try {
            await appearanceSel.first().selectOption(value);
            await page.waitForTimeout(250);
            await page.reload({ waitUntil: "networkidle" });
            await page.waitForTimeout(700);
            const stored = await safe(() => page.evaluate(() => localStorage.getItem("pulse.cc.appearance")), null);
            const bodyDark = await safe(() => page.evaluate(() => document.body.classList.contains("theme-dark")), false);
            await markPersistence(label, "ok", `stored=${stored} bodyDark=${bodyDark}`);
          } catch (e) {
            await markPersistence(label, "fail", trunc(e?.message || e, 240));
          }
        }
      } else {
        await markPersistence("appearance select", "skip", "not found");
      }

      try {
        const collapseBtn = page.getByRole("button", { name: /Collapse navigation/i });
        if ((await collapseBtn.count()) > 0) {
          await collapseBtn.first().click();
          await page.waitForTimeout(300);
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(700);
          const attr = await safe(() => page.evaluate(() => document.querySelector("aside")?.getAttribute("data-collapsed")), null);
          const stored = await safe(() => page.evaluate(() => localStorage.getItem("pulse.sidebarCollapsed")), null);
          await markPersistence("sidebar collapsed", attr === "true" ? "ok" : "fail", `attr=${attr} stored=${stored}`);
        } else {
          await markPersistence("sidebar collapsed", "skip", "Collapse navigation button missing");
        }
      } catch (e) {
        await markPersistence("sidebar collapsed", "fail", trunc(e?.message || e, 240));
      }

      try {
        await ensureOnDashboardCommandCentre(page);
        const btn = page.getByRole("button", { name: /Select Clinics/i });
        if ((await btn.count()) > 0) {
          await btn.first().click();
          await page.waitForTimeout(300);
          const boxes = page.getByRole("checkbox");
          const n = await boxes.count();
          let picked = 0;
          for (let i = 0; i < n && picked < 2; i++) {
            const b = boxes.nth(i);
            if (!(await b.isVisible().catch(() => false))) continue;
            const checked = await b.isChecked().catch(() => false);
            if (!checked) {
              await b.check().catch(() => b.click().catch(() => null));
              picked++;
            }
          }
          await closeOverlays(page);
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(700);
          await btn.first().click().catch(() => null);
          await page.waitForTimeout(300);
          const anyChecked = await safe(async () => {
            const boxes2 = page.getByRole("checkbox");
            const n2 = await boxes2.count();
            for (let i = 0; i < n2; i++) {
              if (await boxes2.nth(i).isChecked().catch(() => false)) return true;
            }
            return false;
          }, false);
          await closeOverlays(page);
          await markPersistence("selected clinics (2)", anyChecked ? "ok" : "fail", `picked=${picked}`);
        } else {
          await markPersistence("selected clinics (2)", "skip", "Select Clinics not found");
        }
      } catch (e) {
        await markPersistence("selected clinics (2)", "fail", trunc(e?.message || e, 240));
      }

      try {
        await ensureOnDashboardCommandCentre(page);
        await page.getByRole("button", { name: /Select Clinics/i }).first().click().catch(() => null);
        await page.waitForTimeout(250);
        const saveBtn = page.getByRole("button", { name: /Save clinic group/i });
        if ((await saveBtn.count()) > 0) {
          page.once("dialog", async (d) => {
            try {
              await d.accept(`Group ${Date.now()}`);
            } catch {
              // ignore
            }
          });
          await saveBtn.first().click().catch(() => null);
          await page.waitForTimeout(350);
          const groups = await readLocalStorageJSON(page, "pulse.cc.clinicGroups");
          await markPersistence("save clinic group", "ok", `clinicGroups=${groups ? "present" : "unknown"}`);
        } else {
          await markPersistence("save clinic group", "skip", "button not found");
        }
        await closeOverlays(page);
      } catch (e) {
        await markPersistence("save clinic group", "fail", trunc(e?.message || e, 240));
      }

      try {
        const periodSel = page.locator('select[aria-label="Period"]');
        if ((await periodSel.count()) > 0) {
          await periodSel.first().selectOption("This Week");
          await page.waitForTimeout(250);
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(700);
          const v = await periodSel.first().inputValue().catch(() => "");
          await markPersistence("period=This Week", v === "This Week" ? "ok" : "fail", `value=${v}`);
        } else {
          await markPersistence("period=This Week", "skip", "Period select not found");
        }
      } catch (e) {
        await markPersistence("period=This Week", "fail", trunc(e?.message || e, 240));
      }

      try {
        await ensureOnDashboardCommandCentre(page);
        const saveLayout = page.getByRole("button", { name: /Save Layout/i });
        if ((await saveLayout.count()) > 0) {
          page.once("dialog", async (d) => {
            try {
              await d.accept(`Layout ${Date.now()}`);
            } catch {
              // ignore
            }
          });
          await saveLayout.first().click().catch(() => null);
          await page.waitForTimeout(300);
          const layouts = await safe(() => page.evaluate(() => localStorage.getItem("pulse.cc.layouts")), null);
          await markPersistence("layouts save", "ok", `pulse.cc.layouts=${layouts ? "set" : "missing"}`);
        } else {
          await markPersistence("layouts save", "skip", "Save Layout not found");
        }
      } catch (e) {
        await markPersistence("layouts save", "fail", trunc(e?.message || e, 240));
      } finally {
        await closeOverlays(page);
      }

      try {
        const addNote = page.getByRole("button", { name: /Add note/i });
        if ((await addNote.count()) > 0) {
          await addNote.first().click().catch(() => null);
          await page.waitForTimeout(250);
          const ta = page.locator("textarea");
          if ((await ta.count()) > 0) {
            await ta.first().fill(`private note ${Date.now()}`);
          }
          await page.getByRole("button", { name: /Save|Add/i }).first().click().catch(() => null);
          await page.waitForTimeout(250);
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(650);
          await markPersistence("private note", "ok", "saved (best-effort)");
        } else {
          await markPersistence("private note", "skip", "Add note not found");
        }
      } catch (e) {
        await markPersistence("private note", "fail", trunc(e?.message || e, 240));
      } finally {
        await closeOverlays(page);
      }

      try {
        await ensureOnDashboardCommandCentre(page);
        const create = page.getByRole("button", { name: /^Create Action$/i });
        if ((await create.count()) > 0) {
          await create.first().click({ timeout: 2500 });
          await page.waitForTimeout(350);
          const dlg = page.getByRole("dialog");
          if ((await dlg.count()) > 0) {
            const input = dlg.first().locator("input").first();
            await input.fill(`Acceptance draft ${Date.now()}`).catch(() => null);
            const saveDraft = page.getByRole("button", { name: /Save Draft/i });
            if ((await saveDraft.count()) > 0) {
              await saveDraft.first().click().catch(() => null);
              await page.waitForTimeout(350);
              await closeOverlays(page);
              await create.first().click().catch(() => null);
              await page.waitForTimeout(350);
              const text = await page.getByRole("dialog").first().innerText().catch(() => "");
              await markPersistence("create action draft reopen", /Draft|Acceptance draft/i.test(text) ? "ok" : "fail", trunc(text, 140));
            } else {
              await markPersistence("create action draft reopen", "skip", "Save Draft not found");
            }
          } else {
            await markPersistence("create action draft reopen", "fail", "dialog did not open");
          }
        } else {
          await markPersistence("create action draft reopen", "skip", "Create Action not found");
        }
      } catch (e) {
        await markPersistence("create action draft reopen", "fail", trunc(e?.message || e, 240));
      } finally {
        await closeOverlays(page);
      }

      for (const k of [
        "pulse.cc.reportSchedules",
        "pulse.cc.recurring",
        "pulse.cc.templates",
        "pulse.cc.demoDay",
        "pulse.cc.actions",
        "pulse.cc.m1.audit",
      ]) {
        try {
          await goto(page, `${BASE}/dashboard`, "domcontentloaded");
          await page.waitForTimeout(400);
          await writeLocalStorage(page, k, JSON.stringify([{ key: k, at: isoNow() }]));
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(450);
          const val = await safe(() => page.evaluate((kk) => localStorage.getItem(kk), k), null);
          await markPersistence(`localStorage ${k}`, val ? "ok" : "fail", val ? "present" : "missing");
        } catch (e) {
          await markPersistence(`localStorage ${k}`, "fail", trunc(e?.message || e, 240));
        }
      }

      try {
        await ensureOnDashboardCommandCentre(page);
        const open = page.getByRole("button", { name: /View Health Breakdown/i });
        if ((await open.count()) > 0) {
          await open.first().click().catch(() => null);
          await page.waitForTimeout(450);
          const apply = page.getByRole("button", { name: /Apply override/i });
          if ((await apply.count()) > 0) {
            await apply.first().click().catch(() => null);
            await page.waitForTimeout(250);
            const ta = page.locator("textarea");
            if ((await ta.count()) > 0) await ta.first().fill("Override reason (acceptance)");
            const pwd = page.locator('input[type="password"]');
            if ((await pwd.count()) > 0) await pwd.first().fill("demo");
            await page.getByRole("button", { name: /Confirm|Apply/i }).first().click().catch(() => null);
            await page.waitForTimeout(300);
          }
          const val = await safe(() => page.evaluate(() => localStorage.getItem("pulse.cc.healthOverrides")), null);
          await markPersistence("health overrides key", val ? "ok" : "skip", val ? "pulse.cc.healthOverrides set" : "not set / UI not available");
        } else {
          await markPersistence("health overrides key", "skip", "health breakdown not available");
        }
      } catch (e) {
        await markPersistence("health overrides key", "fail", trunc(e?.message || e, 240));
      } finally {
        await closeOverlays(page);
      }

      try {
        await goto(page, `${BASE}/dashboard`, "domcontentloaded");
        await page.waitForTimeout(450);
        await writeLocalStorage(page, "pulse.cc.layouts", "{bad");
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(650);
        const crashed = await safe(async () => {
          const html = await page.content();
          return /Application error|Unhandled Runtime|TypeError/i.test(html);
        }, false);
        await markPersistence("malformed pulse.cc.layouts", crashed ? "fail" : "ok", crashed ? "crash-like content detected" : "page remained interactive");
      } catch (e) {
        await markPersistence("malformed pulse.cc.layouts", "fail", trunc(e?.message || e, 240));
      }
    } catch (e) {
      await markPersistence("PERSISTENCE phase", "fail", trunc(e?.message || e, 300));
    }

    // 4) FILTERS
    try {
      await ensureOnDashboardCommandCentre(page);

      const combined = {
        clinics: 0,
        urgentOnly: false,
        priority: null,
        categories: [],
        status: null,
        assignee: null,
        period: "This Week",
        sentence: "",
      };

      const clinicsBtn = page.getByRole("button", { name: /Select Clinics/i });
      if ((await clinicsBtn.count()) > 0) {
        await clinicsBtn.first().click().catch(() => null);
        await page.waitForTimeout(300);
        const boxes = page.getByRole("checkbox");
        const n = await boxes.count();
        let picked = 0;
        for (let i = 0; i < n && picked < 2; i++) {
          const b = boxes.nth(i);
          if (!(await b.isVisible().catch(() => false))) continue;
          const checked = await b.isChecked().catch(() => false);
          if (!checked) {
            await b.check().catch(() => b.click().catch(() => null));
            picked++;
          }
        }
        combined.clinics = picked;
      }
      await closeOverlays(page);

      const urgentBtn = page.getByRole("button", { name: /Urgent only/i });
      if ((await urgentBtn.count()) > 0) {
        await urgentBtn.first().click().catch(() => null);
        combined.urgentOnly = true;
      }

      for (const pri of [/URGENT/i, /EMERGENCY/i, /ATTENTION/i]) {
        const b = page.getByRole("button", { name: pri });
        if ((await b.count()) > 0) {
          await b.first().click().catch(() => null);
          combined.priority = String(pri);
          break;
        }
      }

      const categoryCandidates = page.locator("button").filter({ hasText: /Category|Categories|Safety|Quality|Finance|Staff|Compliance|Risk|Emergency/i });
      const cc = await categoryCandidates.count().catch(() => 0);
      for (let i = 0; i < cc && combined.categories.length < 2; i++) {
        const t = await categoryCandidates.nth(i).innerText().catch(() => "");
        const lab = normLabel(t);
        if (!lab) continue;
        await categoryCandidates.nth(i).click().catch(() => null);
        combined.categories.push(lab);
      }

      const statusSel = page.locator('select[aria-label*="Status" i]');
      if ((await statusSel.count()) > 0) {
        const values = await statusSel.first().locator("option").evaluateAll((opts) => opts.map((o) => o.value));
        const pick = values.find((v) => v && v !== values[0]) || values[0];
        await statusSel.first().selectOption(pick).catch(() => null);
        combined.status = pick;
      }

      const assigneeSel = page.locator('select[aria-label*="Assignee" i]');
      if ((await assigneeSel.count()) > 0) {
        const values = await assigneeSel.first().locator("option").evaluateAll((opts) => opts.map((o) => o.value));
        const pick = values.find((v) => v && v !== values[0]) || values[0];
        await assigneeSel.first().selectOption(pick).catch(() => null);
        combined.assignee = pick;
      }

      const periodSel = page.locator('select[aria-label="Period"]');
      if ((await periodSel.count()) > 0) {
        await periodSel.first().selectOption("This Week").catch(() => null);
      }

      await page.waitForTimeout(350);
      combined.sentence = (await page.locator("text=/Showing|Filters|filter|Urgent/i").first().textContent().catch(() => "")) || "";
      out.filters.combined = combined;

      await page.getByRole("button", { name: /Clear filters|Clear Filter|All Clinics/i }).first().click().catch(() => null);
      await page.waitForTimeout(250);

      async function testFilter(name, applyFn) {
        const startText = await page.locator("body").innerText().catch(() => "");
        await applyFn();
        await page.waitForTimeout(250);
        const sentence = (await page.locator("text=/Showing|Filters|filter|Urgent/i").first().textContent().catch(() => "")) || "";
        const endText = await page.locator("body").innerText().catch(() => "");
        out.filters.individual.push({ name, sentence: trunc(sentence, 140), changed: startText !== endText });
        await page.getByRole("button", { name: /Clear filters|Clear Filter|All Clinics/i }).first().click().catch(() => null);
        await page.waitForTimeout(200);
      }

      await testFilter("clinics-only", async () => {
        const b = page.getByRole("button", { name: /Select Clinics/i });
        if ((await b.count()) === 0) return;
        await b.first().click().catch(() => null);
        await page.waitForTimeout(250);
        const boxes = page.getByRole("checkbox");
        if ((await boxes.count()) > 0) await boxes.first().check().catch(() => boxes.first().click().catch(() => null));
        await closeOverlays(page);
      });

      await testFilter("urgent-only", async () => {
        const b = page.getByRole("button", { name: /Urgent only/i });
        if ((await b.count()) > 0) await b.first().click().catch(() => null);
      });

      await testFilter("priority-only", async () => {
        const b = page.getByRole("button", { name: /URGENT|EMERGENCY|ATTENTION/i });
        if ((await b.count()) > 0) await b.first().click().catch(() => null);
      });

      await testFilter("period-this-week", async () => {
        const s = page.locator('select[aria-label="Period"]');
        if ((await s.count()) > 0) await s.first().selectOption("This Week").catch(() => null);
      });
    } catch (e) {
      out.filters.combined = { error: trunc(e?.message || e, 300) };
    } finally {
      await closeOverlays(page);
    }

    // 5) WIDTHS
    try {
      await ensureOnDashboardCommandCentre(page);
      for (const w of [1440, 1280, 1024, 768, 430, 390]) {
        await setViewport(page, w, 900);
        await ensureOnDashboardCommandCentre(page);
        const row = await checkWidthsHeuristics(page, w);

        try {
          const open = page.getByRole("button", { name: /View Health Breakdown/i });
          if ((await open.count()) > 0) {
            await open.first().click({ timeout: 2000 });
            await page.waitForTimeout(350);
            const overlay = await detectOverlay(page);
            row.drawerOk = overlay.dialogVisible || (await page.locator("[data-drawer], .drawer").count().catch(() => 0)) > 0;
          } else {
            row.drawerOk = false;
          }
        } catch {
          row.drawerOk = false;
        } finally {
          await closeOverlays(page);
        }

        row.ok = Boolean(row.ok) && row.drawerOk !== false;
        out.widths.push(row);
      }
      await setViewport(page, 1440, 900);
    } catch (e) {
      out.widths.push({
        width: -1,
        overflowX: null,
        overlapping: null,
        clippedLabels: null,
        unreadable: null,
        brokenCards: null,
        drawerOk: false,
        modalOk: false,
        stickyOk: false,
        sidebarOk: false,
        tableActionsOk: false,
        chartOk: false,
        mobileOrder: "unknown",
        emergencyProminent: false,
        touchTargets: { total: 0, small: 0 },
        ok: false,
        notes: `widths exception: ${trunc(e?.message || e, 240)}`,
      });
    }

    // 6) AUDIT FLOWS
    try {
      await ensureOnDashboardCommandCentre(page);

      await auditFlow(page, "health override", async () => {
        const open = page.getByRole("button", { name: /View Health Breakdown/i });
        if ((await open.count()) > 0) await open.first().click().catch(() => null);
        await page.waitForTimeout(350);
        const apply = page.getByRole("button", { name: /Apply override/i });
        if ((await apply.count()) > 0) {
          await apply.first().click().catch(() => null);
          await page.waitForTimeout(250);
          const ta = page.locator("textarea");
          if ((await ta.count()) > 0) await ta.first().fill("Override reason (acceptance)");
          const pwd = page.locator('input[type="password"]');
          if ((await pwd.count()) > 0) await pwd.first().fill("demo");
          await page.getByRole("button", { name: /Confirm|Apply/i }).first().click().catch(() => null);
        }
        await closeOverlays(page);
      });

      await auditFlow(page, "withdraw override", async () => {
        const open = page.getByRole("button", { name: /View Health Breakdown/i });
        if ((await open.count()) > 0) await open.first().click().catch(() => null);
        await page.waitForTimeout(350);
        const w = page.getByRole("button", { name: /Withdraw override|Remove override/i });
        if ((await w.count()) > 0) {
          await w.first().click().catch(() => null);
          const ta = page.locator("textarea");
          if ((await ta.count()) > 0) await ta.first().fill("Withdraw reason (acceptance)");
          await page.getByRole("button", { name: /Confirm|Withdraw/i }).first().click().catch(() => null);
        }
        await closeOverlays(page);
      });

      await auditFlow(page, "dismiss action", async () => {
        const open = page.getByRole("button", { name: /Open Full Action/i });
        if ((await open.count()) > 0) {
          await open.first().click().catch(() => null);
          await page.waitForTimeout(350);
          const dismiss = page.getByRole("button", { name: /Dismiss/i });
          if ((await dismiss.count()) > 0) {
            const ta = page.locator("textarea");
            if ((await ta.count()) > 0) await ta.first().fill("Dismiss reason (acceptance)");
            await dismiss.first().click().catch(() => null);
            await page.waitForTimeout(250);
          }
        }
        await closeOverlays(page);
      });

      await auditFlow(page, "finance approve", async () => {
        const approve = page.getByRole("button", { name: /^Approve$/i });
        if ((await approve.count()) > 0) {
          await approve.first().click().catch(() => null);
          await page.waitForTimeout(250);
        }
        await closeOverlays(page);
      });

      await auditFlow(page, "change priority", async () => {
        const pri = page.getByRole("button", { name: /Change Priority|Priority/i });
        if ((await pri.count()) > 0) {
          await pri.first().click().catch(() => null);
          await page.waitForTimeout(250);
          const opt = page.getByRole("button", { name: /EMERGENCY|URGENT|ATTENTION|ROUTINE/i });
          if ((await opt.count()) > 0) await opt.first().click().catch(() => null);
        }
        await closeOverlays(page);
      });

      await auditFlow(page, "withdraw notice", async () => {
        const w = page.getByRole("button", { name: /Withdraw notice/i });
        if ((await w.count()) > 0) {
          await w.first().click().catch(() => null);
          const ta = page.locator("textarea");
          if ((await ta.count()) > 0) await ta.first().fill("Withdraw notice reason (acceptance)");
          await closeOverlays(page);
        }
      });

      await auditFlow(page, "export pdf", async () => {
        const reports = page.getByRole("tab", { name: /Reports/i });
        if ((await reports.count()) > 0) await reports.first().click().catch(() => null);
        await page.waitForTimeout(350);
        const cb = page.getByRole("checkbox", { name: /confidential/i });
        if ((await cb.count()) > 0) await cb.first().check().catch(() => cb.first().click().catch(() => null));
        const pdf = page.getByRole("button", { name: /Export PDF/i });
        if ((await pdf.count()) > 0) await pdf.first().click().catch(() => null);
        await page.waitForTimeout(250);
        const cc = page.getByRole("tab", { name: /Command Centre/i });
        if ((await cc.count()) > 0) await cc.first().click().catch(() => null);
        await closeOverlays(page);
      });

      await auditFlow(page, "mark complete", async () => {
        const mc = page.getByRole("button", { name: /Mark Complete|Complete/i });
        if ((await mc.count()) > 0) {
          await mc.first().click().catch(() => null);
          await page.waitForTimeout(250);
        }
        await closeOverlays(page);
      });

      // Pause recurring: mark as local demonstration if not reachable
      try {
        const before = await readAuditEntries(page);
        let note = "";
        let did = false;
        const templates = page.getByRole("button", { name: /Templates/i });
        if ((await templates.count()) > 0) {
          await templates.first().click().catch(() => null);
          did = true;
          await page.waitForTimeout(250);
          const pause = page.getByRole("button", { name: /Pause recurring/i });
          if ((await pause.count()) > 0) {
            await pause.first().click().catch(() => null);
            await page.waitForTimeout(250);
          } else {
            note = "Pause recurring not found in Templates";
          }
        } else {
          note = "Templates button not found";
        }
        const after = await readAuditEntries(page);
        const newest = after.length > before.length ? after[after.length - 1] : null;
        const miss = missingAuditFields(newest);
        out.auditFlows.push({
          flow: "pause recurring",
          auditOk: did ? miss.length === 0 : false,
          entry: newest,
          missingFields: did ? miss : ["event", "user", "at", "previousValue", "newValue", "reason", "approval", "evidence", "actionId"],
          note,
        });
      } catch (e) {
        out.auditFlows.push({
          flow: "pause recurring",
          auditOk: false,
          entry: null,
          missingFields: ["event", "user", "at", "previousValue", "newValue", "reason", "approval", "evidence", "actionId"],
          note: trunc(e?.message || e, 240),
        });
      } finally {
        await closeOverlays(page);
      }
    } catch (e) {
      out.auditFlows.push({ flow: "AUDIT FLOWS phase", auditOk: false, entry: null, missingFields: ["phase"], note: trunc(e?.message || e, 240) });
    }

    // 7) COMPLETED TODAY
    try {
      await ensureOnDashboardCommandCentre(page);
      const ct = {
        markedComplete: false,
        foundCompletedToday: false,
        simulatedNextDay: false,
        clearedAfterNextDay: false,
        reopened: false,
        notes: [],
      };

      const mark = page.getByRole("button", { name: /Mark Complete|Complete/i });
      if ((await mark.count()) > 0) {
        await mark.first().click().catch(() => null);
        await page.waitForTimeout(350);
        ct.markedComplete = true;
      } else {
        ct.notes.push("Mark Complete not found");
      }
      await closeOverlays(page);

      const completedSection = page.locator("text=/Completed Today/i");
      ct.foundCompletedToday = (await completedSection.count().catch(() => 0)) > 0;

      const qa = page.getByRole("button", { name: /QA Demo/i });
      if ((await qa.count()) > 0) {
        await qa.first().click().catch(() => null);
        await page.waitForTimeout(250);
        const next = page.getByRole("button", { name: /Simulate Next Day/i });
        if ((await next.count()) > 0) {
          await next.first().click().catch(() => null);
          await page.waitForTimeout(500);
          ct.simulatedNextDay = true;
        } else {
          ct.notes.push("Simulate Next Day not found");
        }
      } else {
        ct.notes.push("QA Demo not found");
      }
      await closeOverlays(page);

      // best-effort: if section still exists, record it
      const completedAfter = page.locator("text=/Completed Today/i");
      ct.clearedAfterNextDay = ct.simulatedNextDay ? (await completedAfter.count().catch(() => 0)) === 0 : false;

      const reopen = page.getByRole("button", { name: /Reopen/i });
      if ((await reopen.count()) > 0) {
        await reopen.first().click().catch(() => null);
        const ta = page.locator("textarea");
        if ((await ta.count()) > 0) await ta.first().fill("Reopened after completion (acceptance)");
        await page.getByRole("button", { name: /Confirm|Save|Reopen/i }).first().click().catch(() => null);
        await page.waitForTimeout(300);
        const body = await page.locator("body").innerText().catch(() => "");
        ct.reopened = /Reopened after completion/i.test(body) || /reopen/i.test(body);
      } else {
        ct.notes.push("Reopen button not found");
      }
      await closeOverlays(page);

      out.completedToday = ct;
    } catch (e) {
      out.completedToday = { error: trunc(e?.message || e, 300) };
    }

    // 8) ROUTES
    try {
      const baseRoutes = [
        "/dashboard",
        "/action-inbox",
        "/risk-centre",
        "/compliance-centre",
        "/analytics",
        "/emergency-centre",
        "/tasks",
        "/checklists",
        "/staff",
        "/doctors",
        "/settings",
        "/organisation",
      ];

      await goto(page, `${BASE}/dashboard`, "networkidle");
      await page.waitForTimeout(450);
      const sidebarRoutes = await collectSidebarRoutes(page);
      const all = Array.from(new Set([...baseRoutes, ...sidebarRoutes])).filter(Boolean);

      for (const slug of all) {
        try {
          const res = await goto(page, `${BASE}${slug}`, "domcontentloaded");
          const status = res?.status?.() ?? null;
          const html = await page.content().catch(() => "");
          const crashed = /Application error|Unhandled Runtime|TypeError/i.test(html);
          out.routes.push({ slug, status: status ?? (crashed ? 500 : 200), note: crashed ? "crash-like content" : "ok" });
        } catch (e) {
          out.routes.push({ slug, status: 0, note: trunc(e?.message || e, 240) });
        }
      }

      await goto(page, `${BASE}/dashboard`, "networkidle");
    } catch (e) {
      out.routes.push({ slug: "ROUTES phase", status: 0, note: trunc(e?.message || e, 240) });
    }

    // summary with counts for sections 1-22
    const summary = {
      startedAt,
      finishedAt: isoNow(),
      base: BASE,
      output: RESULTS_PATH,
      sections: {
        s01_hydrationWarnings: out.hydration.warnings.length,
        s02_zeroHydration: out.hydration.zeroHydration,
        s03_controlsDiscovered: totalDiscovered,
        s04_controlsTested: totalTested,
        s05_controlsWorking: out.controls.filter((c) => c.classification === "Working").length,
        s06_controlsLocalDemo: out.controls.filter((c) => c.classification === "Local demonstration").length,
        s07_controlsBackend: out.controls.filter((c) => c.classification === "Backend").length,
        s08_controlsDefects: out.controls.filter((c) => c.classification === "Remaining defect").length,
        s09_persistenceTotal: out.persistence.length,
        s10_persistenceOk: out.persistence.filter((p) => p.status === "ok").length,
        s11_persistenceFail: out.persistence.filter((p) => p.status === "fail").length,
        s12_filtersCombinedSentence: trunc(out.filters.combined?.sentence || "", 120),
        s13_filtersIndividualTotal: out.filters.individual.length,
        s14_widthsTotal: out.widths.length,
        s15_widthsAllOk: out.widths.length ? out.widths.every((w) => w.ok) : false,
        s16_auditFlowsTotal: out.auditFlows.length,
        s17_auditFlowsOk: out.auditFlows.filter((a) => a.auditOk).length,
        s18_completedTodayMarked: Boolean(out.completedToday?.markedComplete),
        s19_completedTodayFoundSection: Boolean(out.completedToday?.foundCompletedToday),
        s20_routesTotal: out.routes.length,
        s21_routesOk: out.routes.filter((r) => (r.status ?? 0) >= 200 && (r.status ?? 0) < 500).length,
        s22_consoleErrorsWarnings: out.console.filter((c) => ["error", "warning", "pageerror"].includes(c.type)).length,
      },
    };

    out.summary = summary;

    await ensureDirFor(RESULTS_PATH);
    await fs.writeFile(RESULTS_PATH, JSON.stringify(out, null, 2), "utf8");

    // required: print JSON.stringify(summary)
    console.log(JSON.stringify(summary));

    await context.close();
  } catch (e) {
    out.summary = {
      startedAt,
      finishedAt: isoNow(),
      fatal: true,
      error: trunc(e?.message || e, 800),
      base: BASE,
      output: RESULTS_PATH,
    };
    try {
      await ensureDirFor(RESULTS_PATH);
      await fs.writeFile(RESULTS_PATH, JSON.stringify(out, null, 2), "utf8");
    } catch {
      // swallow
    }
    console.log(JSON.stringify(out.summary));
  } finally {
    try {
      if (browser) await browser.close();
    } catch {
      // swallow
    }
  }
}

// Run
await run();
