// Щит партнёрских ссылок. В готовых страницах адрес партнёра не лежит открытым
// текстом: ссылка ведёт на /go/, настоящий адрес хранится в data-go (base64) и
// возвращается в href коротким скриптом в самом конце страницы — раньше, чем
// исполняются отложенные модули (трекинг кликов видит обычные адреса).
//
// ⛔ Зачем. Сверка 06.09.2026: за 90 дней касса Travelpayouts насчитала 8 702
// клика, живых с сайта — 729, по Метрике — 458. Остальное — обход сайта роботами
// без JavaScript (10–23.08: 5 362 «клика» из США, Бразилии и Сингапура без реферера
// по 1 281 странице). Такие «клики» портят статистику и грозят санкциями партнёров.
// Робот, который не исполняет скрипты, теперь видит только /go/.
//
// Заодно каждая tpk.mx-ссылка без метки страницы получает sub_id по адресу страницы:
// 46% живых кликов (333 из 729) шли без метки, и их нельзя было отнести к странице.
//
// Проверки, читающие сборку (content-invariants, аудит монетизации), снимают щит
// функцией unshieldHtml и видят те же адреса, что и раньше.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyPartner } from '../src/data/monetization.js';

export const GO_PATH = '/go/';
export const RESTORE_SCRIPT = "<script data-tt-go>(function(){var l=document.querySelectorAll('a[data-go]');for(var i=0;i<l.length;i++){var a=l[i];try{a.setAttribute('href',atob(a.getAttribute('data-go')));a.removeAttribute('data-go');}catch(e){}}})();</script>";

const KNOWN_TOP = new Set(['blog', 'trips', 'packing', 'visa', 'seasons', 'compare', 'countries', 'calculator',
  'novosti', 'about', 'events', 'cards', 'my', 'go', 'og', 'pagefind', 'search', 'tag', 'legal', 'privacy']);
const ANCHOR_RE = /<a\b[^>]*>/gi;
const HREF_RE = /\shref=("([^"]*)"|'([^']*)')/i;

export const cleanSubId = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Метка страницы по её адресу: /blog/ozero-ritsa-2026/ → ozero_ritsa_2026 (как в статьях),
// /trips/october/thailand/ → trips_october_thailand, /kenya/ → hub_kenya, главная → home.
export function subIdForPath(pagePath) {
  const segs = String(pagePath || '/').split(/[?#]/)[0].split('/').filter(Boolean)
    .map((s) => s.replace(/\.html$/, '')).filter((s) => s !== 'index');
  if (!segs.length) return 'home';
  if (segs[0] === 'blog' && segs.length === 2) return cleanSubId(segs[1]);
  if (segs.length === 1 && !KNOWN_TOP.has(segs[0])) return cleanSubId(`hub_${segs[0]}`);
  return cleanSubId(segs.join('_'));
}

// tpk.mx читает свои параметры до &u=; метка ставится параметром шортлинка, не внутри цели.
export function withSubId(href, subId) {
  let host = '';
  try { host = new URL(href).hostname.toLowerCase(); } catch { return href; }
  if (!host.endsWith('.tpk.mx') || !subId) return href;
  const cut = href.indexOf('&u=');
  const base = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? '' : href.slice(cut);
  if (/[?&]sub_id=/.test(base)) return href;
  const sub = `sub_id=${cleanSubId(subId)}`;
  const q = base.indexOf('?');
  if (q === -1) return `${base}?${sub}${rest}`;
  const afterQ = base.slice(q + 1);
  return `${base.slice(0, q + 1)}${sub}${afterQ ? `&${afterQ}` : ''}${rest}`;
}

export function shieldHtml(html, pagePath) {
  const subId = subIdForPath(pagePath);
  let links = 0;
  let injected = 0;
  let out = html.replace(ANCHOR_RE, (tag) => {
    if (/\sdata-go=/.test(tag)) return tag;
    const m = tag.match(HREF_RE);
    if (!m) return tag;
    const href = m[2] ?? m[3] ?? '';
    if (!/^https?:\/\//i.test(href) || !classifyPartner(href)) return tag;
    const marked = withSubId(href, subId);
    if (marked !== href) injected += 1;
    links += 1;
    const b64 = Buffer.from(marked, 'utf8').toString('base64');
    return tag.replace(HREF_RE, ` href="${GO_PATH}" data-go="${b64}"`);
  });
  const escaped = shieldEscaped(out, pagePath);
  out = escaped.html;
  links += escaped.links;
  if (links && !out.includes('data-tt-go')) {
    out = out.includes('</body>') ? out.replace('</body>', `${RESTORE_SCRIPT}</body>`) : out + RESTORE_SCRIPT;
  }
  return { html: out, links, injected };
}

// Ссылки, лежащие внутри JSON-строк (ответы FAQ в JSON-LD): кавычки экранированы как \".
const ESCAPED_RE = /href=\\"(https?:\/\/[^"\\]+)\\"/g;
export function shieldEscaped(html, pagePath) {
  const subId = subIdForPath(pagePath);
  let links = 0;
  const out = html.replace(ESCAPED_RE, (whole, href) => {
    if (!classifyPartner(href)) return whole;
    links += 1;
    const b64 = Buffer.from(withSubId(href, subId), 'utf8').toString('base64');
    return `href=\\"${GO_PATH}\\" data-go=\\"${b64}\\"`;
  });
  return { html: out, links };
}

export function unshieldHtml(html) {
  return html
    .replace(/href="\/go\/" data-go="([A-Za-z0-9+/=]+)"/g,
      (_, b64) => `href="${Buffer.from(b64, 'base64').toString('utf8')}"`)
    .replace(/href=\\"\/go\/\\" data-go=\\"([A-Za-z0-9+/=]+)\\"/g,
      (_, b64) => `href=\\"${Buffer.from(b64, 'base64').toString('utf8')}\\"`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
  });
}

export function shieldDist(dist) {
  const total = { pages: 0, links: 0, injected: 0 };
  for (const file of walk(dist)) {
    const rel = `/${relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '')}`;
    if (rel === GO_PATH) continue;
    const result = shieldHtml(readFileSync(file, 'utf8'), rel);
    if (!result.links) continue;
    writeFileSync(file, result.html);
    total.pages += 1; total.links += result.links; total.injected += result.injected;
  }
  return total;
}

export function ttAffiliateShield() {
  return {
    name: 'tt-affiliate-shield',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const r = shieldDist(fileURLToPath(dir));
        logger.info(`щит партнёрских ссылок: страниц ${r.pages}, ссылок ${r.links}, добавлено меток ${r.injected}`);
      },
    },
  };
}
