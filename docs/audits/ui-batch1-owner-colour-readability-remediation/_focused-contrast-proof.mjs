/**
 * Focused contrast/appearance/screenshot proof after token remapping fix.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3465";
const OUT = join(process.cwd(), "docs/audits/ui-batch1-owner-colour-readability-remediation");
const AFTER = join(OUT, "after");
mkdirSync(AFTER, { recursive: true });

function parse(s) {
  if (!s) return null;
  const t = String(s).trim();
  if (t === "transparent") return null;
  const rgb = t.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*,\s*([.\d]+))?/i);
  if (rgb) {
    if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null;
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  }
  const hex = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return null;
  let h = hex[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function L(c) {
  const ch = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}
function ratio(a, b) {
  if (!a || !b) return null;
  const x = L(a);
  const y = L(b);
  return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2));
}

async function measure(page) {
  return page.evaluate(() => {
    function parse(s) {
      if (!s) return null;
      const t = String(s).trim();
      if (t === "transparent") return null;
      const rgb = t.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*,\s*([.\d]+))?/i);
      if (rgb) {
        if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null;
        return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
      }
      const hex = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!hex) return null;
      let h = hex[1];
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
      };
    }
    function L(c) {
      const ch = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
    }
    function ratio(a, b) {
      if (!a || !b) return null;
      const x = L(a);
      const y = L(b);
      return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2));
    }
    const body = getComputedStyle(document.body);
    const make = (cssText) => {
      const el = document.createElement("div");
      el.style.cssText = cssText;
      document.body.appendChild(el);
      const cs = getComputedStyle(el);
      const r = ratio(parse(cs.color), parse(cs.backgroundColor));
      el.remove();
      return { color: cs.color, background: cs.backgroundColor, contrast: r };
    };
    const active = document.querySelector(
      ".cc-view-tabs button.active, .module-section-nav__tab--selected"
    );
    let activeSample = null;
    if (active) {
      const cs = getComputedStyle(active);
      activeSample = {
        color: cs.color,
        background: cs.backgroundColor,
        contrast: ratio(parse(cs.color), parse(cs.backgroundColor)),
        fontSize: parseFloat(cs.fontSize),
      };
    }
    const brand = document.querySelector(".brand-compact strong");
    let brandSample = null;
    if (brand) {
      const cs = getComputedStyle(brand);
      let n = brand;
      let bg = null;
      while (n && n !== document.documentElement) {
        const b = getComputedStyle(n).backgroundColor;
        const p = parse(b);
        if (p) {
          bg = b;
          break;
        }
        n = n.parentElement;
      }
      brandSample = {
        color: cs.color,
        background: bg,
        contrast: ratio(parse(cs.color), parse(bg || body.backgroundColor)),
      };
    }
    return {
      themeDark: document.body.classList.contains("theme-dark"),
      tokens: {
        canvas: body.getPropertyValue("--hcdp-canvas").trim(),
        surface: body.getPropertyValue("--hcdp-surface").trim(),
        text: body.getPropertyValue("--hcdp-text").trim(),
        muted: body.getPropertyValue("--hcdp-text-muted").trim(),
        action: body.getPropertyValue("--hcdp-action").trim(),
        controlBorder: body.getPropertyValue("--hcdp-control-border").trim(),
        card: body.getPropertyValue("--card").trim(),
      },
      body: { color: body.color, background: body.backgroundColor },
      primaryTextOnCanvas: ratio(parse(body.color), parse(body.backgroundColor)),
      mutedOnSurface: make("color:var(--muted);background:var(--card)"),
      onActionOnAction: make("color:var(--hcdp-on-action);background:var(--hcdp-action)"),
      controlBorderOnSurface: make("color:var(--hcdp-control-border);background:var(--card)"),
      activeSample,
      brandSample,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = { base: BASE, modes: {}, screenshots: [], persistence: {}, startedAt: new Date().toISOString() };

for (const mode of ["light", "dark"]) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.evaluate((m) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
    document.body.classList.toggle("theme-dark", m === "dark");
  }, mode);
  await page.waitForTimeout(300);
  report.modes[mode] = await measure(page);
  for (const [name, route] of [
    ["dashboard", "/dashboard"],
    ["sidebar", "/dashboard"],
    ["m04", "/staff-doctors"],
    ["m05", "/roster"],
    ["m06", "/time-attendance"],
    ["m07-overview", "/staffpay?section=overview"],
    ["m07-adjustments", "/staffpay?section=adjustments"],
  ]) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.evaluate((m) => {
        localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
        document.body.classList.toggle("theme-dark", m === "dark");
      }, mode);
      await page.waitForTimeout(350);
      const file = `${mode}-${name}-${width}.png`;
      if (name === "sidebar") {
        const sb = await page.$(".pulse-sidebar");
        if (sb) await sb.screenshot({ path: join(AFTER, file) });
        else await page.screenshot({ path: join(AFTER, file), fullPage: false });
      } else {
        await page.screenshot({ path: join(AFTER, file), fullPage: false });
      }
      report.screenshots.push(file);
    }
  }
}

await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.evaluate(() => {
  localStorage.setItem("pulse.cc.appearance", JSON.stringify("dark"));
});
await page.reload({ waitUntil: "domcontentloaded" });
try {
  await page.waitForFunction(() => document.body.classList.contains("theme-dark"), null, {
    timeout: 8000,
  });
} catch {
  /* ignore */
}
report.persistence.darkAfterReload = await page.evaluate(() =>
  document.body.classList.contains("theme-dark")
);

const darkCtx = await browser.newContext({ colorScheme: "dark" });
const darkPage = await darkCtx.newPage();
await darkPage.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await darkPage.evaluate(() => localStorage.setItem("pulse.cc.appearance", JSON.stringify("system")));
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
  /* ignore */
}
report.persistence.osDarkSystem = await darkPage.evaluate(() => ({
  prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  themeDark: document.body.classList.contains("theme-dark"),
  appearance: JSON.parse(localStorage.getItem("pulse.cc.appearance") || "null"),
}));
await darkPage.screenshot({ path: join(AFTER, "system-osdark-dashboard-1440.png"), fullPage: false });
report.screenshots.push("system-osdark-dashboard-1440.png");
await darkCtx.close();

report.finishedAt = new Date().toISOString();
writeFileSync(join(OUT, "focused-contrast-proof.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(OUT, "contrast-summary.json"),
  JSON.stringify(
    {
      beforeDefectBaseline: {
        activeTabDark: { approx: 1.1 },
        brandStrongDark: { approx: 1.81 },
        darkBoundary: { approx: 1.42 },
        tealButtonDark: { approx: 3.68 },
        tealBadgeDark: { approx: 1.53 },
      },
      afterFocused: {
        light: {
          primaryTextOnCanvas: report.modes.light?.primaryTextOnCanvas,
          mutedOnSurface: report.modes.light?.mutedOnSurface?.contrast,
          onActionOnAction: report.modes.light?.onActionOnAction?.contrast,
          controlBorderOnSurface: report.modes.light?.controlBorderOnSurface?.contrast,
          activeTab: report.modes.light?.activeSample?.contrast,
          brand: report.modes.light?.brandSample?.contrast,
        },
        dark: {
          primaryTextOnCanvas: report.modes.dark?.primaryTextOnCanvas,
          mutedOnSurface: report.modes.dark?.mutedOnSurface?.contrast,
          onActionOnAction: report.modes.dark?.onActionOnAction?.contrast,
          controlBorderOnSurface: report.modes.dark?.controlBorderOnSurface?.contrast,
          activeTab: report.modes.dark?.activeSample?.contrast,
          brand: report.modes.dark?.brandSample?.contrast,
        },
      },
      persistence: report.persistence,
      tokens: {
        light: report.modes.light?.tokens,
        dark: report.modes.dark?.tokens,
      },
    },
    null,
    2
  )
);
console.log(JSON.stringify({ persistence: report.persistence, light: report.modes.light, dark: report.modes.dark }, null, 2));
await browser.close();
