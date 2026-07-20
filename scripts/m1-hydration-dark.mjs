import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const msgs = [];
page.on("console", (m) => {
  const t = m.text();
  if (m.type() === "error" || /Warning|hydrat/i.test(t)) msgs.push({ type: m.type(), text: t });
});
page.on("pageerror", (e) => msgs.push({ type: "pageerror", text: e.message }));

await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.evaluate(() => {
  localStorage.setItem("pulse.cc.appearance", JSON.stringify("dark"));
  localStorage.setItem("pulse.sidebarCollapsed", JSON.stringify(true));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(3000);

console.log(
  JSON.stringify(
    {
      dark: await page.evaluate(() => document.body.className),
      html: await page.evaluate(() => document.documentElement.className),
      msgs: msgs.map((m) => ({ type: m.type, text: m.text.slice(0, 2500) })),
    },
    null,
    2
  )
);
await browser.close();
