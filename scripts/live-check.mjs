#!/usr/bin/env node
// Живая проверка страниц после выкладки на четырёх ширинах: те же структурные проверки,
// что и в Content Gate, но по боевому адресу с cache-bust.
//   npm run check:live -- https://traveltribe.ru/blog/<slug>/ [ещё адреса] [--widths 402,1280]
// Код выхода 1 при любой находке — рутина обязана приложить вывод к отчёту.
import { chromium } from 'playwright';
import { checkPageStructure, WIDTHS } from './structural-checks.mjs';

const args = process.argv.slice(2);
let widths = WIDTHS;
const urls = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--widths') {
    const raw = args[++i];
    if (!raw) { console.error('после --widths нужен список ширин, например 402,1280'); process.exit(2); }
    widths = raw.split(',').map(Number);
  } else urls.push(args[i]);
}
if (!urls.length) {
  console.error('нужен хотя бы один адрес: npm run check:live -- https://traveltribe.ru/blog/<slug>/');
  process.exit(2);
}
const browser = await chromium.launch();
let total = 0;
try {
  for (const url of urls) {
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (traveltribe live-check)' });
    const page = await context.newPage();
    for (const width of widths) {
      const bust = url + (url.includes('?') ? '&' : '?') + 'v=' + Math.random().toString(36).slice(2);
      const findings = await checkPageStructure(page, bust, width);
      total += findings.length;
      console.log(`${findings.length ? '✖' : '✔'} ${url} @${width}px${findings.length ? '\n    ' + findings.join('\n    ') : ''}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(`ИТОГО: находок ${total}`);
process.exit(total ? 1 : 0);
