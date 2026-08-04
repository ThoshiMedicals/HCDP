/**
 * Independent verification — UI Batch 1 owner colour/readability candidate.
 * Writes ONLY under:
 *   docs/audits/ui-batch1-owner-colour-readability-independent-verification/
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3465 node scripts/ui-batch1-owner-colour-readability-independent-verify.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3465";
const OUT = join(
  process.cwd(),
  "docs/audits/ui-batch1-owner-colour-readability-independent-verification"
);
const SHOTS = join(OUT, "screenshots");
const LOGS = join(OUT, "logs");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(LOGS, { recursive: true });

const M04 = [
  "overview",
  "people",
  "staff-profiles",
  "doctor-profiles",
  "engagements",
  "credentials",
  "leave-availability",
  "restrictions",
  "onboarding",
  "offboarding",
  "reports",
  "settings",
];
const M05 = [
  "roster-board",
  "coverage",
  "open-shifts",
  "availability-leave",
  "requests",
  "conflicts-warnings",
  "published-history",
  "cost-forecast",
  "reports",
  "settings",
];
const M06 = [
  "live",
  "clock",
  "timesheets",
  "exceptions",
  "corrections",
  "approvals",
  "breaks",
  "history",
  "reports",
  "settings",
];
const M07 = [
  "overview",
  "people",
  "leave",
  "adjustments",
  "exceptions",
  "variances",
  "approval",
  "export",
  "reconciliation",
  "history",
  "settings",
];

const CORE_ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  ...M04.map((s) => `/staff-doctors?section=${s}`),
  "/roster",
  ...M05.map((s) => `/roster?section=${s}`),
  "/time-attendance",
  ...M06.map((s) => `/time-attendance?section=${s}`),
  "/staffpay",
  ...M07.map((s) => `/staffpay?section=${s}`),
];

const ALIAS_PROBE = ["/staff-pay", "/m07"];
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const ERROR_PATTERNS = [
  /node:crypto/i,
  /UnhandledSchemeError/i,
  /Module not found.*crypto/i,
  /Can't resolve 'node:crypto'/i,
  /hydration/i,
  /Text content does not match/i,
  /did not match\. Server/i,
  /Minified React error/i,
];

function isNoise(text) {
  if (/Download the React DevTools/i.test(text)) return true;
  if (/\[HMR\]/i.test(text)) return true;
  if (/Fast Refresh/i.test(text)) return true;
  return false;
}

async function setAppearance(page, mode) {
  await page.evaluate((m) => {
    try {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
    } catch {
      /* ignore */
    }
    if (m === "dark") document.body.classList.add("theme-dark");
    else if (m === "light") document.body.classList.remove("theme-dark");
    else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.toggle("theme-dark", dark);
    }
  }, mode);
  await page.waitForTimeout(200);
}

async function gotoRoute(page, route, timeout = 90000) {
  const res = await page.goto(BASE + route, {
    waitUntil: "domcontentloaded",
    timeout,
  });
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    /* settle best-effort */
  }
  await page.waitForTimeout(250);
  return res;
}

/** Browser-side audit with alpha-composited backgrounds (no silent transparent dismiss). */
async function pageAudit(page, meta) {
  return page.evaluate((metaIn) => {
    function parseRgba(input) {
      if (!input) return null;
      const s = String(input).trim();
      if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
      const m = s.match(
        /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([.\d]+))?/i
      );
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] === undefined ? 1 : Number(m[4]),
      };
    }
    function blend(fg, bg) {
      const a = fg.a + bg.a * (1 - fg.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
        g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
        b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
        a: 1,
      };
    }
    function effectiveBackground(el) {
      let acc = { r: 255, g: 255, b: 255, a: 0 };
      const chain = [];
      let node = el;
      while (node && node.nodeType === 1) {
        const cs = getComputedStyle(node);
        const parsed = parseRgba(cs.backgroundColor);
        if (parsed && parsed.a > 0) {
          chain.push({
            tag: node.tagName.toLowerCase(),
            color: cs.backgroundColor,
            a: parsed.a,
          });
          acc = blend(parsed, acc);
          if (acc.a >= 0.99) break;
        }
        if (node === document.documentElement) break;
        node = node.parentElement;
      }
      if (acc.a < 0.99) {
        const body = parseRgba(getComputedStyle(document.body).backgroundColor) || {
          r: 255,
          g: 255,
          b: 255,
          a: 1,
        };
        acc = blend(acc.a > 0 ? acc : { r: 0, g: 0, b: 0, a: 0 }, {
          ...body,
          a: 1,
        });
        chain.push({ tag: "body-fallback", color: getComputedStyle(document.body).backgroundColor });
      }
      return {
        rgb: { r: acc.r, g: acc.g, b: acc.b },
        css: `rgb(${acc.r}, ${acc.g}, ${acc.b})`,
        chain,
      };
    }
    function relLuminance(rgb) {
      const channel = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    }
    function contrastRatio(fg, bg) {
      if (!fg || !bg) return null;
      const L1 = relLuminance(fg);
      const L2 = relLuminance(bg);
      const lighter = Math.max(L1, L2);
      const darker = Math.min(L1, L2);
      return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
    }
    function cssPath(el) {
      if (!el || el.nodeType !== 1) return "";
      const parts = [];
      let n = el;
      while (n && n.nodeType === 1 && parts.length < 5) {
        let part = n.tagName.toLowerCase();
        if (n.id) {
          part += `#${n.id}`;
          parts.unshift(part);
          break;
        }
        const cls = (n.className || "")
          .toString()
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .join(".");
        if (cls) part += `.${cls}`;
        const parent = n.parentElement;
        if (parent) {
          const siblings = [...parent.children].filter((c) => c.tagName === n.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(n) + 1})`;
        }
        parts.unshift(part);
        n = parent;
      }
      return parts.join(" > ");
    }

    const issues = [];
    const textFindings = [];
    const interesting = new Set([
      "p",
      "span",
      "a",
      "button",
      "label",
      "td",
      "th",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "small",
      "div",
      "input",
      "select",
      "textarea",
    ]);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let scanned = 0;
    while (walker.nextNode() && scanned < 320) {
      const el = walker.currentNode;
      if (!(el instanceof HTMLElement)) continue;
      if (!interesting.has(el.tagName.toLowerCase())) continue;
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
      if (!text || text.length > 90) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0)
        continue;
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const fontSize = parseFloat(cs.fontSize) || 0;
      const fontWeight = parseInt(cs.fontWeight, 10) || 400;
      const fgParsed = parseRgba(cs.color);
      const bg = effectiveBackground(el);
      const fg =
        fgParsed && fgParsed.a < 1
          ? blend(fgParsed, { ...bg.rgb, a: 1 })
          : fgParsed
            ? { r: fgParsed.r, g: fgParsed.g, b: fgParsed.b }
            : null;
      const ratio = contrastRatio(fg, bg.rgb);
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const required = isLarge ? 3 : 4.5;
      const aa = ratio == null ? null : ratio >= required;

      const roleish = `${el.className} ${el.getAttribute("role") || ""} ${el.tagName}`;
      const isNavOrControl =
        /nav|button|tab|menu|select|input|table|helper|muted|badge|sidebar|cc-ctrl|module-section/i.test(
          roleish
        ) || ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "LABEL", "TD", "TH"].includes(el.tagName);

      const finding = {
        route: metaIn.route,
        section: metaIn.section || null,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
        text: text.slice(0, 64),
        accessibleName: (el.getAttribute("aria-label") || text).slice(0, 64),
        selector: cssPath(el),
        foreground: cs.color,
        background: bg.css,
        backgroundChain: bg.chain.slice(0, 6),
        fontSize,
        fontWeight,
        ratio,
        required,
        adjudication: aa === false ? "FAIL" : aa === true ? "PASS" : "INDETERMINATE",
      };
      textFindings.push(finding);
      scanned += 1;

      if (fontSize > 0 && fontSize < 12) {
        issues.push({
          ...finding,
          kind: "typography-below-12",
          required: 12,
          adjudication: "FAIL",
        });
      } else if (isNavOrControl && fontSize > 0 && fontSize < 13) {
        issues.push({
          ...finding,
          kind: "typography-control-below-13",
          required: 13,
          adjudication: "FAIL",
        });
      }
      if (aa === false) {
        issues.push({ ...finding, kind: "contrast-aa", adjudication: "FAIL" });
      }
    }

    function sampleControl(sel, kind, minRatio) {
      const el = document.querySelector(sel);
      if (!el) return { selector: sel, kind, found: false };
      const cs = getComputedStyle(el);
      const fg = parseRgba(cs.color);
      const bg = effectiveBackground(el);
      const border = parseRgba(cs.borderTopColor);
      const outline = parseRgba(cs.outlineColor);
      const ratio = contrastRatio(
        fg && fg.a < 1 ? blend(fg, { ...bg.rgb, a: 1 }) : fg,
        bg.rgb
      );
      const borderRatio = border
        ? contrastRatio({ r: border.r, g: border.g, b: border.b }, bg.rgb)
        : null;
      const box = {
        selector: sel,
        kind,
        found: true,
        text: ((el.innerText || el.getAttribute("aria-label") || "").trim()).slice(0, 64),
        foreground: cs.color,
        background: bg.css,
        fontSize: parseFloat(cs.fontSize) || null,
        fontWeight: parseInt(cs.fontWeight, 10) || null,
        ratio,
        required: minRatio,
        borderColor: cs.borderTopColor,
        borderRatio,
        outlineColor: cs.outlineColor,
        outlineWidth: cs.outlineWidth,
        adjudication: ratio != null && ratio < minRatio ? "FAIL" : "PASS",
      };
      if (box.adjudication === "FAIL") {
        issues.push({
          route: metaIn.route,
          appearance: metaIn.appearance,
          viewport: metaIn.width,
          kind: `control-${kind}`,
          ...box,
        });
      }
      return box;
    }

    const controls = [
      sampleControl(".cc-view-tabs button.active", "active-tab", 4.5),
      sampleControl(".module-section-nav__tab--selected", "module-active-tab", 4.5),
      sampleControl(".brand-compact strong", "brand-title", 7),
      sampleControl("h1, [data-page-title], .page-title, .cc-root h1", "page-title", 7),
      sampleControl(".clinic-select-compact", "clinic-selector", 4.5),
      sampleControl(".cc-ctrl", "segmented-control", 4.5),
      sampleControl(".v32-nav-group .nav-btn, .pulse-sidebar a, .pulse-sidebar button", "sidebar-entry", 4.5),
      sampleControl("button:not([disabled])", "button", 4.5),
      sampleControl("button[disabled], [aria-disabled='true']", "disabled-button", 3),
      sampleControl("[role='status'], .badge, .cc-badge", "badge", 4.5),
      sampleControl("input, select, textarea", "input", 4.5),
      sampleControl("table, .data-table, [role='table']", "table", 4.5),
    ];

    // Focus ring sample
    const focusTarget = document.querySelector("button, a, input, select");
    let focusSample = null;
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus();
      const cs = getComputedStyle(focusTarget);
      const bg = effectiveBackground(focusTarget);
      const outline = parseRgba(cs.outlineColor) || parseRgba(cs.boxShadow);
      const ringRatio =
        outline && outline.a > 0
          ? contrastRatio({ r: outline.r, g: outline.g, b: outline.b }, bg.rgb)
          : null;
      focusSample = {
        selector: cssPath(focusTarget),
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
        outlineWidth: cs.outlineWidth,
        ringRatio,
        required: 3,
        adjudication:
          ringRatio == null
            ? cs.boxShadow && cs.boxShadow !== "none"
              ? "PASS-BOXSHADOW"
              : "FAIL-NO-VISIBLE-FOCUS"
            : ringRatio >= 3
              ? "PASS"
              : "FAIL",
      };
      if (focusSample.adjudication.startsWith("FAIL")) {
        issues.push({
          route: metaIn.route,
          appearance: metaIn.appearance,
          viewport: metaIn.width,
          kind: "focus-ring",
          ...focusSample,
        });
      }
    }

    const leaks = [];
    if (document.body.classList.contains("theme-dark")) {
      const candidates = document.querySelectorAll(
        "main *, .cc-root *, section, article, [class*='card'], [class*='rounded']"
      );
      let i = 0;
      for (const el of candidates) {
        if (i++ > 500) break;
        if (!(el instanceof HTMLElement)) continue;
        const cs = getComputedStyle(el);
        const bg = parseRgba(cs.backgroundColor);
        if (!bg || bg.a < 0.85) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 20) continue;
        const nearlyWhite = bg.r > 245 && bg.g > 245 && bg.b > 245;
        const lightOnly = bg.r > 230 && bg.g > 230 && bg.b > 230 && relLuminance(bg) > 0.85;
        const nearBlack = bg.r < 8 && bg.g < 8 && bg.b < 8;
        const hardHex = (el.getAttribute("style") || "").match(/#[0-9a-f]{3,8}/i);
        if (nearlyWhite || lightOnly || nearBlack) {
          leaks.push({
            kind: nearlyWhite || lightOnly ? "light-surface-leak" : "near-black-canvas",
            selector: cssPath(el),
            background: cs.backgroundColor,
            className: (el.className || "").toString().slice(0, 100),
            adjudication: "FAIL",
          });
          if (leaks.length >= 40) break;
        }
        if (hardHex) {
          leaks.push({
            kind: "inline-hardcoded-color",
            selector: cssPath(el),
            style: el.getAttribute("style"),
            adjudication: "REVIEW",
          });
        }
      }
      // Gradient nav/data panels
      const navish = document.querySelectorAll(".pulse-sidebar, .module-section-nav, nav, .cc-view-tabs");
      for (const el of navish) {
        const cs = getComputedStyle(el);
        if (/gradient/i.test(cs.backgroundImage)) {
          leaks.push({
            kind: "nav-gradient",
            selector: cssPath(el),
            backgroundImage: cs.backgroundImage.slice(0, 120),
            adjudication: "FAIL",
          });
        }
      }
    }

    const overflow =
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) >
      document.documentElement.clientWidth + 1;

    const h1s = [...document.querySelectorAll("h1")].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    });

    const sidebarCount = document.querySelectorAll(".pulse-sidebar").length;
    const internalRails = document.querySelectorAll(
      ".module-workspace-rail, .internal-left-nav, [data-internal-rail='true']"
    ).length;
    const favLabels = [...document.querySelectorAll(".pulse-sidebar *")].filter((el) =>
      /^favourites?$/i.test((el.textContent || "").trim())
    ).length;
    const recentLabels = [...document.querySelectorAll(".pulse-sidebar *")].filter((el) =>
      /^recent$/i.test((el.textContent || "").trim())
    ).length;

    const desktopTabs = [...document.querySelectorAll(".module-section-nav__tab")].map((el) => ({
      text: (el.textContent || "").trim(),
      selected: el.classList.contains("module-section-nav__tab--selected"),
    }));
    const mobileSelect = document.querySelector(
      "select.module-section-nav__select, .module-section-mobile select, select[aria-label*='section' i]"
    );
    const mobileOptions = mobileSelect
      ? [...mobileSelect.options].map((o) => ({ value: o.value, text: o.textContent?.trim() }))
      : [];

    const body = getComputedStyle(document.body);
    const tokenSnapshot = {
      themeDark: document.body.classList.contains("theme-dark"),
      canvas: body.backgroundColor,
      ink: body.color,
      card: body.getPropertyValue("--card").trim(),
      hcdpCanvas: body.getPropertyValue("--hcdp-canvas").trim(),
      hcdpSurface: body.getPropertyValue("--hcdp-surface").trim(),
      hcdpText: body.getPropertyValue("--hcdp-text").trim(),
      hcdpMuted: body.getPropertyValue("--hcdp-text-muted").trim(),
      hcdpAction: body.getPropertyValue("--hcdp-action").trim(),
      hcdpOnAction: body.getPropertyValue("--hcdp-on-action").trim(),
      hcdpControlBorder: body.getPropertyValue("--hcdp-control-border").trim(),
      typeBody: body.getPropertyValue("--type-body").trim(),
      typeControl: body.getPropertyValue("--type-control").trim(),
      typeMeta: body.getPropertyValue("--type-meta").trim(),
    };

    function probeVar(fgVar, bgVar) {
      const el = document.createElement("div");
      el.style.color = fgVar;
      el.style.background = bgVar;
      document.body.appendChild(el);
      const cs = getComputedStyle(el);
      const ratio = contrastRatio(parseRgba(cs.color), parseRgba(cs.backgroundColor));
      el.remove();
      return {
        fg: cs.color,
        bg: cs.backgroundColor,
        ratio,
      };
    }

    const focusedContrasts = {
      primaryTextOnCanvas: probeVar("var(--hcdp-text)", "var(--hcdp-canvas)"),
      mutedOnSurface: probeVar("var(--muted)", "var(--card)"),
      onActionOnAction: probeVar("var(--hcdp-on-action)", "var(--hcdp-action)"),
      controlBorderOnSurface: probeVar("var(--hcdp-control-border)", "var(--card)"),
    };

    // Gate focused primary target ≥7:1
    if (
      focusedContrasts.primaryTextOnCanvas.ratio != null &&
      focusedContrasts.primaryTextOnCanvas.ratio < 7
    ) {
      issues.push({
        kind: "primary-text-7-1",
        ...focusedContrasts.primaryTextOnCanvas,
        required: 7,
        adjudication: "FAIL",
        route: metaIn.route,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
      });
    }
    if (
      focusedContrasts.mutedOnSurface.ratio != null &&
      focusedContrasts.mutedOnSurface.ratio < 4.5
    ) {
      issues.push({
        kind: "muted-4-5",
        ...focusedContrasts.mutedOnSurface,
        required: 4.5,
        adjudication: "FAIL",
        route: metaIn.route,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
      });
    }
    if (
      focusedContrasts.onActionOnAction.ratio != null &&
      focusedContrasts.onActionOnAction.ratio < 4.5
    ) {
      issues.push({
        kind: "on-action-4-5",
        ...focusedContrasts.onActionOnAction,
        required: 4.5,
        adjudication: "FAIL",
        route: metaIn.route,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
      });
    }
    if (
      focusedContrasts.controlBorderOnSurface.ratio != null &&
      focusedContrasts.controlBorderOnSurface.ratio < 3
    ) {
      issues.push({
        kind: "boundary-3-1",
        ...focusedContrasts.controlBorderOnSurface,
        required: 3,
        adjudication: "FAIL",
        route: metaIn.route,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
      });
    }

    for (const leak of leaks) {
      if (leak.adjudication === "FAIL") {
        issues.push({
          route: metaIn.route,
          appearance: metaIn.appearance,
          viewport: metaIn.width,
          ...leak,
        });
      }
    }

    if (overflow) {
      issues.push({
        kind: "horizontal-overflow",
        route: metaIn.route,
        appearance: metaIn.appearance,
        viewport: metaIn.width,
        adjudication: "FAIL",
      });
    }

    return {
      issues,
      textFindingCount: textFindings.length,
      contrastFailCount: issues.filter((i) => i.kind === "contrast-aa").length,
      typographyFailCount: issues.filter((i) => String(i.kind).startsWith("typography")).length,
      lightSurfaceLeakCount: leaks.filter((l) => l.kind === "light-surface-leak").length,
      leaks: leaks.slice(0, 40),
      controls,
      focusSample,
      overflow,
      h1Count: h1s.length,
      h1Texts: h1s.map((h) => (h.textContent || "").trim().slice(0, 80)),
      sidebarCount,
      internalRails,
      favouritesLabelCount: favLabels,
      recentLabelCount: recentLabels,
      desktopTabs,
      mobileOptions,
      tokenSnapshot,
      focusedContrasts,
      bodyFontSize: parseFloat(body.fontSize) || null,
      bodyLineHeight: body.lineHeight,
      nestedButton: !!document.querySelector("button button, a button, button a"),
    };
  }, meta);
}

function normalizeHydration(text) {
  return String(text)
    .replace(/http:\/\/localhost:\d+/g, "http://localhost:PORT")
    .replace(/\s+/g, " ")
    .replace(/#[0-9a-f]{4,}/gi, "#HASH")
    .slice(0, 240);
}

async function coldAdjustments(browser) {
  const results = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleMsgs = [];
    page.on("pageerror", (err) => consoleMsgs.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleMsgs.push(msg.text());
    });
    const started = Date.now();
    let status = null;
    let finalUrl = null;
    let error = null;
    try {
      const res = await page.goto(BASE + "/staffpay?section=adjustments", {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      status = res?.status() ?? null;
      finalUrl = page.url();
      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
      } catch {
        /* best effort */
      }
      await page.waitForTimeout(800);
    } catch (e) {
      error = String(e);
    }
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 400) || "");
    results.push({
      attempt: i + 1,
      status,
      finalUrl,
      ms: Date.now() - started,
      error,
      jsonParseErrors: consoleMsgs.filter((m) => /Unexpected end of JSON|JSON/i.test(m)),
      consoleErrors: consoleMsgs.slice(0, 20),
      bodySnippet: bodyText,
      looksLike500: status === 500 || /Internal Server Error|Application error/i.test(bodyText),
    });
    await ctx.close();
  }
  return results;
}

async function aliasProbe(page) {
  const out = [];
  for (const route of ALIAS_PROBE) {
    let status = null;
    let finalUrl = null;
    let error = null;
    try {
      const res = await gotoRoute(page, route);
      status = res?.status() ?? null;
      finalUrl = page.url();
    } catch (e) {
      error = String(e);
    }
    out.push({ route, status, finalUrl, error });
  }
  return out;
}

async function interactSmoke(page) {
  const result = {
    search: null,
    favourite: null,
    sidebarCollapse: null,
    appearanceControl: null,
    sectionTab: null,
    disclosure: null,
    errors: [],
  };
  try {
    await gotoRoute(page, "/dashboard");
    await setAppearance(page, "light");
    const search = page.locator('input[placeholder*="Search" i], input[aria-label*="Search" i]').first();
    if (await search.count()) {
      await search.fill("staff");
      await page.waitForTimeout(300);
      result.search = { ok: true, value: await search.inputValue() };
      await search.fill("");
    } else result.search = { ok: false, reason: "search-input-not-found" };

    const fav = page.locator('[aria-label*="avourite" i], button:has-text("★"), .nav-fav, [data-favourite]').first();
    if (await fav.count()) {
      await fav.click({ timeout: 3000 }).catch((e) => {
        result.errors.push(String(e));
      });
      result.favourite = { ok: true };
    } else result.favourite = { ok: false, reason: "favourite-control-not-found" };

    const collapse = page
      .locator(
        '[aria-label*="collapse" i], [aria-label*="Collapse" i], button.sidebar-collapse, .pulse-sidebar [aria-expanded]'
      )
      .first();
    if (await collapse.count()) {
      await collapse.click({ timeout: 3000 }).catch((e) => result.errors.push(String(e)));
      result.sidebarCollapse = { ok: true };
    } else result.sidebarCollapse = { ok: false, reason: "collapse-not-found" };

    const appearance = page
      .locator('button:has-text("Dark"), button:has-text("Light"), [aria-label*="appearance" i]')
      .first();
    if (await appearance.count()) {
      await appearance.click({ timeout: 3000 }).catch((e) => result.errors.push(String(e)));
      result.appearanceControl = { ok: true };
    } else result.appearanceControl = { ok: false, reason: "appearance-control-not-found" };

    const disclosure = page
      .locator("details summary, button:has-text('More'), button:has-text('Details')")
      .first();
    if (await disclosure.count()) {
      await disclosure.click({ timeout: 3000 }).catch((e) => result.errors.push(String(e)));
      result.disclosure = { ok: true };
    } else result.disclosure = { ok: false, reason: "disclosure-not-found" };

    await gotoRoute(page, "/staff-doctors");
    const tab = page.locator(".module-section-nav__tab").nth(1);
    if (await tab.count()) {
      const before = page.url();
      await tab.click();
      await page.waitForTimeout(400);
      result.sectionTab = { ok: true, before, after: page.url() };
    } else result.sectionTab = { ok: false, reason: "section-tab-not-found" };
  } catch (e) {
    result.errors.push(String(e));
  }
  return result;
}

const report = {
  base: BASE,
  startedAt: new Date().toISOString(),
  independence:
    "Fresh independent evidence only — does not copy remediation screenshots/logs as proof",
  matrix: [],
  issues: [],
  screenshots: [],
  consoleFindings: [],
  hydrationSignatures: [],
  coldAdjustments: null,
  aliases: null,
  interactions: null,
  appearance: {},
  summary: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ colorScheme: "light" });
const page = await context.newPage();
const consoleBag = [];

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    const text = msg.text();
    if (isNoise(text)) return;
    consoleBag.push({ type: msg.type(), text, url: page.url(), at: new Date().toISOString() });
  }
});
page.on("pageerror", (err) => {
  consoleBag.push({
    type: "pageerror",
    text: String(err),
    url: page.url(),
    at: new Date().toISOString(),
  });
});

console.log(JSON.stringify({ phase: "cold-adjustments", base: BASE }));
report.coldAdjustments = await coldAdjustments(browser);

console.log(JSON.stringify({ phase: "alias-probe" }));
await page.setViewportSize({ width: 1440, height: 900 });
report.aliases = await aliasProbe(page);

console.log(JSON.stringify({ phase: "interaction-smoke" }));
report.interactions = await interactSmoke(page);

// Full matrix — light/dark at all widths for core subset; system at 1440/390
const MATRIX_ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/staff-doctors?section=people",
  "/staff-doctors?section=credentials",
  "/roster",
  "/roster?section=coverage",
  "/roster?section=open-shifts",
  "/time-attendance",
  "/time-attendance?section=timesheets",
  "/time-attendance?section=approvals",
  "/staffpay?section=overview",
  "/staffpay?section=people",
  "/staffpay?section=approval",
  "/staffpay?section=export",
  "/staffpay?section=reconciliation",
  "/staffpay?section=adjustments",
];

// Plus every section once at 1440 light
const SECTION_SWEEP = [
  ...M04.map((s) => `/staff-doctors?section=${s}`),
  ...M05.map((s) => `/roster?section=${s}`),
  ...M06.map((s) => `/time-attendance?section=${s}`),
  ...M07.map((s) => `/staffpay?section=${s}`),
];

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  const appearances =
    width === 1440 || width === 390
      ? ["light", "dark", "system"]
      : width === 768
        ? ["light", "dark"]
        : ["light", "dark"];
  for (const route of MATRIX_ROUTES) {
    for (const ap of appearances) {
      const entry = {
        width,
        route,
        appearance: ap,
        ok: true,
        issues: [],
      };
      try {
        await gotoRoute(page, route);
        await setAppearance(page, ap);
        const audit = await pageAudit(page, {
          route,
          appearance: ap,
          width,
          section: new URL(BASE + route).searchParams.get("section"),
        });
        entry.audit = {
          contrastFailCount: audit.contrastFailCount,
          typographyFailCount: audit.typographyFailCount,
          lightSurfaceLeakCount: audit.lightSurfaceLeakCount,
          overflow: audit.overflow,
          sidebarCount: audit.sidebarCount,
          h1Count: audit.h1Count,
          h1Texts: audit.h1Texts,
          internalRails: audit.internalRails,
          focusedContrasts: audit.focusedContrasts,
          tokenSnapshot: audit.tokenSnapshot,
          controls: audit.controls,
          focusSample: audit.focusSample,
          desktopTabCount: audit.desktopTabs.length,
          mobileOptionCount: audit.mobileOptions.length,
          bodyFontSize: audit.bodyFontSize,
          bodyLineHeight: audit.bodyLineHeight,
          nestedButton: audit.nestedButton,
          issueCount: audit.issues.length,
        };
        for (const issue of audit.issues) {
          report.issues.push(issue);
          if (issue.adjudication === "FAIL" || String(issue.adjudication).startsWith("FAIL")) {
            entry.ok = false;
            entry.issues.push(issue.kind || "issue");
          }
        }
        if (audit.sidebarCount !== 1) {
          entry.ok = false;
          entry.issues.push(`sidebarCount=${audit.sidebarCount}`);
        }
        if (audit.h1Count !== 1 && !route.includes("action-inbox")) {
          // record but do not auto-fail dashboards that legitimately differ — flag for report
          entry.issues.push(`h1Count=${audit.h1Count}`);
          if (audit.h1Count === 0 || audit.h1Count > 2) entry.ok = false;
        }
      } catch (err) {
        entry.ok = false;
        entry.issues.push(String(err));
      }
      report.matrix.push(entry);
      if (report.matrix.length % 8 === 0) {
        console.log(
          JSON.stringify({
            progress: report.matrix.length,
            last: `${width}${route}@${ap}`,
            ok: entry.ok,
            issues: entry.issues.slice(0, 6),
          })
        );
      }
    }
  }
}

// Section sweep 1440 light
await page.setViewportSize({ width: 1440, height: 900 });
const sectionResults = [];
for (const route of SECTION_SWEEP) {
  const entry = { route, appearance: "light", width: 1440, ok: true, issues: [] };
  try {
    await gotoRoute(page, route);
    await setAppearance(page, "light");
    const audit = await pageAudit(page, {
      route,
      appearance: "light",
      width: 1440,
      section: new URL(BASE + route).searchParams.get("section"),
    });
    entry.sidebarCount = audit.sidebarCount;
    entry.h1Count = audit.h1Count;
    entry.desktopTabCount = audit.desktopTabs.length;
    entry.mobileOptionCount = audit.mobileOptions.length;
    entry.sectionQuery = page.url();
    entry.focusedContrasts = audit.focusedContrasts;
    if (audit.sidebarCount !== 1) {
      entry.ok = false;
      entry.issues.push(`sidebarCount=${audit.sidebarCount}`);
    }
    for (const issue of audit.issues.filter((i) =>
      ["primary-text-7-1", "muted-4-5", "on-action-4-5", "boundary-3-1", "light-surface-leak"].includes(
        i.kind
      )
    )) {
      entry.ok = false;
      entry.issues.push(issue.kind);
      report.issues.push(issue);
    }
  } catch (e) {
    entry.ok = false;
    entry.issues.push(String(e));
  }
  sectionResults.push(entry);
}
report.sectionSweep = sectionResults;

// Screenshots Light/Dark 1440 & 390
const shotSpecs = [
  ["dashboard", "/dashboard"],
  ["sidebar", "/dashboard"],
  ["m04", "/staff-doctors"],
  ["m05", "/roster"],
  ["m06", "/time-attendance"],
  ["m07-overview", "/staffpay?section=overview"],
  ["m07-adjustments", "/staffpay?section=adjustments"],
];
for (const mode of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    for (const [name, route] of shotSpecs) {
      await gotoRoute(page, route);
      await setAppearance(page, mode);
      await page.waitForTimeout(400);
      const file = `${mode}-${name}-${width}.png`;
      const path = join(SHOTS, file);
      if (name === "sidebar") {
        const sb = await page.$(".pulse-sidebar");
        if (sb) await sb.screenshot({ path });
        else await page.screenshot({ path, fullPage: false });
      } else {
        await page.screenshot({ path, fullPage: false });
      }
      report.screenshots.push(file);
    }
  }
}

// Appearance persistence / system / clean default
await page.setViewportSize({ width: 1440, height: 900 });
await gotoRoute(page, "/dashboard");
await setAppearance(page, "dark");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
report.appearance.persistedDark = await page.evaluate(() =>
  document.body.classList.contains("theme-dark")
);

const cleanCtx = await browser.newContext({ colorScheme: "light" });
const cleanPage = await cleanCtx.newPage();
await cleanPage.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await cleanPage.waitForTimeout(700);
report.appearance.cleanStorageDefault = await cleanPage.evaluate(() => ({
  themeDark: document.body.classList.contains("theme-dark"),
  stored: (() => {
    try {
      return JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
    } catch {
      return null;
    }
  })(),
}));
await cleanCtx.close();

for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const p = await ctx.newPage();
  await p.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
  await p.evaluate(() => {
    try {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify("system"));
    } catch {
      /* ignore */
    }
  });
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  const snap = await p.evaluate(() => ({
    prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    themeDark: document.body.classList.contains("theme-dark"),
    appearance: (() => {
      try {
        return JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
      } catch {
        return null;
      }
    })(),
  }));
  report.appearance[`systemOs${scheme}`] = snap;
  await p.screenshot({
    path: join(SHOTS, `system-os${scheme}-dashboard-1440.png`),
    fullPage: false,
  });
  report.screenshots.push(`system-os${scheme}-dashboard-1440.png`);
  await ctx.close();
}

// Hydration signature capture on candidate
const hydraRoutes = [
  "/dashboard",
  "/staff-doctors",
  "/roster",
  "/time-attendance",
  "/staffpay?section=overview",
  "/staffpay?section=adjustments",
];
const hydraCtx = await browser.newContext();
const hydraPage = await hydraCtx.newPage();
const hydraBag = [];
hydraPage.on("console", (msg) => {
  const t = msg.text();
  if (/hydration|did not match|Text content does not match/i.test(t)) {
    hydraBag.push({ text: t, url: hydraPage.url(), norm: normalizeHydration(t) });
  }
});
hydraPage.on("pageerror", (err) => {
  const t = String(err);
  if (/hydration|did not match|Text content does not match/i.test(t)) {
    hydraBag.push({ text: t, url: hydraPage.url(), norm: normalizeHydration(t) });
  }
});
for (const route of hydraRoutes) {
  await hydraPage.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
  await hydraPage.waitForTimeout(1200);
}
report.hydrationSignatures = hydraBag;
await hydraCtx.close();

const patternHits = consoleBag.filter((c) => ERROR_PATTERNS.some((re) => re.test(c.text)));
const cryptoHits = consoleBag.filter((c) => /node:crypto/i.test(c.text));
const hydrationHits = consoleBag.filter((c) =>
  /hydration|did not match|Text content does not match/i.test(c.text)
);

report.consoleFindings = consoleBag;
report.summary = {
  matrixTotal: report.matrix.length,
  matrixPass: report.matrix.filter((m) => m.ok).length,
  matrixFail: report.matrix.filter((m) => !m.ok).length,
  issueTotal: report.issues.length,
  failIssues: report.issues.filter((i) => String(i.adjudication).startsWith("FAIL")).length,
  cryptoHits: cryptoHits.length,
  hydrationHits: hydrationHits.length,
  patternHits: patternHits.length,
  coldAdjustments: report.coldAdjustments,
  aliases: report.aliases,
  appearance: report.appearance,
  focusedLight: report.matrix.find(
    (m) => m.route === "/dashboard" && m.width === 1440 && m.appearance === "light"
  )?.audit?.focusedContrasts,
  focusedDark: report.matrix.find(
    (m) => m.route === "/dashboard" && m.width === 1440 && m.appearance === "dark"
  )?.audit?.focusedContrasts,
  sectionSweepFail: sectionResults.filter((s) => !s.ok).length,
  finishedAt: new Date().toISOString(),
};

writeFileSync(join(OUT, "browser-validation-report.json"), JSON.stringify(report, null, 2));
writeFileSync(join(OUT, "console-bag.json"), JSON.stringify(consoleBag, null, 2));
writeFileSync(join(OUT, "issues.json"), JSON.stringify(report.issues, null, 2));
writeFileSync(
  join(OUT, "contrast-summary.json"),
  JSON.stringify(
    {
      focusedLight: report.summary.focusedLight,
      focusedDark: report.summary.focusedDark,
      matrixPass: report.summary.matrixPass,
      matrixFail: report.summary.matrixFail,
      failIssues: report.summary.failIssues,
    },
    null,
    2
  )
);
writeFileSync(
  join(OUT, "hydration-candidate.json"),
  JSON.stringify(
    {
      signatures: report.hydrationSignatures,
      uniqueNorm: [...new Set(report.hydrationSignatures.map((h) => h.norm))],
      consoleHydrationHits: hydrationHits.slice(0, 30),
    },
    null,
    2
  )
);
writeFileSync(join(OUT, "cold-adjustments.json"), JSON.stringify(report.coldAdjustments, null, 2));
writeFileSync(join(OUT, "alias-probe.json"), JSON.stringify(report.aliases, null, 2));
writeFileSync(join(OUT, "interactions.json"), JSON.stringify(report.interactions, null, 2));
writeFileSync(join(OUT, "section-sweep.json"), JSON.stringify(sectionResults, null, 2));
writeFileSync(
  join(OUT, "routes-discovered.json"),
  JSON.stringify({ CORE_ROUTES, SECTION_SWEEP, ALIAS_PROBE, M04, M05, M06, M07 }, null, 2)
);

console.log(JSON.stringify(report.summary, null, 2));
await browser.close();

const hardFail =
  report.coldAdjustments.some((a) => a.looksLike500 || a.status === 500) ||
  cryptoHits.length > 0 ||
  report.summary.matrixFail > report.summary.matrixTotal * 0.35;

process.exit(hardFail ? 2 : 0);
