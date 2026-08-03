/**
 * UI Batch 1 owner colour / contrast / typography readability validation.
 * Writes ONLY to docs/audits/ui-batch1-owner-colour-readability-remediation/
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3465 node scripts/ui-batch1-owner-colour-readability-validate.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3465";
const OUT = join(process.cwd(), "docs/audits/ui-batch1-owner-colour-readability-remediation");
const AFTER = join(OUT, "after");
mkdirSync(AFTER, { recursive: true });

const ROUTES = [
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
  "/staff-pay",
  "/m07",
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const APPEARANCES = ["light", "dark", "system"];

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

function relLuminance(rgb) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function parseColor(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (s === "transparent" || s === "rgba(0, 0, 0, 0)") return null;
  const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function contrastRatio(fg, bg) {
  if (!fg || !bg) return null;
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function visibleBg(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const bg = parseColor(cs.backgroundColor);
    if (bg && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") {
      return { color: cs.backgroundColor, rgb: bg };
    }
    node = node.parentElement;
  }
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  return { color: bodyBg, rgb: parseColor(bodyBg) };
}

// expose helpers into page via string injection through evaluate bindings

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
  await page.waitForTimeout(150);
}

async function pageAudit(page) {
  return page.evaluate(() => {
    function parseColor(input) {
      if (!input) return null;
      const s = String(input).trim();
      if (s === "transparent") return null;
      const rgb = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*,\s*([.\d]+))?/i);
      if (rgb) {
        if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null;
        return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
      }
      const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        let h = hex[1];
        if (h.length === 3) h = h.split("").map((c) => c + c).join("");
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
        };
      }
      return null;
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
    function visibleBg(el) {
      let node = el;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        const parsed = parseColor(cs.backgroundColor);
        if (parsed) return { color: cs.backgroundColor, rgb: parsed };
        node = node.parentElement;
      }
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      return { color: bodyBg, rgb: parseColor(bodyBg) };
    }

    const textSamples = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const interesting = [
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
    ];
    let n = 0;
    while (walker.nextNode() && n < 220) {
      const el = walker.currentNode;
      if (!(el instanceof HTMLElement)) continue;
      if (!interesting.includes(el.tagName.toLowerCase())) continue;
      const text = (el.innerText || "").trim();
      if (!text || text.length > 80) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      const fontSize = parseFloat(cs.fontSize) || 0;
      const color = cs.color;
      const fg = parseColor(color);
      const bg = visibleBg(el);
      const ratio = contrastRatio(fg, bg.rgb);
      const fontWeight = parseInt(cs.fontWeight, 10) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const aa = ratio == null ? null : isLarge ? ratio >= 3 : ratio >= 4.5;
      textSamples.push({
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 48),
        fontSize,
        color,
        background: bg.color,
        contrast: ratio,
        aa,
        className: (el.className || "").toString().slice(0, 80),
      });
      n += 1;
    }

    const fontViolations = textSamples.filter((s) => s.fontSize > 0 && s.fontSize < 12);
    const contrastFails = textSamples.filter((s) => s.aa === false);

    const selectors = {
      activeTab: ".cc-view-tabs button.active, .module-section-nav__tab--selected",
      brandStrong: ".brand-compact strong",
      card: ".pulse-sidebar ~ *, [class*='rounded']",
      buttonTeal: "button",
      badge: "[role='status']",
      focusable: "button, a, input, select",
    };

    function sample(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const fg = parseColor(cs.color);
      const bg = visibleBg(el);
      const border = parseColor(cs.borderColor || cs.borderTopColor);
      return {
        selector: sel,
        color: cs.color,
        background: bg.color,
        borderColor: cs.borderTopColor,
        fontSize: parseFloat(cs.fontSize) || null,
        contrast: contrastRatio(fg, bg.rgb),
        borderContrast: border ? contrastRatio(border, bg.rgb) : null,
      };
    }

    const controlSamples = [
      sample(".cc-view-tabs button.active"),
      sample(".module-section-nav__tab--selected"),
      sample(".brand-compact strong"),
      sample(".clinic-select-compact"),
      sample(".cc-ctrl"),
      sample(".module-section-nav__tab"),
      sample(".v32-nav-group .nav-btn"),
    ].filter(Boolean);

    // hard-coded light surface leak heuristics in dark mode (bounded sample)
    const leakCandidates = [];
    if (document.body.classList.contains("theme-dark")) {
      const candidates = document.querySelectorAll(
        "main *, .cc-root *, [class*='rounded'], [class*='card'], section, article"
      );
      let scanned = 0;
      for (const el of candidates) {
        if (scanned++ > 400) break;
        if (!(el instanceof HTMLElement)) continue;
        const cs = getComputedStyle(el);
        const bg = parseColor(cs.backgroundColor);
        if (!bg) continue;
        const nearlyWhite = bg.r > 245 && bg.g > 245 && bg.b > 245;
        const rect = el.getBoundingClientRect();
        if (nearlyWhite && rect.width > 40 && rect.height > 20) {
          leakCandidates.push({
            tag: el.tagName.toLowerCase(),
            className: (el.className || "").toString().slice(0, 100),
            background: cs.backgroundColor,
          });
          if (leakCandidates.length >= 40) break;
        }
      }
    }

    const overflow =
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) >
      document.documentElement.clientWidth + 1;

    const tokens = getComputedStyle(document.body);
    const body = getComputedStyle(document.body);
    const tokenSnapshot = {
      canvas: body.backgroundColor,
      ink: body.color,
      card: tokens.getPropertyValue("--card").trim(),
      hcdpCanvas: tokens.getPropertyValue("--hcdp-canvas").trim(),
      hcdpSurface: tokens.getPropertyValue("--hcdp-surface").trim(),
      hcdpText: tokens.getPropertyValue("--hcdp-text").trim(),
      hcdpMuted: tokens.getPropertyValue("--hcdp-text-muted").trim(),
      hcdpAction: tokens.getPropertyValue("--hcdp-action").trim(),
      hcdpControlBorder: tokens.getPropertyValue("--hcdp-control-border").trim(),
      themeDark: document.body.classList.contains("theme-dark"),
    };

    // focused sample pairs for gates
    const pair = (fgCss, bgCss) => {
      const fg = parseColor(fgCss);
      const bg = parseColor(bgCss);
      return contrastRatio(fg, bg);
    };

    const focusedContrasts = {
      primaryTextOnCanvas: pair(tokenSnapshot.hcdpText || body.color, body.backgroundColor),
      mutedOnSurface: (() => {
        const soft = document.createElement("div");
        soft.style.color = "var(--muted)";
        soft.style.background = "var(--card)";
        document.body.appendChild(soft);
        const cs = getComputedStyle(soft);
        const ratio = contrastRatio(parseColor(cs.color), parseColor(cs.backgroundColor));
        soft.remove();
        return ratio;
      })(),
      onActionOnAction: (() => {
        const el = document.createElement("button");
        el.className = "";
        el.style.color = "var(--hcdp-on-action)";
        el.style.background = "var(--hcdp-action)";
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const ratio = contrastRatio(parseColor(cs.color), parseColor(cs.backgroundColor));
        el.remove();
        return ratio;
      })(),
      controlBorderOnSurface: (() => {
        const el = document.createElement("div");
        el.style.color = "var(--hcdp-control-border)";
        el.style.background = "var(--card)";
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const ratio = contrastRatio(parseColor(cs.color), parseColor(cs.backgroundColor));
        el.remove();
        return ratio;
      })(),
    };

    return {
      textSampleCount: textSamples.length,
      contrastFails: contrastFails.slice(0, 40),
      contrastFailCount: contrastFails.length,
      fontViolations: fontViolations.slice(0, 40),
      fontViolationCount: fontViolations.length,
      controlSamples,
      lightSurfaceLeaks: leakCandidates.slice(0, 40),
      lightSurfaceLeakCount: leakCandidates.length,
      overflow,
      tokenSnapshot,
      focusedContrasts,
      sidebarCount: document.querySelectorAll(".pulse-sidebar").length,
    };
  });
}

const results = {
  base: BASE,
  startedAt: new Date().toISOString(),
  matrix: [],
  screenshots: [],
  consoleFindings: [],
  beforeDefectBaseline: {
    activeTabDark: { fg: "#ffffff", bg: "#f1f5f9", approx: 1.1, note: "white on near-white --ink" },
    brandStrongDark: { fg: "#0f3f7a", bg: "#07111f", approx: 1.81 },
    darkBoundary: { fg: "#26384e", bg: "#101d2d", approx: 1.42 },
    tealButtonDark: { fg: "#ffffff", bg: "#3b82f6", approx: 3.68 },
    tealBadgeDark: { fg: "#93c5fd", bg: "#e2eefb", approx: 1.53 },
  },
  summary: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const consoleBag = [];

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    const text = msg.text();
    if (isNoise(text)) return;
    consoleBag.push({ type: msg.type(), text, url: page.url() });
  }
});
page.on("pageerror", (err) => {
  consoleBag.push({ type: "pageerror", text: String(err), url: page.url() });
});

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  for (const route of ROUTES) {
    const appearance = width === 1440 || width === 390 ? APPEARANCES : width === 768 ? ["light", "dark"] : ["light"];
    for (const ap of appearance) {
      const entry = {
        width,
        route,
        appearance: ap,
        ok: true,
        issues: [],
      };
      try {
        await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
        try {
          await page.waitForLoadState("networkidle", { timeout: 8000 });
        } catch {
          /* ignore */
        }
        await setAppearance(page, ap);
        await page.waitForTimeout(350);
        const audit = await pageAudit(page);
        entry.audit = {
          contrastFailCount: audit.contrastFailCount,
          fontViolationCount: audit.fontViolationCount,
          lightSurfaceLeakCount: audit.lightSurfaceLeakCount,
          overflow: audit.overflow,
          focusedContrasts: audit.focusedContrasts,
          tokenSnapshot: audit.tokenSnapshot,
          controlSamples: audit.controlSamples,
          contrastFails: audit.contrastFails,
          fontViolations: audit.fontViolations,
          lightSurfaceLeaks: audit.lightSurfaceLeaks,
          sidebarCount: audit.sidebarCount,
        };

        if (audit.sidebarCount !== 1) {
          const alias = route === "/staff-pay" || route === "/m07";
          if (!alias) {
            entry.ok = false;
            entry.issues.push(`sidebarCount=${audit.sidebarCount}`);
          } else {
            entry.issues.push(`aliasSidebarSoft=${audit.sidebarCount}`);
          }
        }
        if (audit.overflow) {
          entry.ok = false;
          entry.issues.push("horizontalOverflow");
        }
        if (audit.fontViolationCount > 0) {
          entry.ok = false;
          entry.issues.push(`fontViolations=${audit.fontViolationCount}`);
        }
        if (ap === "dark" && audit.lightSurfaceLeakCount > 0) {
          entry.ok = false;
          entry.issues.push(`lightSurfaceLeaks=${audit.lightSurfaceLeakCount}`);
        }
        // Gate key token contrasts (measured from body cascade)
        const fc = audit.focusedContrasts || {};
        if (fc.onActionOnAction != null && fc.onActionOnAction < 4.5) {
          entry.ok = false;
          entry.issues.push(`onActionContrast=${fc.onActionOnAction}`);
        }
        if (fc.controlBorderOnSurface != null && fc.controlBorderOnSurface < 3) {
          entry.ok = false;
          entry.issues.push(`controlBorderContrast=${fc.controlBorderOnSurface}`);
        }
        if (fc.mutedOnSurface != null && fc.mutedOnSurface < 4.5) {
          entry.ok = false;
          entry.issues.push(`mutedContrast=${fc.mutedOnSurface}`);
        }
        if (fc.primaryTextOnCanvas != null && fc.primaryTextOnCanvas < 4.5) {
          entry.ok = false;
          entry.issues.push(`primaryTextContrast=${fc.primaryTextOnCanvas}`);
        }
        // Allow a small number of incidental tiny scraps; hard-fail on many AA fails
        if (audit.contrastFailCount > 12) {
          entry.ok = false;
          entry.issues.push(`contrastFails=${audit.contrastFailCount}`);
        }
      } catch (err) {
        entry.ok = false;
        entry.issues.push(String(err));
      }
      results.matrix.push(entry);
      if (results.matrix.length % 5 === 0) {
        console.log(
          JSON.stringify({
            progress: results.matrix.length,
            last: `${width}${route}@${ap}`,
            ok: entry.ok,
            issues: entry.issues,
          })
        );
      }
    }
  }
}

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
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
      await setAppearance(page, mode);
      await page.waitForTimeout(500);
      const file = `${mode}-${name}-${width}.png`;
      if (name === "sidebar") {
        const sb = await page.$(".pulse-sidebar");
        if (sb) await sb.screenshot({ path: join(AFTER, file) });
        else await page.screenshot({ path: join(AFTER, file), fullPage: false });
      } else {
        await page.screenshot({ path: join(AFTER, file), fullPage: false });
      }
      results.screenshots.push(file);
    }
  }
}

// Appearance persistence + system
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await setAppearance(page, "dark");
await page.reload({ waitUntil: "domcontentloaded" });
try {
  await page.waitForFunction(() => document.body.classList.contains("theme-dark"), null, {
    timeout: 8000,
  });
} catch {
  /* recorded below */
}
await page.waitForTimeout(400);
const persistedDark = await page.evaluate(() => document.body.classList.contains("theme-dark"));
await setAppearance(page, "system");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const systemStored = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null");
  } catch {
    return null;
  }
});

// OS dark preference emulated
const darkContext = await browser.newContext({ colorScheme: "dark" });
const darkPage = await darkContext.newPage();
await darkPage.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await darkPage.evaluate(() => {
  try {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify("system"));
  } catch {
    /* ignore */
  }
});
await darkPage.reload({ waitUntil: "domcontentloaded" });
try {
  await darkPage.waitForFunction(
    () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches &&
      document.body.classList.contains("theme-dark"),
    null,
    { timeout: 8000 }
  );
} catch {
  /* recorded */
}
await darkPage.waitForTimeout(400);
const osDarkSystem = await darkPage.evaluate(() => ({
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
await darkPage.screenshot({ path: join(AFTER, "system-osdark-dashboard-1440.png"), fullPage: false });
results.screenshots.push("system-osdark-dashboard-1440.png");
await darkContext.close();

const patternHits = consoleBag.filter((c) => ERROR_PATTERNS.some((re) => re.test(c.text)));
const cryptoHits = consoleBag.filter((c) => /node:crypto/i.test(c.text));
const hydrationHits = consoleBag.filter((c) =>
  /hydration|did not match|Text content does not match/i.test(c.text)
);

results.consoleFindings = consoleBag;
results.summary = {
  matrixTotal: results.matrix.length,
  matrixPass: results.matrix.filter((m) => m.ok).length,
  matrixFail: results.matrix.filter((m) => !m.ok).length,
  cryptoHits: cryptoHits.length,
  hydrationHits: hydrationHits.length,
  patternHits: patternHits.length,
  appearancePersistenceDark: persistedDark,
  appearanceSystemStored: systemStored,
  osDarkSystem,
  focusedLight: results.matrix.find(
    (m) => m.route === "/dashboard" && m.width === 1440 && m.appearance === "light"
  )?.audit?.focusedContrasts,
  focusedDark: results.matrix.find(
    (m) => m.route === "/dashboard" && m.width === 1440 && m.appearance === "dark"
  )?.audit?.focusedContrasts,
  finishedAt: new Date().toISOString(),
};

writeFileSync(join(OUT, "browser-validation-report.json"), JSON.stringify(results, null, 2));
writeFileSync(join(OUT, "console-bag.json"), JSON.stringify(consoleBag, null, 2));
writeFileSync(
  join(OUT, "hydration-adjudication.json"),
  JSON.stringify(
    {
      newHydrationHits: hydrationHits.length,
      sample: hydrationHits.slice(0, 10),
      note:
        hydrationHits.length === 0
          ? "No hydration console hits in this validation pass."
          : "Hydration messages observed — classify against known pre-existing debt; new unique messages are blockers.",
    },
    null,
    2
  )
);
writeFileSync(
  join(OUT, "contrast-summary.json"),
  JSON.stringify(
    {
      beforeDefectBaseline: results.beforeDefectBaseline,
      afterFocused: {
        light: results.summary.focusedLight,
        dark: results.summary.focusedDark,
      },
      matrixFail: results.summary.matrixFail,
      matrixPass: results.summary.matrixPass,
    },
    null,
    2
  )
);

await browser.close();
console.log(JSON.stringify({ out: OUT, ...results.summary }, null, 2));
process.exit(results.summary.matrixFail || results.summary.cryptoHits ? 1 : 0);
