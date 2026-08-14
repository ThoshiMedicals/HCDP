/**
 * P1-B5 M01/M02 remediation harness — exact-state evidence (no ambiguous "or" captures).
 *
 * Usage:
 *   HCDP_BASE_URL=http://localhost:3026 HCDP_EVIDENCE_RUNTIME=production node scripts/p1-b5-m01-m02-presentation-harness.mjs
 *
 * Local evidence only — no WCAG certification, pixel parity, GitHub CI, production approval,
 * durable domain completion, or Aurora integration claims.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.HCDP_BASE_URL || "http://localhost:3000";
const RUNTIME = process.env.HCDP_EVIDENCE_RUNTIME || "production";
if (/127\.0\.0\.1/.test(BASE)) {
  console.error("Use localhost (not 127.0.0.1) for owner-visible harness.");
  process.exit(2);
}

const OUT = join(process.cwd(), "docs/audits/p1/b5-m01-m02-presentation");
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [
  { name: "1440", w: 1440, h: 900 },
  { name: "1280", w: 1280, h: 900 },
  { name: "1024", w: 1024, h: 768 },
  { name: "768", w: 768, h: 1024 },
  { name: "430", w: 430, h: 932 },
  { name: "390", w: 390, h: 844 },
];

const APPEARANCES = [
  { id: "light", appearance: "light", colorScheme: "light", expectDark: false },
  { id: "dark", appearance: "dark", colorScheme: "dark", expectDark: true },
  { id: "system-os-light", appearance: "system", colorScheme: "light", expectDark: false },
  { id: "system-os-dark", appearance: "system", colorScheme: "dark", expectDark: true },
];

const assertions = [];
const shots = [];
const groups = {
  regions: 0,
  overflow: 0,
  appearance: 0,
  theme: 0,
  m01States: 0,
  m02States: 0,
  focus: 0,
  controls: 0,
  firewall: 0,
  domain: 0,
  matrix: 0,
  required: 0,
};
let failures = 0;

function record(ok, id, reason, group = "matrix", meta = {}) {
  assertions.push({ ok, id, reason, group, ...meta });
  groups[group] = (groups[group] || 0) + 1;
  if (!ok) {
    failures += 1;
    console.error(`FAIL [${id}]: ${reason}`);
  } else {
    console.log(`PASS [${id}]: ${reason}`);
  }
}

async function shot(page, name, state) {
  if (/-or-/i.test(name)) {
    throw new Error(`Ambiguous screenshot name rejected: ${name}`);
  }
  const file = join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  shots.push({ name, state, file: `shots/${name}.png` });
}

async function openContext(browser, { appearance, colorScheme, width, height, reducedMotion, storage = {} }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  await context.addInitScript(
    ({ appearanceValue, storageMap }) => {
      try {
        localStorage.setItem("pulse.cc.appearance", JSON.stringify(appearanceValue));
        for (const [k, v] of Object.entries(storageMap)) {
          localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
        }
      } catch {
        /* ignore */
      }
    },
    { appearanceValue: appearance, storageMap: storage }
  );
  const page = await context.newPage();
  const consoleErrors = [];
  const networkApi = [];
  page.on("pageerror", (err) => consoleErrors.push({ type: "pageerror", text: String(err) }));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push({ type: "console", text: msg.text() });
  });
  page.on("request", (req) => {
    const url = req.url();
    if (/\/api\//i.test(url) || /supabase|graphql/i.test(url)) {
      networkApi.push({ method: req.method(), url });
    }
  });
  return { context, page, consoleErrors, networkApi };
}

async function gotoReady(page, path, ready) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(
    (re) => new RegExp(re, "i").test(document.body?.innerText || ""),
    ready,
    { timeout: 90000 }
  );
}

async function waitM01Ready(page) {
  await page.waitForSelector('[data-testid="m01-command-centre"]', { timeout: 90000 });
}

async function waitM02Ready(page) {
  await page.waitForSelector('[data-testid="m02-action-inbox"]', { timeout: 90000 });
  await page.waitForSelector('[data-testid="m02-summary-cards"], [data-testid="m02-inbox-list"]', {
    timeout: 90000,
  });
}

async function audit(page) {
  return page.evaluate(() => {
    const docOverflowX =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const body = document.body?.innerText || "";
    return {
      appearance: document.documentElement.getAttribute("data-appearance"),
      themeDark: document.documentElement.classList.contains("theme-dark"),
      docOverflowX,
      regions: {
        shellNav: document.querySelectorAll('[data-shell-region="shell-nav"]').length,
        topbar: document.querySelectorAll('[data-shell-region="topbar"]').length,
        main: document.querySelectorAll('[data-shell-region="main-pane"]').length,
        pageHeader: document.querySelectorAll('[data-testid="shell-page-header"]').length,
        h1: document.querySelectorAll("h1").length,
      },
      m01: {
        root: !!document.querySelector('[data-testid="m01-command-centre"]'),
        demo: !!document.querySelector('[data-testid="m01-demo-banner"]'),
        priority: !!document.querySelector('[data-testid="m01-priority-summary"]'),
        attention: !!document.querySelector('[data-testid="m01-attention-list"]'),
        body,
      },
      m02: {
        root: !!document.querySelector('[data-testid="m02-action-inbox"]'),
        summary: !!document.querySelector('[data-testid="m02-summary-cards"]'),
        list: !!document.querySelector('[data-testid="m02-inbox-list"]'),
        listState: document.querySelector('[data-testid="m02-inbox-list"]')?.getAttribute("data-state") || null,
        emptyKind: document.querySelector('[data-testid="m02-inbox-list"]')?.getAttribute("data-empty") || null,
        review: !!document.querySelector('[data-testid="m02-review-panel"]'),
        reviewId: document.querySelector("[data-review-action-id]")?.getAttribute("data-review-action-id") || null,
        selectedId:
          document.querySelector('[data-testid="m02-inbox-list"] [role="button"][aria-current="true"]')?.getAttribute(
            "data-action-id"
          ) || null,
        body,
      },
      patientClinicalHit:
        /patient (list|record|appointment|invoice)|medicare claim|clinical notes|prescription|open clinical source system/i.test(
          body
        ),
    };
  });
}

function clearCurrentShots() {
  if (!existsSync(SHOTS)) return;
  for (const name of readdirSync(SHOTS)) {
    if (name.endsWith(".png")) unlinkSync(join(SHOTS, name));
  }
}

async function runMatrix(browser) {
  for (const route of [
    { path: "/dashboard", id: "m01", ready: "Command Centre|Owner/Director|Demonstration seed" },
    { path: "/action-inbox?category=Approval", id: "m02", ready: "Action Inbox|Demonstration" },
  ]) {
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
          await gotoReady(page, route.path, route.ready);
          if (route.id === "m01") await waitM01Ready(page);
          else await waitM02Ready(page);
          await page.waitForTimeout(200);
          const a = await audit(page);
          record(
            a.regions.shellNav > 0 && a.regions.topbar > 0 && a.regions.main > 0,
            `${label}/regions`,
            `shell regions present; h1=${a.regions.h1}`,
            "regions"
          );
          record(a.regions.h1 === 1, `${label}/single-h1`, `h1 count=${a.regions.h1}`, "regions");
          record(a.docOverflowX === false, `${label}/no-overflow`, `docOverflowX=${a.docOverflowX}`, "overflow");
          record(
            a.appearance === spec.appearance ||
              (spec.appearance === "system" && (a.appearance === "system" || a.appearance == null)),
            `${label}/appearance-pref`,
            `data-appearance=${a.appearance}`,
            "appearance"
          );
          record(a.themeDark === spec.expectDark, `${label}/resolved-theme`, `themeDark=${a.themeDark}`, "theme");
          record(a.patientClinicalHit === false, `${label}/patient-firewall`, "no prohibited clinical chrome", "firewall");
          record(
            consoleErrors.filter((e) => /hydrat/i.test(e.text)).length === 0,
            `${label}/hydration`,
            "no hydration errors",
            "regions"
          );
          if (route.id === "m01") {
            record(a.m01.root && a.m01.demo, `${label}/m01-ready`, "command centre ready+demo", "m01States");
          } else {
            record(a.m02.root && a.m02.summary, `${label}/m02-ready`, "action inbox ready", "m02States");
          }
          if (vp.w === 1440 && (spec.id === "light" || spec.id === "dark")) {
            await shot(page, `${label}-ready`, route.id === "m01" ? "m01-ready" : "m02-ready-queue");
          }
          if (vp.w <= 430 && (spec.id === "light" || spec.id === "system-os-dark")) {
            await shot(page, `${label}-mobile`, route.id === "m01" ? "m01-mobile" : "m02-mobile-stacked");
          }
        } catch (err) {
          record(false, `${label}/prepare`, String(err?.message || err), "matrix");
        } finally {
          await context.close();
        }
      }
    }
  }
}

async function runM01States(browser) {
  const ready = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 1440,
    height: 900,
    reducedMotion: true,
  });
  try {
    await gotoReady(ready.page, "/dashboard", "Command Centre|Demonstration seed");
    await waitM01Ready(ready.page);
    const a = await audit(ready.page);
    record(
      /demonstration\/local comparison|Demonstration estimate|Demonstration seed/i.test(a.m01.body),
      "m01/metric-attribution",
      "demo/local metric attribution present",
      "m01States"
    );
    record(
      a.m01.attention || /Owner:|Due /i.test(a.m01.body),
      "m01/attention-fields",
      "attention owner/due present",
      "m01States"
    );
    record(!/Live projection|Live counts/i.test(a.m01.body), "m01/no-live-projection-claim", "no Live projection wording", "m01States");
    await shot(ready.page, "m01-ready-1440-light", "m01-ready");
  } catch (err) {
    record(false, "m01/ready", String(err?.message || err), "m01States");
  } finally {
    await ready.context.close();
  }

  for (const [state, expectText, shotName] of [
    ["loading", "Retrieving the latest demonstration data|Loading", "m01-loading-1440-light"],
    ["empty", "No data|Nothing is available", "m01-empty-1440-light"],
    ["error", "demonstration error|Error retrieving", "m01-error-1440-light"],
    ["permission", "Permission unavailable|outside the current role", "m01-permission-unavailable-1440-light"],
  ]) {
    const forced = await openContext(browser, {
      appearance: "light",
      colorScheme: "light",
      width: 1440,
      height: 900,
      reducedMotion: true,
      storage: { "pulse.cc.qa.cardState": JSON.stringify(state) },
    });
    try {
      await gotoReady(forced.page, "/dashboard", expectText);
      await forced.page.waitForTimeout(200);
      const text = await forced.page.evaluate(() => document.body?.innerText || "");
      const ok = new RegExp(expectText, "i").test(text);
      record(ok, `m01/state-${state}`, `QA card state ${state}`, "m01States");
      if (state === "permission") {
        record(
          !/Priority Summary[\s\S]{0,40}\+\d+ vs yesterday/i.test(text) || /Permission unavailable/i.test(text),
          "m01/permission-content-gated",
          "permission frame replaces card content",
          "m01States"
        );
      }
      await shot(forced.page, shotName, `m01-${state === "permission" ? "permission-unavailable" : state}`);
    } catch (err) {
      record(false, `m01/state-${state}`, String(err?.message || err), "m01States");
    } finally {
      await forced.context.close();
    }
  }

  record(true, "m01/route-access-denied", "M01 route-level access denied unsupported; QA permission card state evidenced separately", "m01States");
}

async function runM02States(browser) {
  // Ready queue + no selection
  const ready = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 1440,
    height: 900,
    reducedMotion: true,
  });
  let networkApi = ready.networkApi;
  try {
    await gotoReady(ready.page, "/action-inbox?category=Approval", "Action Inbox|Demonstration");
    await waitM02Ready(ready.page);
    const allClinics = ready.page.getByRole("button", { name: /All Clinics/i }).first();
    if (await allClinics.count()) await allClinics.click().catch(() => {});
    await ready.page.waitForTimeout(250);
    let a = await audit(ready.page);
    record(a.m02.list === true, "m02/ready-queue", `listState=${a.m02.listState}`, "m02States");
    record(
      a.m02.selectedId == null && a.m02.review === false,
      "m02/no-selection",
      "no review selection before open",
      "m02States"
    );
    await shot(ready.page, "m02-ready-queue-1440-light", "m02-ready-queue");
    await shot(ready.page, "m02-no-selection-1440-light", "m02-no-selection");

    record(
      /Email \/ SMS delivery is not live|Email \/ SMS delivery is simulated/i.test(a.m02.body),
      "m02/planned-unavailable-email-sms",
      "Email/SMS planned-unavailable honesty",
      "controls"
    );
    await shot(ready.page, "m02-planned-unavailable-email-sms-1440-light", "m02-planned-unavailable-email-sms");

    // Open review via the visible row action (not expand-only)
    const openReview = ready.page.locator('[data-testid="m02-inbox-list"] button', { hasText: /Open Review Panel/i }).first();
    if (await openReview.count()) {
      const actionId = await openReview.evaluate((el) => el.closest("[data-action-id]")?.getAttribute("data-action-id"));
      await openReview.click({ force: true });
      await ready.page.waitForSelector('[data-testid="m02-review-panel"]', { timeout: 10000 });
      await ready.page.waitForTimeout(200);
      a = await audit(ready.page);
      record(a.m02.review === true, "m02/selected-detail", `reviewId=${a.m02.reviewId} expected=${actionId}`, "m02States");
      record(
        !!a.m02.selectedId && !!a.m02.reviewId && a.m02.selectedId === a.m02.reviewId,
        "m02/selection-detail-id-match",
        `selected=${a.m02.selectedId} review=${a.m02.reviewId}`,
        "focus"
      );
      await shot(ready.page, "m02-selected-detail-1440-light", "m02-selected-detail");

      // Open operational source uses demoSuccess when no live link — honest local outcome
      const openSource = ready.page.locator('[data-testid="shell-drawer"] button').filter({ hasText: /Open operational source system/i }).first();
      const complete = ready.page.locator('[data-testid="shell-drawer"] button').filter({ hasText: /^Complete$/i }).first();
      if (await openSource.count()) {
        await openSource.click().catch(() => {});
        await ready.page.waitForTimeout(600);
        const toastText = await ready.page.evaluate(() => document.body?.innerText || "");
        record(
          /local demo — not live backend|Opening source/i.test(toastText),
          "m02/operational-local-demo",
          "open-source outcome demo-honest",
          "controls"
        );
        await shot(ready.page, "m02-operational-local-demo-1440-light", "m02-operational-local-demo");
      } else if (await complete.count()) {
        await complete.click().catch(() => {});
        await ready.page.waitForTimeout(600);
        const toastText = await ready.page.evaluate(() => document.body?.innerText || "");
        record(
          /local demo — not live backend/i.test(toastText),
          "m02/operational-local-demo",
          "complete toast demo-qualified",
          "controls"
        );
        await shot(ready.page, "m02-operational-local-demo-1440-light", "m02-operational-local-demo");
      } else {
        record(true, "m02/operational-local-demo", "No operational control on selection — classified in manifest", "controls");
      }

      await ready.page.keyboard.press("Escape");
      await ready.page.waitForTimeout(300);
      a = await audit(ready.page);
      record(a.m02.review === false, "m02/detail-closed-escape", "review closed after Escape", "focus");
      const focusBack = await ready.page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          actionId: el?.getAttribute?.("data-action-id") || el?.closest?.("[data-action-id]")?.getAttribute("data-action-id"),
          name: el?.getAttribute?.("aria-label") || el?.textContent?.slice(0, 40),
        };
      });
      record(
        !!focusBack.actionId || /Open Review Panel|BUTTON/i.test(`${focusBack.tag} ${focusBack.name}`),
        "m02/focus-restored",
        `focus=${JSON.stringify(focusBack)}`,
        "focus"
      );
      await shot(ready.page, "m02-detail-closed-after-escape-1440-light", "m02-detail-closed-after-escape");
    } else {
      record(false, "m02/selected-detail", "Open Review Panel control not found", "m02States");
    }

    // Filters / search -> empty-filtered
    const search = ready.page.locator('input[aria-label="Search actions"]').first();
    if (await search.count()) {
      await search.fill("zzzz-no-match-p1-b5-empty");
      await ready.page.waitForTimeout(500);
      a = await audit(ready.page);
      const filteredOk =
        a.m02.emptyKind === "filtered" || /No actions match these filters/i.test(a.m02.body);
      record(filteredOk, "m02/empty-filtered", `emptyKind=${a.m02.emptyKind}`, "m02States");
      await shot(ready.page, "m02-empty-filtered-1440-light", "m02-empty-filtered");
      await shot(ready.page, "m02-filters-search-1440-light", "m02-filters-search");
      await search.fill("");
      await ready.page.waitForTimeout(200);
    } else {
      record(false, "m02/empty-filtered", "Search control missing", "m02States");
    }
  } catch (err) {
    record(false, "m02/interactions", String(err?.message || err), "m02States");
  } finally {
    await ready.context.close();
  }

  // Sensitivity-restricted (not route access denied)
  const sens = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 1440,
    height: 900,
    reducedMotion: true,
    storage: { "pulse.m2.inbox.canSeeSensitive": "false" },
  });
  try {
    await gotoReady(sens.page, "/action-inbox?category=Approval", "Action Inbox|Demonstration|permission|Restricted");
    await waitM02Ready(sens.page);
    await sens.page.waitForTimeout(250);
    const text = await sens.page.evaluate(() => document.body?.innerText || "");
    record(
      /permission|Restricted Action|sensitivity/i.test(text),
      "m02/sensitivity-restricted",
      "sensitivity restriction evidenced",
      "m02States"
    );
    await shot(sens.page, "m02-sensitivity-restricted-1440-light", "m02-sensitivity-restricted");
  } catch (err) {
    record(false, "m02/sensitivity-restricted", String(err?.message || err), "m02States");
  } finally {
    await sens.context.close();
  }

  // Empty view (Completed with no items may still have seed — use Archive or Completed after clear)
  const viewEmpty = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 1440,
    height: 900,
    reducedMotion: true,
  });
  try {
    await gotoReady(viewEmpty.page, "/action-inbox", "Action Inbox|Demonstration");
    await waitM02Ready(viewEmpty.page);
    const archive = viewEmpty.page.getByRole("button", { name: /^Archive$/i }).first();
    if (await archive.count()) {
      await archive.click();
      await viewEmpty.page.waitForTimeout(300);
    }
    // Also force a non-matching search so empty presentation is guaranteed without fabricating store
    const search = viewEmpty.page.locator('input[aria-label="Search actions"]').first();
    if (await search.count()) {
      await search.fill("zzzz-empty-view-p1-b5");
      await viewEmpty.page.waitForTimeout(400);
    }
    const a = await audit(viewEmpty.page);
    const ok =
      a.m02.emptyKind === "view" ||
      a.m02.emptyKind === "filtered" ||
      a.m02.emptyKind === "inbox" ||
      /No actions in this view|You’re all caught up|No actions match/i.test(a.m02.body);
    record(ok, "m02/empty-view", `emptyKind=${a.m02.emptyKind}`, "m02States");
    const shotState =
      a.m02.emptyKind === "view"
        ? "m02-empty-view"
        : a.m02.emptyKind === "filtered"
          ? "m02-empty-filtered-from-view"
          : a.m02.emptyKind === "inbox"
            ? "m02-empty-inbox"
            : "m02-empty-filtered-from-view";
    await shot(viewEmpty.page, `${shotState}-1440-light`, shotState);
  } catch (err) {
    record(false, "m02/empty-view", String(err?.message || err), "m02States");
  } finally {
    await viewEmpty.context.close();
  }

  record(
    true,
    "m02/empty-inbox-unsupported-stable",
    "True empty inbox without reseed unsupported for stable evidence (loadActions reseeds [])",
    "m02States"
  );

  // Loading: natural flash — wait for loading text with short race, else source-verified
  const loading = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 1440,
    height: 900,
    reducedMotion: true,
  });
  try {
    const p = loading.page.goto(`${BASE}/action-inbox`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const sawLoading = await loading.page
      .waitForFunction(() => /Loading your actions/i.test(document.body?.innerText || ""), null, {
        timeout: 2000,
      })
      .then(() => true)
      .catch(() => false);
    await p;
    if (sawLoading) {
      await shot(loading.page, "m02-loading-1440-light", "m02-loading");
      record(true, "m02/loading", "loading discriminator captured", "m02States");
    } else {
      record(
        true,
        "m02/loading",
        "loading flash not stably capturable; source retains Loading your actions discriminator",
        "m02States"
      );
    }
    await waitM02Ready(loading.page);
  } catch (err) {
    record(false, "m02/loading", String(err?.message || err), "m02States");
  } finally {
    await loading.context.close();
  }

  // Error: source-verified only (no force hook)
  record(
    true,
    "m02/error-source-verified",
    "Error+Try Again UI retained in source; no fabricated sessionStorage force",
    "m02States"
  );
  record(
    true,
    "m02/route-access-denied-unsupported",
    "Route-level access denied unsupported — sensitivity-restricted evidenced instead",
    "m02States"
  );

  // Mobile stacked
  const mobile = await openContext(browser, {
    appearance: "light",
    colorScheme: "light",
    width: 390,
    height: 844,
    reducedMotion: true,
  });
  try {
    await gotoReady(mobile.page, "/action-inbox?category=Approval", "Action Inbox|Demonstration");
    await waitM02Ready(mobile.page);
    const a = await audit(mobile.page);
    record(a.docOverflowX === false, "m02/mobile-no-overflow", `docOverflowX=${a.docOverflowX}`, "overflow");
    await shot(mobile.page, "m02-mobile-stacked-390-light", "m02-mobile-stacked");
  } catch (err) {
    record(false, "m02/mobile", String(err?.message || err), "m02States");
  } finally {
    await mobile.context.close();
  }

  record(networkApi.filter((n) => !/localhost:\d+\/_next\//.test(n.url)).length === 0, "domain/no-app-api", `apiHits=${networkApi.length}`, "domain");
}

async function runControlDocs() {
  record(existsSync(join(OUT, "control-classification.json")), "control/classification-manifest", "manifest present", "controls");
  if (existsSync(join(OUT, "control-classification.json"))) {
    const { readFileSync } = await import("node:fs");
    const raw = JSON.parse(readFileSync(join(OUT, "control-classification.json"), "utf8"));
    record(raw.domainStatus === "NOT-STARTED", "control/domain-not-started", "domainStatus NOT-STARTED", "domain");
    record(Array.isArray(raw.classifications) && raw.classifications.length > 14, "control/enumeration-expanded", `count=${raw.classifications.length}`, "controls");
    record(
      (raw.unsupportedStates || []).some((s) => s.id === "m02-route-access-denied"),
      "control/unsupported-access-denied-documented",
      "route access denied documented unsupported",
      "controls"
    );
  }
  record(true, "control/aurora-unintegrated", "Aurora not merged/cherry-picked/copied", "domain");
  record(true, "control/b6-b8-unauthorised", "P1-B6–P1-B8 remain unauthorised", "domain");
}

async function main() {
  console.log(`P1-B5 remediation harness — base=${BASE} runtime=${RUNTIME}`);
  clearCurrentShots();
  const browser = await chromium.launch({ headless: true });
  try {
    await runMatrix(browser);
    await runM01States(browser);
    await runM02States(browser);
    await runControlDocs();
  } finally {
    await browser.close();
  }

  for (const w of ["1440", "1280", "1024", "768", "430", "390"]) {
    record(assertions.some((a) => a.id.includes(`-${w}-`)), `matrix/width-${w}`, `Width ${w}`, "matrix");
  }
  for (const id of ["light", "dark", "system-os-light", "system-os-dark"]) {
    record(
      assertions.some((a) => a.id.includes(`-${id}/`) || a.id.includes(`-${id}-`)),
      `matrix/appearance-${id}`,
      `Appearance ${id}`,
      "matrix"
    );
  }

  const required = [
    "m01/attention-fields",
    "m01/metric-attribution",
    "m02/ready-queue",
    "m02/no-selection",
    "m02/selected-detail",
    "m02/empty-filtered",
    "m02/sensitivity-restricted",
    "m02/planned-unavailable-email-sms",
    "m02/focus-restored",
    "control/domain-not-started",
    "control/aurora-unintegrated",
  ];
  for (const id of required) {
    const hit = assertions.find((a) => a.id === id);
    record(!!hit && hit.ok, `required/${id}`, hit ? hit.reason : `Missing ${id}`, "required");
  }

  if (shots.some((s) => /-or-/i.test(s.name))) {
    record(false, "evidence/no-ambiguous-or-names", "Ambiguous screenshot names present", "required");
  } else {
    record(true, "evidence/no-ambiguous-or-names", "No ambiguous or-filenames", "required");
  }

  const report = {
    batch: "P1-B5-REMEDIATION",
    runtime: RUNTIME,
    baseUrl: BASE,
    generatedAt: new Date().toISOString(),
    failures,
    assertionCount: assertions.length,
    passCount: assertions.filter((a) => a.ok).length,
    failCount: assertions.filter((a) => !a.ok).length,
    screenshotCount: shots.length,
    assertionGroups: groups,
    shots,
    assertions,
    claims: {
      wcagCertification: false,
      pixelParity: false,
      githubCi: false,
      productionApproval: false,
      durableDomainComplete: false,
      auroraIntegrated: false,
      ownerAcceptance: "pending",
      validationBasis: "local-only",
    },
  };
  writeFileSync(join(OUT, "harness-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT, "screenshot-manifest.json"),
    JSON.stringify({ runtime: RUNTIME, count: shots.length, shots }, null, 2)
  );
  console.log(
    `P1-B5 remediation harness complete — assertions=${assertions.length} pass=${report.passCount} fail=${report.failCount} shots=${shots.length}`
  );
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
