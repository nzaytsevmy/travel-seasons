// Потолок на день. Гейт отвечает за «правда ли это», а этот скрипт — за «сколько».
// Без потолка в горячий день лента выдаст десяток заметок и размоет главные,
// а в пустой не выдаст ничего — и это правильно, пустой день ничем не добивается.
//
// Оставляем только сегодняшние заметки с лучшими оценками, остальные удаляем:
// заметка, не попавшая сегодня, завтра уже не новость.

import { readFileSync, unlinkSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseNote } from './news-gate.mjs';

const root = process.cwd();
const dir = join(root, 'src/content/news');
const cfg = JSON.parse(readFileSync(join(root, 'news/config.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// Новые = НЕОТСЛЕЖИВАЕМЫЕ файлы, а не «те, чьё имя начинается с сегодняшней даты».
// Первый прогон 31.07.2026 показал, почему это важно: имя файла несёт дату
// СОБЫТИЯ, а не дату сбора, поэтому робот создал 2026-07-29-… и 2026-08-01-…,
// фильтр по сегодняшнему числу не нашёл ничего, и потолок молча не применился.
// Молчаливое бездействие хуже падения: лимит выглядел рабочим, но не работал.
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'src/content/news'],
  { cwd: root, encoding: 'utf8' })
  .split('\n').map((x) => x.trim()).filter((x) => x.endsWith('.md'));

// Повторный запуск в тот же день должен учитывать заметки, которые уже успели
// попасть в main. Иначе после утренней одиночной публикации робот увидит четыре
// свободных слота, добавит ещё четыре и нарушит дневной лимит.
const trackedToday = execFileSync('git', ['ls-files', '--', 'src/content/news'],
  { cwd: root, encoding: 'utf8' })
  .split('\n').map((x) => x.trim()).filter((x) => x.endsWith('.md'))
  .map((rel) => basename(rel))
  .map((f) => ({ file: f, note: parseNote(readFileSync(join(dir, f), 'utf8'), basename(f, '.md')) }))
  .filter(({ note }) => {
    const added = note.data.added ?? note.data.checked;
    return String(added ?? '').slice(0, 10) === today;
  });

const todays = untracked
  .map((rel) => basename(rel))
  .map((f) => ({ file: f, note: parseNote(readFileSync(join(dir, f), 'utf8'), basename(f, '.md')) }))
  .sort((a, b) => (b.note.data.score ?? 0) - (a.note.data.score ?? 0));

const target = cfg.targetPerDay ?? cfg.maxPerDay;
const availableSlots = Math.max(0, cfg.maxPerDay - trackedToday.length);
const keep = todays.slice(0, availableSlots);
const drop = todays.slice(availableSlots);
const published = trackedToday.length + keep.length;

for (const d of drop) {
  unlinkSync(join(dir, d.file));
  console.log(`сверх лимита, удалено: ${d.file} (оценка ${d.note.data.score})`);
}

// Аудит: без него непонятно, почему в ленте оказалось именно это.
if (!existsSync(join(root, 'news'))) mkdirSync(join(root, 'news'), { recursive: true });
appendFileSync(join(root, 'news/log.jsonl'), JSON.stringify({
  date: today,
  candidates: trackedToday.length + todays.length,
  target,
  already_published: trackedToday.map((item) => ({ file: item.file, score: item.note.data.score })),
  published,
  deficit: Math.max(0, target - published),
  dropped_over_cap: drop.map((d) => ({ file: d.file, score: d.note.data.score })),
  kept: keep.map((k) => ({
    file: k.file,
    score: k.note.data.score,
    topic: k.note.data.topic,
    reviewRef: k.note.data.reviewRef ?? null,
  })),
}) + '\n');

console.log(`сегодня уже было ${trackedToday.length}, новых кандидатов ${todays.length}, добавлено ${keep.length} (цель ${target}, лимит ${cfg.maxPerDay})`);
if (published < target) {
  console.warn(`дефицит выпуска: ${target - published} — продолжить поиск или зафиксировать HOLD с причинами`);
}
