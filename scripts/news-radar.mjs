#!/usr/bin/env node
/**
 * Сборщик поводов: обходит источники из news/config.json, достаёт с них живые
 * адреса статей и СРАЗУ проверяет каждый тем же способом, каким потом пойдёт
 * гейт. На выходе — список статей, которые заведомо откроются.
 *
 * Зачем это появилось (03.08.2026). У части хороших источников нет своей ленты:
 * у National Geographic все привычные адреса ленты отдают 404, хотя сами статьи
 * читаются прекрасно — 8–19 тысяч знаков, гейт такие принимает. Модель искала
 * адреса на глаз, промахивалась, и заметка умирала уже на гейте: «источник отдал
 * 404», «на странице нет читаемого текста». Три заметки за 03.08 умерли именно
 * так, и день вышел пустым.
 *
 * Проверка читаемости — не украшение, а главное здесь. Смотреть надо на СТАТЬЮ,
 * а не на главную страницу сайта: 02.08 я проверил главные и решил, что
 * nature.com, UNESCO и IUCN закрыты от роботов. Замер по статьям показал
 * обратное — закрыты как раз главные (редирект), а статьи отдаются нормально.
 * Обратный случай тоже есть: у Smithsonian и Atlas Obscura лента открывается, а
 * статья отвечает 403. Отсюда правило: судить по той странице, которую потом
 * будет читать гейт.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { stripHtml } from './news-gate.mjs';

const UA = 'traveltribe-news-gate/1.0 (+https://traveltribe.ru/)';

const PER_SOURCE = 6;      // сколько кандидатов берём с одной страницы
// ⛔ Добор для источников, где первые ссылки — навигация. Замер 25.08.2026:
// у IUCN и АТОР все шесть первых ссылок оказались разделами сайта, то есть эти
// два источника не давали НИ ОДНОЙ статьи, а в отчёте выглядели живыми. Берём
// следующие ссылки только там, где в первой шестёрке статей не нашлось: у
// здоровых источников это не стоит ни одного лишнего запроса.
const PER_SOURCE_RETRY = 12;
const CONCURRENCY = 8;     // параллельных проверок
const MIN_CHARS = 400;     // тот же порог, что у гейта
const TIMEOUT = 15000;
const FRESH_DAYS = 14;    // окно свежести: неделя по рубрике плюс запас

async function get(url, timeoutMs = TIMEOUT) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': UA }, redirect: 'follow' });
    return { status: res.status, body: res.ok ? await res.text() : '' };
  } catch (e) {
    return { status: `err:${e.name}`, body: '' };
  } finally {
    clearTimeout(t);
  }
}

/** Ссылки на статьи с обзорной страницы: тот же домен, путь глубже раздела. */
function extractArticleLinks(html, pageUrl) {
  let origin;
  try { origin = new URL(pageUrl).origin; } catch { return []; }
  const out = new Set();
  for (const m of html.matchAll(/href="([^"#?]+)"/gi)) {
    let href = m[1];
    if (href.startsWith('/')) href = origin + href;
    if (!href.startsWith(origin)) continue;
    const path = href.slice(origin.length).replace(/\/+$/, '');
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) continue;                       // раздел, а не статья
    const last = parts[parts.length - 1];
    if (!/[a-z]/i.test(last) || last.length < 12) continue; // слаг статьи длинный
    if (/\.(jpg|png|webp|svg|pdf|xml|css|js|json|woff2?|ttf|ico|webmanifest)$/i.test(last)) continue;
    if (/\/(page-data|wp-json|feeds?|rss)\//.test(path)) continue;
    if (/(subscribe|newsletter|privacy|terms|about|contact|login|account|shop|gift)/i.test(path)) continue;
    out.add(href);
  }
  return [...out];
}

/**
 * Дата публикации статьи. Без неё сборщик выдавал модели читаемые, но старые
 * материалы: 03.08.2026 первым кандидатом с National Geographic пришла статья
 * годичной давности, и поймал это человек, а не робот. Читаемость проверялась,
 * свежесть — нет.
 *
 * Порядок источников — от надёжного к запасному. Дата в адресе идёт последней:
 * она бывает датой раздела, а не материала.
 */
export function publishedAt(html, url = '') {
  const pats = [
    /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/i,
    /<meta[^>]+(?:property|name)="article:published_time"[^>]+content="(\d{4}-\d{2}-\d{2})/i,
    /<meta[^>]+itemprop="datePublished"[^>]+content="(\d{4}-\d{2}-\d{2})/i,
    /<meta[^>]+name="(?:date|pubdate|publish-date|DC\.date\.issued)"[^>]+content="(\d{4}-\d{2}-\d{2})/i,
    /<time[^>]+datetime="(\d{4}-\d{2}-\d{2})/i,
  ];
  for (const re of pats) {
    const m = html.match(re);
    if (m) return m[1];
  }
  // ScienceDaily: /releases/2026/07/260726015243.htm — день зашит в имя файла.
  const sd = url.match(/\/releases\/(20\d\d)\/(\d\d)\/\d\d\d\d(\d\d)/);
  if (sd) return `${sd[1]}-${sd[2]}-${sd[3]}`;
  const u = url.match(/\/(20\d\d)\/(\d\d)\/(\d\d)\//) || url.match(/\/(20\d\d)\/(\d\d)\//);
  if (u) return `${u[1]}-${u[2]}-${u[3] ?? '01'}`;
  return null;
}

/** Сколько дней назад, или null если даты нет. */
export function ageDays(date, today) {
  if (!date) return null;
  const d = Date.parse(date + 'T00:00:00Z');
  if (Number.isNaN(d)) return null;
  return Math.round((today - d) / 86400000);
}

/**
 * Статья это или раздел сайта. Отборщик ссылок судит по адресу — путь глубокий,
 * слаг длинный, — и под это правило подходят «Climate crisis», «Personal
 * Finance», «Avian Influenza - Topic» и региональные страницы IUCN. Замер
 * 25.08.2026 по 110 свежим кандидатам: 35 из них были разделами, то есть треть
 * списка, который человек читает как список поводов.
 *
 * Пометок три, потому что издания размечают статью по-разному: у большинства
 * og:type, у Nature и Mongabay — JSON-LD, у аргентинских нацпарков нет ни того,
 * ни другого, а есть только article:published_time. Хватает любой: дороже
 * потерять первоисточник, чем оставить лишний раздел.
 *
 * ⛔ Найденное здесь НЕ выбрасывается молча. Nature при параллельной загрузке
 * один раз отдал урезанный ответ без единой пометки — на живой странице все три
 * на месте. Фильтр, который бы её выбросил, соврал бы тихо, поэтому раздел
 * уезжает отдельным списком вниз отчёта, а не в никуда.
 */
export function looksLikeArticle(html) {
  if (!html) return false;
  const og = html.match(/<meta[^>]+(?:property|name)="og:type"[^>]+content="([^"]+)"/i);
  if (og && /article/i.test(og[1])) return true;
  if (/<meta[^>]+(?:property|name)="article:published_time"/i.test(html)) return true;
  if (/"@type"\s*:\s*"[^"]*(?:Article|BlogPosting)"/i.test(html)) return true;
  return false;
}

function titleOf(html) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (og) return og[1].trim();
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return t ? t[1].trim().replace(/\s+\|\s+.*$/, '') : '';
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  }));
  return out;
}

async function main() {
  const cfg = JSON.parse(readFileSync(new URL('../news/config.json', import.meta.url), 'utf8'));
  const radar = cfg.radar ?? [];

  const pages = await mapLimit(radar, CONCURRENCY, async (src) => {
    const r = await get(src.url);
    if (!r.body) return { src, status: r.status, links: [], rest: [] };
    const all = extractArticleLinks(r.body, src.url);
    return { src, status: r.status, links: all.slice(0, PER_SOURCE),
      rest: all.slice(PER_SOURCE, PER_SOURCE + PER_SOURCE_RETRY) };
  });

  const flat = [];
  for (const p of pages) for (const url of p.links) flat.push({ src: p.src, url });

  const checked = await mapLimit(flat, CONCURRENCY, async (c) => {
    const r = await get(c.url);
    const text = r.body ? stripHtml(r.body).trim() : '';
    const date = r.body ? publishedAt(r.body, c.url) : null;
    return { ...c, status: r.status, chars: text.length, date,
      age: ageDays(date, Date.now()), title: r.body ? titleOf(r.body) : '',
      // Признак берём из этого же тела: второй запрос — второй способ промахнуться.
      article: looksLikeArticle(r.body) };
  });

  // Добор: источник, у которого в первой шестёрке нет ни одной статьи, получает
  // второй заход по следующим ссылкам. Иначе он молча числится рабочим.
  const gotArticle = new Set(checked.filter((c) => c.article).map((c) => c.src.url));
  const retry = [];
  for (const p of pages) {
    if (gotArticle.has(p.src.url)) continue;
    for (const url of p.rest ?? []) retry.push({ src: p.src, url });
  }
  if (retry.length) {
    const more = await mapLimit(retry, CONCURRENCY, async (c) => {
      const r = await get(c.url);
      const text = r.body ? stripHtml(r.body).trim() : '';
      const date = r.body ? publishedAt(r.body, c.url) : null;
      return { ...c, status: r.status, chars: text.length, date,
        age: ageDays(date, Date.now()), title: r.body ? titleOf(r.body) : '',
        article: looksLikeArticle(r.body) };
    });
    checked.push(...more.filter((c) => c.article));
  }

  const good = checked.filter((c) => c.chars >= MIN_CHARS);
  // Рубрика просит поводы за последнюю НЕДЕЛЮ, но материал может выйти в
  // пятницу и попасть в сбор в понедельник — берём две недели с запасом.
  const fresh = good.filter((c) => c.age !== null && c.age <= FRESH_DAYS);
  const stale = good.filter((c) => c.age !== null && c.age > FRESH_DAYS);
  const undated = good.filter((c) => c.age === null);

  const sections = fresh.filter((c) => !c.article);
  const articles = fresh.filter((c) => c.article);

  const byTopic = new Map();
  for (const c of articles) {
    const k = c.src.topic ?? 'nature';
    if (!byTopic.has(k)) byTopic.set(k, []);
    byTopic.get(k).push(c);
  }
  for (const items of byTopic.values()) items.sort((a, b) => a.age - b.age);

  const lines = [];
  lines.push('ПОВОДЫ, ПРОВЕРЕННЫЕ НА ЧИТАЕМОСТЬ');
  lines.push('Каждый адрес ниже уже открыт и отдал текст тем же способом, каким его');
  lines.push('будет читать гейт. Бери источники ОТСЮДА, а не подбирай адрес на глаз.');
  lines.push('');
  for (const [topic, items] of [...byTopic].sort()) {
    lines.push(`── ${topic} ──`);
    for (const c of items) {
      lines.push(`  ${c.title || '(без заголовка)'}`);
      lines.push(`    ${c.url}`);
      lines.push(`    ${c.date} · ${c.age} дн. назад · ${c.src.name} · знаков: ${c.chars}`);
    }
    lines.push('');
  }

  if (sections.length) {
    lines.push(`── похоже на раздел сайта, а не на статью (${sections.length}) ──`);
    lines.push('  На странице нет ни одной пометки статьи. Обычно это рубрика вроде');
    lines.push('  «Climate crisis» или «Personal Finance»: адрес выглядит как у статьи,');
    lines.push('  а содержимое — список ссылок. Брать только убедившись глазами.');
    for (const c of sections.slice(0, 15)) {
      lines.push(`  ${(c.title || c.url).slice(0, 60)} — ${c.src.name}`);
    }
    lines.push('');
  }

  if (undated.length) {
    lines.push(`── без даты публикации (${undated.length}), брать только проверив дату руками ──`);
    for (const c of undated.slice(0, 12)) lines.push(`  ${(c.title || c.url).slice(0, 78)}\n    ${c.url}`);
    lines.push('');
  }
  if (stale.length) {
    lines.push(`── СТАРОЕ, НЕ БРАТЬ (${stale.length}) ──`);
    lines.push('  Читается, но это не новость. 03.08.2026 первым кандидатом с National');
    lines.push('  Geographic пришла статья годичной давности, и поймал её человек.');
    for (const c of stale.sort((a, b) => a.age - b.age).slice(0, 10)) {
      lines.push(`  ${c.age} дн. — ${(c.title || c.url).slice(0, 66)}`);
    }
    lines.push('');
  }

  const dead = pages.filter((p) => p.links.length === 0);
  if (dead.length) {
    lines.push('── источники, с которых не удалось взять ни одной статьи ──');
    for (const p of dead) lines.push(`  ${p.src.name} — ${p.status} — ${p.src.url}`);
    lines.push('');
  }
  const blocked = checked.filter((c) => c.chars < MIN_CHARS);
  if (blocked.length) {
    lines.push(`── статьи, закрытые от робота (${blocked.length}) ──`);
    const hosts = new Map();
    for (const b of blocked) {
      const h = new URL(b.url).host;
      hosts.set(h, (hosts.get(h) ?? 0) + 1);
    }
    for (const [h, n] of [...hosts].sort((a, b) => b[1] - a[1])) lines.push(`  ${h}: ${n}`);
    lines.push('');
  }
  lines.push(`ИТОГО: источников ${radar.length}, проверено ${checked.length}, `
    + `свежих статей ${articles.length} (плюс ${sections.length} разделов), `
    + `старых ${stale.length}, без даты ${undated.length}.`);

  const text = lines.join('\n');
  const out = process.env.NEWS_RADAR_OUT ?? '/tmp/news-radar.txt';
  writeFileSync(out, text + '\n', 'utf8');
  console.log(text);
  console.log(`\nсписок записан: ${out}`);
}

// ⛔ Без этой проверки модуль обходил все источники при простом импорте: тест,
// который хочет одну функцию, запускал бы получасовой обход.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((e) => {
    console.error('сборщик поводов упал:', e);
    process.exit(1);
  });
}
