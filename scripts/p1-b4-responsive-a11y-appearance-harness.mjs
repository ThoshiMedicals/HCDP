/**
 * P1-B4 responsive / a11y / appearance / reduced-motion acceptance harness.
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3000 node scripts/p1-b4-responsive-a11y-appearance-harness.mjs
 *   HCDP_EVIDENCE_RUNTIME=production|development (label only; default production)
 *
 * Exit non-zero if any required assertion fails.
 * LOCAL evidence only — do not claim GitHub CI, WCAG certification, pixel parity, or production approval.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
const RUNTIME = process.env.HCDP_EVIDENCE_RUNTIME || "production";
if (/127\.0\.0\.1/.test(BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b4-responsive-a11y-appearance");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [
  { name: "1440", w: 1440, h: 900, class: "desktop" },
  { name: "1280", w: 1280, h: 900, class: "desktop" },
  { name: "1024", w: 1024, h: 768, class: "tablet" },
  { name: "768", w: 768, h: 1024, class: "tablet" },
  { name: "430", w: 430, h: 932, class: "mobile" },
  { name: "390", w: 390, h: 844, class: "mobile" },
];

const APPEARANCES = [
  { id: "light", appearance: "light", colorScheme: "light", expectDark: false },
  { id: "dark", appearance: "dark", colorScheme: "dark", expectDark: true },
  { id: "system-os-light", appearance: "system", colorScheme: "light", expectDark: false },
  { id: "system-os-dark", appearance: "system", colorScheme: "dark", expectDark: true },
];

const PRIMARY_ROUTES = [
  {
    path: "/dashboard",
    id: "dashboard",
    ready: /Command Centre|Owner\/Director|MODULE 1/i,
    required: ["shell-nav", "topbar", "main-pane"],
  },
  {
    path: "/action-inbox",
    id: "action-inbox",
    ready: /Demonstration mode|My Actions|Couldn.?t load Action Inbox|No actions/i,
    required: ["shell-nav", "topbar", "main-pane"],
    notLoading: /Loading your actions/i,
  },
];

const CONSUMER_ROUTES = [
  { path: "/dashboard?qaDemo=1", id: "b2-demo-honesty", ready: /Command Centre|QA \/ Demo|Demonstration/i },
  { path: "/training", id: "b3-m11-nav", ready: /Training|Overview|Course Catalogue/i },
  { path: "/staffpay?section=history", id: "b3-m07-history", ready: /History|Planned|not yet available|not operational/i },
  { path: "/staffpay?section=adjustments", id: "b3-m07-adjustments", ready: /Adjustments|Adjustment/i },
  { path: "/staff", id: "hydrate-m04", ready: /Staff|Doctor|Workforce|People/i },
  { path: "/roster", id: "hydrate-m05", ready: /Roster|Schedule|Shift/i },
  { path: "/staffpay", id: "hydrate-m07", ready: /Staff Pay|Payroll|Overview|People Review/i },
];

const assertions = [];
const shots = [];
const hydrationLog = [];
let failures = 0;

function record(ok, id, reason, meta = {}) {
  assertions.push({ ok, id, reason, ...meta });
  if (!ok) {
    failures += 1;
    console.error(`FAIL [${id}]: ${reason}`);
  } else {
    console.log(`PASS [${id}]: ${reason}`);
  }
}

function expectSidebarWidth(width) {
  if (width < 768) return 240;
  if (width < 1280) return 72;
  return 240;
}

async function shot(page, name) {
  const file = `${name}.png`;
  const path = join(SHOTS, file);
  await page.screenshot({ path, fullPage: false });
  if (!existsSync(path) || statSync(path).size < 1024) {
    record(false, `shot/${name}`, `Screenshot missing or too small: ${name}`);
  } else {
    shots.push({ file, runtime: RUNTIME, bytes: statSync(path).size });
  }
  return file;
}

async function seedAppearance(context, appearance) {
  await context.addInitScript((value) => {
    try {
      localStorage.setItem("pulse.cc.appearance", JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, appearance);
}

function transitionNearZero(sample) {
  if (!sample) return true;
  return sample.split(",").every((part) => {
    const n = parseFloat(part);
    return Number.isFinite(n) && n <= 0.05;
  });
}

async function auditShell(page, width) {
  return page.evaluate((expectedWidth) => {
    const sidebar = document.querySelector('[data-testid="shell-sidebar"], .pulse-sidebar');
    const topbar = document.querySelector('[data-testid="shell-topbar"], .pulse-top-ribbon');
    const menu = document.querySelector('[data-testid="shell-mobile-menu"]');
    const overlay = document.querySelector('[data-testid="shell-mobile-nav-overlay"]');
    const sb = sidebar?.getBoundingClientRect() ?? null;
    const tb = topbar?.getBoundingClientRect() ?? null;
    const mb = menu?.getBoundingClientRect() ?? null;
    const cs = getComputedStyle(document.documentElement);
    const regions = {};
    for (const r of ["shell-nav", "topbar", "main-pane", "module-title-tabs", "detail-pane", "toolbar"]) {
      regions[r] = document.querySelectorAll(`[data-shell-region="${r}"]`).length;
    }
    const docOverflowX =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const transitionSample = sidebar ? getComputedStyle(sidebar).transitionDuration : null;
    const overlayCs = overlay ? getComputedStyle(overlay) : null;
    const sidebarCs = sidebar ? getComputedStyle(sidebar) : null;
    return {
      sidebarWidth: sb ? Math.round(sb.width) : null,
      sidebarLeft: sb ? Math.round(sb.left) : null,
      sidebarRight: sb ? Math.round(sb.right) : null,
      sidebarVisible:
        sb != null && sb.width > 1 && sb.right > 0 && sb.left < window.innerWidth && sb.right > 8,
      sidebarOffscreenLeft: sb != null && sb.right <= 1,
      topbarHeight: tb ? Math.round(tb.height) : null,
      menuWidth: mb ? Math.round(mb.width) : null,
      menuHeight: mb ? Math.round(mb.height) : null,
      cssSidebarCurrent: cs.getPropertyValue("--sidebar-current").trim(),
      appearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      regions,
      docOverflowX,
      mobileNav: sidebar?.getAttribute("data-mobile-nav") || null,
      role: sidebar?.getAttribute("role"),
      ariaModal: sidebar?.getAttribute("aria-modal"),
      ariaHidden: sidebar?.getAttribute("aria-hidden"),
      inert: sidebar?.hasAttribute("inert") || sidebar?.inert === true,
      sidebarPointerEvents: sidebarCs?.pointerEvents ?? null,
      menuExpanded: menu?.getAttribute("aria-expanded") ?? null,
      menuControls: menu?.getAttribute("aria-controls") ?? null,
      overlayVisible: overlay
        ? overlayCs.display !== "none" && overlay.getBoundingClientRect().width > 0
        : false,
      overlayHidden:
        !overlay ||
        overlayCs.display === "none" ||
        overlay.getBoundingClientRect().width === 0 ||
        overlay.getAttribute("aria-hidden") === "true",
      overlayPointerEvents: overlayCs?.pointerEvents ?? null,
      expectedWidth,
      transitionSample,
      viewportWidth: window.innerWidth,
    };
  }, expectSidebarWidth(width));
}

async function focusInsideSidebar(page) {
  return page.evaluate(() => {
    const aside = document.querySelector('[data-testid="shell-sidebar"]');
    return !!(aside && document.activeElement && aside.contains(document.activeElement));
  });
}

async function focusIsMobileMenu(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute("data-testid") === "shell-mobile-menu";
  });
}

async function countSidebarFocusables(page) {
  return page.evaluate(() => {
    const aside = document.querySelector('[data-testid="shell-sidebar"]');
    if (!aside) return 0;
    const sel =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(aside.querySelectorAll(sel)).filter((el) => {
      if (el.getAttribute("aria-hidden") === "true") return false;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") return false;
      return true;
    }).length;
  });
}

function classifyAssertionGroup(id) {
  if (/hydration|pageerror/.test(id)) return "hydration";
  if (/^motion\/|\/reduced-motion$|reduce-near-zero|matchMedia/.test(id)) return "reducedMotion";
  if (
    /stored-appearance|resolved-theme|os-preference|system-os-change|explicit-light|matrix\/appearance/.test(
      id
    )
  ) {
    return "appearance";
  }
  if (/^(b2-|b3-|hydrate-m)/.test(id)) return "consumer";
  if (
    /keyboard\/|^interaction\/|tab-wrap|focus-restore|overlay-dismiss|escape-focus|open-role-dialog|open-aria-modal|aria-expanded|aria-controls|drawer-/.test(
      id
    )
  ) {
    return "keyboard";
  }
  if (
    /overflow|viewport|sidebar-geometry|mobile-nav-closed|matrix\/width|pointer-noninteractive|regions|mobile-menu-target|menu-target-size/.test(
      id
    )
  ) {
    return "responsive";
  }
  return "other";
}

function summarizeAssertionGroups(list) {
  const groups = {
    appearance: { pass: 0, fail: 0, total: 0 },
    responsive: { pass: 0, fail: 0, total: 0 },
    keyboard: { pass: 0, fail: 0, total: 0 },
    reducedMotion: { pass: 0, fail: 0, total: 0 },
    hydration: { pass: 0, fail: 0, total: 0 },
    consumer: { pass: 0, fail: 0, total: 0 },
    other: { pass: 0, fail: 0, total: 0 },
  };
  for (const a of list) {
    const g = classifyAssertionGroup(a.id);
    groups[g].total += 1;
    if (a.ok) groups[g].pass += 1;
    else groups[g].fail += 1;
  }
  return groups;
}

async function waitReady(page, route) {
  await page.waitForSelector('[data-testid="shell-topbar"], .pulse-top-ribbon', {
    timeout: 45000,
    state: "attached",
  });
  await page.waitForFunction(
    ({ readySource, notLoadingSource }) => {
      const text = document.body?.innerText || "";
      if (notLoadingSource && new RegExp(notLoadingSource, "i").test(text)) return false;
      return new RegExp(readySource, "i").test(text);
    },
    {
      readySource: route.ready.source,
      notLoadingSource: route.notLoading ? route.notLoading.source : null,
    },
    { timeout: 45000 }
  );
}

async function openContext(browser, { appearance, colorScheme, width, height, reducedMotion }) {
  const context = await browser.newContext({
    colorScheme,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    viewport: { width, height },
  });
  // Seed BEFORE first navigation (addInitScript runs on every document start)
  await seedAppearance(context, appearance);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (t === "error" || /hydrat/i.test(text)) {
      consoleErrors.push({ type: t, text });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ type: "pageerror", text: String(err) });
  });
  return { context, page, consoleErrors };
}

async function gotoSeeded(page, path) {
  const response = await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  if (response && response.status() >= 500) {
    throw new Error(`HTTP ${response.status()} for ${path}`);
  }
}

function assertAppearance(audit, spec, label) {
  // data-appearance asserted separately from theme-dark
  record(
    audit.appearance === spec.appearance,
    `${label}/stored-appearance`,
    `Stored/data-appearance=${audit.appearance} (expected ${spec.appearance})`
  );
  record(
    audit.themeDark === spec.expectDark,
    `${label}/resolved-theme`,
    `themeDark=${audit.themeDark} expected=${spec.expectDark} (OS dark=${audit.colorSchemeDark})`
  );
  if (spec.appearance === "system") {
    record(
      audit.colorSchemeDark === (spec.colorScheme === "dark"),
      `${label}/os-preference`,
      `OS colorScheme dark=${audit.colorSchemeDark} for ${spec.id}`
    );
  }
}

function assertNoOverflow(audit, label) {
  record(!audit.docOverflowX, `${label}/overflow`, !audit.docOverflowX ? "No horizontal page overflow" : "Horizontal overflow");
}

function assertRegions(audit, required, label) {
  const missing = required.filter((r) => (audit.regions[r] || 0) < 1);
  record(
    missing.length === 0,
    `${label}/regions`,
    missing.length === 0 ? `Regions present: ${required.join(", ")}` : `Missing: ${missing.join(", ")}`
  );
}

function recordHydration(consoleErrors, label, routeId) {
  const hydratHits = consoleErrors.filter((e) => /hydrat/i.test(e.text));
  const residuals = consoleErrors.filter((e) => !/hydrat/i.test(e.text));
  hydrationLog.push({
    route: routeId,
    label,
    errors: consoleErrors.slice(0, 20),
    hydrationHits: hydratHits.slice(0, 10),
    residualsUnrelated: residuals.slice(0, 10),
  });
  record(
    hydratHits.length === 0,
    `${label}/hydration-console`,
    hydratHits.length === 0
      ? residuals.length === 0
        ? "No hydration console/pageerror messages observed"
        : `No hydration messages; documented residuals=${residuals.length}`
      : `Hydration messages: ${hydratHits.map((e) => e.text).join(" | ").slice(0, 240)}`
  );
}

async function runPrimaryMatrix(browser) {
  for (const route of PRIMARY_ROUTES) {
    for (const vp of WIDTHS) {
      for (const spec of APPEARANCES) {
        const label = `${route.id}-${vp.name}-${spec.id}`;
        const { context, page, consoleErrors } = await openContext(browser, {
          appearance: spec.appearance,
          colorScheme: spec.colorScheme,
          width: vp.w,
          height: vp.h,
          reducedMotion: true,
        });
        try {
          await gotoSeeded(page, route.path);
          await waitReady(page, route);
          await page.waitForFunction((w) => window.innerWidth === w, vp.w, { timeout: 10000 });
          const audit = await auditShell(page, vp.w);
          assertRegions(audit, route.required, label);
          assertNoOverflow(audit, label);
          assertAppearance(audit, spec, label);
          record(
            audit.reducedMotion === true,
            `${label}/reduced-motion`,
            audit.reducedMotion ? "prefers-reduced-motion: reduce active" : "reduced-motion not active"
          );
          record(
            audit.viewportWidth === vp.w,
            `${label}/viewport`,
            `viewportWidth=${audit.viewportWidth}`
          );

          if (vp.class === "mobile") {
            record(
              audit.sidebarOffscreenLeft === true && !audit.sidebarVisible,
              `${label}/mobile-nav-closed`,
              `Closed geometry right=${audit.sidebarRight} inert=${audit.inert} aria-hidden=${audit.ariaHidden}`
            );
            record(
              audit.inert === true || audit.ariaHidden === "true",
              `${label}/mobile-nav-closed-a11y`,
              `Closed nav inert/hidden (inert=${audit.inert}, aria-hidden=${audit.ariaHidden})`
            );
            record(
              audit.overlayHidden === true && !audit.overlayVisible,
              `${label}/mobile-nav-closed-overlay`,
              `Closed overlay hidden=${audit.overlayHidden} visible=${audit.overlayVisible}`
            );
            record(
              audit.sidebarPointerEvents === "none",
              `${label}/mobile-nav-closed-pointer-noninteractive`,
              `Closed sidebar pointer-events=${audit.sidebarPointerEvents}`
            );
            if (audit.menuWidth != null) {
              record(
                audit.menuWidth >= 40 && audit.menuHeight >= 40,
                `${label}/mobile-menu-target`,
                `Mobile menu target ${audit.menuWidth}x${audit.menuHeight} (44px target, >=40 accept)`
              );
            }
          } else {
            const expected = expectSidebarWidth(vp.w);
            record(
              audit.sidebarVisible &&
                audit.sidebarWidth != null &&
                Math.abs(audit.sidebarWidth - expected) <= 2,
              `${label}/sidebar-geometry`,
              `Sidebar width=${audit.sidebarWidth} expected=${expected}`
            );
          }

          recordHydration(consoleErrors, label, route.id);

          // Sparse shots: dashboard all widths×appearances; action-inbox representative subset
          const shotThis =
            route.id === "dashboard" ||
            (route.id === "action-inbox" &&
              (vp.w === 1440 || vp.w === 768 || vp.w === 390) &&
              (spec.id === "light" || spec.id === "system-os-dark"));
          if (shotThis) {
            await shot(page, `${label}-reduce`);
          }
        } catch (err) {
          record(false, `${label}/prepare`, String(err?.message || err));
        } finally {
          await context.close();
        }
      }
    }
  }
}

async function runConsumerSurfaces(browser) {
  const specs = [
    APPEARANCES.find((a) => a.id === "light"),
    APPEARANCES.find((a) => a.id === "system-os-dark"),
  ];
  const widths = [1440, 768, 390];
  for (const route of CONSUMER_ROUTES) {
    for (const w of widths) {
      for (const spec of specs) {
        const vp = WIDTHS.find((x) => x.w === w);
        const label = `${route.id}-${vp.name}-${spec.id}`;
        const { context, page, consoleErrors } = await openContext(browser, {
          appearance: spec.appearance,
          colorScheme: spec.colorScheme,
          width: vp.w,
          height: vp.h,
          reducedMotion: true,
        });
        try {
          await gotoSeeded(page, route.path);
          await waitReady(page, route);
          const audit = await auditShell(page, vp.w);
          assertNoOverflow(audit, label);
          assertAppearance(audit, spec, label);
          assertRegions(audit, ["shell-nav", "topbar"], label);
          recordHydration(consoleErrors, label, route.id);
          if (w === 1440 || w === 390) {
            await shot(page, `${label}-reduce`);
          }
        } catch (err) {
          record(false, `${label}/prepare`, String(err?.message || err));
        } finally {
          await context.close();
        }
      }
    }
  }
}

async function runMobileNavKeyboardSuite(browser, width, height) {
  const prefix = `interaction/mobile-nav-${width}`;
  const spec = APPEARANCES[0];
  const { context, page } = await openContext(browser, {
    appearance: spec.appearance,
    colorScheme: spec.colorScheme,
    width,
    height,
    reducedMotion: true,
  });
  try {
    await gotoSeeded(page, "/dashboard");
    await waitReady(page, PRIMARY_ROUTES[0]);
    const menu = page.locator('[data-testid="shell-mobile-menu"]');

    // Closed baseline + 44px target (accept >=40)
    let audit = await auditShell(page, width);
    const ariaExpandedOk = audit.menuExpanded === "false";
    const ariaControlsOk = audit.menuControls === "shell-sidebar-nav";
    record(ariaExpandedOk, `${prefix}/aria-expanded-closed`, `aria-expanded=${audit.menuExpanded}`);
    record(ariaControlsOk, `${prefix}/aria-controls`, `aria-controls=${audit.menuControls}`);
    if (width === 390) {
      record(ariaExpandedOk, "interaction/aria-expanded-closed", `aria-expanded=${audit.menuExpanded}`);
      record(ariaControlsOk, "interaction/aria-controls", `aria-controls=${audit.menuControls}`);
    }
    record(
      audit.menuWidth != null &&
        audit.menuHeight != null &&
        audit.menuWidth >= 40 &&
        audit.menuHeight >= 40,
      `${prefix}/menu-target-size`,
      `Menu button ${audit.menuWidth}x${audit.menuHeight} (44 target, >=40 accept)`
    );
    record(
      audit.sidebarOffscreenLeft === true && !audit.sidebarVisible,
      `${prefix}/closed-offscreen`,
      `Closed offscreen right=${audit.sidebarRight} visible=${audit.sidebarVisible}`
    );
    record(
      audit.inert === true || audit.ariaHidden === "true",
      `${prefix}/closed-inert-or-hidden`,
      `inert=${audit.inert} aria-hidden=${audit.ariaHidden}`
    );
    record(
      audit.overlayHidden === true && !audit.overlayVisible,
      `${prefix}/closed-overlay-hidden`,
      `overlayHidden=${audit.overlayHidden} overlayVisible=${audit.overlayVisible}`
    );
    record(
      audit.sidebarPointerEvents === "none",
      `${prefix}/closed-pointer-noninteractive`,
      `pointer-events=${audit.sidebarPointerEvents}`
    );

    // Open via Enter on menu
    await menu.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    audit = await auditShell(page, width);
    record(
      audit.sidebarVisible === true,
      `${prefix}/open-sidebar-visible`,
      `sidebarVisible=${audit.sidebarVisible} left=${audit.sidebarLeft}`
    );
    record(
      audit.overlayVisible === true,
      `${prefix}/open-overlay-visible`,
      `overlayVisible=${audit.overlayVisible}`
    );
    record(audit.role === "dialog", `${prefix}/open-role-dialog`, `role=${audit.role}`);
    record(audit.ariaModal === "true", `${prefix}/open-aria-modal`, `aria-modal=${audit.ariaModal}`);
    if (width === 390) {
      record(
        audit.sidebarVisible === true && audit.overlayVisible === true,
        "interaction/mobile-nav-open",
        `Open visible=${audit.sidebarVisible} overlay=${audit.overlayVisible}`
      );
    }
    await shot(page, `interaction-mobile-nav-open-${width}-light-reduce`);

    const focusInside = await focusInsideSidebar(page);
    record(
      focusInside,
      `${prefix}/focus-in-sidebar`,
      focusInside ? "Focus moved into sidebar after Enter open" : "Focus not in sidebar"
    );
    if (width === 390) {
      record(
        focusInside,
        "interaction/mobile-nav-focus",
        focusInside ? "Focus moved into sidebar" : "Focus not in sidebar"
      );
    }

    // Forward Tab wrap — press Tab enough times; activeElement stays inside sidebar
    const focusableCount = await countSidebarFocusables(page);
    const tabPasses = Math.max(focusableCount + 2, 6);
    let tabWrapOk = true;
    for (let i = 0; i < tabPasses; i++) {
      await page.keyboard.press("Tab");
      if (!(await focusInsideSidebar(page))) {
        tabWrapOk = false;
        break;
      }
    }
    record(
      tabWrapOk,
      `${prefix}/tab-wrap-forward`,
      tabWrapOk
        ? `Forward Tab stayed in sidebar across ${tabPasses} presses (focusables~${focusableCount})`
        : `Forward Tab escaped sidebar within ${tabPasses} presses`
    );

    // Shift+Tab wrap
    let shiftWrapOk = true;
    for (let i = 0; i < tabPasses; i++) {
      await page.keyboard.press("Shift+Tab");
      if (!(await focusInsideSidebar(page))) {
        shiftWrapOk = false;
        break;
      }
    }
    record(
      shiftWrapOk,
      `${prefix}/tab-wrap-shift`,
      shiftWrapOk
        ? `Shift+Tab stayed in sidebar across ${tabPasses} presses`
        : `Shift+Tab escaped sidebar within ${tabPasses} presses`
    );

    // Escape restores focus to exact shell-mobile-menu
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    audit = await auditShell(page, width);
    record(
      audit.sidebarOffscreenLeft === true && !audit.overlayVisible,
      `${prefix}/escape-closed`,
      `After Escape offscreen=${audit.sidebarOffscreenLeft} overlay=${audit.overlayVisible}`
    );
    const restoredEscape = await focusIsMobileMenu(page);
    record(
      restoredEscape,
      `${prefix}/escape-focus-restore`,
      restoredEscape
        ? "Escape restored focus to data-testid=shell-mobile-menu"
        : "Escape did not restore focus to shell-mobile-menu"
    );
    if (width === 390) {
      record(
        audit.sidebarOffscreenLeft === true && !audit.overlayVisible,
        "interaction/mobile-nav-escape",
        `After Escape offscreen=${audit.sidebarOffscreenLeft} overlay=${audit.overlayVisible}`
      );
      record(
        restoredEscape,
        "interaction/mobile-nav-focus-restore",
        restoredEscape ? "Focus restored to menu" : "Focus not restored"
      );
    }
    await shot(page, `interaction-mobile-nav-closed-after-escape-${width}-light-reduce`);

    // Separately: open, click overlay to close, assert focus restored to menu
    await menu.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const overlay = page.locator('[data-testid="shell-mobile-nav-overlay"]');
    // Click dimmed area outside the left sidebar rail (sidebar z-index sits above overlay).
    const overlayBox = await overlay.boundingBox();
    const clickX = overlayBox
      ? Math.min(overlayBox.width - 16, Math.max(280, overlayBox.width - 24))
      : Math.max(280, width - 24);
    await overlay.click({ position: { x: clickX, y: 40 } });
    await page.waitForTimeout(200);
    audit = await auditShell(page, width);
    record(
      audit.sidebarOffscreenLeft === true && !audit.overlayVisible,
      `${prefix}/overlay-dismiss-closed`,
      `Overlay dismiss offscreen=${audit.sidebarOffscreenLeft} overlay=${audit.overlayVisible}`
    );
    const restoredOverlay = await focusIsMobileMenu(page);
    record(
      restoredOverlay,
      `${prefix}/overlay-dismiss-focus-restore`,
      restoredOverlay
        ? "Overlay dismiss restored focus to shell-mobile-menu"
        : "Overlay dismiss did not restore focus to shell-mobile-menu"
    );
    await shot(page, `interaction-mobile-nav-closed-after-overlay-${width}-light-reduce`);
  } catch (err) {
    record(false, `${prefix}/suite`, String(err?.message || err));
  } finally {
    await context.close();
  }
}

async function runInteractions(browser) {
  // Mobile nav keyboard / focus / dialog for 390 AND 430
  await runMobileNavKeyboardSuite(browser, 390, 844);
  await runMobileNavKeyboardSuite(browser, 430, 932);

  // Drawer Escape + focus trap smoke via Action Inbox review if available
  {
    const { context, page } = await openContext(browser, {
      appearance: "light",
      colorScheme: "light",
      width: 1280,
      height: 900,
      reducedMotion: true,
    });
    try {
      await gotoSeeded(page, "/action-inbox");
      await waitReady(page, PRIMARY_ROUTES[1]);
      const review = page.locator('button:has-text("Review"), [data-testid*="review"]').first();
      if (await review.count()) {
        await review.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(250);
        const drawerState = await page.evaluate(() => {
          const d =
            document.querySelector('[data-testid="shell-drawer"]') ||
            document.querySelector('[data-testid="shell-detail-panel"]');
          if (!d) return null;
          const r = d.getBoundingClientRect();
          return {
            role: d.getAttribute("role"),
            labelled: !!d.getAttribute("aria-labelledby"),
            focusIn: d.contains(document.activeElement),
            visible: r.left < window.innerWidth - 1 && r.width > 1,
            ariaHidden: d.getAttribute("aria-hidden"),
          };
        });
        if (drawerState?.visible) {
          record(drawerState.role === "dialog" || drawerState.role === "complementary", "interaction/drawer-role", `role=${drawerState.role}`);
          record(!!drawerState.labelled, "interaction/drawer-labelled", `labelled=${drawerState.labelled}`);
          record(!!drawerState.focusIn, "interaction/drawer-focus", drawerState.focusIn ? "Focus in drawer" : "Focus not in drawer");
          await shot(page, "interaction-drawer-open-1280-light-reduce");
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
          const after = await page.evaluate(() => {
            const d =
              document.querySelector('[data-testid="shell-drawer"]') ||
              document.querySelector('[data-testid="shell-detail-panel"]');
            if (!d) return { hidden: true };
            const r = d.getBoundingClientRect();
            return {
              hidden: d.getAttribute("aria-hidden") === "true" || r.left >= window.innerWidth - 1,
              activeTestId: document.activeElement?.getAttribute("data-testid") || document.activeElement?.tagName,
            };
          });
          record(!!after.hidden, "interaction/drawer-escape", after.hidden ? "Escape closed drawer" : "Drawer still open");
        } else {
          record(true, "interaction/drawer-skip", "No review drawer available on this seed — skipped without fail");
        }
      } else {
        record(true, "interaction/drawer-skip", "No Review control found — skipped without fail");
      }
    } catch (err) {
      record(false, "interaction/drawer", String(err?.message || err));
    } finally {
      await context.close();
    }
  }

  // System OS change while System selected (live matchMedia → portal subscribe)
  {
    const { context, page } = await openContext(browser, {
      appearance: "system",
      colorScheme: "light",
      width: 1440,
      height: 900,
      reducedMotion: true,
    });
    try {
      await gotoSeeded(page, "/dashboard");
      await waitReady(page, PRIMARY_ROUTES[0]);
      let audit = await auditShell(page, 1440);
      record(
        audit.appearance === "system" && audit.themeDark === false,
        "system-os-change/initial-light",
        `appearance=${audit.appearance} dark=${audit.themeDark}`
      );
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.waitForFunction(
        () =>
          document.documentElement.getAttribute("data-appearance") === "system" &&
          document.documentElement.classList.contains("theme-dark") === true,
        null,
        { timeout: 5000 }
      );
      audit = await auditShell(page, 1440);
      record(
        audit.appearance === "system" && audit.themeDark === true,
        "system-os-change/after-os-dark",
        `After OS dark: appearance=${audit.appearance} themeDark=${audit.themeDark}`
      );
      await shot(page, "system-os-change-system-preference-os-dark-1440");
    } catch (err) {
      record(false, "system-os-change", String(err?.message || err));
    } finally {
      await context.close();
    }
  }

  // Explicit Light unaffected by OS dark
  {
    const { context, page } = await openContext(browser, {
      appearance: "light",
      colorScheme: "light",
      width: 1440,
      height: 900,
      reducedMotion: true,
    });
    try {
      await gotoSeeded(page, "/dashboard");
      await waitReady(page, PRIMARY_ROUTES[0]);
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.waitForTimeout(400);
      const audit = await auditShell(page, 1440);
      record(
        audit.appearance === "light" && audit.themeDark === false,
        "explicit-light/os-dark-unaffected",
        `appearance=${audit.appearance} themeDark=${audit.themeDark}`
      );
      await shot(page, "explicit-light-unaffected-by-os-dark-1440");
    } catch (err) {
      record(false, "explicit-light", String(err?.message || err));
    } finally {
      await context.close();
    }
  }

  // Normal motion vs reduced (matchMedia + transition duration evidence)
  {
    for (const reduce of [true, false]) {
      const { context, page } = await openContext(browser, {
        appearance: "dark",
        colorScheme: "dark",
        width: 1440,
        height: 900,
        reducedMotion: reduce,
      });
      try {
        await gotoSeeded(page, "/dashboard");
        await waitReady(page, PRIMARY_ROUTES[0]);
        const audit = await auditShell(page, 1440);
        record(
          audit.reducedMotion === reduce,
          `motion/${reduce ? "reduce" : "normal"}-matchMedia`,
          `matchMedia prefers-reduced-motion reduce=${audit.reducedMotion} (expected ${reduce})`
        );
        // Keep prior id for reduce matchMedia compatibility
        if (reduce) {
          record(
            audit.reducedMotion === true,
            "motion/reduce",
            `reducedMotion=${audit.reducedMotion} transitionSample=${audit.transitionSample}`
          );
          record(
            transitionNearZero(audit.transitionSample),
            "motion/reduce-near-zero-transition",
            `transitionDuration=${audit.transitionSample}`
          );
        } else {
          record(
            audit.reducedMotion === false,
            "motion/normal",
            `reducedMotion=${audit.reducedMotion} transitionSample=${audit.transitionSample}`
          );
        }
        await shot(page, `motion-${reduce ? "reduce" : "normal"}-dashboard-1440-dark`);
      } catch (err) {
        record(false, `motion/${reduce ? "reduce" : "normal"}`, String(err?.message || err));
      } finally {
        await context.close();
      }
    }
  }

  // Keyboard Tab reaches topbar control
  {
    const { context, page } = await openContext(browser, {
      appearance: "light",
      colorScheme: "light",
      width: 1440,
      height: 900,
      reducedMotion: true,
    });
    try {
      await gotoSeeded(page, "/dashboard");
      await waitReady(page, PRIMARY_ROUTES[0]);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tag: el.tagName,
          name: el.getAttribute("aria-label") || el.textContent?.trim()?.slice(0, 40),
        };
      });
      record(!!focusInfo, "keyboard/tab-focus", focusInfo ? `Focus on ${focusInfo.tag} (${focusInfo.name})` : "No focus");
      await shot(page, "keyboard-tab-focus-dashboard-1440-light-reduce");
    } catch (err) {
      record(false, "keyboard/tab-focus", String(err?.message || err));
    } finally {
      await context.close();
    }
  }
}

async function main() {
  console.log(`P1-B4 harness starting — base=${BASE} runtime=${RUNTIME}`);
  // Clear live shots/ only for this run — never touch historical-* archives
  try {
    rmSync(SHOTS, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    await runPrimaryMatrix(browser);
    await runConsumerSurfaces(browser);
    await runInteractions(browser);
  } finally {
    await browser.close();
  }

  const requiredIds = [
    "interaction/mobile-nav-open",
    "interaction/mobile-nav-escape",
    "interaction/mobile-nav-focus-restore",
    "interaction/aria-expanded-closed",
    "interaction/aria-controls",
    "interaction/mobile-nav-390/tab-wrap-forward",
    "interaction/mobile-nav-390/tab-wrap-shift",
    "interaction/mobile-nav-390/overlay-dismiss-focus-restore",
    "interaction/mobile-nav-390/open-role-dialog",
    "interaction/mobile-nav-390/open-aria-modal",
    "interaction/mobile-nav-430/tab-wrap-forward",
    "interaction/mobile-nav-430/tab-wrap-shift",
    "interaction/mobile-nav-430/escape-focus-restore",
    "interaction/mobile-nav-430/overlay-dismiss-focus-restore",
    "interaction/mobile-nav-430/open-role-dialog",
    "system-os-change/after-os-dark",
    "explicit-light/os-dark-unaffected",
    "motion/reduce-near-zero-transition",
    "motion/reduce-matchMedia",
    "motion/normal-matchMedia",
    "keyboard/tab-focus",
  ];
  for (const id of requiredIds) {
    const hit = assertions.find((a) => a.id === id);
    if (!hit) {
      record(false, `required-missing/${id}`, `Required assertion missing: ${id}`);
    }
  }

  // Prove matrix coverage counts
  const widthsFromIds = new Set();
  for (const a of assertions) {
    const m = a.id.match(/^(?:dashboard|action-inbox)-(\d+)-/);
    if (m) widthsFromIds.add(m[1]);
  }
  for (const w of ["1440", "1280", "1024", "768", "430", "390"]) {
    record(widthsFromIds.has(w), `matrix/width-${w}`, widthsFromIds.has(w) ? `Width ${w} exercised` : `Width ${w} missing`);
  }
  for (const id of ["light", "dark", "system-os-light", "system-os-dark"]) {
    const hit = assertions.some((a) => a.id.includes(`-${id}/`) || a.id.includes(`-${id}`));
    record(hit, `matrix/appearance-${id}`, hit ? `Appearance case ${id} exercised` : `Appearance case ${id} missing`);
  }

  const assertionGroups = summarizeAssertionGroups(assertions);
  const hydrationResiduals = hydrationLog
    .filter((e) => (e.residualsUnrelated || []).length > 0)
    .map((e) => ({
      label: e.label,
      residuals: e.residualsUnrelated,
    }));

  const report = {
    batch: "P1-B4",
    runtime: RUNTIME,
    baseUrl: BASE,
    generatedAt: new Date().toISOString(),
    failures,
    assertionCount: assertions.length,
    passCount: assertions.filter((a) => a.ok).length,
    failCount: assertions.filter((a) => !a.ok).length,
    assertionGroups,
    screenshotCount: shots.length,
    shots,
    assertions,
    hydrationLog,
    hydrationResiduals,
    claims: {
      wcagCertification: false,
      pixelParity: false,
      githubCi: false,
      productionApproval: false,
      ownerAcceptance: "pending",
    },
  };
  writeFileSync(join(OUT, "harness-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT, "screenshot-manifest.json"),
    JSON.stringify({ runtime: RUNTIME, count: shots.length, shots }, null, 2)
  );
  writeFileSync(
    join(OUT, "hydration-reverification.json"),
    JSON.stringify(
      {
        runtime: RUNTIME,
        entries: hydrationLog,
        residualsUnrelated: hydrationResiduals,
        note: "Fail only on hydration messages for tested surfaces; residualsUnrelated are documented non-hydration console/pageerror leftovers.",
      },
      null,
      2
    )
  );

  console.log(
    `P1-B4 harness complete — assertions=${assertions.length} pass=${report.passCount} fail=${report.failCount} shots=${shots.length}`
  );
  console.log(`assertionGroups=${JSON.stringify(assertionGroups)}`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
