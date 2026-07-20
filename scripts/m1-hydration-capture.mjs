import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const msgs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") msgs.push({ type: m.type(), text: m.text() });
});
page.on("pageerror", (e) => msgs.push({ type: "pageerror", text: e.message }));

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2500);

const hydr = msgs.filter((m) => /hydrat|Did not expect|Text content does not match|warning/i.test(m.text));
console.log(JSON.stringify({ count: msgs.length, hydration: hydr.map((h) => h.text.slice(0, 2000)), all: msgs.map((m) => m.text.slice(0, 400)) }, null, 2));
await browser.close();
