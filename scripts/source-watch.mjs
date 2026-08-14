// Сторож первоисточников: следит, не изменились ли страницы, по которым мы
// сверяли факты.
//
// Зачем. Календарь ревизий сам по себе не масштабируется: тысяча статей с
// полугодовым циклом — это шесть проверок каждый день без выходных, а сверка
// десяти статей 14.08.2026 заняла около двух часов. Сторож переворачивает
// задачу. Раз в неделю он дёргает адреса из журналов проверок и сравнивает
// страницу со слепком прошлой недели:
//
//   страница не менялась  → срок сверки продлевается сам, статья в очередь
//                           не попадает;
//   страница изменилась   → статья идёт в очередь немедленно, не дожидаясь
//                           календаря — правила меняют не по нашему графику.
//
// ⛔ Сравниваем не весь HTML, а его текст без разметки и без цифр-счётчиков:
// у госсайтов в вёрстке живут баннеры, идентификаторы сессии и «просмотров:
// 1234», от которых хеш прыгает каждый запрос. Иначе сторож кричал бы всегда,
// а гейт, который кричит всегда, перестают читать.
//
// Запуск: node scripts/source-watch.mjs [--write]
//   без --write — только отчёт, слепки не трогаются (так гоняем локально);
//   с --write   — обновляет слепки (так гоняет еженедельная задача).

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const BLOG = join(process.cwd(), 'src/content/blog');
const SNAP = join(process.cwd(), 'seo-pulse/source-snapshots.json');
const UA = 'traveltribe-source-watch/1.0 (+https://traveltribe.ru)';

/** Адреса первоисточников из журналов всех статей: url → список статей. */
export function collectSources() {
  const map = new Map();
  for (const name of readdirSync(BLOG).filter((n) => /\.mdx?$/.test(n))) {
    const fm = readFileSync(join(BLOG, name), 'utf8').split('---')[1] ?? '';
    if (!/^checks:/m.test(fm)) continue;
    const slug = name.replace(/\.mdx?$/, '');
    for (const m of fm.matchAll(/^\s+url:\s*"([^"]+)"/gm)) {
      const url = m[1];
      if (!map.has(url)) map.set(url, new Set());
      map.get(url).add(slug);
    }
  }
  return map;
}

/** Отпечаток содержимого: только текст, без разметки, цифр и лишних пробелов. */
export function fingerprint(html) {
  const text = html
    // Регистр обязателен: страница с <SCRIPT> отдала бы код внутрь отпечатка,
    // и сторож кричал бы на каждой сборке чужого сайта.
    .replace(/<script[\s\S]*?<\/script\s*>|<style[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\d[\d\s.,:/-]*/g, ' ')   // счётчики, даты сборки, идентификаторы сессии
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return { hash: createHash('sha256').update(text).digest('hex').slice(0, 16), size: text.length };
}

async function fetchPage(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25_000);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: ctl.signal, redirect: 'follow' });
    if (!res.ok) return { error: `код ${res.status}` };
    return { html: await res.text() };
  } catch (e) {
    return { error: String(e.message || e).slice(0, 60) };
  } finally {
    clearTimeout(timer);
  }
}

export async function run({ write = false } = {}) {
  const sources = collectSources();
  const prev = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, 'utf8')) : {};
  const next = {};
  const changed = [];
  const broken = [];

  for (const [url, slugs] of sources) {
    const { html, error } = await fetchPage(url);
    if (error) {
      broken.push({ url, error, slugs: [...slugs] });
      next[url] = prev[url] ?? null;   // недоступность — не повод терять слепок
      continue;
    }
    const fp = fingerprint(html);
    const before = prev[url];
    if (before && before.hash !== fp.hash) {
      // Крошечная разница чаще всего означает баннер или подпись «обновлено»,
      // а не правку правил: порог отсекает шум, но пропускает настоящие правки.
      const delta = Math.abs(fp.size - before.size);
      if (delta > 40 || fp.size === before.size) {
        changed.push({ url, slugs: [...slugs], delta });
      }
    }
    next[url] = { hash: fp.hash, size: fp.size, checked: new Date().toISOString().slice(0, 10) };
  }

  if (write) writeFileSync(SNAP, JSON.stringify(next, null, 2) + '\n');
  return { total: sources.size, changed, broken, first: Object.keys(prev).length === 0 };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const r = await run({ write: process.argv.includes('--write') });
  console.log(`Первоисточников под наблюдением: ${r.total}`);
  if (r.first) console.log('Первый прогон — слепки только что созданы, сравнивать не с чем.');
  if (r.changed.length) {
    console.log(`\nИзменились ${r.changed.length}:`);
    for (const c of r.changed) console.log(`  ${c.url}\n    → статьи: ${c.slugs.join(', ')}`);
  } else if (!r.first) {
    console.log('Изменений нет — сроки сверки можно не трогать.');
  }
  if (r.broken.length) {
    console.log(`\nНе открылись ${r.broken.length}:`);
    for (const b of r.broken) console.log(`  ${b.url} — ${b.error}`);
  }
}
