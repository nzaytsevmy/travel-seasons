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
import { stripHtml } from './news-gate.mjs';

const UA = 'traveltribe-news-gate/1.0 (+https://traveltribe.ru/)';

const PER_SOURCE = 6;      // сколько кандидатов берём с одной страницы
const CONCURRENCY = 8;     // параллельных проверок
const MIN_CHARS = 400;     // тот же порог, что у гейта
const TIMEOUT = 15000;

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
    if (/\.(jpg|png|webp|svg|pdf|xml|css|js)$/i.test(last)) continue;
    if (/(subscribe|newsletter|privacy|terms|about|contact|login|account|shop|gift)/i.test(path)) continue;
    out.add(href);
  }
  return [...out];
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
    if (!r.body) return { src, status: r.status, links: [] };
    return { src, status: r.status, links: extractArticleLinks(r.body, src.url).slice(0, PER_SOURCE) };
  });

  const flat = [];
  for (const p of pages) for (const url of p.links) flat.push({ src: p.src, url });

  const checked = await mapLimit(flat, CONCURRENCY, async (c) => {
    const r = await get(c.url);
    const text = r.body ? stripHtml(r.body).trim() : '';
    return { ...c, status: r.status, chars: text.length, title: r.body ? titleOf(r.body) : '' };
  });

  const good = checked.filter((c) => c.chars >= MIN_CHARS);
  const byTopic = new Map();
  for (const c of good) {
    const k = c.src.topic ?? 'nature';
    if (!byTopic.has(k)) byTopic.set(k, []);
    byTopic.get(k).push(c);
  }

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
      lines.push(`    источник: ${c.src.name} · знаков: ${c.chars}`);
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
  lines.push(`ИТОГО: источников ${radar.length}, проверено статей ${checked.length}, годных ${good.length}.`);

  const text = lines.join('\n');
  const out = process.env.NEWS_RADAR_OUT ?? '/tmp/news-radar.txt';
  writeFileSync(out, text + '\n', 'utf8');
  console.log(text);
  console.log(`\nсписок записан: ${out}`);
}

main().catch((e) => {
  console.error('сборщик поводов упал:', e);
  process.exit(1);
});
