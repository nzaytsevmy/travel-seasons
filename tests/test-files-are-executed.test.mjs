// Сторож на сторожей: ни один файл проверок не может остаться незапущенным.
//
// ⛔ 12.09.2026 внешний рецензент нашёл двух сторожей, которых не запускал никто: список для
//    node --test заполнялся руками и терял 4 файла из 33, а прогоны по содержимому и в облаке,
//    и в локальном гейте шли списком файлов. На контентных заявках такие проверки не
//    запускались вовсе. Готового линтера для этого нет — отрасль ставит ровно такой сторож.
// ⛔ Второй заход того же дня: сам этот сторож не видел вложенных папок, а за час до того в
//    дереве лежал tests/dist/. Поэтому обход рекурсивный, а поиск проверок — с двумя звёздами.
// ⛔ Третий урок: проверки node --test идут ДО сборки сайта, читать dist им нельзя. Такой
//    сторож либо уронит сборку с «сборки нет», либо позеленеет на сборке прошлого захода.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// browser-fixture.ts импортируется браузерными spec; её контракт проверяет browser-fixture.spec.ts.
const ПОМОЩНИКИ = new Set(['global-lock.ts', 'lock-scope.mjs', 'visible-text.ts', 'test-helpers.mjs', 'browser-fixture.ts']);

function файлы(корень) {
  const out = [];
  for (const имя of readdirSync(корень)) {
    if (имя.startsWith('.') || имя.endsWith('-snapshots') || имя === 'node_modules') continue;
    const путь = join(корень, имя);
    if (statSync(путь).isDirectory()) out.push(...файлы(путь));
    else out.push(путь);
  }
  return out;
}

test('проверки находятся по имени, а не ручным списком', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const команды = Object.values(pkg.scripts).join(' ; ');
  assert.match(команды, /node --test\s+'tests\/\*\*\/\*\.test\.mjs'/,
    'прогон проверок не ищет файлы по имени рекурсивно — из ручного списка и из вложенной папки можно выпасть');
  for (const [файл, кто] of [['.github/workflows/content-gate.yml', 'облако'], ['scripts/pre-push.sh', 'локальный гейт']]) {
    const текст = readFileSync(файл, 'utf8');
    assert.match(текст, /playwright test --grep-invert "— visual"/,
      кто + ' запускает прогоны по содержимому списком файлов — из него молча выпадают проверки');
    assert.ok(!/playwright test \\\s*\n\s+tests\//.test(текст), кто + ': остался список файлов прогонов');
  }
});

test('каждый файл в папке проверок кем-то запускается', () => {
  const ничейные = [];
  // Проверки на Python и оболочке по маске не находятся — их вызывают по имени. До 12.09.2026
  // сторож смотрел только файлы JavaScript, и такая проверка могла лечь рядом и не запускаться.
  const вызовы = [
    readFileSync('package.json', 'utf8'),
    readFileSync('scripts/pre-push.sh', 'utf8'),
    ...readdirSync('.github/workflows').map((f) => readFileSync(join('.github/workflows', f), 'utf8')),
  ].join('\n');
  for (const путь of файлы('tests')) {
    const имя = путь.split('/').pop();
    if (ПОМОЩНИКИ.has(имя)) continue;
    if (имя.endsWith('.spec.ts') || имя.endsWith('.test.mjs')) continue;
    if (/\.(py|sh)$/.test(имя)) {
      if (!вызовы.includes(имя)) ничейные.push(путь + ': проверку на Python или оболочке не вызывает ни команда пакета, ни локальный гейт, ни облако');
      continue;
    }
    if (/\.(mjs|ts|js)$/.test(имя)) {
      ничейные.push(путь + ': имя не подходит ни под поиск проверок (*.test.mjs), ни под браузерный прогон (*.spec.ts) — его никто не запустит');
    }
  }
  assert.deepEqual(ничейные, [], 'файлы проверок, которых никто не запускает:\n' + ничейные.join('\n'));
});

test('проверки до сборки не читают собранный сайт', () => {
  const виновные = [];
  for (const путь of файлы('tests')) {
    if (!путь.endsWith('.test.mjs')) continue;
    const т = readFileSync(путь, 'utf8');
    if (/process\.cwd\(\)[^)]*,\s*'dist'/.test(т) || /readFileSync\(\s*'dist\//.test(т) || /existsSync\(\s*'dist'/.test(т)) {
      виновные.push(путь + ': читает собранный сайт, а этот прогон идёт до сборки — такой сторож должен быть *.spec.ts');
    }
  }
  assert.deepEqual(виновные, [], 'проверки, которым нужна сборка, стоят до неё:\n' + виновные.join('\n'));
});
