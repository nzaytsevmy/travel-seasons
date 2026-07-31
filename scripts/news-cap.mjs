// Потолок на день. Гейт отвечает за «правда ли это», а этот скрипт — за «сколько».
// Без потолка в горячий день лента выдаст десяток заметок и размоет главные,
// а в пустой не выдаст ничего — и это правильно, пустой день ничем не добивается.
//
// Оставляем только сегодняшние заметки с лучшими оценками, остальные удаляем:
// заметка, не попавшая сегодня, завтра уже не новость.

import { readFileSync, readdirSync, unlinkSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseNote } from './news-gate.mjs';

const root = process.cwd();
const dir = join(root, 'src/content/news');
const cfg = JSON.parse(readFileSync(join(root, 'news/config.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// Сегодняшние = те, что робот только что создал. Старые не трогаем.
const todays = readdirSync(dir)
  .filter((f) => f.endsWith('.md') && f.startsWith(today))
  .map((f) => ({ file: f, note: parseNote(readFileSync(join(dir, f), 'utf8'), basename(f, '.md')) }))
  .sort((a, b) => (b.note.data.score ?? 0) - (a.note.data.score ?? 0));

const keep = todays.slice(0, cfg.maxPerDay);
const drop = todays.slice(cfg.maxPerDay);

for (const d of drop) {
  unlinkSync(join(dir, d.file));
  console.log(`сверх лимита, удалено: ${d.file} (оценка ${d.note.data.score})`);
}

// Аудит: без него непонятно, почему в ленте оказалось именно это.
if (!existsSync(join(root, 'news'))) mkdirSync(join(root, 'news'), { recursive: true });
appendFileSync(join(root, 'news/log.jsonl'), JSON.stringify({
  date: today,
  candidates: todays.length,
  published: keep.length,
  dropped_over_cap: drop.map((d) => ({ file: d.file, score: d.note.data.score })),
  kept: keep.map((k) => ({ file: k.file, score: k.note.data.score, topic: k.note.data.topic })),
}) + '\n');

console.log(`кандидатов сегодня ${todays.length}, оставлено ${keep.length} (лимит ${cfg.maxPerDay})`);
