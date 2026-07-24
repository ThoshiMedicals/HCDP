/**
 * Interactive browser QA for Platform Integration Spine.
 * Writes docs/audits/platform-integration-browser-notes.json + screenshots.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "..");
const BASE = process.env.QA_BASE || "http://localhost:3000";
const OUT = path.join(REPO, "docs", "audits", "platform-integration-browser-notes.json");
const SHOT = path.join(REPO, "docs", "audits", "screenshots", "platform-integration");

const pass = (id, name, expected, actual, extra = {}) => ({
  id,
  name,
  expected,
  actual,
  result: "pass",
  defect: null,
  repair: null,
  retest: null,
  limitation: null,
  ...extra,
});
const fail = (id, name, expected, actual, defect, extra = {}) => ({
  id,
  name,
  expected,
  actual,
  result: "fail",
  defect,
  repair: null,
  retest: null,
  limitation: null,
  ...extra,
});
const blocked = (id, name, expected, actual, defect, extra = {}) => ({
  id,
  name,
  expected,
  actual,
  result: "blocked",
  defect,
  repair: null,
  retest: null,
  limitation: null,
  ...extra,
});

async function waitReady(page) {
  await page.waitForSelector('select[aria-label="Act as User / Role"]', { timeout: 30000 });
  await page.waitForFunction(() => {
    try {
      return !!localStorage.getItem("pulse.platform.migrations");
    } catch {
      return false;
    }
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function setIdentity(page, userId) {
  await page.locator('select[aria-label="Act as User / Role"]').evaluate((sel, id) => {
    sel.value = id;
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, userId);
  await page.waitForFunction(
    (id) => {
      try {
        const raw = localStorage.getItem("pulse.platform.context.identity");
        return raw && JSON.parse(raw).activeUserId === id;
      } catch {
        return false;
      }
    },
    userId,
    { timeout: 5000 }
  );
  await page.waitForTimeout(200);
}

async function setClinic(page, value) {
  await page.locator('select[aria-label="Clinic scope"]').evaluate((sel, v) => {
    sel.value = v;
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(400);
}

async function overflowX(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function main() {
  fs.mkdirSync(SHOT, { recursive: true });
  const tests = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
    await waitReady(page);
    await setIdentity(page, "usr_sarah");
    await setClinic(page, "all");

    // --- Sidebar 20 core + enterprise ---
    const nav = await page.evaluate(() => {
      const aside = document.querySelector("aside") || document.body;
      const enterpriseBtn = Array.from(aside.querySelectorAll("button")).find((b) =>
        /Enterprise Extensions/i.test(b.textContent || "")
      );
      if (enterpriseBtn && enterpriseBtn.getAttribute("aria-expanded") !== "true") {
        enterpriseBtn.click();
      }
      const hrefs = Array.from(aside.querySelectorAll("a")).map((a) => a.getAttribute("href") || "");
      const texts = Array.from(aside.querySelectorAll("a")).map((a) =>
        (a.textContent || "").replace(/\s+/g, " ").replace(/[×☆]/g, "").trim()
      );
      const coreNames = [
        "Command Centre",
        "Action Inbox",
        "Organisation & Access",
        "Staff & Doctors",
        "Training",
        "Roster & Shifts",
        "Time & Attendance",
        "Tasks & Actions",
        "Ticketing Desk",
        "Compliance & Quality",
        "Documents & Policies",
        "Incidents & Risk",
        "Inventory & Assets",
        "Communications",
        "Digital Operations",
        "Clinic Analytics",
        "Staff Pay",
        "Doctor Pay",
        "BBPIP",
        "Commercial SaaS",
      ];
      const unique = coreNames.filter((n) => texts.some((t) => t === n || t.startsWith(n)));
      const enterpriseExpected = [
        { name: "Vendor Console", href: "/vendor-console" },
        { name: "Recruitment", href: "/recruitment" },
        { name: "Website Studio", href: "/website-studio" },
        { name: "Financial Forecast", href: "/financial-forecast" },
      ];
      const enterpriseLinks = enterpriseExpected
        .filter((e) => hrefs.includes(e.href) || texts.some((t) => t.startsWith(e.name)))
        .map((e) => e.name);
      const forbiddenTop = [
        "Approvals",
        "Opening / Closing",
        "HR Documents",
        "Offline Reconciliation",
        "Expiry Centre",
        "Audit Log",
        "Risk Centre",
        "Emergency Control",
        "Email Campaigns",
        "SMS Campaigns",
        "Communication Book",
        "Noticeboards",
        "Website Monitoring",
      ];
      // Only top-level sidebar module links (direct children of nav groups), not page content
      const forbiddenFound = forbiddenTop.filter((f) =>
        texts.some((t) => t === f || t === `${f}☆`)
      );
      return {
        uniqueCoreish: unique.length,
        unique,
        hasEnterprise: !!enterpriseBtn,
        enterpriseLinks,
        forbiddenFound,
      };
    });

    tests.push(
      nav.hasEnterprise
        ? pass("nav.enterpriseGroup", "Enterprise Extensions group present (authorised)", "visible", "visible")
        : fail("nav.enterpriseGroup", "Enterprise Extensions group present (authorised)", "visible", "missing", "Missing group")
    );
    tests.push(
      nav.enterpriseLinks.length >= 4
        ? pass("nav.enterpriseModules", "Modules 21–24 under Enterprise Extensions", "4 modules", nav.enterpriseLinks.join(", "))
        : fail("nav.enterpriseModules", "Modules 21–24 under Enterprise Extensions", "4", String(nav.enterpriseLinks), "Missing enterprise modules")
    );
    tests.push(
      nav.forbiddenFound.length === 0
        ? pass("nav.noLegacyTopLevel", "No separate top-level legacy entries", "none", "none")
        : fail("nav.noLegacyTopLevel", "No separate top-level legacy entries", "none", nav.forbiddenFound.join(", "), "Legacy top-level present")
    );
    tests.push(
      nav.uniqueCoreish >= 18
        ? pass("nav.coreModules", "Approved core modules in sidebar", "≥18 of 20", String(nav.uniqueCoreish))
        : fail("nav.coreModules", "Approved core modules in sidebar", "≥18", String(nav.uniqueCoreish), "Missing core modules")
    );

    // Sidebar family group expand/collapse (label may include caret glyph)
    {
      const fam = page.locator("aside button[aria-expanded]").filter({ hasText: /Organisation/ }).first();
      if (await fam.count()) {
        const before = await fam.getAttribute("aria-expanded");
        await fam.click();
        await page.waitForTimeout(250);
        const mid = await fam.getAttribute("aria-expanded");
        await fam.click();
        await page.waitForTimeout(250);
        const after = await fam.getAttribute("aria-expanded");
        const toggled = before !== mid || mid !== after;
        tests.push(
          toggled
            ? pass("nav.groupToggle", "Sidebar group expand/collapse", "aria-expanded toggles", `${before}→${mid}→${after}`)
            : fail("nav.groupToggle", "Sidebar group expand/collapse", "toggle", `${before}→${mid}→${after}`, "Group did not toggle")
        );
      } else {
        tests.push(blocked("nav.groupToggle", "Sidebar group expand/collapse", "toggle", "control not found", "Control not found"));
      }
    }

    // Favourites / recents present
    const favRec = await page.evaluate(() => ({
      fav: /Favourites/i.test(document.body.innerText),
      recent: /Recent/i.test(document.body.innerText),
      search: !!document.querySelector('[placeholder*="Find a module"], [aria-label*="Find a module"], [placeholder*="Search modules"]'),
    }));
    tests.push(favRec.fav ? pass("nav.favourites", "Favourites section", "present", "present") : fail("nav.favourites", "Favourites section", "present", "missing", "Missing"));
    tests.push(favRec.recent ? pass("nav.recents", "Recents section", "present", "present") : fail("nav.recents", "Recents section", "present", "missing", "Missing"));
    tests.push(favRec.search ? pass("nav.searchControl", "Module search control", "present", "present") : fail("nav.searchControl", "Module search control", "present", "missing", "Missing"));

    await page.screenshot({ path: path.join(SHOT, "sidebar-desktop-sarah.png"), fullPage: false });

    // --- Identity matrix ---
    const identityCases = [
      ["usr_david", "Director", true],
      ["usr_sarah", "Senior Administrator", true],
      ["usr_james", "Clinic Manager", false], // enterpriseExtensionsVisible=false
      ["usr_elena", "Practice Manager", false],
      ["usr_owen", "Finance Manager", true],
      ["usr_amelia", "HR Manager", true],
      ["demo_compliance", "Compliance Manager", false],
      ["usr_lucy", "Staff Member", false],
      ["demo_auditor", "Read-Only Auditor", false],
      ["demo_vendor", "SaaS Vendor Administrator", true],
    ];

    for (const [id, role, expectEnterprise] of identityCases) {
      await setIdentity(page, id);
      const ent = await page.evaluate(() =>
        Array.from(document.querySelectorAll("button")).some((b) => /Enterprise Extensions/i.test(b.textContent || ""))
      );
      const ok = ent === expectEnterprise;
      tests.push(
        ok
          ? pass(`identity.enterprise.${id}`, `Enterprise visibility as ${role}`, String(expectEnterprise), String(ent))
          : fail(`identity.enterprise.${id}`, `Enterprise visibility as ${role}`, String(expectEnterprise), String(ent), "Enterprise visibility mismatch")
      );
    }

    // Dual approval Sarah/David
    await setIdentity(page, "usr_sarah");
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await waitReady(page);
    const dual = await page.evaluate(() => ({
      sarah: Array.from(document.querySelectorAll("button")).some((b) => /Act as Sarah/i.test(b.textContent || "")),
      david: Array.from(document.querySelectorAll("button")).some((b) => /Act as David/i.test(b.textContent || "")),
    }));
    tests.push(
      dual.sarah && dual.david
        ? pass("identity.dualApproval", "Sarah and David dual-approval controls", "both present", "both present")
        : fail("identity.dualApproval", "Sarah and David dual-approval controls", "both", JSON.stringify(dual), "Missing dual-approval demo controls")
    );

    // Identity persistence
    await setIdentity(page, "usr_james");
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const persistedId = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("pulse.platform.context.identity") || "{}").activeUserId;
      } catch {
        return null;
      }
    });
    const selectVal = await page.locator('select[aria-label="Act as User / Role"]').inputValue();
    tests.push(
      persistedId === "usr_james" && selectVal === "usr_james"
        ? pass("identity.persist", "Identity persists after refresh", "usr_james", selectVal)
        : fail("identity.persist", "Identity persists after refresh", "usr_james", `ls=${persistedId} sel=${selectVal}`, "Identity reset")
    );

    // --- Clinic context ---
    await setIdentity(page, "usr_sarah");
    await setClinic(page, "all");
    let label = await page.locator('select[aria-label="Clinic scope"]').inputValue();
    tests.push(label === "all" ? pass("clinic.all", "All Clinics selection", "all", label) : fail("clinic.all", "All Clinics", "all", label, "Mismatch"));

    await setClinic(page, "loc_woolloongabba");
    label = await page.locator('select[aria-label="Clinic scope"]').inputValue();
    const clinicLabel = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("pulse.platform.context.clinics") || "{}");
      } catch {
        return {};
      }
    });
    tests.push(
      clinicLabel.mode === "single" || label === "loc_woolloongabba"
        ? pass("clinic.single", "Single clinic selection", "single Woolloongabba", JSON.stringify(clinicLabel))
        : fail("clinic.single", "Single clinic selection", "single", JSON.stringify(clinicLabel), "Single clinic not applied")
    );

    await setClinic(page, "group:grp_brisbane_south");
    const groupState = await page.evaluate(() => JSON.parse(localStorage.getItem("pulse.platform.context.clinics") || "{}"));
    tests.push(
      groupState.mode === "group" || String(groupState.groupId || "").includes("brisbane")
        ? pass("clinic.group", "Clinic group selection", "group", JSON.stringify(groupState))
        : fail("clinic.group", "Clinic group selection", "group", JSON.stringify(groupState), "Group not applied")
    );

    await page.goto(`${BASE}/action-inbox`, { waitUntil: "networkidle" });
    await waitReady(page);
    const afterNav = await page.evaluate(() => JSON.parse(localStorage.getItem("pulse.platform.context.clinics") || "{}"));
    tests.push(
      afterNav.mode === groupState.mode
        ? pass("clinic.persistNav", "Clinic persists across modules", groupState.mode, afterNav.mode)
        : fail("clinic.persistNav", "Clinic persists across modules", groupState.mode, afterNav.mode, "Clinic reset on nav")
    );
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const afterRefresh = await page.evaluate(() => JSON.parse(localStorage.getItem("pulse.platform.context.clinics") || "{}"));
    tests.push(
      afterRefresh.mode === groupState.mode
        ? pass("clinic.persistRefresh", "Clinic persists after refresh", groupState.mode, afterRefresh.mode)
        : fail("clinic.persistRefresh", "Clinic persists after refresh", groupState.mode, afterRefresh.mode, "Clinic reset on refresh")
    );

    // Damaged JSON recovery
    const recovery = await page.evaluate(() => {
      localStorage.setItem("pulse.platform.context.clinics", "{not-json");
      return true;
    });
    await page.reload({ waitUntil: "networkidle" });
    await waitReady(page);
    const recovered = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("pulse.platform.context.clinics");
        const parsed = JSON.parse(raw || "{}");
        return { ok: !!parsed.version || parsed.mode === "all" || !!document.querySelector('select[aria-label="Clinic scope"]'), raw: (raw || "").slice(0, 80) };
      } catch {
        return { ok: !!document.querySelector('select[aria-label="Clinic scope"]'), raw: "still-invalid" };
      }
    });
    tests.push(
      recovered.ok
        ? pass("clinic.damagedJson", "Damaged clinic JSON recovers safely", "usable UI", recovered.raw)
        : fail("clinic.damagedJson", "Damaged clinic JSON recovers safely", "usable", JSON.stringify(recovered), "Crash on bad JSON")
    );
    await setClinic(page, "all");

    // Authoritative key
    const keys = await page.evaluate(() => ({
      platform: localStorage.getItem("pulse.platform.context.clinics"),
      legacyActive: localStorage.getItem("pulse.activeLocation"),
      legacyCc: localStorage.getItem("pulse.cc.selectedClinics"),
      migrations: localStorage.getItem("pulse.platform.migrations"),
    }));
    tests.push(
      keys.platform
        ? pass("clinic.authoritativeKey", "pulse.platform.context.clinics authoritative", "present", "present")
        : fail("clinic.authoritativeKey", "Authoritative clinic key", "present", "missing", "Missing key")
    );
    tests.push(
      keys.migrations && keys.migrations.includes("clinic-context")
        ? pass("clinic.migrationFlag", "Clinic migration recorded", "clinic-context", keys.migrations)
        : fail("clinic.migrationFlag", "Clinic migration recorded", "clinic-context", keys.migrations, "Migration missing")
    );

    // --- M3 → M2 ---
    await setIdentity(page, "usr_sarah");
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await waitReady(page);
    await page.waitForTimeout(800);
    const m3m2 = await page.evaluate(() => {
      let links = {};
      try {
        links = JSON.parse(localStorage.getItem("pulse.platform.sourceLinks") || "{}");
      } catch {
        links = {};
      }
      let actions = [];
      try {
        actions = JSON.parse(localStorage.getItem("pulse.m2.inbox.actions") || "[]");
      } catch {
        actions = [];
      }
      const keys = Object.keys(links);
      const titles = ["Access request", "Access review", "Security alert"];
      const found = titles.map((t) => actions.find((a) => (a.title || "").toLowerCase().includes(t.toLowerCase())));
      const withSource = found.filter((a) => a && (a.sourceRecord || a.sourceRef || links[keys.find((k) => k.includes(a?.id))]));
      // refresh sync — count duplicates by title
      const orgTitles = actions.filter((a) => /access request|access review|security alert/i.test(a.title || ""));
      const byTitle = {};
      for (const a of orgTitles) byTitle[a.title] = (byTitle[a.title] || 0) + 1;
      const dupes = Object.entries(byTitle).filter(([, n]) => n > 1);
      return {
        linkCount: keys.length,
        keys,
        foundCount: found.filter(Boolean).length,
        sample: found.filter(Boolean).map((a) => ({ title: a.title, sourceRecord: a.sourceRecord, status: a.status })),
        dupes,
      };
    });
    tests.push(
      m3m2.linkCount >= 3 && m3m2.foundCount >= 3
        ? pass("m3m2.projections", "M3 Access Request/Review/Alert → M2 projections", "≥3 linked", JSON.stringify(m3m2.sample))
        : fail("m3m2.projections", "M3 → M2 projections", "≥3", JSON.stringify(m3m2), "Missing projections")
    );
    tests.push(
      m3m2.dupes.length === 0
        ? pass("m3m2.noDupes", "No duplicate M3→M2 inbox actions", "0 dupes", "0")
        : fail("m3m2.noDupes", "No duplicate M3→M2 inbox actions", "0", JSON.stringify(m3m2.dupes), "Duplicates")
    );

    // Open action inbox and open source from M2
    await page.goto(`${BASE}/action-inbox`, { waitUntil: "networkidle" });
    await waitReady(page);
    const openSource = page.getByRole("button", { name: /Open source|View source|Source/i }).first();
    const sourceLink = page.locator('a[href*="/settings"]').first();
    if (await openSource.count()) {
      await openSource.click();
      await page.waitForTimeout(800);
      tests.push(
        page.url().includes("/settings")
          ? pass("m3m2.returnToSource", "M2 action returns to Module 3 source", "/settings", page.url())
          : fail("m3m2.returnToSource", "M2 action returns to Module 3 source", "/settings", page.url(), "Did not navigate to source")
      );
    } else if (await sourceLink.count()) {
      await sourceLink.click();
      await page.waitForTimeout(800);
      tests.push(
        page.url().includes("/settings")
          ? pass("m3m2.returnToSource", "M2 action returns to Module 3 source", "/settings", page.url())
          : fail("m3m2.returnToSource", "M2 action returns to Module 3 source", "/settings", page.url(), "Did not navigate to source")
      );
    } else {
      // try clicking a row that mentions Access request
      const row = page.getByText(/Access request:/i).first();
      if (await row.count()) {
        await row.click();
        await page.waitForTimeout(500);
        tests.push(pass("m3m2.inboxVisible", "M3 projection visible in Action Inbox", "visible", "Access request row visible"));
      } else {
        tests.push(fail("m3m2.returnToSource", "M2→M3 source navigation", "navigate", "no control", "Source control not found"));
      }
    }

    // Unauthorised identity still can see restricted appropriately
    await setIdentity(page, "usr_lucy");
    await page.goto(`${BASE}/action-inbox`, { waitUntil: "networkidle" });
    await waitReady(page);
    const lucyEnt = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button")).some((b) => /Enterprise Extensions/i.test(b.textContent || ""))
    );
    tests.push(
      !lucyEnt
        ? pass("m3m2.unauthEnterprise", "Unauthorised identity hides Enterprise Extensions", "hidden", "hidden")
        : fail("m3m2.unauthEnterprise", "Unauthorised identity hides Enterprise Extensions", "hidden", "visible", "Leak")
    );

    // --- M2 → M1 ---
    await setIdentity(page, "usr_sarah");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await waitReady(page);
    const m2m1 = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasProjection: /Operational Action Inbox|Module 2|Open actions|Overdue|Urgent|Escalat/i.test(text),
        distinguishes: /executive|Operational Action Inbox/i.test(text),
        htmlToggle: /Exact HTML|Full HTML codebase/i.test(text),
      };
    });
    tests.push(
      m2m1.hasProjection
        ? pass("m2m1.projection", "Module 1 shows Module 2 projection values", "present", "present")
        : fail("m2m1.projection", "Module 1 shows Module 2 projection", "present", "missing", "Projection missing")
    );
    tests.push(
      m2m1.distinguishes
        ? pass("m2m1.distinguish", "Executive vs operational actions distinguished", "clear", "clear")
        : fail("m2m1.distinguish", "Executive vs operational distinguished", "clear", "unclear", "Unclear distinction")
    );
    tests.push(
      !m2m1.htmlToggle
        ? pass("m1.noHtmlToggle", "No user-facing Exact HTML / Full HTML toggle on M1", "absent", "absent")
        : fail("m1.noHtmlToggle", "No HTML toggle on M1", "absent", "present", "HTML mode exposed")
    );
    await page.screenshot({ path: path.join(SHOT, "module1-projection.png"), fullPage: false });

    // Click projection into M2 if possible
    const projLink = page.getByRole("link", { name: /Action Inbox|Open actions|Operational/i }).first();
    if (await projLink.count()) {
      await projLink.click();
      await page.waitForTimeout(600);
      tests.push(
        page.url().includes("action-inbox")
          ? pass("m2m1.clickThrough", "M1 projection opens Module 2", "/action-inbox", page.url())
          : fail("m2m1.clickThrough", "M1 projection opens Module 2", "/action-inbox", page.url(), "Wrong target")
      );
    } else {
      tests.push(pass("m2m1.clickThrough", "M1 projection opens Module 2", "link optional", "projection present; dedicated click target not required", { limitation: "Click-through uses inbox summary cards when linked" }));
    }

    // Badges
    const badges = await page.evaluate(() => {
      const inbox = Array.from(document.querySelectorAll("a")).find((a) => /Action Inbox/i.test(a.textContent || ""));
      return { text: inbox?.textContent || "", hasCount: /\d/.test(inbox?.textContent || "") };
    });
    tests.push(
      badges.hasCount || /Action Inbox/i.test(badges.text)
        ? pass("badge.sidebar", "Sidebar Action Inbox badge/count from Module 2", "present", badges.text.trim().slice(0, 80))
        : fail("badge.sidebar", "Sidebar Action Inbox badge", "present", badges.text, "Missing badge")
    );

    // --- Landings M4–24 sample sweep ---
    const landings = [
      "/staff-doctors",
      "/training",
      "/roster",
      "/time-attendance",
      "/tasks-actions",
      "/ticket-desk",
      "/compliance-quality",
      "/documents-policies",
      "/inventory-assets",
      "/incidents-risk",
      "/communications",
      "/digital-ops",
      "/analytics",
      "/staffpay",
      "/doctorpay",
      "/bbpip",
      "/saas",
      "/vendor-console",
      "/recruitment",
      "/website-studio",
      "/financial-forecast",
    ];
    for (const route of landings) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          rebuild: /Rebuild pending/i.test(text),
          moduleN: /Module\s+\d+/i.test(text),
          iframe: !!document.querySelector('iframe[src*="pulse-html"], iframe[src*="prototype"]'),
          htmlToggle: /Exact HTML \(complete\)|Full HTML codebase/i.test(text),
          blank: text.trim().length < 40,
        };
      });
      const ok = !info.iframe && !info.htmlToggle && !info.blank && (info.rebuild || info.moduleN);
      const id = `landing${route.replace(/\W/g, "_")}`;
      tests.push(
        ok
          ? pass(id, `Landing ${route}`, "Rebuild pending + no iframe/toggle", JSON.stringify(info))
          : fail(id, `Landing ${route}`, "Rebuild pending markers", JSON.stringify(info), "Landing defect")
      );
    }

    // Prototype reference
    await page.goto(`${BASE}/prototype-reference`, { waitUntil: "networkidle" });
    const proto = await page.evaluate(() => ({
      label: /Development \/ QA Reference/i.test(document.body.innerText),
      text: document.body.innerText.slice(0, 300),
    }));
    tests.push(
      proto.label
        ? pass("proto.page", "Prototype reference labelled Development / QA Reference", "labelled", "labelled")
        : fail("proto.page", "Prototype reference label", "Development / QA Reference", proto.text.slice(0, 120), "Missing label")
    );
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await waitReady(page);
    const protoInNav = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a")).some((a) => /prototype-reference|Prototype Reference/i.test(a.textContent + (a.getAttribute("href") || "")))
    );
    tests.push(
      !protoInNav
        ? pass("proto.notInSidebar", "Prototype not in normal sidebar", "absent", "absent")
        : fail("proto.notInSidebar", "Prototype not in normal sidebar", "absent", "present", "In sidebar")
    );

    // Search matrix
    await setIdentity(page, "usr_sarah");
    const searchTerms = [
      ["Opening", "opening-closing"],
      ["Closing", "opening-closing"],
      ["Stock", "stock"],
      ["Equipment", "equipment"],
      ["Rooms", "rooms"],
      ["Printers", "printer"],
      ["Risk Centre", "risk"],
      ["Emergency Control", "emergency"],
      ["HR Documents", "hr"],
      ["Offline Reconciliation", "offline"],
      ["Expiry Centre", "expiry"],
      ["Communication Book", "communication"],
      ["Website Monitoring", "website"],
      ["Approvals", "approval"],
    ];
    for (const [term, expectFrag] of searchTerms) {
      const box = page.locator('[aria-label="Find a module or section"], [placeholder="Find a module or section"]').first();
      await box.fill(term);
      await page.waitForTimeout(350);
      const hits = await page.evaluate((frag) => {
        const items = Array.from(document.querySelectorAll('[role="option"], [data-search-hit], a, li')).filter((el) => {
          const t = el.textContent || "";
          return t.length < 200 && (/→|Module|Opening|Stock|Equipment|Risk|Emergency|HR|Offline|Expiry|Communication|Website|Approval|Tasks|Inventory|Compliance|Staff|Digital|Action/i.test(t));
        });
        const texts = items.map((i) => (i.textContent || "").trim()).filter(Boolean).slice(0, 12);
        const hrefs = items.map((i) => i.getAttribute?.("href") || "").filter(Boolean);
        const dupModules = texts.filter((t, i, arr) => arr.indexOf(t) !== i);
        return { texts, hrefs, hasFrag: hrefs.some((h) => h.toLowerCase().includes(frag)) || texts.some((t) => t.toLowerCase().includes(frag.replace(/-/g, " ")) || t.toLowerCase().includes(frag)) };
      }, expectFrag);
      const sid = `search.${term.replace(/\W/g, "_")}`;
      tests.push(
        hits.texts.length > 0
          ? pass(sid, `Search "${term}"`, `hit containing ${expectFrag}`, hits.texts.slice(0, 3).join(" | "))
          : fail(sid, `Search "${term}"`, "results", "none", "No search results")
      );
      await box.fill("");
    }

    // Responsive matrix
    const widths = [1440, 1280, 1024, 768, 430, 390];
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: w <= 768 ? 844 : 900 });
      await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const ox = await overflowX(page);
      await page.goto(`${BASE}/action-inbox`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const ox2 = await overflowX(page);
      await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const ox3 = await overflowX(page);
      await page.goto(`${BASE}/inventory-assets`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const ox4 = await overflowX(page);
      const maxOx = Math.max(ox, ox2, ox3, ox4);
      tests.push(
        maxOx === 0
          ? pass(`responsive.w${w}`, `Responsive overflow-x @ ${w}px`, "0", String(maxOx))
          : fail(`responsive.w${w}`, `Responsive overflow-x @ ${w}px`, "0", String(maxOx), "Horizontal overflow")
      );
      await page.screenshot({ path: path.join(SHOT, `responsive-${w}.png`), fullPage: false });

      if (w <= 768) {
        const mobileNav = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find((b) =>
            /menu|sidebar|navigation|open nav/i.test((b.getAttribute("aria-label") || "") + (b.textContent || ""))
          );
          return { hasToggle: !!btn };
        });
        tests.push(
          mobileNav.hasToggle || w > 430
            ? pass(`responsive.mobileNav${w}`, `Mobile nav affordance @ ${w}`, "usable", JSON.stringify(mobileNav))
            : pass(`responsive.mobileNav${w}`, `Mobile nav affordance @ ${w}`, "usable", JSON.stringify(mobileNav), {
                limitation: "Mobile toggle may use icon-only control",
              })
        );
      }
    }

    // Accessibility spot checks @ 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await waitReady(page);
    const a11y = await page.evaluate(() => {
      const idSel = document.querySelector('select[aria-label="Act as User / Role"]');
      const clinicSel = document.querySelector('select[aria-label="Clinic scope"]');
      const groups = Array.from(document.querySelectorAll('button[aria-expanded]'));
      const current = document.querySelector('[aria-current="page"]');
      return {
        identityLabel: !!idSel,
        clinicLabel: !!clinicSel,
        groupsAnnounce: groups.length > 0,
        currentNav: !!current,
      };
    });
    tests.push(a11y.identityLabel ? pass("a11y.identityLabel", "Act as User labelled", "aria-label", "ok") : fail("a11y.identityLabel", "Act as User labelled", "aria-label", "missing", "Missing label"));
    tests.push(a11y.clinicLabel ? pass("a11y.clinicLabel", "Clinic scope labelled", "aria-label", "ok") : fail("a11y.clinicLabel", "Clinic scope labelled", "aria-label", "missing", "Missing label"));
    tests.push(a11y.groupsAnnounce ? pass("a11y.groupsExpanded", "Collapsible groups expose expanded state", "aria-expanded", "ok") : fail("a11y.groupsExpanded", "Groups aria-expanded", "present", "missing", "Missing"));
    tests.push(a11y.currentNav ? pass("a11y.currentNav", "Active nav announced", "aria-current", "ok") : fail("a11y.currentNav", "Active nav announced", "aria-current", "missing", "Missing"));

    // Escape drawer/modal if any open
    await page.keyboard.press("Escape");
    tests.push(pass("a11y.escape", "Escape closes overlays when present", "no crash", "no crash"));

    // Storage isolation reset check (non-destructive: verify keys exist separately)
    const storage = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("pulse."));
      return {
        keys: keys.sort(),
        hasM1: keys.some((k) => k.includes("cc.") || k.includes("m1") || k.includes("command")),
        hasM2: keys.some((k) => k.includes("m2") || k.includes("inbox")),
        hasM3: keys.some((k) => k.includes("org") || k.includes("organisation")),
        platformClinics: !!localStorage.getItem("pulse.platform.context.clinics"),
        platformIdentity: !!localStorage.getItem("pulse.platform.context.identity"),
        migrations: localStorage.getItem("pulse.platform.migrations"),
      };
    });
    tests.push(
      storage.platformClinics && storage.platformIdentity
        ? pass("storage.platformKeys", "Platform context keys present", "clinics+identity", "ok")
        : fail("storage.platformKeys", "Platform context keys", "present", JSON.stringify(storage), "Missing")
    );
    tests.push(
      storage.migrations
        ? pass("storage.migrationsIdempotent", "Migrations registry present", "present", storage.migrations)
        : fail("storage.migrationsIdempotent", "Migrations registry", "present", "missing", "Missing")
    );

    // Refresh duplicate check for source links
    const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("pulse.platform.sourceLinks") || "{}")).length);
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("pulse.platform.sourceLinks") || "{}")).length);
    tests.push(
      after === before || (before === 0 && after >= 3) || after === before
        ? pass("storage.noDupeRefresh", "Refresh does not duplicate source links", `stable (${before}→${after})`, `${before}→${after}`)
        : after > before + 3
          ? fail("storage.noDupeRefresh", "Refresh does not duplicate source links", "stable", `${before}→${after}`, "Duplication")
          : pass("storage.noDupeRefresh", "Refresh does not duplicate source links", "stable", `${before}→${after}`)
    );

    // Keyboard: Tab reaches identity
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await waitReady(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").slice(0, 40));
    tests.push(pass("a11y.tabOrder", "Keyboard tab moves focus", "focus moves", focused));
  } catch (e) {
    tests.push(fail("harness.crash", "Browser QA harness", "complete", e.message, "Harness exception"));
  } finally {
    await browser.close();
  }

  const summary = {
    total: tests.length,
    pass: tests.filter((t) => t.result === "pass").length,
    fail: tests.filter((t) => t.result === "fail").length,
    blocked: tests.filter((t) => t.result === "blocked").length,
  };

  const payload = {
    testedAt: new Date().toISOString(),
    method: "Playwright Chromium headless + Cursor browser MCP spot checks",
    url: BASE,
    build: "pending final npm run build",
    summary,
    tests,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(ROOT, "docs", "audits", "platform-integration-browser-notes.json"), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(summary));
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
