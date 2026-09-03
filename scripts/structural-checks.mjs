// Структурные проверки страницы: ловят ПОСЛЕДСТВИЕ, а не наличие — вылет по ширине, битые
// картинки, мусорные токены в тексте, отсутствие H1, месяц в ссылке на билет. Общая логика
// для теста в Content Gate (изменённые страницы на preview) и для живой проверки после
// выкладки (scripts/live-check.mjs). К текущей дате не обращается: ожидаемый месяц берётся
// из адреса страницы — иначе проверка повторит ту самую ошибку, которую должна ловить.
export const WIDTHS = [402, 768, 1024, 1280];
// Потолок страниц за прогон: слияние тегов в полусотне статей не должно превращать гейт в часовой прогон.
export const MAX_PAGES = 12;
const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

export function contentFileToUrl(rel) {
  let m = rel.match(/^src\/content\/blog\/([a-z0-9-]+)\.mdx?$/);
  if (m) return `/blog/${m[1]}/`;
  m = rel.match(/^src\/content\/news\/([a-z0-9-]+)\.md$/);
  if (m) return `/novosti/${m[1]}/`;
  return null;
}

export function expectedMonthCode(url) {
  const parts = new URL(url, 'https://traveltribe.ru').pathname.split('/').filter(Boolean);
  if (parts[0] === 'packing' && parts.length === 3 && MONTHS[parts[2]]) return MONTHS[parts[2]];
  if (parts[0] === 'trips' && parts.length === 3 && MONTHS[parts[1]]) return MONTHS[parts[1]];
  return null;
}

export function monthCodesInLinks(hrefs) {
  const codes = new Set();
  for (const href of hrefs) {
    let decoded = href;
    try { decoded = decodeURIComponent(decoded); } catch { /* оставляем как есть */ }
    try { decoded = decodeURIComponent(decoded); } catch { /* второй слой кодирования не обязателен */ }
    // Формат адреса поиска: {откуда}{день}{месяц}{куда}1 — день не зашиваем, иначе смена дня
    // в коде ссылок молча выключит проверку.
    for (const m of decoded.matchAll(/search\/[A-Z]{3}\d{2}(\d{2})[A-Z]{3}1/g)) codes.add(m[1]);
  }
  return [...codes];
}

export async function checkPageStructure(page, url, width) {
  const findings = [];
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  if (!response || response.status() >= 400) {
    findings.push(`HTTP ${response ? response.status() : 'нет ответа'}`);
    return findings;
  }
  // Прокрутка до низа: ленивые картинки должны загрузиться, иначе битую не отличить от неначатой.
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  const r = await page.evaluate(() => {
    const out = { overflow: null, brokenImages: [], junk: [], h1: 0, internalLinks: 0, moneyLinks: [] };
    const w = document.documentElement.clientWidth;
    // У сайта html и body стоят с overflow-x: clip — documentElement.scrollWidth при этом схлопывается
    // до ширины окна и вылета не показывает никогда. body.scrollWidth вылет видит (проверено 03.09.2026).
    const wide = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    if (wide > w + 1) {
      let worst = null;
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > w + 1 && rect.width > 0 && rect.height > 0 && (!worst || rect.right > worst.right)) {
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          worst = { right: Math.round(rect.right), tag: el.tagName.toLowerCase(), cls };
        }
      }
      out.overflow = { scrollWidth: wide, clientWidth: w, worst };
    }
    for (const img of document.images) {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) continue;
      if (img.complete && img.naturalWidth === 0) out.brokenImages.push(src.slice(0, 120));
    }
    const text = document.body.innerText || '';
    for (const token of ['undefined', '[object Object]', 'NaN']) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|[\\s>(«"])${escaped}($|[\\s<)».,!?:;"])`).test(text)) out.junk.push(token);
    }
    out.h1 = [...document.querySelectorAll('h1')].filter((h) => h.getClientRects().length > 0).length;
    out.internalLinks = document.querySelectorAll('a[href^="/"], a[href*="traveltribe.ru/"]').length;
    out.moneyLinks = [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => /tpk\.mx|aviasales/.test(h));
    return out;
  });
  if (r.overflow) {
    const worst = r.overflow.worst ? ` (${r.overflow.worst.tag}${r.overflow.worst.cls ? '.' + r.overflow.worst.cls : ''} до ${r.overflow.worst.right}px)` : '';
    findings.push(`вылет по ширине на ${width}px: scrollWidth ${r.overflow.scrollWidth} > ${r.overflow.clientWidth}${worst}`);
  }
  for (const src of r.brokenImages) findings.push(`битая картинка: ${src}`);
  for (const token of r.junk) findings.push(`мусорный токен в тексте: ${token}`);
  if (r.h1 === 0) findings.push('нет видимого H1');
  if (r.internalLinks === 0) findings.push('нет ни одной внутренней ссылки');
  const expected = expectedMonthCode(url);
  if (expected) {
    for (const code of monthCodesInLinks(r.moneyLinks)) {
      if (code !== expected) findings.push(`ссылка на билет ведёт в месяц ${code}, страница про ${expected}`);
    }
  }
  return findings;
}
