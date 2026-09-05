// Мелкая правка или переработка — решение Никиты 05.09.2026.
//
// 05.09.2026 исправление одной даты («декабрь 2024» вместо «январь 2025») в двух статьях
// включило три тяжёлых гейта, введённых для новых и переработанных текстов: подтверждение
// происхождения всех кадров статьи, независимую оценку другой моделью с хешем текста и сроки
// пересмотра у каждой цены — часы работы на одно слово. Правила остаются, но включаются
// только на настоящей правке. Переработка — это больше SMALL_EDIT_MAX_WORDS изменённых слов
// прозы или смена заголовка либо описания (они входят в хеш оценки). Всё, что меньше, —
// мелкая правка: ей достаточно новой записи в журнале с источником и чистого языка в
// добавленных строках. Новые картинки переработкой не считаются, но их происхождение и
// подписи проверяются как раньше.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export const SMALL_EDIT_MAX_WORDS = 40;
const IMAGE_REF = /\.\/_images\/([A-Za-z0-9._/-]+?\.(?:jpe?g|png|webp|svg))/g;

export function splitPost(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: src };
}
const scalar = (fm, key) => fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? '';
const words = (text) => text.split(/\s+/).filter(Boolean);
const refs = (body) => [...body.matchAll(IMAGE_REF)].map((m) => m[1]);

/** Длина наибольшей общей подпоследовательности: два ряда памяти, O(n·m) времени. */
function lcsLength(a, b) {
  if (!a.length || !b.length) return 0;
  let prev = new Uint32Array(b.length + 1);
  let cur = new Uint32Array(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

/** Построчный diff: какие строки убраны и какие добавлены (по общей подпоследовательности строк). */
export function lineDiff(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const n = a.length; const m = b.length;
  const dp = new Uint32Array((n + 1) * (m + 1));
  const at = (i, j) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[at(i, j)] = a[i] === b[j] ? dp[at(i + 1, j + 1)] + 1 : Math.max(dp[at(i + 1, j)], dp[at(i, j + 1)]);
    }
  }
  const removed = []; const added = [];
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i += 1; j += 1; }
    else if (dp[at(i + 1, j)] >= dp[at(i, j + 1)]) { removed.push(a[i]); i += 1; }
    else { added.push(b[j]); j += 1; }
  }
  while (i < n) removed.push(a[i++]);
  while (j < m) added.push(b[j++]);
  return { removed, added };
}

/** Сколько слов изменено: замена слова считается один раз, чистая вставка или удаление — по числу слов. */
export function changedWords(before, after) {
  const { removed, added } = lineDiff(before, after);
  const a = words(removed.join('\n'));
  const b = words(added.join('\n'));
  const common = lcsLength(a, b);
  return Math.max(a.length - common, b.length - common);
}

/**
 * kind: 'new' — статьи в основе нет; 'meta' — проза, заголовок и описание не менялись;
 * 'small' — мелкая правка; 'rework' — переработка (тяжёлые гейты включены).
 * addedLines — добавленные строки прозы: языковой гейт мелкой правки смотрит только их.
 * newImages — кадры, которых в основе не было: храповик происхождения и гейт подписей смотрят их.
 */
export function classifyEdit(before, after) {
  const now = splitPost(after);
  if (before == null) {
    return {
      kind: 'new', wordsChanged: words(now.body).length, titleChanged: true, descriptionChanged: true,
      newImages: [...new Set(refs(now.body))], addedLines: now.body.split('\n'),
    };
  }
  const was = splitPost(before);
  const titleChanged = scalar(was.fm, 'title') !== scalar(now.fm, 'title');
  const descriptionChanged = scalar(was.fm, 'description') !== scalar(now.fm, 'description');
  const { removed, added } = lineDiff(was.body, now.body);
  const wordsChanged = changedWords(was.body, now.body);
  const known = new Set(refs(was.body));
  const newImages = [...new Set(refs(now.body))].filter((r) => !known.has(r));
  let kind = 'small';
  if (titleChanged || descriptionChanged || wordsChanged > SMALL_EDIT_MAX_WORDS) kind = 'rework';
  else if (wordsChanged === 0 && !newImages.length) kind = 'meta';
  return { kind, wordsChanged, titleChanged, descriptionChanged, newImages, addedLines: added };
}

/** Текст статьи в основе (origin/main или GITHUB_BASE_REF); null — статьи там нет. */
export function baseVersion(rel, root = process.cwd()) {
  const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
  try {
    return execFileSync('git', ['show', `${base}:${rel}`], { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** Классификация правки файла статьи относительно основы. */
export function classifyFile(rel, root = process.cwd()) {
  return classifyEdit(baseVersion(rel, root), readFileSync(`${root}/${rel}`, 'utf8'));
}

// CLI: node scripts/edit-kind.mjs src/content/blog/<slug>.mdx
if (process.argv[1]?.endsWith('edit-kind.mjs')) {
  for (const rel of process.argv.slice(2)) {
    const r = classifyFile(rel);
    process.stdout.write(`${rel}: ${r.kind}, изменено слов ${r.wordsChanged}` +
      `${r.titleChanged ? ', заголовок' : ''}${r.descriptionChanged ? ', описание' : ''}` +
      `${r.newImages.length ? `, новых кадров ${r.newImages.length}` : ''}\n`);
  }
}
