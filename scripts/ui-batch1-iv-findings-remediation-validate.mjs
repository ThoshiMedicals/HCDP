/**
 * UI Batch 1 — independent-verification findings remediation validation.
 * Evidence ONLY under:
 *   docs/audits/ui-batch1-independent-verification-findings-remediation/
 *
 *   HCDP_BASE_URL=http://localhost:3470 node scripts/ui-batch1-iv-findings-remediation-validate.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3470";
const OUT = join(
  process.cwd(),
  "docs/audits/ui-batch1-independent-verification-findings-remediation"
);
const SHOTS = join(OUT, "screenshots");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(join(OUT, "logs"), { recursive: true });

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

const SECTION_SWEEP = [
  ...M04.map((s) => `/staff-doctors?section=${s}`),
  ...M05.map((s) => `/roster?section=${s}`),
  ...M06.map((s) => `/time-attendance?section=${s}`),
  ...M07.map((s) => `/staffpay?section=${s}`),
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

function write(name, data) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2));
}

async function goto(page, route, timeout = 90000) {
  const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout });
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    /* settle */
  }
  await page.waitForTimeout(200);
  return res;
}

/** Persist appearance via storage only — reload must pick up theme-init on <html>. */
async function persistAppearance(page, mode) {
  await page.evaluate((m) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
  }, mode);
}

async function pageProbe(page) {
  return page.evaluate(() => {
    function parseRgba(input) {
      if (!input) return null;
      const s = String(input).trim();
      if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
      const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([.\d]+))?/i);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
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
      let node = el;
      while (node && node.nodeType === 1) {
        const parsed = parseRgba(getComputedStyle(node).backgroundColor);
        if (parsed && parsed.a > 0) {
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
        acc = blend(acc.a > 0 ? acc : { r: 0, g: 0, b: 0, a: 0 }, { ...body, a: 1 });
      }
      return { r: acc.r, g: acc.g, b: acc.b };
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
      return Number(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2));
    }

    const htmlDark = document.documentElement.classList.contains("theme-dark");
    const bodyDark = document.body.classList.contains("theme-dark");
    const appearance = document.documentElement.dataset.appearance || null;
    const issues = [];

    // Typography / contrast for nav toggles + favourites
    for (const el of document.querySelectorAll(".v32-nav-toggle, .v33-fav-star")) {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
      const visible =
        cs.opacity !== "0" &&
        cs.visibility !== "hidden" &&
        cs.display !== "none" &&
        el.getBoundingClientRect().width > 0;
      if (el.classList.contains("v32-nav-toggle") || el.classList.contains("is-fav") || visible) {
        if (fontSize + 0.01 < 13) {
          issues.push({
            kind: "typography-control-below-13",
            selector: el.className,
            fontSize,
            text: text.slice(0, 40),
          });
        }
      }
      if (el.classList.contains("v33-fav-star") && (el.classList.contains("is-fav") || visible)) {
        const fgP = parseRgba(cs.color);
        const bg = effectiveBackground(el);
        const fg = fgP ? { r: fgP.r, g: fgP.g, b: fgP.b } : null;
        const ratio = contrastRatio(fg, bg);
        const required = fontSize < 13 ? 4.5 : 3; // icon ≥3:1; small text still 4.5
        if (ratio != null && ratio < required) {
          issues.push({
            kind: "fav-contrast",
            ratio,
            required,
            fontSize,
            fg: cs.color,
            bg: `rgb(${bg.r},${bg.g},${bg.b})`,
            text: text.slice(0, 20),
          });
        }
      }
    }

    // Helper / form / table text using type-control or text-xs remap should be ≥13
    const helperNodes = document.querySelectorAll(
      ".module-section-nav__select-caption, .module-section-nav__badge, .cc-chip, .cc-demo-banner, .cc-layer-label, label, th, .v27-sidebar-role p, .v27-sidebar-role select"
    );
    for (const el of helperNodes) {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const text = (el.innerText || "").trim();
      if (!text) continue;
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      if (fontSize + 0.01 < 13) {
        issues.push({
          kind: "typography-helper-below-13",
          tag: el.tagName,
          className: String(el.className).slice(0, 80),
          fontSize,
          text: text.slice(0, 40),
        });
      }
    }

    // Near-white surfaces in dark mode
    if (htmlDark) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let n = 0;
      while (walker.nextNode() && n < 400) {
        const el = walker.currentNode;
        if (!(el instanceof HTMLElement)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 24 || rect.height < 16) continue;
        const bg = effectiveBackground(el);
        const lum = relLuminance(bg);
        // Near-white leak: luminance high while page is dark-themed
        if (lum >= 0.9) {
          const cls = String(el.className || "");
          if (/pulse-sidebar|sr-only|hidden/.test(cls)) continue;
          issues.push({
            kind: "light-surface-leak",
            background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
            className: cls.slice(0, 120),
            tag: el.tagName.toLowerCase(),
          });
          n += 20; // sample sparsely
        }
        n++;
      }
    }

    // Overflow / clipping sample
    const overflowHits = [];
    for (const el of document.querySelectorAll("button, a, .module-section-nav__tab, .v32-nav-toggle")) {
      const cs = getComputedStyle(el);
      if (cs.overflow === "hidden" && el.scrollWidth > el.clientWidth + 2) {
        overflowHits.push({
          kind: "overflow-clip",
          text: (el.innerText || "").trim().slice(0, 40),
          className: String(el.className).slice(0, 80),
        });
      }
    }

    // Focused token probes
    const styles = getComputedStyle(document.body);
    const rootStyles = getComputedStyle(document.documentElement);
    const ink = parseRgba(styles.getPropertyValue("--ink") || styles.color);
    const canvas = parseRgba(styles.getPropertyValue("--soft") || styles.backgroundColor);
    const card = parseRgba(styles.getPropertyValue("--card"));
    const muted = parseRgba(styles.getPropertyValue("--muted"));

    return {
      htmlDark,
      bodyDark,
      appearance,
      colorScheme: rootStyles.colorScheme,
      issues,
      overflowHits: overflowHits.slice(0, 20),
      sidebarCount: document.querySelectorAll(".pulse-sidebar").length,
      bootstrapStatus: document.querySelector("[data-m07-bootstrap-status]")?.textContent || null,
      tokens: {
        ink: ink && `rgb(${ink.r},${ink.g},${ink.b})`,
        canvas: canvas && `rgb(${canvas.r},${canvas.g},${canvas.b})`,
        card: card && `rgb(${card.r},${card.g},${card.b})`,
        muted: muted && `rgb(${muted.r},${muted.g},${muted.b})`,
      },
    };
  });
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const consoleBag = [];
  const hydration = [];
  const matrix = [];
  const issuesAll = [];
  const appearanceResults = {};

  // --- Appearance persistence (clean storage → light; dark/light reload; system) ---
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    page.on("console", (msg) => {
      const text = msg.text();
      if (/hydration|did not match|Text content does not match/i.test(text)) {
        hydration.push({ phase: "appearance", text: text.slice(0, 1200) });
      }
      if (msg.type() === "error") consoleBag.push({ phase: "appearance", text: text.slice(0, 500) });
    });
    page.on("pageerror", (err) =>
      consoleBag.push({ phase: "appearance-pageerror", text: String(err).slice(0, 500) })
    );

    await ctx.clearCookies();
    await goto(page, "/dashboard");
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    let probe = await pageProbe(page);
    appearanceResults.cleanDefault = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false,
    };

    await persistAppearance(page, "dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    appearanceResults.darkReload = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === true && probe.appearance === "dark",
    };
    await page.screenshot({ path: join(SHOTS, "persist-dark-reload.png"), fullPage: false });

    await persistAppearance(page, "light");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    appearanceResults.lightReload = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false && probe.appearance === "light",
    };

    await persistAppearance(page, "system");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    appearanceResults.systemOsLight = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false && probe.appearance === "system",
    };
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await goto(page, "/dashboard");
    await persistAppearance(page, "system");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const probe = await pageProbe(page);
    appearanceResults.systemOsDark = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === true && probe.appearance === "system",
    };
    await page.screenshot({ path: join(SHOTS, "persist-system-os-dark.png"), fullPage: false });

    // OS preference change while System selected
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(300);
    // Dispatch change via matchMedia listeners by re-applying through storage helper if present
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
    });
    // Force re-read by toggling via in-app if available, else rely on subscribeSystemAppearance via reload
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const after = await pageProbe(page);
    appearanceResults.systemOsChangeToLight = {
      htmlDark: after.htmlDark,
      appearance: after.appearance,
      pass: after.htmlDark === false && after.appearance === "system",
    };
    await ctx.close();
  }

  // --- Matrix (same route subset as IV; system at 1440/390) ---
  for (const width of WIDTHS) {
    const appearances =
      width === 1440 || width === 390 ? ["light", "dark", "system"] : ["light", "dark"];
    for (const appearance of appearances) {
      const colorScheme =
        appearance === "dark" ? "dark" : appearance === "system" ? "light" : "light";
      const ctx = await browser.newContext({
        viewport: { width, height: width <= 430 ? 844 : 900 },
        colorScheme,
      });
      const page = await ctx.newPage();
      page.on("console", (msg) => {
        const text = msg.text();
        if (/hydration|did not match|Text content does not match/i.test(text)) {
          hydration.push({ appearance, width, text: text.slice(0, 1500) });
        }
        if (msg.type() === "error" && !/404|favicon/i.test(text)) {
          consoleBag.push({ appearance, width, text: text.slice(0, 400) });
        }
      });
      page.on("pageerror", (err) =>
        consoleBag.push({ appearance, width, pageerror: String(err).slice(0, 400) })
      );

      await goto(page, "/dashboard");
      await persistAppearance(page, appearance);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);

      for (const route of MATRIX_ROUTES) {
        const res = await goto(page, route);
        const status = res?.status() ?? 0;
        const probe = await pageProbe(page);
        const entryIssues = probe.issues.map((i) => ({
          ...i,
          route,
          appearance,
          width,
        }));
        issuesAll.push(...entryIssues);
        const fail =
          status >= 400 ||
          entryIssues.some((i) =>
            ["typography-control-below-13", "fav-contrast", "light-surface-leak"].includes(i.kind)
          );
        matrix.push({
          route,
          appearance,
          width,
          status,
          htmlDark: probe.htmlDark,
          sidebarCount: probe.sidebarCount,
          issueCount: entryIssues.length,
          overflow: probe.overflowHits.length,
          fail,
        });

        if (
          (route === "/dashboard" ||
            route === "/settings" ||
            route === "/action-inbox" ||
            route === "/staffpay?section=overview" ||
            route === "/staffpay?section=adjustments") &&
          (width === 1440 || width === 390) &&
          (appearance === "light" || appearance === "dark")
        ) {
          const slug = `${appearance}-${width}-${route.replace(/[/?=&]/g, "_")}`;
          await page.screenshot({ path: join(SHOTS, `${slug}.png`), fullPage: false });
        }
      }
      await ctx.close();
    }
  }

  // Section sweep @1440 light + dark for leaks/hydration surfaces
  for (const appearance of ["light", "dark"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: appearance === "dark" ? "dark" : "light",
    });
    const page = await ctx.newPage();
    page.on("console", (msg) => {
      const text = msg.text();
      if (/hydration|did not match/i.test(text)) {
        hydration.push({ phase: "section-sweep", appearance, text: text.slice(0, 1500) });
      }
    });
    await goto(page, "/dashboard");
    await persistAppearance(page, appearance);
    await page.reload({ waitUntil: "domcontentloaded" });
    for (const route of SECTION_SWEEP) {
      const res = await goto(page, route);
      const probe = await pageProbe(page);
      const entryIssues = probe.issues
        .filter((i) =>
          ["typography-control-below-13", "fav-contrast", "light-surface-leak"].includes(i.kind)
        )
        .map((i) => ({ ...i, route, appearance, width: 1440, sweep: true }));
      issuesAll.push(...entryIssues);
      matrix.push({
        route,
        appearance,
        width: 1440,
        status: res?.status() ?? 0,
        htmlDark: probe.htmlDark,
        sidebarCount: probe.sidebarCount,
        issueCount: entryIssues.length,
        overflow: probe.overflowHits.length,
        fail: entryIssues.length > 0 || (res?.status() ?? 0) >= 400,
        sweep: true,
      });
    }
    await ctx.close();
  }

  // --- M07 hydration focused (all sections, light+dark) ---
  const hydrationM07 = [];
  for (const appearance of ["light", "dark"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: appearance === "dark" ? "dark" : "light",
    });
    const page = await ctx.newPage();
    const localHydration = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (/hydration|did not match/i.test(text)) localHydration.push(text.slice(0, 2000));
    });
    await goto(page, "/staffpay?section=overview");
    await persistAppearance(page, appearance);
    await page.reload({ waitUntil: "domcontentloaded" });
    for (const section of M07) {
      localHydration.length = 0;
      await goto(page, `/staffpay?section=${section}`);
      await page.waitForTimeout(300);
      hydrationM07.push({
        section,
        appearance,
        hydrationCount: localHydration.length,
        samples: localHydration.slice(0, 2),
        bootstrap: await page.locator("[data-m07-bootstrap-status]").count(),
      });
    }
    await ctx.close();
  }

  // --- Adjustments first-hit probes ---
  const firstHit = [];
  for (let run = 0; run < 3; run++) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text().slice(0, 300));
    });
    page.on("pageerror", (err) => errors.push(String(err).slice(0, 300)));
    const t0 = Date.now();
    const res = await goto(page, "/staffpay?section=adjustments", 120000);
    firstHit.push({
      attempt: run + 1,
      status: res?.status() ?? 0,
      ms: Date.now() - t0,
      jsonParseErrors: errors.filter((e) => /Unexpected end of JSON/i.test(e)),
      consoleErrors: errors.slice(0, 8),
    });
    await ctx.close();
  }

  // Clean-server style: fresh contexts after waiting (warm server)
  const firstHitWarm = [];
  for (let run = 0; run < 3; run++) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text().slice(0, 300));
    });
    const t0 = Date.now();
    const res = await page.goto(BASE + "/staffpay?section=adjustments", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    firstHitWarm.push({
      attempt: run + 1,
      status: res?.status() ?? 0,
      ms: Date.now() - t0,
      jsonParseErrors: errors.filter((e) => /Unexpected end of JSON/i.test(e)),
      consoleErrors: errors.slice(0, 8),
    });
    await ctx.close();
  }

  await browser.close();

  const summary = {
    base: BASE,
    matrixEntries: matrix.length,
    matrixFail: matrix.filter((m) => m.fail).length,
    issueTotals: issuesAll.reduce((acc, i) => {
      acc[i.kind] = (acc[i.kind] || 0) + 1;
      return acc;
    }, {}),
    appearanceResults,
    appearanceAllPass: Object.values(appearanceResults).every((r) => r.pass),
    hydrationSignatures: hydration.length,
    hydrationM07Fail: hydrationM07.filter((h) => h.hydrationCount > 0).length,
    firstHit,
    firstHitWarm,
    firstHitAll200: [...firstHit, ...firstHitWarm].every((x) => x.status === 200),
    consoleErrorCount: consoleBag.length,
  };

  write("browser-validation-report.json", { summary, matrix });
  write("issues.json", issuesAll);
  write("issue-samples.json", {
    typography: issuesAll.filter((i) => i.kind.includes("typography")).slice(0, 20),
    favContrast: issuesAll.filter((i) => i.kind === "fav-contrast").slice(0, 20),
    leaks: issuesAll.filter((i) => i.kind === "light-surface-leak").slice(0, 20),
  });
  write("appearance-persistence.json", appearanceResults);
  write("hydration.json", { hydration, hydrationM07 });
  write("cold-adjustments.json", { firstHit, firstHitWarm });
  write("console-bag.json", consoleBag.slice(0, 100));
  write("summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
