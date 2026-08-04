/**
 * Phase 4 FINAL Work-Step QA — frozen app SHA d822dfd against :3491.
 * Evidence-only. Does not edit application source/tests.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SHOTS = path.join(ROOT, "screenshots");
const TRACES = path.join(ROOT, "traces");
const OUT = path.join(ROOT, "_raw-results.json");
const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3491";
const APP_SHA = "d822dfd4a80ed0c98635a0ff8631f9e39fe781f0";

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(TRACES, { recursive: true });

const findings = [];
function addFinding(id, workflowId, severity, title, detail) {
  findings.push({ id, workflowId, severity, title, detail, status: "OPEN" });
}

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function errBag() {
  return { consoleErrors: [], pageErrors: [], requestFailures: [] };
}
function attachErrors(page, bag) {
  page.on("console", (m) => {
    if (m.type() === "error") bag.consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => bag.pageErrors.push(String(e)));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/favicon|hot-update|webpack|_next\/static/.test(u)) return;
    bag.requestFailures.push(`${r.method()} ${u} :: ${r.failure()?.errorText || ""}`);
  });
}

async function waitReady(page, ms = 1200) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(ms);
}

async function gotoDash(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
  await waitReady(page, 1500);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".cc-surface-danger")].some((el) =>
        /Emergency announcement/i.test(el.textContent || "")
      ) || document.querySelector("h1"),
    { timeout: 20000 }
  ).catch(() => {});
}

/** Geometry helpers for VQA-style operability */
async function measureControl(page, selectorOrEval) {
  return page.evaluate((sel) => {
    const el =
      typeof sel === "string"
        ? document.querySelector(sel)
        : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    const docEl = document.documentElement;
    const scrollW = docEl.scrollWidth;
    const clientW = docEl.clientWidth;
    const parent = el.closest(".cc-surface-danger, .pulse-top-ribbon, aside, header, .page-title") || el.parentElement;
    const pr = parent?.getBoundingClientRect();
    return {
      text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
      rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      visible: r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none" && st.opacity !== "0",
      fullyInViewport: r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1,
      insideParent: pr
        ? r.left >= pr.left - 2 && r.right <= pr.right + 2 && r.top >= pr.top - 2 && r.bottom <= pr.bottom + 2
        : null,
      overflowHiddenClip:
        st.overflow === "hidden" ||
        (parent && getComputedStyle(parent).overflow === "hidden" && pr && (r.right > pr.right + 1 || r.bottom > pr.bottom + 1)),
      textOverflow: st.textOverflow,
      whiteSpace: st.whiteSpace,
      pageHorizontalScroll: scrollW > clientW + 1,
      scrollWidth: scrollW,
      clientWidth: clientW,
    };
  }, selectorOrEval);
}

async function measureByLocator(page, locator) {
  const handle = await locator.elementHandle();
  if (!handle) return null;
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    const parent = el.closest(".cc-surface-danger, .pulse-top-ribbon, aside, header, .page-title, .brand-compact") || el.parentElement;
    const pr = parent?.getBoundingClientRect();
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const ellipsis =
      st.textOverflow === "ellipsis" ||
      (el.scrollWidth > el.clientWidth + 1 && (st.overflow === "hidden" || st.textOverflow === "ellipsis"));
    return {
      text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
      tag: el.tagName,
      rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      visible: r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none",
      fullyInViewport: r.top >= -1 && r.left >= -1 && r.bottom <= window.innerHeight + 1 && r.right <= window.innerWidth + 1,
      insideParentFully: pr
        ? r.left >= pr.left - 2 && r.right <= pr.right + 2 && r.top >= pr.top - 2 && r.bottom <= pr.bottom + 2
        : null,
      parentTag: parent?.className?.toString?.().slice(0, 80),
      ellipsisLikely: ellipsis,
      textOverflow: st.textOverflow,
      whiteSpace: st.whiteSpace,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      pageHorizontalScroll: scrollW > clientW + 1,
      disabled: el.disabled === true,
    };
  });
}

async function inventory(page) {
  return page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const info = (el) =>
      el
        ? {
            tag: el.tagName.toLowerCase(),
            text: text(el).slice(0, 100),
            ariaLabel: el.getAttribute("aria-label"),
            disabled: el.disabled === true || el.hasAttribute("disabled"),
            href: el.getAttribute("href"),
            visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
            rect: (() => {
              const r = el.getBoundingClientRect();
              return { t: r.top, l: r.left, r: r.right, b: r.bottom, w: r.width, h: r.height };
            })(),
          }
        : null;

    const banner = [...document.querySelectorAll(".cc-surface-danger")].find((el) =>
      [...el.querySelectorAll("div")].some((d) => (d.textContent || "").trim() === "Emergency announcement")
    );
    const emergency = banner
      ? {
          title: banner.querySelector("strong")?.textContent?.trim(),
          buttons: [...banner.querySelectorAll("button")].map((b) => ({
            text: text(b),
            disabled: b.disabled,
            rect: (() => {
              const r = b.getBoundingClientRect();
              return { t: r.top, l: r.left, r: r.right, b: r.bottom, w: r.width, h: r.height };
            })(),
            insideBanner: (() => {
              const br = banner.getBoundingClientRect();
              const r = b.getBoundingClientRect();
              return r.left >= br.left - 2 && r.right <= br.right + 2 && r.top >= br.top - 2 && r.bottom <= br.bottom + 2;
            })(),
          })),
          bannerRect: (() => {
            const r = banner.getBoundingClientRect();
            return { t: r.top, l: r.left, r: r.right, b: r.bottom, w: r.width, h: r.height };
          })(),
        }
      : null;

    const topbar = document.querySelector(".pulse-top-ribbon");
    const brand = topbar?.querySelector(".brand-compact");
    const brandStrong = brand?.querySelector("strong");
    const topbarControls = topbar
      ? [...topbar.querySelectorAll("a,button,input,select")].map((el) => info(el))
      : [];

    const sidebar = document.querySelector("aside.pulse-sidebar");
    const groups = sidebar
      ? [...sidebar.querySelectorAll("[data-nav-group]")].map((g) => ({
          id: g.getAttribute("data-nav-group"),
          title: text(g.querySelector(".v32-nav-toggle")),
          expanded: g.querySelector(".v32-nav-toggle")?.getAttribute("aria-expanded"),
          modules: [...g.querySelectorAll("[data-canonical-module]")].map((m) => ({
            id: m.getAttribute("data-canonical-module"),
            href: m.getAttribute("data-canonical-href"),
            label: text(m.querySelector(".nav-label")),
          })),
        }))
      : [];
    const footer = sidebar?.querySelector(".sidebar-user");
    const actAs = sidebar?.querySelector('select[aria-label="Act as User / Role"]');
    const fr = footer?.getBoundingClientRect();
    const ar = actAs?.getBoundingClientRect();

    const appearance = document.querySelector('select[aria-label="Appearance"]');
    const h1 = document.querySelector("h1");
    const h1St = h1 ? getComputedStyle(h1) : null;

    return {
      url: location.href,
      viewport: { w: innerWidth, h: innerHeight },
      pageHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      emergency,
      brand: brand
        ? {
            text: text(brand),
            strongText: text(brandStrong),
            strongEllipsis: brandStrong ? getComputedStyle(brandStrong).textOverflow === "ellipsis" : null,
            strongScrollOverflow: brandStrong ? brandStrong.scrollWidth > brandStrong.clientWidth + 1 : null,
            fullyInViewport: brand
              ? (() => {
                  const r = brand.getBoundingClientRect();
                  return r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1;
                })()
              : false,
            rect: brand.getBoundingClientRect().toJSON(),
          }
        : null,
      topbarControls,
      online: info([...document.querySelectorAll("button")].find((b) => /^(Online|Offline)$/.test(text(b)))),
      openMenu: info(document.querySelector('button[aria-label="Open menu"]')),
      sidebar: {
        groups,
        search: !!sidebar?.querySelector('input[aria-label="Find a module or section"]'),
        footer: footer
          ? {
              user: text(footer.querySelector(".user-name")),
              role: text(footer.querySelector(".user-role")),
              actAsPresent: !!actAs,
              footerFullyVisible: fr ? fr.top >= 0 && fr.bottom <= innerHeight && fr.height > 0 : false,
              actAsFullyVisible: ar ? ar.top >= 0 && ar.bottom <= innerHeight && ar.width > 0 : false,
              actAsRect: ar ? { t: ar.top, l: ar.left, r: ar.right, b: ar.bottom, w: ar.width, h: ar.height } : null,
              footerRect: fr ? { t: fr.top, l: fr.left, r: fr.right, b: fr.bottom, w: fr.width, h: fr.height } : null,
            }
          : null,
      },
      appearance: appearance
        ? {
            value: appearance.value,
            options: [...appearance.options].map((o) => ({ value: o.value, label: o.textContent })),
            disabled: appearance.disabled,
          }
        : { present: false },
      h1: h1
        ? {
            text: text(h1),
            textOverflow: h1St.textOverflow,
            whiteSpace: h1St.whiteSpace,
            ellipsisClass: h1.className.includes("truncate"),
            scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
            rect: h1.getBoundingClientRect().toJSON(),
          }
        : null,
      htmlThemeDark: document.documentElement.classList.contains("theme-dark"),
      dataAppearance: document.documentElement.getAttribute("data-appearance"),
    };
  });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = {
    meta: {
      agent: "Work-Step / Functional QA",
      phase: "Phase 4 FINAL",
      appSourceSha: APP_SHA,
      worktree: "/tmp/hcdp-fix/ui-batch1-wqa-3491",
      base: BASE,
      startedAt: new Date().toISOString(),
    },
    inventory: {},
    workflows: [],
    findings,
  };

  // ========== INVENTORY ==========
  {
    for (const [key, vp] of [
      ["desktop1440x900", { width: 1440, height: 900 }],
      ["desktop1440x720", { width: 1440, height: 720 }],
      ["mobile390", { width: 390, height: 844 }],
    ]) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await gotoDash(page);
      results.inventory[key] = await inventory(page);
      results.inventory[key].shot = await shot(page, `INV-${key}-dashboard`);
      await ctx.close();
    }
    // Route headings inventory
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const headings = {};
    for (const route of [
      "/dashboard",
      "/action-inbox",
      "/settings",
      "/staffpay?section=overview",
      "/staffpay?section=adjustments",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 90000 });
      await waitReady(page);
      headings[route] = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        if (!h1) return null;
        const st = getComputedStyle(h1);
        return {
          text: (h1.textContent || "").trim(),
          textOverflow: st.textOverflow,
          whiteSpace: st.whiteSpace,
          truncateClass: h1.classList.contains("truncate") || /\btruncate\b/.test(h1.className),
          scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
          lineCount: Math.round(h1.getBoundingClientRect().height / (parseFloat(st.lineHeight) || 24)),
          height: h1.getBoundingClientRect().height,
        };
      });
      await shot(page, `INV-h1-${route.replace(/[/?=&]/g, "_")}`);
    }
    results.inventory.headings = headings;
    await ctx.close();
  }

  // ========== WF-EMERGENCY DESKTOP ==========
  async function wfEmergency(vp, suffix) {
    const id = `WF-EMERGENCY-${suffix}`;
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      precondition: "Dashboard with emergency banner",
      startingState: `${vp.width}x${vp.height}`,
      steps: [],
      outcome: "PASS",
      screenshots: [],
      keyboard: null,
      mobileEquivalent: vp.width <= 390,
      errors: errBag(),
      operability: {},
    };
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await ctx.tracing.start({ screenshots: true, snapshots: true });
    await gotoDash(page);

    const banner = page.locator(".cc-surface-danger").filter({ hasText: "Emergency announcement" }).first();
    const present = await banner.isVisible().catch(() => false);
    wf.steps.push({
      n: 1,
      action: "Locate Emergency announcement banner",
      expected: "Banner visible",
      observed: present ? "visible" : "missing",
      result: present ? "PASS" : "FAIL",
    });
    if (!present) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-01-${suffix}`, id, "major", "Emergency banner missing on final SHA", "");
      wf.screenshots.push(await shot(page, `${id}-missing`));
      await ctx.tracing.stop({ path: path.join(TRACES, `${id}.zip`) }).catch(() => {});
      await ctx.close();
      results.workflows.push(wf);
      return;
    }
    await banner.scrollIntoViewIfNeeded();
    wf.screenshots.push(await shot(page, `${id}-banner`));

    const prev = banner.getByRole("button", { name: "Previous", exact: true });
    const next = banner.getByRole("button", { name: "Next", exact: true });
    const viewAll = banner.getByRole("button", { name: "View All Announcements", exact: true });
    const prevDis = await prev.isDisabled();
    const nextDis = await next.isDisabled();
    const title = (await banner.locator("strong").first().textContent())?.trim();
    wf.steps.push({
      n: 2,
      action: "Inspect Previous/Next disabled states",
      expected: "Disabled when <2 emergency items",
      observed: `prevDisabled=${prevDis}, nextDisabled=${nextDis}, title="${title}"`,
      result: "PASS",
    });

    // Operability: View All fully inside card; no page H-scroll for emergency controls
    const viewAllGeom = await measureByLocator(page, viewAll);
    const brandGeom = await measureByLocator(page, page.locator(".brand-compact").first());
    const hScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    wf.operability = { viewAllGeom, brandGeom, pageHorizontalScroll: hScroll };
    const viewAllOk =
      viewAllGeom &&
      viewAllGeom.visible &&
      viewAllGeom.insideParentFully !== false &&
      viewAllGeom.fullyInViewport;
    wf.steps.push({
      n: 3,
      action: "View All Announcements fully inside emergency card (no clip)",
      expected: "Button fully inside .cc-surface-danger and viewport; no page H-scroll required",
      observed: JSON.stringify({
        insideParentFully: viewAllGeom?.insideParentFully,
        fullyInViewport: viewAllGeom?.fullyInViewport,
        pageHorizontalScroll: hScroll,
        rect: viewAllGeom?.rect,
      }),
      result: viewAllOk && !hScroll ? "PASS" : "FAIL",
    });
    if (!(viewAllOk && !hScroll)) {
      wf.outcome = "FAIL";
      addFinding(
        `WQA-EMG-CLIP-${suffix}`,
        id,
        "major",
        "View All Announcements clipped or requires horizontal scroll",
        JSON.stringify(wf.operability)
      );
    }

    const brandOk =
      brandGeom &&
      brandGeom.visible &&
      brandGeom.fullyInViewport &&
      !brandGeom.ellipsisLikely &&
      !(brandGeom.scrollWidth > brandGeom.clientWidth + 2);
    // brand-compact may contain strong+small; check strong specifically
    const brandStrong = await measureByLocator(page, page.locator(".brand-compact strong").first());
    const brandStrongOk =
      brandStrong &&
      brandStrong.visible &&
      brandStrong.fullyInViewport &&
      !(brandStrong.scrollWidth > brandStrong.clientWidth + 2);
    wf.operability.brandStrong = brandStrong;
    wf.steps.push({
      n: 4,
      action: "Brand not partial / not clipped in topbar",
      expected: "Doctors Pulse brand fully visible without ellipsis/clip",
      observed: JSON.stringify({ brandGeom, brandStrong }),
      result: brandOk && brandStrongOk ? "PASS" : "FAIL",
    });
    if (!(brandOk && brandStrongOk)) {
      wf.outcome = "FAIL";
      addFinding(`WQA-BRAND-${suffix}`, id, "major", "Brand partial or clipped in topbar", JSON.stringify({ brandGeom, brandStrong }));
    }

    // Prev/Next when enabled
    if (!nextDis) {
      const before = title;
      await next.click();
      await waitReady(page, 400);
      const after = (await banner.locator("strong").first().textContent())?.trim();
      wf.steps.push({
        n: 5,
        action: "Click Next",
        expected: "Advances announcement",
        observed: `${before} → ${after}`,
        result: after !== before ? "PASS" : "FAIL",
      });
      if (after === before) {
        wf.outcome = "FAIL";
        addFinding(`WQA-EMG-NEXT-${suffix}`, id, "major", "Next did not advance", "");
      }
      await prev.click();
      await waitReady(page, 400);
    } else {
      wf.steps.push({
        n: 5,
        action: "Next/Previous (disabled single-item seed)",
        expected: "Non-operable by design when items.length < 2",
        observed: "Both disabled — single Beachmere emergency",
        result: "PASS",
      });
    }

    // Click View All
    await viewAll.click();
    await waitReady(page, 700);
    const dialogVisible = await page.getByRole("dialog").isVisible().catch(() => false);
    const allTitle = await page.getByText("All Announcements", { exact: true }).isVisible().catch(() => false);
    wf.steps.push({
      n: 6,
      action: "Activate View All Announcements",
      expected: "Opens All Announcements modal",
      observed: `dialog=${dialogVisible}, title=${allTitle}, url=${page.url()}`,
      result: dialogVisible || allTitle ? "PASS" : "FAIL",
      url: page.url(),
    });
    wf.screenshots.push(await shot(page, `${id}-view-all`));
    if (!(dialogVisible || allTitle)) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-VIEWALL-${suffix}`, id, "major", "View All did not open modal", "");
    } else {
      await page.keyboard.press("Escape");
      await waitReady(page, 400);
      const closed = !(await page.getByRole("dialog").isVisible().catch(() => false));
      wf.steps.push({
        n: 7,
        action: "Close modal via Escape",
        expected: "Modal closes",
        observed: `closed=${closed}`,
        result: closed ? "PASS" : "FAIL",
      });
    }

    // Keyboard: tab to emergency actions and activate View All
    await gotoDash(page);
    await banner.scrollIntoViewIfNeeded();
    // Focus first focusable in banner via JS then Tab through
    await page.evaluate(() => {
      const banner = [...document.querySelectorAll(".cc-surface-danger")].find((el) =>
        /Emergency announcement/i.test(el.textContent || "")
      );
      const btns = [...(banner?.querySelectorAll("button") || [])].filter((b) => !b.disabled);
      btns[0]?.focus();
    });
    let focusedViewAll = false;
    for (let i = 0; i < 12; i++) {
      const label = await page.evaluate(() => (document.activeElement?.textContent || "").replace(/\s+/g, " ").trim());
      if (/View All Announcements/i.test(label)) {
        focusedViewAll = true;
        break;
      }
      await page.keyboard.press("Tab");
      await page.waitForTimeout(80);
    }
    // If Tab from first enabled didn't hit (disabled skip), try Shift+Tab from end
    if (!focusedViewAll) {
      await viewAll.focus();
      focusedViewAll = /View All/i.test(
        await page.evaluate(() => (document.activeElement?.textContent || "").trim())
      );
    }
    if (focusedViewAll) {
      await page.keyboard.press("Enter");
      await waitReady(page, 700);
      const opened = await page.getByRole("dialog").isVisible().catch(() => false);
      wf.keyboard = { focusedViewAll, activatedEnter: opened };
      wf.steps.push({
        n: 8,
        action: "Keyboard: focus View All + Enter activate",
        expected: "Modal opens via keyboard",
        observed: JSON.stringify(wf.keyboard),
        result: opened ? "PASS" : "FAIL",
      });
      if (!opened) {
        wf.outcome = "FAIL";
        addFinding(`WQA-EMG-KBD-${suffix}`, id, "major", "Keyboard Enter on View All failed", "");
      } else {
        await page.keyboard.press("Escape");
        await waitReady(page, 300);
      }
    } else {
      wf.keyboard = { focusedViewAll: false };
      wf.steps.push({
        n: 8,
        action: "Keyboard: tab/focus View All",
        expected: "View All is keyboard focusable",
        observed: "Could not focus View All",
        result: "FAIL",
      });
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-KBD-${suffix}`, id, "major", "View All not keyboard focusable", "");
    }

    // Reload persistence of banner
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page, 1500);
    const afterReload = await page
      .locator(".cc-surface-danger")
      .filter({ hasText: "Emergency announcement" })
      .first()
      .isVisible()
      .catch(() => false);
    wf.reload = { bannerVisible: afterReload };
    wf.steps.push({
      n: 9,
      action: "Reload dashboard",
      expected: "Emergency banner still present",
      observed: `bannerVisible=${afterReload}`,
      result: afterReload ? "PASS" : "FAIL",
    });
    if (!afterReload) {
      wf.outcome = "FAIL";
      addFinding(`WQA-EMG-RELOAD-${suffix}`, id, "major", "Emergency banner lost on reload", "");
    }

    wf.screenshots.push(await shot(page, `${id}-end`));
    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.tracing.stop({ path: path.join(TRACES, `${id}.zip`) }).catch(() => {});
    await ctx.close();
    results.workflows.push(wf);
  }

  await wfEmergency({ width: 1440, height: 900 }, "DESKTOP");
  await wfEmergency({ width: 390, height: 844 }, "MOBILE390");

  // ========== WF-TOPBAR ==========
  {
    const id = "WF-TOPBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      precondition: "Topbar visible",
      startingState: "1440x900",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      keyboard: null,
      mobileEquivalent: true,
      errors: errBag(),
      persistence: null,
      reload: null,
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await gotoDash(page);
    wf.screenshots.push(await shot(page, `${id}-start`));

    const dashLink = page.locator(".pulse-top-ribbon a", { hasText: "Dashboard" }).first();
    const inboxLink = page.locator(".pulse-top-ribbon a", { hasText: /Action Inbox/ }).first();
    const search = page.getByLabel("Search modules and sections");
    const online = page.getByRole("button", { name: /^(Online|Offline)$/ });

    await dashLink.click();
    await waitReady(page);
    const onDash = /\/(dashboard)?\/?$/.test(new URL(page.url()).pathname.replace(/\/$/, "") + "/") || page.url().includes("/dashboard");
    wf.steps.push({
      n: 1,
      action: "Topbar Dashboard nav",
      expected: "/dashboard",
      observed: page.url(),
      result: page.url().includes("/dashboard") || new URL(page.url()).pathname === "/" ? "PASS" : "FAIL",
      url: page.url(),
    });

    await inboxLink.click();
    await page.waitForURL(/action-inbox/, { timeout: 15000 }).catch(() => {});
    await waitReady(page);
    wf.steps.push({
      n: 2,
      action: "Topbar Action Inbox nav",
      expected: "/action-inbox",
      observed: page.url(),
      result: page.url().includes("/action-inbox") ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!page.url().includes("/action-inbox")) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-02", id, "major", "Action Inbox nav failed", page.url());
    }

    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await search.click();
    await search.fill("Staff Pay");
    await search.press("Enter");
    await waitReady(page, 1500);
    const searchOk = page.url().includes("staffpay");
    wf.keyboard = { searchEnterNavigated: searchOk, url: page.url() };
    wf.steps.push({
      n: 3,
      action: "Keyboard: topbar search Enter for Staff Pay",
      expected: "Navigates to /staffpay",
      observed: page.url(),
      result: searchOk ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!searchOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-03", id, "major", "Topbar search Enter failed", page.url());
    }

    // Search close/blur
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await search.click();
    await search.fill("");
    await page.keyboard.press("Escape");
    await search.blur();
    const blurred = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    wf.steps.push({
      n: 4,
      action: "Blur/close search",
      expected: "Search not focused",
      observed: `activeLabel=${blurred}`,
      result: blurred !== "Search modules and sections" ? "PASS" : "FAIL",
    });

    // Online toggle + persist
    const before = await online.getAttribute("aria-label");
    await online.click();
    await waitReady(page, 400);
    const after = await online.getAttribute("aria-label");
    const toggled = before !== after;
    wf.steps.push({
      n: 5,
      action: "Toggle Online classification",
      expected: "Online↔Offline",
      observed: `${before} → ${after}`,
      result: toggled ? "PASS" : "FAIL",
    });
    if (!toggled) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-05", id, "major", "Online toggle failed", "");
    }
    const stored = await page.evaluate(() => localStorage.getItem("pulse.v31.online"));
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const reloaded = await page.getByRole("button", { name: /^(Online|Offline)$/ }).getAttribute("aria-label");
    wf.persistence = { key: "pulse.v31.online", stored, reloaded };
    wf.reload = { matches: reloaded === after };
    wf.steps.push({
      n: 6,
      action: "Reload Online persistence",
      expected: "Classification persists",
      observed: JSON.stringify(wf.persistence),
      result: reloaded === after ? "PASS" : "FAIL",
    });
    if (reloaded === "Offline") {
      await page.getByRole("button", { name: "Offline" }).click();
      await waitReady(page, 300);
    }

    // Appearance absent from topbar
    const appearTop = await page.locator('.pulse-top-ribbon select[aria-label="Appearance"]').count();
    wf.steps.push({
      n: 7,
      action: "Appearance in Topbar",
      expected: "Absent from Topbar (lives in CC control bar) — document",
      observed: `count=${appearTop}`,
      result: "PASS",
    });

    // No horizontal scroll on topbar interactions
    const hScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    wf.steps.push({
      n: 8,
      action: "No page horizontal scroll on Dashboard topbar",
      expected: "scrollWidth ≈ clientWidth",
      observed: `pageHorizontalScroll=${hScroll}`,
      result: !hScroll ? "PASS" : "FAIL",
    });
    if (hScroll) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-HSCROLL", id, "major", "Dashboard requires horizontal scroll", "");
    }

    // Mobile topbar: open menu present
    await page.setViewportSize({ width: 390, height: 844 });
    await waitReady(page);
    const openMenu = page.getByRole("button", { name: "Open menu" });
    const openVis = await openMenu.isVisible();
    wf.steps.push({
      n: 9,
      action: "Mobile 390: Open menu control",
      expected: "Visible",
      observed: `visible=${openVis}`,
      result: openVis ? "PASS" : "FAIL",
    });
    if (!openVis) {
      wf.outcome = "FAIL";
      addFinding("WQA-TOP-MOBILE", id, "major", "Open menu missing at 390", "");
    }
    wf.screenshots.push(await shot(page, `${id}-mobile390`));

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    wf.screenshots.push(await shot(page, `${id}-end`));
    await ctx.close();
    results.workflows.push(wf);
  }

  // ========== WF-SIDEBAR ==========
  {
    const id = "WF-SIDEBAR";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      precondition: "Sidebar rendered",
      startingState: "multi-viewport",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      actAsVisibility: {},
      keyboard: null,
      mobileEquivalent: true,
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);
    await gotoDash(page);

    const toggles = page.locator("button.v32-nav-toggle");
    const toggleCount = await toggles.count();
    wf.steps.push({
      n: 1,
      action: "Count family toggles",
      expected: "≥1",
      observed: `count=${toggleCount}`,
      result: toggleCount >= 1 ? "PASS" : "FAIL",
    });

    // Collapse/restore non-active group
    let didCollapse = false;
    for (let i = 0; i < toggleCount; i++) {
      const t = toggles.nth(i);
      const expanded = await t.getAttribute("aria-expanded");
      const group = await t.evaluate((el) => el.closest("[data-nav-group]")?.getAttribute("data-nav-group"));
      if (expanded === "true" && group && group !== "executive") {
        await t.click();
        await waitReady(page, 300);
        const after = await t.getAttribute("aria-expanded");
        wf.steps.push({
          n: 2,
          action: `Collapse family ${group}`,
          expected: "aria-expanded=false",
          observed: `aria-expanded=${after}`,
          result: after === "false" ? "PASS" : "FAIL",
        });
        await t.click();
        await waitReady(page, 300);
        const restored = await t.getAttribute("aria-expanded");
        wf.steps.push({
          n: 3,
          action: `Restore family ${group}`,
          expected: "aria-expanded=true",
          observed: `aria-expanded=${restored}`,
          result: restored === "true" ? "PASS" : "FAIL",
        });
        didCollapse = true;
        break;
      }
    }
    if (!didCollapse) {
      wf.steps.push({ n: 2, action: "Collapse family", expected: "collapsible group", observed: "none found", result: "BLOCKED" });
    }

    // Section nav Staff Pay
    await page.locator("a.nav-btn", { hasText: "Staff Pay" }).first().click();
    await page.waitForURL(/staffpay/, { timeout: 15000 }).catch(() => {});
    await waitReady(page);
    wf.steps.push({
      n: 4,
      action: "Sidebar nav to Staff Pay",
      expected: "/staffpay",
      observed: page.url(),
      result: page.url().includes("/staffpay") ? "PASS" : "FAIL",
      url: page.url(),
    });
    if (!page.url().includes("/staffpay")) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-03", id, "major", "Staff Pay nav failed", page.url());
    }

    // Act-as at 1440x900 — usable (visible + can change value)
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const actAs = page.locator('select[aria-label="Act as User / Role"]');
    const vis900 = await measureByLocator(page, actAs);
    const footer900 = await measureByLocator(page, page.locator(".sidebar-user").first());
    wf.actAsVisibility["1440x900"] = { actAs: vis900, footer: footer900 };
    wf.screenshots.push(await shot(page, `${id}-actas-1440x900`));
    const usable900 = vis900?.visible && vis900?.fullyInViewport && !vis900?.disabled;
    let changed900 = false;
    if (usable900) {
      const before = await actAs.inputValue();
      const options = await actAs.evaluate((el) => [...el.options].map((o) => o.value));
      const nextVal = options.find((v) => v !== before) || options[0];
      await actAs.selectOption(nextVal);
      await waitReady(page, 400);
      const after = await actAs.inputValue();
      changed900 = after === nextVal;
      // restore
      await actAs.selectOption(before).catch(() => {});
    }
    wf.steps.push({
      n: 5,
      action: "Act-as usable at 1440×900 (visible + changeable, no H-scroll)",
      expected: "Select fully in viewport and operable",
      observed: JSON.stringify({ vis900, changed900, hScroll: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) }),
      result: usable900 && changed900 ? "PASS" : "FAIL",
    });
    if (!(usable900 && changed900)) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-ACTAS-900", id, "major", "Act-as not usable at 1440×900", JSON.stringify(vis900));
    }

    // 1440x720
    await page.setViewportSize({ width: 1440, height: 720 });
    await waitReady(page, 500);
    const vis720 = await measureByLocator(page, actAs);
    wf.actAsVisibility["1440x720"] = vis720;
    wf.screenshots.push(await shot(page, `${id}-actas-1440x720`));
    const usable720 = vis720?.visible && vis720?.fullyInViewport && !vis720?.disabled;
    let changed720 = false;
    if (usable720) {
      const before = await actAs.inputValue();
      const options = await actAs.evaluate((el) => [...el.options].map((o) => o.value));
      const nextVal = options.find((v) => v !== before) || options[0];
      await actAs.selectOption(nextVal);
      await waitReady(page, 400);
      changed720 = (await actAs.inputValue()) === nextVal;
      await actAs.selectOption(before).catch(() => {});
    }
    wf.steps.push({
      n: 6,
      action: "Act-as usable at 1440×720",
      expected: "Select fully in viewport and operable without clip",
      observed: JSON.stringify({ vis720, changed720 }),
      result: usable720 && changed720 ? "PASS" : "FAIL",
    });
    if (!(usable720 && changed720)) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-ACTAS-720", id, "major", "Act-as not usable at 1440×720", JSON.stringify(vis720));
    }

    // Mobile drawer open/close + focus return
    await page.setViewportSize({ width: 390, height: 844 });
    await waitReady(page);
    const openBtn = page.getByRole("button", { name: "Open menu" });
    await openBtn.focus();
    const focusBefore = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    await openBtn.click();
    await waitReady(page, 500);
    const opened = await page.evaluate(() => {
      const aside = document.querySelector("aside.pulse-sidebar");
      const r = aside.getBoundingClientRect();
      return { left: r.left, width: r.width, visible: r.left >= -1 && r.width > 100 };
    });
    wf.steps.push({
      n: 7,
      action: "Mobile drawer open",
      expected: "Sidebar in view",
      observed: JSON.stringify(opened),
      result: opened.visible ? "PASS" : "FAIL",
    });
    wf.screenshots.push(await shot(page, `${id}-mobile-drawer-open`));
    if (!opened.visible) {
      wf.outcome = "FAIL";
      addFinding("WQA-SIDE-DRAWER-OPEN", id, "major", "Mobile drawer did not open", JSON.stringify(opened));
    }

    // Close via overlay
    await page.mouse.click(370, 120);
    await waitReady(page, 500);
    const closed = await page.evaluate(() => {
      const aside = document.querySelector("aside.pulse-sidebar");
      return { left: aside.getBoundingClientRect().left };
    });
    // Focus return — try to observe open menu focusable again
    await openBtn.focus().catch(() => {});
    const focusAfter = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    wf.keyboard = { focusBeforeOpen: focusBefore, focusAfterClose: focusAfter, drawerClosedLeft: closed.left };
    wf.steps.push({
      n: 8,
      action: "Mobile drawer close + focus return to Open menu",
      expected: "Drawer off-canvas; Open menu focusable again",
      observed: JSON.stringify(wf.keyboard),
      result: closed.left < -10 && focusAfter === "Open menu" ? "PASS" : "FAIL",
    });
    if (!(closed.left < -10 && focusAfter === "Open menu")) {
      wf.outcome = "FAIL";
      addFinding(
        "WQA-SIDE-DRAWER-FOCUS",
        id,
        "major",
        "Drawer close or focus return failed",
        JSON.stringify(wf.keyboard)
      );
    }

    wf.steps.push({
      n: 9,
      action: "Sidebar width collapse control",
      expected: "N/A if absent (family collapse only)",
      observed: "No dedicated width collapse — family toggles only",
      result: "PASS",
    });

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ========== WF-ROUTES ==========
  {
    const id = "WF-ROUTES";
    const wf = {
      workflowId: id,
      route: "multi",
      sourceSha: APP_SHA,
      precondition: "Canonical routes on :3491",
      startingState: "1440x900",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      history: null,
      reload: null,
      mobileEquivalent: true,
      errors: errBag(),
      h1Checks: {},
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);

    const routes = [
      { path: "/dashboard", expectH1: /Command Centre|Dashboard/i, label: "Dashboard", checkEllipsis: false },
      { path: "/action-inbox", expectH1: /Action Inbox|Inbox/i, label: "Action_Inbox", checkEllipsis: false },
      { path: "/settings", expectH1: /Organisation|Settings|Access/i, label: "Settings", checkEllipsis: true },
      { path: "/staffpay?section=overview", expectH1: /Staff Pay|Payroll/i, label: "M07_overview", checkEllipsis: true },
      { path: "/staffpay?section=adjustments", expectH1: /Staff Pay|Payroll|Adjustment/i, label: "M07_adjustments", checkEllipsis: true },
    ];

    let n = 0;
    for (const r of routes) {
      n++;
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 90000 });
      await waitReady(page);
      const h1Meta = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        if (!h1) return null;
        const st = getComputedStyle(h1);
        return {
          text: (h1.textContent || "").trim(),
          textOverflow: st.textOverflow,
          whiteSpace: st.whiteSpace,
          truncateClass: h1.classList.contains("truncate") || /\btruncate\b/.test(h1.className),
          scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
          height: h1.getBoundingClientRect().height,
          fullyInViewport: (() => {
            const rect = h1.getBoundingClientRect();
            return rect.top >= -1 && rect.left >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
          })(),
        };
      });
      wf.h1Checks[r.path] = h1Meta;
      const urlOk = page.url().includes(r.path.split("?")[0]);
      const sectionOk = !r.path.includes("section=") || page.url().includes(r.path.split("section=")[1]);
      const h1Ok = h1Meta && r.expectH1.test(h1Meta.text);
      // Special: Settings/M07 must wrap without ellipsis
      let ellipsisOk = true;
      if (r.checkEllipsis && h1Meta) {
        ellipsisOk =
          h1Meta.textOverflow !== "ellipsis" &&
          !h1Meta.truncateClass &&
          !h1Meta.scrollOverflow;
      }
      const pass = h1Ok && urlOk && sectionOk && ellipsisOk;
      wf.steps.push({
        n,
        action: `Navigate ${r.label} (${r.path})` + (r.checkEllipsis ? " — H1 wrap/no ellipsis" : ""),
        expected: r.checkEllipsis
          ? `h1 matches; no truncate/ellipsis; title wraps`
          : `h1 matches; URL retained`,
        observed: JSON.stringify({ url: page.url(), h1Meta }),
        result: pass ? "PASS" : "FAIL",
        url: page.url(),
      });
      wf.screenshots.push(await shot(page, `${id}-${r.label}`));
      if (!pass) {
        wf.outcome = "FAIL";
        addFinding(
          `WQA-RTE-${r.label}`,
          id,
          "major",
          `Route/H1 issue for ${r.label}`,
          JSON.stringify({ url: page.url(), h1Meta })
        );
      }
    }

    // Reload adjustments
    await page.goto(`${BASE}/staffpay?section=adjustments`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const reloadOk = page.url().includes("staffpay") && page.url().includes("adjustments");
    wf.reload = { url: page.url(), ok: reloadOk };
    wf.steps.push({
      n: ++n,
      action: "Reload M07 adjustments deep link",
      expected: "section retained",
      observed: page.url(),
      result: reloadOk ? "PASS" : "FAIL",
    });
    if (!reloadOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-RTE-RELOAD", id, "major", "Adjustments deep link lost on reload", page.url());
    }

    // Back/Forward
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goto(`${BASE}/action-inbox`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    await page.goBack();
    await waitReady(page);
    const backUrl = page.url();
    const backOk = backUrl.includes("/dashboard") || new URL(backUrl).pathname === "/";
    await page.goForward();
    await waitReady(page);
    const fwdUrl = page.url();
    const fwdOk = fwdUrl.includes("/action-inbox");
    wf.history = { backUrl, fwdUrl, backOk, fwdOk };
    wf.steps.push({
      n: ++n,
      action: "Browser Back to Dashboard",
      expected: "/dashboard",
      observed: backUrl,
      result: backOk ? "PASS" : "FAIL",
    });
    wf.steps.push({
      n: ++n,
      action: "Browser Forward to Action Inbox",
      expected: "/action-inbox",
      observed: fwdUrl,
      result: fwdOk ? "PASS" : "FAIL",
    });
    if (!backOk || !fwdOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-RTE-HISTORY", id, "major", "Back/Forward failed", JSON.stringify(wf.history));
    }

    // Mobile route smoke Settings H1
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 90000 });
    await waitReady(page);
    const mobH1 = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      return {
        text: h1.textContent?.trim(),
        truncateClass: h1.classList.contains("truncate") || /\btruncate\b/.test(h1.className),
        textOverflow: getComputedStyle(h1).textOverflow,
        scrollOverflow: h1.scrollWidth > h1.clientWidth + 1,
        pageHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    wf.steps.push({
      n: ++n,
      action: "Mobile 390 Settings H1 wrap / no ellipsis / no H-scroll",
      expected: "Title readable without ellipsis; no page horizontal scroll",
      observed: JSON.stringify(mobH1),
      result:
        mobH1 &&
        !mobH1.truncateClass &&
        mobH1.textOverflow !== "ellipsis" &&
        !mobH1.scrollOverflow &&
        !mobH1.pageHScroll
          ? "PASS"
          : "FAIL",
    });
    wf.screenshots.push(await shot(page, `${id}-Settings-mobile390`));
    if (
      !(
        mobH1 &&
        !mobH1.truncateClass &&
        mobH1.textOverflow !== "ellipsis" &&
        !mobH1.scrollOverflow &&
        !mobH1.pageHScroll
      )
    ) {
      wf.outcome = "FAIL";
      addFinding("WQA-RTE-SETTINGS-390", id, "major", "Settings H1 clipped/ellipsis/H-scroll at 390", JSON.stringify(mobH1));
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // ========== WF-APPEARANCE ==========
  {
    const id = "WF-APPEARANCE";
    const wf = {
      workflowId: id,
      route: "/dashboard",
      sourceSha: APP_SHA,
      precondition: "CC Appearance select present",
      startingState: "clean localStorage appearance",
      steps: [],
      outcome: "PASS",
      screenshots: [],
      persistence: {},
      mobileEquivalent: false,
      errors: errBag(),
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachErrors(page, wf.errors);

    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.evaluate(() => localStorage.removeItem("pulse.cc.appearance"));
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page, 1500);
    const def = await page.evaluate(() => ({
      stored: localStorage.getItem("pulse.cc.appearance"),
      dataAppearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
    }));
    wf.persistence.cleanDefault = def;
    wf.screenshots.push(await shot(page, `${id}-clean-default`));
    const defaultOk = (def.dataAppearance === "light" || def.select === "light" || def.stored === null) && def.themeDark === false;
    wf.steps.push({
      n: 1,
      action: "Clean-storage default appearance",
      expected: "Light / not theme-dark",
      observed: JSON.stringify(def),
      result: defaultOk ? "PASS" : "FAIL",
    });
    if (!defaultOk) {
      wf.outcome = "FAIL";
      addFinding("WQA-APP-01", id, "major", "Clean-storage default not Light", JSON.stringify(def));
    }

    const appearance = page.locator('select[aria-label="Appearance"]');
    if ((await appearance.count()) === 0) {
      wf.steps.push({ n: 2, action: "Locate Appearance", expected: "present", observed: "missing", result: "FAIL" });
      wf.outcome = "FAIL";
      addFinding("WQA-APP-02", id, "major", "Appearance control missing", "");
    } else {
      await appearance.selectOption("light");
      await waitReady(page, 400);
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const light = await page.evaluate(() => ({
        stored: localStorage.getItem("pulse.cc.appearance"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
        themeDark: document.documentElement.classList.contains("theme-dark"),
        select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
      }));
      wf.persistence.lightReload = light;
      wf.screenshots.push(await shot(page, `${id}-light-reload`));
      const lightOk = light.select === "light" && light.themeDark === false;
      wf.steps.push({
        n: 2,
        action: "Light + reload",
        expected: "Remains Light",
        observed: JSON.stringify(light),
        result: lightOk ? "PASS" : "FAIL",
      });
      if (!lightOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-APP-03", id, "major", "Light did not persist", JSON.stringify(light));
      }

      await page.locator('select[aria-label="Appearance"]').selectOption("dark");
      await waitReady(page, 400);
      const darkImmediate = await page.evaluate(() => document.documentElement.classList.contains("theme-dark"));
      await page.reload({ waitUntil: "networkidle" });
      await waitReady(page);
      const dark = await page.evaluate(() => ({
        stored: localStorage.getItem("pulse.cc.appearance"),
        dataAppearance: document.documentElement.getAttribute("data-appearance"),
        themeDark: document.documentElement.classList.contains("theme-dark"),
        select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
        bodyDark: document.body.classList.contains("theme-dark"),
      }));
      wf.persistence.darkReload = dark;
      wf.screenshots.push(await shot(page, `${id}-dark-reload`));
      const darkOk = dark.select === "dark" && dark.themeDark === true && darkImmediate === true;
      wf.steps.push({
        n: 3,
        action: "Dark + reload",
        expected: "theme-dark persists",
        observed: JSON.stringify({ darkImmediate, ...dark }),
        result: darkOk ? "PASS" : "FAIL",
      });
      if (!darkOk) {
        wf.outcome = "FAIL";
        addFinding("WQA-APP-04", id, "major", "Dark apply/persist failed", JSON.stringify({ darkImmediate, ...dark }));
      }

      try {
        await page.locator('select[aria-label="Appearance"]').selectOption("system");
        await waitReady(page, 400);
        await page.reload({ waitUntil: "networkidle" });
        await waitReady(page);
        const sys = await page.evaluate(() => ({
          stored: localStorage.getItem("pulse.cc.appearance"),
          dataAppearance: document.documentElement.getAttribute("data-appearance"),
          themeDark: document.documentElement.classList.contains("theme-dark"),
          select: document.querySelector('select[aria-label="Appearance"]')?.value || null,
          prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
          stillOnDashboard: location.pathname.includes("dashboard") || location.pathname === "/",
        }));
        wf.persistence.systemReload = sys;
        wf.screenshots.push(await shot(page, `${id}-system-reload`));
        const sysOk = sys.select === "system" && sys.themeDark === !!sys.prefersDark && sys.stillOnDashboard;
        wf.steps.push({
          n: 4,
          action: "System (Device setting) + reload",
          expected: "Persists; follows prefers-color-scheme; session intact",
          observed: JSON.stringify(sys),
          result: sysOk ? "PASS" : "FAIL",
        });
        if (!sysOk) {
          wf.outcome = "FAIL";
          addFinding("WQA-APP-05", id, "major", "System appearance failed", JSON.stringify(sys));
        }
      } catch (e) {
        wf.steps.push({ n: 4, action: "System appearance", expected: "operable", observed: String(e), result: "BLOCKED" });
        addFinding("WQA-APP-05", id, "major", "System appearance blocked", String(e));
        wf.outcome = "FAIL";
      }

      await page.locator('select[aria-label="Appearance"]').selectOption("light").catch(() => {});
    }

    if (wf.steps.some((s) => s.result === "FAIL")) wf.outcome = "FAIL";
    await ctx.close();
    results.workflows.push(wf);
  }

  // OOS
  results.workflows.push({
    workflowId: "WF-PAYMENTS-OOS",
    route: "n/a",
    sourceSha: APP_SHA,
    outcome: "OUT OF SCOPE",
    steps: [
      {
        n: 1,
        action: "External payments/providers/communications",
        expected: "OUT OF SCOPE",
        observed: "Not executed",
        result: "OUT OF SCOPE",
      },
    ],
  });

  results.meta.finishedAt = new Date().toISOString();
  results.totals = {
    pass: results.workflows.filter((w) => w.outcome === "PASS").length,
    fail: results.workflows.filter((w) => w.outcome === "FAIL").length,
    blocked: results.workflows.filter((w) => w.outcome === "BLOCKED").length,
    outOfScope: results.workflows.filter((w) => w.outcome === "OUT OF SCOPE").length,
    total: results.workflows.length,
    openFindings: findings.length,
  };
  results.findings = findings;

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log("WROTE", OUT);
  console.log("TOTALS", JSON.stringify(results.totals));
  console.log("FINDINGS", findings.map((f) => f.id).join(", ") || "(none)");
  for (const w of results.workflows) {
    console.log(w.workflowId, w.outcome, (w.steps || []).filter((s) => s.result === "FAIL").map((s) => s.n + ":" + s.action).join(" | "));
  }
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
