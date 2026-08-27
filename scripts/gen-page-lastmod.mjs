// Дата изменения СВОИХ данных для каждого направления — вместо одной общей даты
// на весь сайт.
//
// Зачем. Программные страницы (сборы, «по месяцам», визы) получали в карте сайта
// дату последней правки любого справочного файла: тронул визовые правила Кореи —
// и 1665 страниц заявили поиску «мы обновились». Замер 27.08.2026: у 1930 адресов
// из 2018 в карте стояло 23 августа, Googlebot ушёл перепроверять их и до новых
// статей не добрался — на все статьи блога пришлось 45 его заходов из 705 за
// неделю, а вышедшие после 19 августа он не открыл ни разу («адрес неизвестен»).
//
// Теперь дата считается по стране: правка визы Кореи двигает страницы про Корею,
// а Турцию не трогает. Считается из истории git, помнить и проставлять руками
// нечего — тот же принцип, что в gen-freshness.mjs.
//
// ⛔ Требует полной истории (fetch-depth: 0). Без неё честно отдаём пусто, и
// карта работает как раньше — по общей дате.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const DATA = join(root, 'src/data');
const OUT = join(DATA, 'page-lastmod.generated.json');
const ГЛУБИНА = 400;          // коммитов истории хватает с запасом на год

const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

/** Файлы, объявившие себя носителями датированной фактуры. */
function помеченные() {
  const out = [];
  for (const name of readdirSync(DATA)) {
    if (name.endsWith('.freshness')) { out.push(join('src/data', name.replace(/\.freshness$/, '.json'))); continue; }
    if (!/\.(js|ts)$/.test(name)) continue;
    try {
      if (readFileSync(join(DATA, name), 'utf8').includes('@freshness: DATA_UPDATED')) out.push(join('src/data', name));
    } catch { /* нечитаемый пропускаем */ }
  }
  return out;
}

/** Ключи направлений — по ним узнаём, чей блок правился. */
async function направления() {
  const m = await import(new URL('../src/data/directions.js', import.meta.url));
  return (m.DIRECTIONS || []).map((d) => d.slug).filter(Boolean);
}

/** Номера изменённых строк по файлам в одном коммите. */
function тронутыеСтроки(коммит, файлы) {
  let diff;
  try {
    diff = execFileSync('git', ['show', '--unified=0', '--format=', '--no-color', коммит, '--', ...файлы],
      { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch { return {}; }
  const по_файлам = {};
  let текущий = null;
  for (const строка of diff.split('\n')) {
    const f = строка.match(/^\+\+\+ b\/(.+)$/);
    if (f) { текущий = f[1]; по_файлам[текущий] ??= []; continue; }
    const h = строка.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (h && текущий) {
      const начало = +h[1], сколько = h[2] === undefined ? 1 : +h[2];
      // Ханк удаления (0 строк) всё равно указывает на место правки.
      for (let i = 0; i < Math.max(сколько, 1); i++) по_файлам[текущий].push(начало + i);
    }
  }
  return по_файлам;
}

const КЛЮЧ = /^\s{0,4}'?([a-z][a-z0-9-]*)'?\s*:/;
const ПОЯСНЕНИЕ = /^\s*(\/\/|\/\*|\*)|^\s*$/;

/** Чей блок содержит эту строку.
 *
 * ⛔ Сначала смотрим ВНИЗ. Пояснение пишут ПЕРЕД записью, к которой оно
 *    относится, а ближайший ключ сверху — это сосед, у которого своя правка не
 *    менялась. Замер 27.08.2026: правка визовых правил Кореи из четырёх строк,
 *    три из которых комментарий, засчиталась ещё и Камбодже — та стояла выше.
 */
function хозяин(строки, номер, ключи) {
  const i0 = Math.min(номер, строки.length) - 1;
  if (i0 >= 0 && ПОЯСНЕНИЕ.test(строки[i0])) {
    for (let i = i0; i < строки.length; i++) {
      if (ПОЯСНЕНИЕ.test(строки[i])) continue;
      const m = строки[i].match(КЛЮЧ);
      return m && ключи.has(m[1]) ? m[1] : null;
    }
  }
  for (let i = i0; i >= 0; i--) {
    const m = строки[i].match(КЛЮЧ);
    if (m && ключи.has(m[1])) return m[1];
  }
  return null;
}

const файлы = помеченные();
const ключи = new Set(await направления());
const дата_направления = {};
let общая = null;

let история = [];
try {
  история = git(['log', `-${ГЛУБИНА}`, '--format=%H %cs', '--', ...файлы]).split('\n').filter(Boolean);
} catch { /* истории нет — отдадим пусто */ }

for (const строка of история) {
  const [коммит, дата] = строка.split(' ');
  общая ??= дата;
  if (дата_направления.size === ключи.size) break;
  const тронуто = тронутыеСтроки(коммит, файлы);
  for (const [файл, номера] of Object.entries(тронуто)) {
    if (!номера.length) continue;
    let содержимое;
    try { содержимое = git(['show', `${коммит}:${файл}`]).split('\n'); } catch { continue; }
    for (const н of номера) {
      const кто = хозяин(содержимое, н, ключи);
      // Первое попадание — самое свежее: история идёт от новых к старым.
      if (кто && !дата_направления[кто]) дата_направления[кто] = дата;
    }
  }
}

writeFileSync(OUT, JSON.stringify({
  общая,
  направления: дата_направления,
  найдено: Object.keys(дата_направления).length,
  всего: ключи.size,
}, null, 2) + '\n');
console.log(`даты направлений: ${Object.keys(дата_направления).length} из ${ключи.size} (общая ${общая})`);
