#!/usr/bin/env node
// Site-wide SEO-аудит dist/ — прогонять после build: `npm run check:seo`.
// Проверки по канону SEO-CHECKLIST-2026.md + модули claude-seo-ai (M2/M8/M10/M13/M17):
//   canonical (self, единственный), robots-meta vs sitemap (noindex-URL в sitemap = fail),
//   OG/Twitter-карточки, Article dateModified, generic-анкоры, orphan-страницы,
//   H1=1, JSON-LD парсится, sitemap-консистентность.
// Не сеть, только файлы dist/ — секунды на 2300 страниц. Exit 1 при находках.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = process.argv[2] || 'dist';
const ORIGIN = 'https://traveltribe.ru';

// Известные исключения (проверены вручную — НЕ дефекты):
const IGNORE = [
  /\/(yandex_|zen_)[a-zA-Z0-9]+\.html$/, // верификационные файлы Я.Вебмастер/Дзен
  /\/404(\.html|\/)?$/,                  // страница ошибки
];
// Легаси-стабы с canonical на новый URL (задуманная склейка, редиректы Astro):
// /seasons/[c]/[m]/ → /trips/[m]/[c]/, japan-momiji и пр. Для них canonical≠self — норма,
// og:url обязан совпадать с canonical (не с URL стаба).
const isIgnored = (u) => IGNORE.some((re) => re.test(u));

function tags(html, name) {
  const out = [];
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = {};
    const are = /([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let a;
    while ((a = are.exec(m[1])) !== null) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    out.push({ attrs });
  }
  return out;
}

const htmlFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

const urlOf = (f) => {
  const rel = relative(DIST, f).replace(/\\/g, '/');
  if (rel === 'index.html') return ORIGIN + '/';
  if (rel.endsWith('/index.html')) return ORIGIN + '/' + rel.slice(0, -'index.html'.length);
  return ORIGIN + '/' + rel;
};

function sitemapUrls() {
  const urls = new Set();
  const idx = join(DIST, 'sitemap-index.xml');
  const files = [];
  if (existsSync(idx)) {
    for (const l of readFileSync(idx, 'utf8').match(/<loc>([^<]+)<\/loc>/g) || [])
      files.push(l.replace(/<\/?loc>/g, '').replace(ORIGIN + '/', ''));
  }
  for (const f of files) {
    const p = join(DIST, f);
    if (!existsSync(p)) { console.log(`FAIL sitemap-index → нет файла ${f}`); continue; }
    if (f.includes('images')) continue; // image-sitemap — другие правила
    for (const l of readFileSync(p, 'utf8').match(/<loc>([^<]+)<\/loc>/g) || [])
      urls.add(l.replace(/<\/?loc>/g, ''));
  }
  return urls;
}
const smUrls = sitemapUrls();

const findings = [];
const pages = new Map();
const GENERIC = /^(тут|здесь|сюда|читать(\s+(далее|дальше|ещё|еще))?|ссылка|click here|read more|learn more|далее)[\s.…]*$/i;
// «Подробнее» допустимо ТОЛЬКО как вторичная ссылка при наличии в том же блоке
// описательного анкора на тот же URL (кейс таблицы главной) — иначе флаг.

for (const f of htmlFiles) {
  const url = urlOf(f);
  if (isIgnored(url)) continue;
  const html = readFileSync(f, 'utf8');
  const headEnd = html.indexOf('</head>');
  const head = html.slice(0, headEnd > 0 ? headEnd : 4000);
  const page = { noindex: false, canonical: null, links: [] };
  pages.set(url, page);

  const canons = tags(head, 'link').filter(t => (t.attrs.rel || '').toLowerCase() === 'canonical').map(t => t.attrs.href);
  page.canonical = canons[0] || null;
  const isStub = page.canonical && page.canonical !== url; // легаси-склейка
  if (canons.length === 0) findings.push(['canonical.missing', url]);
  else if (canons.length > 1) findings.push(['canonical.multiple', url, canons.join(' | ')]);

  const metas = tags(head, 'meta');
  const metaBy = (key, val) => metas.filter(t => (t.attrs[key] || '').toLowerCase() === val);
  const robots = metaBy('name', 'robots')[0];
  page.noindex = !!(robots && /noindex/i.test(robots.attrs.content || ''));
  if (page.noindex && smUrls.has(url)) findings.push(['sitemap.noindex_url', url]);
  if (isStub && smUrls.has(url)) findings.push(['sitemap.non_canonical_url', url]);

  if (!page.noindex && !isStub) {
    const h1s = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1s !== 1) findings.push(['h1.count', url, `h1=${h1s}`]);
    for (const t of ['og:title', 'og:description', 'og:image', 'og:url']) {
      const tag = metaBy('property', t)[0];
      if (!tag || !tag.attrs.content) findings.push([`og.missing.${t}`, url]);
      else if (t === 'og:url' && tag.attrs.content !== (page.canonical || url))
        findings.push(['og.url_mismatch', url, `og:url=${tag.attrs.content}`]);
    }
    if (!metaBy('name', 'twitter:card')[0]) findings.push(['twitter.no_card', url]);
  }

  for (const [, raw] of html.matchAll(/<script type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j; try { j = JSON.parse(raw); } catch { findings.push(['jsonld.parse_error', url]); continue; }
    const nodes = Array.isArray(j) ? j : (j['@graph'] || [j]);
    for (const n of nodes) {
      const t = [].concat(n['@type'] || []);
      if (t.some(x => /Article|BlogPosting/.test(x))) {
        if (n.datePublished && !n.dateModified) findings.push(['article.datemodified.missing', url]);
        if (n.dateModified && n.datePublished && n.dateModified < n.datePublished)
          findings.push(['article.dates.modified_before_published', url, `${n.dateModified} < ${n.datePublished}`]);
      }
    }
  }

  const mainMatch = html.match(/<main[\s>][\s\S]*?<\/main>/i) || html.match(/<article[\s>][\s\S]*?<\/article>/i);
  const body = mainMatch ? mainMatch[0] : html.slice(headEnd);
  const are = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const seenDescriptive = new Set(); // URL, на которые в body уже есть описательный анкор
  const podrobneje = [];
  let m;
  while ((m = are.exec(body)) !== null) {
    const hm = m[1].match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!hm) continue;
    let href = (hm[2] ?? hm[3] ?? hm[4] ?? '').split('#')[0];
    if (!href) continue;
    // Итеративный strip: один проход <[^>]+>/g не убирает вложенные конструкции
    // вида "<<script>script>" (после первого прохода остаётся "<script>").
    let text = m[2], prevText;
    do { prevText = text; text = text.replace(/<[^>]*>/g, ''); } while (text !== prevText);
    text = text.trim();
    if (href.startsWith('/')) href = ORIGIN + href;
    // Точное совпадение хоста, не substring — иначе "https://traveltribe.ru.evil.com/"
    // тоже прошёл бы startsWith(ORIGIN) и попал в граф внутренних ссылок.
    if (href !== ORIGIN && !href.startsWith(ORIGIN + '/')) continue;
    const clean = href.split('?')[0];
    const norm = clean.endsWith('/') || /\.\w+$/.test(clean) ? clean : clean + '/';
    page.links.push(norm);
    if (GENERIC.test(text)) findings.push(['anchor.generic_text', url, `"${text}" → ${norm}`]);
    else if (/^подробнее/i.test(text)) podrobneje.push([norm, text]);
    else if (text.length > 2) seenDescriptive.add(norm);
  }
  for (const [target, text] of podrobneje)
    if (!seenDescriptive.has(target)) findings.push(['anchor.generic_text', url, `"${text}" → ${target} (нет описательного дубля)`]);
}

// Orphan: sitemap-URL без единой входящей внутренней ссылки
const inlinks = new Map();
for (const [src, p] of pages) for (const l of p.links) if (l !== src) inlinks.set(l, (inlinks.get(l) || 0) + 1);
for (const u of smUrls) {
  if (!pages.has(u)) { if (!isIgnored(u)) findings.push(['sitemap.url_no_file', u]); continue; }
  // Главная не orphan: на неё ведёт логотип в шапке (вне <main>, скан её не видит)
  if (u === ORIGIN + '/') continue;
  if (!inlinks.has(u)) findings.push(['orphan.no_incoming_links', u]);
}
// Индексируемые вне sitemap (кроме стабов с canonical≠self)
for (const [u, p] of pages) {
  if (!p.noindex && !(p.canonical && p.canonical !== u) && !smUrls.has(u))
    findings.push(['sitemap.missing_indexable', u]);
}

console.log(`Страниц: ${htmlFiles.length}; в sitemap: ${smUrls.size}`);
const byRule = {};
for (const [rule, ...rest] of findings) (byRule[rule] ||= []).push(rest.join(' '));
for (const rule of Object.keys(byRule).sort()) {
  const items = byRule[rule];
  console.log(`\n== ${rule} (${items.length}) ==`);
  for (const i of items.slice(0, 20)) console.log('  ' + i);
  if (items.length > 20) console.log(`  ... +${items.length - 20}`);
}
if (!findings.length) console.log('\n✅ Чисто — 0 находок.');
process.exit(findings.length ? 1 : 0);
