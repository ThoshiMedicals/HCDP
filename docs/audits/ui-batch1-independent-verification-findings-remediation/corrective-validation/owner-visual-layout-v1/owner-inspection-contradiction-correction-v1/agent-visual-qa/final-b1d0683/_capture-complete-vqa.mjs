/**
 * Visual QA Agent — complete capture at frozen SHA b1d0683 against :3501
 * Evidence-only; does not modify src/ or scripts/.
 * Writes under agent-visual-qa/final-b1d0683/ (does not touch revalidation-b661b6c/).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("/tmp/hcdp-fix/ui-batch1-contradiction-v1/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
const CROPS = path.join(__dirname, "defect-crops");
const GEO = path.join(__dirname, "geometry");
const BASE = "http://127.0.0.1:3501";
const APP_SHA = "b1d0683057882546b68c73b1ae679630d8dbbcb8";
const WORKTREE = "/tmp/hcdp-fix/ui-batch1-contradiction-v1";

for (const d of [OUT, CROPS, GEO]) fs.mkdirSync(d, { recursive: true });

const sha = execSync("git rev-parse HEAD", { cwd: WORKTREE }).toString().trim();
const frozenOk = execSync(`git rev-parse ${APP_SHA}`, { cwd: WORKTREE }).toString().trim() === APP_SHA;
const diffBytes = execSync(`git diff ${APP_SHA} -- src scripts | wc -c`, { cwd: WORKTREE, shell: "/bin/bash" })
  .toString()
  .trim();

const M04 = [
  "overview","people","staff-profiles","doctor-profiles","engagements","credentials",
  "leave-availability","restrictions","onboarding","offboarding","reports","settings"
];
const M05 = [
  "roster-board","coverage","open-shifts","availability-leave","requests",
  "conflicts-warnings","published-history","cost-forecast","reports","settings"
];
const M06 = [
  "live","clock","timesheets","exceptions","corrections","approvals",
  "breaks","history","reports","settings"
];
const M07 = [
  "overview","people","leave","adjustments","exceptions","variances",
  "approval","export","reconciliation","history","settings"
];

function routesForModules() {
  const routes = ["/dashboard", "/action-inbox", "/settings"];
  for (const s of M04) routes.push(s === "overview" ? "/staff-doctors" : `/staff-doctors?section=${s}`);
  for (const s of M05) routes.push(s === "roster-board" ? "/roster" : `/roster?section=${s}`);
  for (const s of M06) routes.push(s === "live" ? "/time-attendance" : `/time-attendance?section=${s}`);
  for (const s of M07) routes.push(s === "overview" ? "/staffpay" : `/staffpay?section=${s}`);
  return routes;
}

const VIEWPORTS = [
  { w: 1440, h: 900, id: "1440x900" },
  { w: 1280, h: 900, id: "1280x900" },
  { w: 1024, h: 768, id: "1024x768" },
  { w: 768, h: 1024, id: "768x1024" },
  { w: 430, h: 932, id: "430x932" },
  { w: 390, h: 844, id: "390x844" },
];
const SHORT_VIEWPORTS = [
  { w: 1024, h: 600, id: "1024x600" },
  { w: 768, h: 500, id: "768x500" },
];
const MODES = ["light", "dark", "system"];

function slugRoute(route) {
  return route
    .replace(/^\//, "")
    .replace(/\?/g, "_")
    .replace(/=/g, "_")
    .replace(/&/g, "_")
    .replace(/\//g, "_") || "root";
}

function shotName(mode, vp, route, suffix = "") {
  return `${mode}-${vp.id}-${slugRoute(route)}${suffix}.png`;
}

async function setAppearanceViaUi(page, mode) {
  // Appearance select lives on dashboard ControlBar
  const current = page.url();
  if (!current.includes("/dashboard")) {
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(800);
  }
  const sel = page.locator('[aria-label="Appearance"]');
  if (await sel.count()) {
    await sel.selectOption(mode);
    await page.waitForTimeout(400);
  } else {
    // fallback
    await page.evaluate((m) => {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
    }, mode);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(800);
  }
  const resolved = await page.evaluate(() => ({
    dataAppearance: document.documentElement.getAttribute("data-appearance"),
    themeDark: document.documentElement.classList.contains("theme-dark"),
    stored: localStorage.getItem("pulse.cc.appearance"),
  }));
  return resolved;
}

async function gotoReady(page, route) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
}

async function ensureSidebarFooterVisible(page) {
  await page.evaluate(() => {
    const sidebar = document.querySelector("aside.pulse-sidebar");
    const footer = sidebar?.querySelector(".sidebar-user");
    if (footer) footer.scrollIntoView({ block: "end", inline: "nearest" });
    if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
  });
  await page.waitForTimeout(200);
}

async function probeMeaningfulControls(page) {
  return page.evaluate(() => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const interesting = /Refresh|Bulk approve|Request Correction|Clear Filter|Publish|Evaluate|Clinic|Create Draft|Offer|Create|Add|ACTIVE STAFF|ACTIVE DOCTORS|BLOCKED READINESS|ON LEAVE|Audience|Preferred name|Email|Ends on|Clinic id/i;

    const nodes = Array.from(
      document.querySelectorAll("button, a[href], input, select, textarea, [role='button']")
    );

    const hits = [];
    for (const el of nodes) {
      const label =
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("name") ||
        text(el).slice(0, 80) ||
        "";
      if (!label && el.tagName !== "INPUT") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      // skip off-document tiny
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;

      const outsideViewport =
        r.right > vpW + 1 || r.bottom > vpH + 1 || r.left < -1 || r.top < -1;
      const overflowsViewportX = r.right > vpW + 1;
      const overflowsViewportY = r.bottom > vpH + 1;

      let clippedByAncestor = false;
      let ancestorInfo = null;
      let n = el.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        const ox = cs.overflowX;
        const oy = cs.overflowY;
        const clips =
          ox === "hidden" || ox === "clip" || oy === "hidden" || oy === "clip" ||
          (ox === "auto" && oy === "hidden");
        if (clips || cs.overflow === "hidden") {
          const pr = n.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.bottom > pr.bottom + 1 || r.left < pr.left - 1) {
            // distinguish intentional scroll containers
            const scrollableX = n.scrollWidth > n.clientWidth + 2;
            const scrollableY = n.scrollHeight > n.clientHeight + 2;
            const intentionalScroll =
              (r.right > pr.right + 1 && scrollableX && (ox === "auto" || ox === "scroll")) ||
              (r.bottom > pr.bottom + 1 && scrollableY && (oy === "auto" || oy === "scroll"));
            if (!intentionalScroll) {
              clippedByAncestor = true;
              ancestorInfo = {
                tag: n.tagName,
                className: String(n.className || "").slice(0, 80),
                overflow: cs.overflow,
                overflowX: ox,
                overflowY: oy,
                rect: {
                  x: Math.round(pr.x),
                  y: Math.round(pr.y),
                  w: Math.round(pr.width),
                  h: Math.round(pr.height),
                },
              };
              break;
            }
          }
        }
        n = n.parentElement;
      }

      // content wider than element (truncation signal for buttons/labels)
      const truncated =
        (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) &&
        style.overflow !== "visible";

      const isHot = interesting.test(label) || interesting.test(text(el));
      if (outsideViewport || clippedByAncestor || (isHot && (overflowsViewportX || truncated))) {
        hits.push({
          tag: el.tagName.toLowerCase(),
          label: label.slice(0, 100),
          rect: {
            x: Math.round(r.x * 100) / 100,
            y: Math.round(r.y * 100) / 100,
            w: Math.round(r.width * 100) / 100,
            h: Math.round(r.height * 100) / 100,
            right: Math.round(r.right * 100) / 100,
            bottom: Math.round(r.bottom * 100) / 100,
          },
          flags: {
            outsideViewport,
            overflowsViewportX,
            overflowsViewportY,
            clippedByAncestor,
            truncated,
          },
          ancestorInfo,
          hot: isHot,
        });
      }
    }

    // shell probes
    const sidebar = document.querySelector("aside.pulse-sidebar");
    const footer = sidebar?.querySelector(".sidebar-user");
    const topbar = document.querySelector("header, .pulse-topbar, [data-testid='topbar']");
    const shell = {
      themeDark: document.documentElement.classList.contains("theme-dark"),
      dataAppearance: document.documentElement.getAttribute("data-appearance"),
      sidebar: sidebar
        ? {
            scrollHeight: sidebar.scrollHeight,
            clientHeight: sidebar.clientHeight,
            footerVisible: footer
              ? (() => {
                  const fr = footer.getBoundingClientRect();
                  return fr.bottom <= window.innerHeight + 2 && fr.top >= -2;
                })()
              : null,
          }
        : null,
      topbarH: topbar ? Math.round(topbar.getBoundingClientRect().height) : null,
    };

    return {
      viewport: { w: vpW, h: vpH },
      shell,
      hitCount: hits.length,
      hotHits: hits.filter((h) => h.hot),
      hits: hits.slice(0, 80),
    };
  });
}

async function captureFocusRing(page) {
  return page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => {
      const t = (b.textContent || "").trim();
      return t && b.offsetParent !== null;
    });
    if (!btn) return { ok: false, reason: "no-button" };
    btn.focus();
    const cs = getComputedStyle(btn);
    const outline = cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor;
    const ring = cs.boxShadow;
    const hasVisible =
      (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
      (ring && ring !== "none");
    return {
      ok: hasVisible,
      label: (btn.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      outline,
      boxShadow: ring.slice(0, 120),
    };
  });
}

/** VQA-C-001 topbar ribbon geometry for Export / + New Entry / Enterprise / Online */
async function probeTopbarRibbon(page) {
  return page.evaluate(() => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const ribbon =
      document.querySelector(".ribbon-right") ||
      document.querySelector("[data-testid='topbar']") ||
      document.querySelector("header");
    const buttons = Array.from((ribbon || document).querySelectorAll("button, a"));
    const findBtn = (re) =>
      buttons.find((b) => {
        const t = text(b);
        const al = b.getAttribute("aria-label") || "";
        return re.test(t) || re.test(al);
      });

    function describe(el, expectedHidden) {
      if (!el) {
        return { present: false, expectedHidden: !!expectedHidden };
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const displayNone = cs.display === "none";
      const visibilityHidden = cs.visibility === "hidden";
      const opacity0 = Number(cs.opacity) === 0;
      const zeroBox = r.width < 1 || r.height < 1;
      const visuallyHidden = displayNone || visibilityHidden || opacity0 || zeroBox;
      const clippedVp =
        !visuallyHidden &&
        (r.right > vpW + 1 || r.left < -1 || r.bottom > vpH + 1 || r.top < -1);
      const truncated =
        !visuallyHidden &&
        (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2);
      // scroll parent that could intentionally hold overflow
      let scrollParent = null;
      let n = el.parentElement;
      while (n && n !== document.body) {
        const ox = getComputedStyle(n).overflowX;
        if ((ox === "auto" || ox === "scroll") && n.scrollWidth > n.clientWidth + 2) {
          scrollParent = {
            className: String(n.className || "").slice(0, 80),
            scrollWidth: n.scrollWidth,
            clientWidth: n.clientWidth,
          };
          break;
        }
        n = n.parentElement;
      }
      return {
        present: true,
        label: text(el).slice(0, 80),
        ariaLabel: el.getAttribute("aria-label"),
        className: String(el.className || "").slice(0, 160),
        display: cs.display,
        visuallyHidden,
        expectedHidden: !!expectedHidden,
        x: Math.round(r.x * 100) / 100,
        w: Math.round(r.width * 100) / 100,
        right: Math.round(r.right * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        clippedVp,
        truncated,
        partiallyVisible:
          !visuallyHidden &&
          ((r.left < vpW && r.right > vpW + 1) || (r.left < -1 && r.right > 0)),
        inScrollParent: !!scrollParent,
        scrollParent,
      };
    }

    // Breakpoint expectations (Tailwind defaults): xl=1280, 2xl=1536
    const expectExportVisible = vpW >= 1280;
    const expectNewEntryVisible = vpW >= 1280;
    const expectEnterpriseVisible = vpW >= 1536;

    const exportBtn = findBtn(/^Export$/);
    const newEntry = findBtn(/^\+?\s*New Entry$/);
    const enterprise = findBtn(/Enterprise Sign-In/);
    const online = findBtn(/^(Online|Offline)$/) || findBtn(/Online|Offline/);

    const Export = describe(exportBtn, !expectExportVisible);
    const NewEntry = describe(newEntry, !expectNewEntryVisible);
    const Enterprise = describe(enterprise, !expectEnterpriseVisible);
    const Online = describe(online, false);

    const passExport =
      expectExportVisible
        ? Export.present && !Export.visuallyHidden && !Export.clippedVp && !Export.truncated && Export.label === "Export"
        : !Export.present || Export.visuallyHidden || Export.display === "none";
    const passNewEntry =
      expectNewEntryVisible
        ? NewEntry.present && !NewEntry.visuallyHidden && !NewEntry.clippedVp
        : !NewEntry.present || NewEntry.visuallyHidden || NewEntry.display === "none";
    const passEnterprise =
      expectEnterpriseVisible
        ? Enterprise.present && !Enterprise.visuallyHidden && !Enterprise.clippedVp
        : !Enterprise.present || Enterprise.visuallyHidden || Enterprise.display === "none";
    const passOnline =
      Online.present && !Online.visuallyHidden && !Online.clippedVp && !Online.truncated && Online.right <= vpW + 1;

    return {
      w: vpW,
      h: vpH,
      expectations: {
        exportVisible: expectExportVisible,
        newEntryVisible: expectNewEntryVisible,
        enterpriseVisible: expectEnterpriseVisible,
        onlineVisible: true,
      },
      Export,
      NewEntry,
      Enterprise,
      Online,
      verdict: {
        passExport,
        passNewEntry,
        passEnterprise,
        passOnline,
        passAll: passExport && passNewEntry && passEnterprise && passOnline,
      },
    };
  });
}

// Critical prior-fail combinations that MUST be re-captured
const CRITICAL = [
  { route: "/staff-doctors", w: 430, h: 932, note: "KPI buttons" },
  { route: "/staff-doctors?section=people", w: 430, h: 932, note: "form controls" },
  { route: "/staff-doctors?section=credentials", w: 430, h: 932, note: "credentials form" },
  { route: "/roster?section=open-shifts", w: 390, h: 844, note: "open-shifts mobile" },
  { route: "/roster?section=open-shifts", w: 430, h: 932, note: "open-shifts mobile" },
  { route: "/roster?section=coverage", w: 1024, h: 768, note: "Evaluate coverage" },
  { route: "/roster?section=availability-leave", w: 1024, h: 768, note: "availability" },
  { route: "/roster?section=conflicts-warnings", w: 1024, h: 768, note: "conflicts Evaluate" },
  { route: "/roster?section=settings", w: 1024, h: 768, note: "Create Draft" },
  { route: "/roster", w: 1024, h: 768, note: "Clinic/Create period" },
  { route: "/time-attendance", w: 1024, h: 768, note: "Refresh" },
  { route: "/time-attendance", w: 1280, h: 900, note: "Refresh" },
  { route: "/time-attendance", w: 1440, h: 900, note: "Refresh" },
  { route: "/time-attendance?section=approvals", w: 1024, h: 768, note: "Bulk Approve" },
  { route: "/time-attendance?section=approvals", w: 1280, h: 900, note: "Bulk Approve" },
  { route: "/time-attendance?section=approvals", w: 1440, h: 900, note: "Bulk Approve" },
  { route: "/time-attendance?section=corrections", w: 1024, h: 768, note: "Request Correction" },
  { route: "/time-attendance?section=history", w: 1024, h: 768, note: "Clear Filter" },
  { route: "/time-attendance?section=settings", w: 1024, h: 768, note: "Publish" },
];

const allRoutes = routesForModules();

const jobs = [];
// Full matrix: all routes × primary viewports × modes
for (const mode of MODES) {
  for (const vp of VIEWPORTS) {
    for (const route of allRoutes) {
      jobs.push({
        mode,
        vp,
        route,
        footer: route === "/dashboard" && (vp.w >= 1024 || vp.id.includes("x600") || vp.id.includes("x500")),
        critical: CRITICAL.some((c) => c.route === route && c.w === vp.w),
        tier: "matrix",
      });
    }
  }
}
// Short-height shell checks
for (const mode of MODES) {
  for (const vp of SHORT_VIEWPORTS) {
    jobs.push({
      mode,
      vp,
      route: "/dashboard",
      footer: true,
      critical: true,
      tier: "shell-short",
      topbarProbe: true,
    });
    jobs.push({
      mode,
      vp,
      route: "/staff-doctors",
      footer: true,
      critical: false,
      tier: "shell-short",
      topbarProbe: true,
    });
  }
}

// VQA-C-001: 1536 (=2xl) is outside primary matrix — capture dedicated proof set.
// 1024/1280/1440 topbar probes ride on the primary matrix (see mark loop below).
const VQA_C001_EXTRA_VP = { w: 1536, h: 900, id: "1536x900" };
const VQA_C001_ROUTES = [
  "/dashboard",
  "/roster",
  "/roster?section=coverage",
  "/time-attendance",
  "/time-attendance?section=settings",
  "/staff-doctors",
];
for (const mode of MODES) {
  for (const route of VQA_C001_ROUTES) {
    jobs.push({
      mode,
      vp: VQA_C001_EXTRA_VP,
      route,
      footer: route === "/dashboard",
      critical: true,
      tier: "vqa-c001",
      topbarProbe: true,
    });
  }
}

// Mark matrix / short-shell jobs for topbar probe at VQA-C-001 widths
for (const job of jobs) {
  if ([1024, 1280, 1440].includes(job.vp.w) && VQA_C001_ROUTES.includes(job.route)) {
    job.topbarProbe = true;
  }
  if (job.tier === "shell-short") job.topbarProbe = true;
}

console.log(
  JSON.stringify(
    {
      appShaExpected: APP_SHA,
      headSha: sha,
      frozenOk,
      srcScriptsDiffBytes: Number(diffBytes),
      routeCount: allRoutes.length,
      jobCount: jobs.length,
      base: BASE,
    },
    null,
    2
  )
);

const WORKERS = 3;
const chunkSize = Math.ceil(jobs.length / WORKERS);
const chunks = Array.from({ length: WORKERS }, (_, i) => jobs.slice(i * chunkSize, (i + 1) * chunkSize));

async function runChunk(chunk, workerId) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    deviceScaleFactor: 1, // original screenshot resolution — do not downscale
    reducedMotion: "reduce",
  });
  // system mode: emulate prefers-color-scheme dark for one pass visibility
  const page = await context.newPage();
  const captures = [];
  let currentMode = null;

  for (let i = 0; i < chunk.length; i++) {
    const job = chunk[i];
    try {
      await page.setViewportSize({ width: job.vp.w, height: job.vp.h });
      // System mode resolves via prefers-color-scheme; emulate OS dark for visibility of dark tokens.
      await page.emulateMedia({
        colorScheme: job.mode === "light" ? "light" : "dark",
      });

      if (currentMode !== job.mode) {
        await setAppearanceViaUi(page, job.mode);
        currentMode = job.mode;
      }

      await gotoReady(page, job.route);
      // ensure appearance still applied after navigation
      const appearanceState = await page.evaluate((m) => {
        const stored = localStorage.getItem("pulse.cc.appearance");
        if (!stored || JSON.parse(stored) !== m) {
          localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
          return { neededReload: true };
        }
        // re-apply class for safety without full reload when possible
        const dark =
          m === "dark" ||
          (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("theme-dark", dark);
        document.body?.classList.toggle("theme-dark", dark);
        document.documentElement.setAttribute("data-appearance", m);
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
        return { neededReload: false, dark };
      }, job.mode);
      if (appearanceState.neededReload) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(900);
      }

      if (job.footer) await ensureSidebarFooterVisible(page);

      const name = shotName(job.mode, job.vp, job.route);
      const shotPath = path.join(OUT, name);
      await page.screenshot({ path: shotPath, fullPage: false });
      const screenshotBytes = fs.statSync(shotPath).size;

      const probe = await probeMeaningfulControls(page);
      let topbar = null;
      if (job.topbarProbe || job.tier === "vqa-c001") {
        topbar = await probeTopbarRibbon(page);
      }
      let focus = null;
      if (job.critical || job.route === "/dashboard") {
        focus = await captureFocusRing(page);
      }

      // crop hot clipped regions for critical jobs
      const crops = [];
      if (job.critical && probe.hotHits?.length) {
        for (const hit of probe.hotHits.slice(0, 4)) {
          const clip = {
            x: Math.max(0, hit.rect.x - 8),
            y: Math.max(0, hit.rect.y - 8),
            width: Math.min(job.vp.w - Math.max(0, hit.rect.x - 8), hit.rect.w + 16),
            height: Math.min(job.vp.h - Math.max(0, hit.rect.y - 8), hit.rect.h + 16),
          };
          if (clip.width >= 2 && clip.height >= 2) {
            const cropName = `crop-${job.mode}-${job.vp.id}-${slugRoute(job.route)}-${hit.tag}-${(hit.label || "x")
              .replace(/\W+/g, "_")
              .slice(0, 40)}.png`;
            await page.screenshot({ path: path.join(CROPS, cropName), clip });
            crops.push(cropName);
          }
        }
      }

      // VQA-C-001 proof crops (topbar right edge) — dashboard primary per mode×width
      if (topbar && job.route === "/dashboard" && [1024, 1280, 1440, 1536].includes(job.vp.w)) {
        const topH = Math.min(72, job.vp.h);
        const cropName = `VQA-C-001-${job.mode}-${job.vp.id}-topbar-right.png`;
        await page.screenshot({
          path: path.join(CROPS, cropName),
          clip: {
            x: Math.max(0, job.vp.w - Math.min(520, job.vp.w)),
            y: 0,
            width: Math.min(520, job.vp.w),
            height: topH,
          },
        });
        crops.push(cropName);
        const stripName = `VQA-C-001-${job.mode}-${job.vp.id}-topbar-full.png`;
        await page.screenshot({
          path: path.join(CROPS, stripName),
          clip: { x: 0, y: 0, width: job.vp.w, height: topH },
        });
        crops.push(stripName);
      }

      const rec = {
        workerId,
        mode: job.mode,
        viewport: job.vp,
        route: job.route,
        tier: job.tier,
        critical: job.critical,
        screenshot: name,
        screenshotBytes,
        finalUrl: page.url(),
        probe,
        topbar,
        focus,
        crops,
        deviceScaleFactor: 1,
      };
      captures.push(rec);
      if ((i + 1) % 25 === 0 || job.critical || topbar) {
        const tv = topbar?.verdict?.passAll;
        console.log(
          `[w${workerId}] ${i + 1}/${chunk.length} ${name} hits=${probe.hitCount} hot=${probe.hotHits.length} topbarPass=${tv}`
        );
      }
    } catch (err) {
      captures.push({
        workerId,
        mode: job.mode,
        viewport: job.vp,
        route: job.route,
        error: String(err?.message || err),
      });
      console.error(`[w${workerId}] FAIL`, job.route, job.vp.id, job.mode, err?.message);
    }
  }

  await browser.close();
  return captures;
}

const started = Date.now();
const results = (await Promise.all(chunks.map((c, i) => runChunk(c, i)))).flat();
const elapsedMs = Date.now() - started;

const meta = {
  appSha: APP_SHA,
  headSha: sha,
  frozenOk,
  srcScriptsDiffBytes: Number(diffBytes),
  base: BASE,
  capturedAt: new Date().toISOString(),
  elapsedMs,
  deviceScaleFactor: 1,
  adjudicationResolutionNote:
    "Screenshots captured at original viewport CSS pixels with deviceScaleFactor=1 (no downscale).",
  routeCount: allRoutes.length,
  routes: allRoutes,
  viewportCount: VIEWPORTS.length + SHORT_VIEWPORTS.length,
  modes: MODES,
  jobCount: jobs.length,
  captureCount: results.filter((r) => r.screenshot).length,
  errorCount: results.filter((r) => r.error).length,
};

fs.writeFileSync(path.join(GEO, "manifest.json"), JSON.stringify({ meta, results }, null, 2));
fs.writeFileSync(path.join(__dirname, "CAPTURE_META.json"), JSON.stringify(meta, null, 2));

// Aggregate hot/clipped signals for adjudication aid
const signals = [];
for (const r of results) {
  if (!r.probe) continue;
  for (const h of r.probe.hotHits || []) {
    if (h.flags.outsideViewport || h.flags.clippedByAncestor || h.flags.overflowsViewportX) {
      signals.push({
        mode: r.mode,
        viewport: r.viewport.id,
        route: r.route,
        screenshot: r.screenshot,
        label: h.label,
        tag: h.tag,
        flags: h.flags,
        rect: h.rect,
      });
    }
  }
}
fs.writeFileSync(path.join(GEO, "clip-signals.json"), JSON.stringify({ count: signals.length, signals }, null, 2));

// Aggregate VQA-C-001 topbar probes
const topbarFindings = [];
for (const r of results) {
  if (!r.topbar) continue;
  topbarFindings.push({
    mode: r.mode,
    viewport: r.viewport.id,
    route: r.route,
    screenshot: r.screenshot,
    ...r.topbar,
  });
}
const topbarFails = topbarFindings.filter((t) => !t.verdict?.passAll);
fs.writeFileSync(
  path.join(GEO, "topbar-export-probe.json"),
  JSON.stringify(
    {
      appSha: APP_SHA,
      count: topbarFindings.length,
      failCount: topbarFails.length,
      findings: topbarFindings,
      fails: topbarFails,
    },
    null,
    2
  )
);

// Prior-defect surface reprobe (geometry aid for the known 110 clipping surfaces)
const priorReprobe = results
  .filter((r) => r.critical && r.probe)
  .map((r) => ({
    mode: r.mode,
    viewport: r.viewport.id,
    route: r.route,
    screenshot: r.screenshot,
    hitCount: r.probe.hitCount,
    hotHits: r.probe.hotHits,
    badHot: (r.probe.hotHits || []).filter(
      (h) => h.flags.outsideViewport || h.flags.clippedByAncestor || h.flags.overflowsViewportX
    ),
  }));
fs.writeFileSync(
  path.join(GEO, "prior-defect-reprobe.json"),
  JSON.stringify(
    {
      count: priorReprobe.length,
      stillBad: priorReprobe.filter((p) => p.badHot.length > 0),
      stillBadCount: priorReprobe.filter((p) => p.badHot.length > 0).length,
      rows: priorReprobe,
    },
    null,
    2
  )
);

console.log(
  "DONE",
  JSON.stringify({
    captures: meta.captureCount,
    errors: meta.errorCount,
    signals: signals.length,
    topbarProbes: topbarFindings.length,
    topbarFails: topbarFails.length,
    elapsedMs,
    out: OUT,
  })
);
