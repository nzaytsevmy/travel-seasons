// Run manually after changing the cover: node scripts/generate-social-cover.mjs
// Reuses the homepage photograph and brand fonts; no network requests.
import { readFile, mkdir, chmod } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const data = async (path, mime) => `data:${mime};base64,${(await readFile(new URL(path, import.meta.url))).toString('base64')}`;
const photo = await data('../src/assets/destinations/georgia.jpg', 'image/jpeg');
const display = await data('../node_modules/@fontsource/old-standard-tt/files/old-standard-tt-cyrillic-400-normal.woff2', 'font/woff2');
const body = await data('../node_modules/@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2', 'font/woff2');
const latin = await data('../node_modules/@fontsource-variable/golos-text/files/golos-text-latin-wght-normal.woff2', 'font/woff2');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="ru"><meta charset="utf-8"><style>
    @font-face{font-family:Atlas;src:url('${display}')}
    @font-face{font-family:Golos;src:url('${body}')}
    @font-face{font-family:GolosLatin;src:url('${latin}')}
    *{box-sizing:border-box}body{margin:0;background:#fbfbfa;color:#15171a;font-family:Golos,GolosLatin,sans-serif}
    main{width:1200px;height:630px;display:grid;grid-template-columns:600px 600px}
    section{padding:48px 40px 42px 52px;display:flex;flex-direction:column;align-items:flex-start}
    .brand{font:500 32px GolosLatin,sans-serif;color:#1d40ae}
    h1{font:400 86px/1.04 Atlas,serif;margin:62px 0 24px;letter-spacing:-2px}
    p{font-size:30px;line-height:1.4;margin:0;color:#5c626b}
    .url{margin-top:auto;font:400 25px GolosLatin,sans-serif;color:#1d40ae}
    figure{margin:24px 24px 24px 0;display:flex;flex-direction:column;background:white;padding:12px 12px 0;border:1px solid #d9dbde}
    img{width:100%;height:518px;object-fit:cover;object-position:50% 50%}
    figcaption{font-size:21px;padding:13px 8px;color:#5c626b}
  </style><main><section><div class="brand">TravelTribe</div><h1>Куда поехать<br>и когда</h1><p>Сезоны, визы и бюджет<br>для ваших путешествий</p><div class="url">traveltribe.ru</div></section><figure><img src="${photo}" alt="Троицкая церковь в Гергети под Казбеком"><figcaption>Гергети, Грузия</figcaption></figure></main></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  await mkdir(new URL('../public/', import.meta.url), { recursive: true });
  await page.screenshot({ path: new URL('../public/og-traveltribe-v3.png', import.meta.url).pathname });
  await chmod(new URL('../public/og-traveltribe-v3.png', import.meta.url), 0o644);
} finally {
  await browser.close();
}
