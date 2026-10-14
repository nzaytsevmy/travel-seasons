// Редакционный отбор без дневной квоты: сохраняем все файлы кандидатов.
// Реестр не заменяет source-gate, независимое ревью и подтверждённую публикацию.
import { appendFileSync, mkdirSync, readFileSync, lstatSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { attentionMatches } from './news-attention.mjs';

export function validateEditorialConfig(config) {
  if (!config || config.selectionMode !== 'editorial') {
    throw new Error('Set selectionMode to editorial before using this inventory.');
  }
  if (config.targetPerDay != null || config.maxPerDay != null) {
    throw new Error('Editorial selection must not retain numeric daily quotas.');
  }
  if (!Number.isFinite(config.minScore) || config.minScore < 3 || config.minScore > 5) {
    throw new Error('Preserve the existing score floor (3–5).');
  }
  return config;
}

function dayOf(value) {
  if (!(value instanceof Date) && (typeof value !== 'string' || !value.trim())) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.valueOf()) ? new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date) : null;
}

function normalize(item) {
  if (!item || typeof item.file !== 'string' || !item.file.endsWith('.md')) {
    throw new Error('Each inventory item must identify a Markdown file.');
  }
  const data = item.note?.data ?? {};
  const score = data.score ?? null;
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 5)) {
    throw new Error(`Invalid score in ${item.file}`);
  }
  return {
    file: item.file, score, topic: data.topic ?? null, title: data.title ?? '',
    attentionQuery: data.attentionQuery ?? data.title ?? '', impact: data.impact ?? 'medium',
    reviewRef: data.reviewRef ?? null, addedDay: dayOf(data.added ?? data.checked),
  };
}

export function buildEditorialInventory({ config, candidates = [], tracked = [], day, attention = null, now = new Date() }) {
  validateEditorialConfig(config);
  if (!Array.isArray(candidates) || !Array.isArray(tracked)) throw new TypeError('Expected arrays.');
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) || dayOf(day) !== day) {
    throw new Error('Expected a valid Moscow date in YYYY-MM-DD format.');
  }
  const seen = new Set();
  const records = [...candidates, ...tracked].map(item => {
    const record = normalize(item);
    if (seen.has(record.file)) throw new Error(`Duplicate file: ${record.file}`);
    seen.add(record.file);
    return record;
  });
  const newNotes = records.slice(0, candidates.length).map(record => ({
    ...record, searchSurge: attentionMatches([record.attentionQuery], attention, now),
  })).sort((a, b) =>
    Number(b.impact === 'high') - Number(a.impact === 'high') ||
    Number(Boolean(b.searchSurge?.length)) - Number(Boolean(a.searchSurge?.length)) ||
    (b.score ?? -1) - (a.score ?? -1) || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return {
    schemaVersion: 2, date: day, timezone: 'Europe/Moscow', selectionMode: 'editorial',
    paused: config.paused === true,
    candidate_count: newNotes.length,
    // A file tracked in this checkout is not necessarily deployed to production.
    tracked_for_day: records.slice(candidates.length).filter(item => item.addedDay === day),
    ready_for_source_and_independent_review: newNotes.filter(item => item.score !== null && item.score >= config.minScore),
    below_score_floor: newNotes.filter(item => item.score !== null && item.score < config.minScore),
    unscored: newNotes.filter(item => item.score === null),
    source_gate: 'NOT_RUN_BY_INVENTORY', independent_review: 'NOT_VERIFIED_BY_INVENTORY',
    attention_fetch_status: attention?.status ?? 'not_measured',
    attention_status: !attention ? 'not_measured'
      : attentionMatches([], attention, now) === null ? 'unavailable_or_stale' : 'fresh_ru',
    publication: 'NOT_ATTEMPTED', deleted_files: [],
  };
}

export async function main(root = process.cwd()) {
  root = resolve(root);
  const config = validateEditorialConfig(JSON.parse(readFileSync(resolve(root, 'news/config.json'), 'utf8')));
  // Reuse the project's parser; do not introduce a second YAML implementation.
  const { parseNote } = await import('./news-gate.mjs');
  const list = args => execFileSync('git', [...args, '-z', '--', 'src/content/news'], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).split('\0').filter(file => file.endsWith('.md'));
  const load = file => {
    const absolute = resolve(root, file);
    const rel = relative(resolve(root, 'src/content/news'), absolute);
    if (!/^[a-z0-9-]+\.md$/.test(rel) || isAbsolute(rel) || !lstatSync(absolute).isFile()) {
      throw new Error(`Invalid news file: ${file}`);
    }
    return { file, note: parseNote(readFileSync(absolute, 'utf8'), rel.replace(/\.md$/, '')) };
  };
  const report = buildEditorialInventory({
    config,
    attention: existsSync(resolve(root, '.run/news-attention.json'))
      ? JSON.parse(readFileSync(resolve(root, '.run/news-attention.json'), 'utf8')) : null,
    candidates: list(['ls-files', '--others', '--exclude-standard']).map(load),
    tracked: list(['ls-files']).map(load),
    day: dayOf(new Date()),
  });
  mkdirSync(resolve(root, 'news'), { recursive: true });
  appendFileSync(resolve(root, 'news/log.jsonl'), JSON.stringify(report) + '\n');
  console.log(`Кандидатов: ${report.candidate_count}. Файлы не удалены; публикация не выполнялась.`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
