#!/usr/bin/env node
/**
 * Снимок страницы-первоисточника, снятый браузером.
 *
 * Зачем (19.08.2026). Сайты японского МИД и всех японских посольств ушли за
 * Akamai и отдают 403 любому серверу — с любым User-Agent, из любого места.
 * В браузере страница открывается нормально. Гейт считает такой источник
 * неподтверждающим, и заметка умирает — хотя это ровно тот первоисточник,
 * которого рубрика требует для визовых фактов. Получалось, что защита от
 * выдумок выбрасывала министерства и оставляла пересказы.
 *
 * Здесь снимок кладётся РУКАМИ: текст достаётся браузером через Claude in
 * Chrome и передаётся на вход. Гейт потом сверяет по нему числа — но только
 * если живой запрос действительно упёрся в блокировку, и только пока снимок
 * свежий. Тихо подменить живую страницу снимком нельзя: открытый источник
 * всегда читается напрямую.
 *
 * Использование:
 *   node scripts/news-snapshot.mjs <url> "<заголовок страницы>" < текст.txt
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const snapshotKey = (url) =>
  createHash('sha1').update(url.replace(/\/+$/, '')).digest('hex').slice(0, 16);

export const snapshotDir = (root) => join(root, 'news/snapshots');

export function writeSnapshot(root, { url, title, text, capturedAt, capturedBy = 'claude-in-chrome' }) {
  const dir = snapshotDir(root);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${snapshotKey(url)}.json`);
  const body = { url, title, capturedAt, capturedBy, text };
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  return file;
}

const isMain = process.argv[1] && process.argv[1].endsWith('news-snapshot.mjs');
if (isMain) {
  const [url, title] = process.argv.slice(2);
  if (!url) {
    console.error('нужен адрес страницы: node scripts/news-snapshot.mjs <url> "<заголовок>" < текст.txt');
    process.exit(2);
  }
  const text = await new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
  });
  if (text.trim().length < 400) {
    console.error(`в снимке ${text.trim().length} знаков, нужно от 400 — страница снята не целиком`);
    process.exit(1);
  }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const capturedAt = new Date().toISOString().slice(0, 10);
  const file = writeSnapshot(root, { url, title: title ?? '', text: text.trim(), capturedAt });
  console.log(`снимок записан: ${file}\n  адрес: ${url}\n  знаков: ${text.trim().length}\n  снят: ${capturedAt}`);
}
