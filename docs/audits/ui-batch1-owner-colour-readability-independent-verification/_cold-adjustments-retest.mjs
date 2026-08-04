import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const BASE="http://localhost:3465";
const browser=await chromium.launch({headless:true});
const results=[];
for(let i=0;i<3;i++){
  const ctx=await browser.newContext();
  const page=await ctx.newPage();
  const consoleMsgs=[];
  page.on("pageerror",e=>consoleMsgs.push(String(e)));
  page.on("console",m=>{ if(m.type()==="error") consoleMsgs.push(m.text()); });
  const started=Date.now(); let status=null,error=null,bodySnippet="";
  try{
    const res=await page.goto(BASE+"/staffpay?section=adjustments",{waitUntil:"domcontentloaded",timeout:180000});
    status=res?.status()??null;
    try{await page.waitForLoadState("networkidle",{timeout:20000});}catch{}
    await page.waitForTimeout(800);
    bodySnippet=await page.evaluate(()=>document.body?.innerText?.slice(0,300)||"");
  }catch(e){error=String(e);}
  results.push({attempt:i+1,status,ms:Date.now()-started,error,jsonParseErrors:consoleMsgs.filter(m=>/Unexpected end of JSON|JSON/i.test(m)),consoleErrors:consoleMsgs.slice(0,15),bodySnippet,looksLike500:status===500||/Internal Server Error|Application error/i.test(bodySnippet)});
  await ctx.close();
}
writeFileSync(join(process.cwd(),"docs/audits/ui-batch1-owner-colour-readability-independent-verification/cold-adjustments-clean-server.json"), JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
await browser.close();
