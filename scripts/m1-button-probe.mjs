import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith("pulse.")) localStorage.removeItem(k);
  }
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const names = await page.evaluate(() => {
  const wanted = [
    "Mobile urgent",
    "View Health Breakdown",
    "Open Full Briefing",
    "Clinic Operations",
    "Create follow-up",
    "Review RCA",
    "View as Table",
    "Ask AI",
    "Approve with Conditions",
  ];
  const all = Array.from(document.querySelectorAll("button, [role='button'], [role='tab']"))
    .map((el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return {
    hits: Object.fromEntries(wanted.map((w) => [w, all.some((t) => t.includes(w) || new RegExp(w, "i").test(t))])),
    sample: all.filter((t) => /Health|Briefing|Mobile|Clinic Operations|follow-up|Review|Ask AI|Approve/i.test(t)).slice(0, 40),
    count: all.length,
    title: document.body.innerText.slice(0, 200),
  };
});
console.log(JSON.stringify(names, null, 2));
await browser.close();
