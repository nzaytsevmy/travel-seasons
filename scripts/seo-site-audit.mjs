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

    // ⛔ Длина заголовка и описания. Добавлено 21.08.2026 после аудита Ahrefs: он
    // нашёл 3 длинных заголовка и 473 коротких описания, а наш аудит их не видел.
    // Пороги взяты по внешнему аудиту, а не по канону: канонные 60 знаков дают
    // 27 находок на живых страницах, где заголовок 61–66 — выдача их не режет, и
    // гейт с таким порогом начнут обходить. Ловим реальные перекосы: title > 70,
    // описание вне 100–160.
    const titleText = (html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1].trim();
    if (titleText && titleText.length > 70) {
      findings.push(['title.too_long', url, `${titleText.length} знаков`]);
    }
    const descTag = metaBy('name', 'description')[0];
    const descText = descTag?.attrs?.content?.trim() || '';
    if (descText && descText.length < 100) {
      findings.push(['description.too_short', url, `${descText.length} знаков`]);
    }
    if (descText.length > 160) {
      findings.push(['description.too_long', url, `${descText.length} знаков`]);
    }
  }

  // Вопросы и капсула-ответ: три правила цитируемости.
  //
  // ⛔ Сравнивать вопрос из разметки с видимым текстом можно только после
  // нормализации. У визовых страниц в видимом заголовке есть декоративный номер
  // «01» и плюс — без очистки дюжина ложных срабатываний на пустом месте.
  const norm = (s) => s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/^\s*\d{1,2}[.)]?\s+/, '')
    .replace(/[+−›>]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
  // Видимым считается вопрос и в аккордеоне, и обычным заголовком: поиску важно,
  // что текст на странице есть, а не в каком он теге. На странице сезонов ответы
  // стоят заголовками h2 — это законно.
  // Два разных признака, и путать их нельзя.
  //  · «есть ли на странице этот текст» — считаем широко: аккордеон, заголовок,
  //    термин списка. Поиску важно наличие текста, а не тег.
  //  · «похоже ли, что тут FAQ» — только аккордеон. Если считать заголовками,
  //    правило начинает ругаться на любую страницу с двумя подзаголовками.
  const visibleText = [
    ...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi),
    ...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi),
    ...html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/gi),
  ].map((m) => norm(m[1]));
  const accordions = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi)].map((m) => norm(m[1]));
  const schemaQuestions = [];
  let hasSpeakable = false;

  // Граница по имени тега, а не по точному «</script>»: закрывающий тег по
  // спецификации может нести пробелы и атрибуты. В нашей выдаче таких пока нет
  // (проверено на 600 страницах — ноль), но регулярка, ждущая точного вида,
  // молча пропустила бы весь блок разметки, и аудит решил бы, что схемы нет.
  for (const [, raw] of html.matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi)) {
    let j; try { j = JSON.parse(raw); } catch { findings.push(['jsonld.parse_error', url]); continue; }
    const nodes = Array.isArray(j) ? j : (j['@graph'] || [j]);
    if (/SpeakableSpecification/.test(raw)) hasSpeakable = true;
    for (const n of nodes) {
      for (const q of [].concat(n.mainEntity || [])) {
        if (q && /Question/.test([].concat(q['@type'] || []).join(' ')) && q.name) schemaQuestions.push(norm(q.name));
      }
      const t = [].concat(n['@type'] || []);
      if (t.some(x => /Article|BlogPosting/.test(x))) {
        if (n.datePublished && !n.dateModified) findings.push(['article.datemodified.missing', url]);
        if (n.dateModified && n.datePublished && n.dateModified < n.datePublished)
          findings.push(['article.dates.modified_before_published', url, `${n.dateModified} < ${n.datePublished}`]);
      }
    }
  }

  if (!page.noindex && !isStub) {
    // 1. Вопрос объявлен, а на странице его нет — по чеклисту это спам-флаг.
    for (const q of schemaQuestions) {
      if (!visibleText.some((s) => s.includes(q) || q.includes(s))) {
        findings.push(['faq.schema_without_visible', url, q.slice(0, 60)]);
      }
    }
    // 2. Вопрос виден, а для поиска его нет. Так молча терялись 22 вопроса.
    if (accordions.length >= 2 && schemaQuestions.length === 0) {
      findings.push(['faq.visible_without_schema', url, `видимых ${accordions.length}`]);
    }
    // 3. Капсула-ответ отрисована, а голосовой ответ не объявлен — страница вне
    //    канала цитирования, хотя ответ на ней уже есть.
    if (!hasSpeakable && /class=["']?[a-z-]*(tldr|lede)\b/i.test(html)) {
      findings.push(['speakable.missing', url]);
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
    // ссылки с якорем собираем отдельно: выше фрагмент отрезан вместе с '#'
    const rawHref = (hm[2] ?? hm[3] ?? hm[4] ?? '');
    if (rawHref.startsWith('/') && rawHref.includes('#'))
      (page.anchorLinks ??= []).push(rawHref);
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
// Внутренняя ссылка в никуда. Сборка о таком пишет предупреждением и спокойно
// продолжает, поэтому битая ссылка доезжает до сайта: ссылка на несуществующий
// раздел Австралии прожила в статье про города четыре выкладки (11.08.2026).
// Здесь она валит гейт. Ссылки на файлы (/llms.txt, /rss.xml) в карту страниц
// не попадают — их проверяем по наличию на диске.
const broken = new Map(); // цель → страницы, где встретилась
for (const [src, p] of pages) {
  for (const l of new Set(p.links)) {
    if (pages.has(l) || isIgnored(l)) continue;
    const rel = l.slice(ORIGIN.length);
    if (/\.\w+$/.test(rel) && existsSync(join(DIST, rel))) continue;
    if (!broken.has(l)) broken.set(l, []);
    broken.get(l).push(src);
  }
}
for (const [target, srcs] of broken)
  findings.push(['link.broken_internal', target, `со страницы ${srcs[0]}${srcs.length > 1 ? ` и ещё ${srcs.length - 1}` : ''}`]);

// Ссылка на несуществующий якорь: страница открывается, но человек попадает
// не туда, куда обещал текст. Сборка такого не видит вовсе. Найдено 12.08.2026
// при доводке статьи об Антарктиде: хаб вёл на раздел, переименованный когда-то
// давно. ⛔ Две ловушки, обе стоили ложного результата при первой проверке:
// astro-compress срезает кавычки у атрибутов (искать href без кавычек тоже),
// а кириллические якоря в HTML закодированы процентами — сравнивать после
// decodeURIComponent, иначе рабочий якорь объявляется битым.
const anchorsOf = new Map();  // URL страницы → набор её id
for (const f of htmlFiles) {
  const set = new Set();
  for (const m of readFileSync(f, 'utf8').matchAll(/id="?([^"\s>]+)/g)) set.add(m[1]);
  anchorsOf.set(urlOf(f), set);
}
for (const [src, p] of pages) {
  for (const raw of p.anchorLinks ?? []) {
    const [target, frag] = raw.split('#');
    // ⛔ Ключи anchorsOf — абсолютные (urlOf даёт ORIGIN+путь), а href в разметке
    // относительный. Без ORIGIN сравнение не совпадает НИКОГДА и проверка молча
    // пропускает всё — поймано оракулом 12.08.2026 на нарочно сломанном якоре.
    const page = ORIGIN + (target.endsWith('/') ? target : target + '/');
    if (!anchorsOf.has(page)) continue;              // саму страницу ловит проверка выше
    let anchor = frag;
    try { anchor = decodeURIComponent(frag); } catch { /* кривой процент — сравним как есть */ }
    if (!anchorsOf.get(page).has(anchor) && !anchorsOf.get(page).has(frag))
      findings.push(['link.broken_anchor', src, `${page}#${anchor}`]);
  }
}

// Индексируемые вне sitemap (кроме стабов с canonical≠self)
for (const [u, p] of pages) {
  if (!p.noindex && !(p.canonical && p.canonical !== u) && !smUrls.has(u))
    findings.push(['sitemap.missing_indexable', u]);
}

// ⛔ Вес картинок в сборке. Добавлено 21.08.2026: аудит Ahrefs нашёл 75 файлов
// тяжелее 800 КБ (самый большой 1,78 МБ) — исходники направлений были до 3872 px
// при максимальной используемой ширине 1600. Наш аудит вес не проверял вовсе.
// Порог 800 КБ — не идеал, а граница, за которой файл заметен на мобильном интернете.
{
  const assetsDir = join(DIST, '_astro');
  if (existsSync(assetsDir)) {
    for (const f of readdirSync(assetsDir)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      const bytes = statSync(join(assetsDir, f)).size;
      if (bytes > 800 * 1024) {
        findings.push(['image.too_heavy', `/_astro/${f}`, `${Math.round(bytes / 1024)} КБ`]);
      }
    }
  }
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
