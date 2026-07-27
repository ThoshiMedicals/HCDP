/**
 * Wave 2 M04 browser / responsive evidence (Playwright Chromium).
 * Run against a local server on BASE_URL (default http://localhost:3000).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const SECTIONS = [
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
const LEGACY = ["/staff", "/doctors", "/hr-docs"];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const page = await browser.newPage();

  async function check(id, name, fn) {
    try {
      const actual = await fn();
      const pass = actual.pass !== false;
      results.push({
        id,
        name,
        expected: actual.expected ?? "pass",
        actual: actual.actual ?? "ok",
        result: pass ? "pass" : "fail",
        defect: pass ? null : actual.defect ?? "failed",
      });
    } catch (e) {
      results.push({
        id,
        name,
        expected: "pass",
        actual: String(e.message || e),
        result: "fail",
        defect: String(e.message || e),
      });
    }
  }

  await check("m04.load", "Staff-doctors workspace loads", async () => {
    const res = await page.goto(`${BASE}/staff-doctors`, { waitUntil: "networkidle", timeout: 60000 });
    const text = await page.locator("body").innerText();
    return {
      pass: Boolean(res && res.ok() && /Staff & Doctor Management/i.test(text)),
      actual: `status=${res?.status()} hasTitle=${/Staff & Doctor Management/i.test(text)}`,
      expected: "200 + workspace title",
    };
  });

  for (const section of SECTIONS) {
    await check(`m04.section.${section}`, `Deep-link section=${section}`, async () => {
      const url =
        section === "overview" ? `${BASE}/staff-doctors` : `${BASE}/staff-doctors?section=${section}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(400);
      const current = page.url();
      const nav = page.getByRole("navigation", { name: /Staff and Doctor Management/i });
      const active = nav.locator('[aria-current="page"]');
      const label = (await active.count()) ? await active.first().innerText() : "";
      const hasNav = (await nav.count()) > 0;
      return {
        pass: hasNav,
        actual: `url=${current} active=${label || "(none)"}`,
        expected: "section nav present",
      };
    });
  }

  await check("m04.nav.urlWrite", "Nav click writes ?section=", async () => {
    await page.goto(`${BASE}/staff-doctors`, { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: /Staff and Doctor Management/i });
    await nav.getByRole("button", { name: "Credentials" }).click();
    await page.waitForTimeout(500);
    return {
      pass: page.url().includes("section=credentials"),
      actual: page.url(),
      expected: "contains section=credentials",
    };
  });

  for (const route of LEGACY) {
    await check(`m04.legacy${route}`, `Legacy ${route} reaches M04`, async () => {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(600);
      const text = await page.locator("body").innerText();
      const ok =
        (res?.ok() || res?.status() === 200) &&
        (/Staff & Doctor Management/i.test(text) || /People|Doctor|Credential/i.test(text));
      return {
        pass: Boolean(ok),
        actual: `status=${res?.status()} url=${page.url()}`,
        expected: "M04 content",
      };
    });
  }

  await check("m01.workforceProjection", "Command Centre shows M04 workforce card", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1200);
    const text = await page.locator("body").innerText();
    const hit = /Workforce \(Module 4\)/i.test(text) || /active staff/i.test(text);
    return {
      pass: hit,
      actual: hit ? "workforce projection visible" : "not found on home",
      expected: "Workforce (Module 4) projection",
      defect: hit ? null : "May require opening overview dashboard panel",
    };
  });

  for (const w of WIDTHS) {
    await check(`responsive.${w}`, `No page-level horizontal overflow at ${w}px`, async () => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/staff-doctors?section=people`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          overflowPx: Math.max(0, doc.scrollWidth - doc.clientWidth),
        };
      });
      return {
        pass: overflow.overflowPx <= 1,
        actual: JSON.stringify(overflow),
        expected: "overflowPx <= 1",
      };
    });
  }

  await check("a11y.nav", "Section nav has aria-label and aria-current", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/staff-doctors?section=people`, { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: /Staff and Doctor Management/i });
    const current = await nav.locator('[aria-current="page"]').count();
    return {
      pass: (await nav.count()) === 1 && current >= 1,
      actual: `nav=${await nav.count()} aria-current=${current}`,
      expected: "1 labelled nav + active current",
    };
  });

  await browser.close();

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.result === "pass").length,
    fail: results.filter((r) => r.result === "fail").length,
    blocked: 0,
  };

  const out = {
    testedAt: new Date().toISOString(),
    method: "Playwright Chromium headless",
    url: BASE,
    wave: "Wave 2 M04",
    summary,
    tests: results,
  };

  const outPath = path.join(__dirname, "..", "docs", "audits", "wave2-m04-browser-evidence.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log("Wrote", outPath);
  if (summary.fail) {
    console.log(
      "Failures:",
      results.filter((r) => r.result === "fail").map((r) => `${r.id}: ${r.actual}`)
    );
  }
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
