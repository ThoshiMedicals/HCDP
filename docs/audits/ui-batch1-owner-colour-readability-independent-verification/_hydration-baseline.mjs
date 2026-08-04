import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const BASE = process.env.HCDP_BASE_URL || "http://localhost:3466";
const OUT = join(process.cwd(), "docs/audits/ui-batch1-owner-colour-readability-independent-verification");
const routes = ["/dashboard","/staff-doctors","/roster","/time-attendance","/staffpay?section=overview","/staffpay?section=adjustments"];
function normalize(text){return String(text).replace(/http:\/\/localhost:\d+/g,"http://localhost:PORT").replace(/\s+/g," ").replace(/#[0-9a-f]{4,}/gi,"#HASH").slice(0,240);}
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext();
const page = await ctx.newPage();
const hits=[];
page.on("console", (msg)=>{ const t=msg.text(); if(/hydration|did not match|Text content does not match/i.test(t)) hits.push({text:t,url:page.url(),norm:normalize(t)}); });
page.on("pageerror", (err)=>{ const t=String(err); if(/hydration|did not match|Text content does not match/i.test(t)) hits.push({text:t,url:page.url(),norm:normalize(t)}); });
for (const route of routes){ await page.goto(BASE+route,{waitUntil:"domcontentloaded",timeout:120000}); await page.waitForTimeout(1200); }
const unique=[...new Set(hits.map(h=>h.norm))];
writeFileSync(join(OUT,"hydration-baseline-f3333b6.json"), JSON.stringify({base:BASE,hits,uniqueNorm:unique},null,2));
console.log(JSON.stringify({count:hits.length, unique:unique.length, unique},null,2));
await browser.close();
