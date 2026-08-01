// Дата актуальности данных считается ИЗ ИСТОРИИ GIT, а не проставляется руками.
//
// Зачем так. Раньше дату бампал человек, а специальный гейт в CI следил, чтобы он
// не забыл. Гейт оказался ловушкой: он угадывал по диффу, «правка это фактуры или
// нет», список исключений в нём правился шесть раз, и каждый новый файл ронял
// сборку. Лечить это заплатками бессмысленно — проблема в том, что дату вообще
// приходилось помнить.
//
// Теперь помнить нечего: берём дату последнего коммита, который тронул файл с
// меткой «@freshness: DATA_UPDATED». Подпись «данные проверены на дату X» верна
// по построению — соврать ею невозможно, забыть тоже. Так же поступают
// jekyll-last-modified-at и mkdocs-git-revision-date.
//
// ⛔ Требует ПОЛНОЙ истории: при клоне глубины 1 git решит, что все файлы созданы
// в момент сборки. В сборочных workflow стоит fetch-depth: 0. Если истории нет
// (архив без .git, свежий клон одним коммитом) — честно падаем обратно на
// зафиксированное значение, а не выдаём дату сборки за дату проверки.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const DATA = join(root, 'src/data');
const OUT = join(DATA, 'freshness.generated.json');
const FALLBACK = '2026-07-28';   // последнее значение, проставленное вручную

const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

/** Файлы, которые сами объявили, что несут датированную фактуру. */
function markedFiles() {
  const out = [];
  for (const name of readdirSync(DATA)) {
    const p = join(DATA, name);
    if (name.endsWith('.freshness')) { out.push(join('src/data', name.replace(/\.freshness$/, '.json'))); continue; }
    if (!/\.(js|ts)$/.test(name)) continue;
    try {
      if (readFileSync(p, 'utf8').includes('@freshness: DATA_UPDATED')) out.push(join('src/data', name));
    } catch { /* нечитаемый файл пропускаем */ }
  }
  return out;
}

function lastCommitDate(files) {
  if (files.length === 0) return null;
  try {
    // %cs — дата коммита в виде YYYY-MM-DD, ровно то, что нужно подписи.
    const d = git(['log', '-1', '--format=%cs', '--', ...files]);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch {
    return null;
  }
}

/** Глубокая ли история: на shallow-клоне дата будет датой сборки, а это ложь. */
function historyIsUsable() {
  try {
    return git(['rev-parse', '--is-shallow-repository']) === 'false';
  } catch {
    return false;
  }
}

const files = markedFiles();
let date = FALLBACK;
let source = 'запасное значение';

if (historyIsUsable()) {
  const fromGit = lastCommitDate(files);
  if (fromGit) { date = fromGit; source = 'история git'; }
} else {
  source = 'история обрезана, взято запасное значение';
}

writeFileSync(OUT, JSON.stringify({ dataUpdated: date, files: files.length, source }, null, 2) + '\n');
console.log(`freshness: ${date} (${source}, файлов с меткой: ${files.length})`);
