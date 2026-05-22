import { chromium } from 'playwright';const br=await chromium.launch();
const p=await (await br.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1})).newPage();
await p.goto('https://traveltribe.ru/?a='+Date.now(),{waitUntil:'networkidle'});await p.waitForTimeout(1000);
const x=await p.evaluate(()=>{const L=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().left):null};
  return {wordmark:L('.wm'), nav_ul:L('.nav ul'), idx:L('.idx'), h1:L('.h1'), seasonlead:L('.seasonlead'),
    dash_th:L('.dash thead th'), dash_firstcell:L('.dash tbody td'), gear_h:L('.gear-h h2'), footer:L('.ft')};});
console.log(JSON.stringify(x,null,0));
