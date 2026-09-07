import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  evaluateChecks,
  isContentOnly,
  requiredChecks,
} from '../scripts/auto-merge-policy.mjs';

test('текстовая заявка не ждёт тяжёлые визуальные замеры', () => {
  const files = [
    'src/content/blog/peru.md',
    'news/2026-08-30-example.md',
    'public/llms-full.txt',
    'notes.md',
  ];

  assert.equal(isContentOnly(files), true);
  assert.equal(requiredChecks(files).length, 6);
});

test('код или смешанная заявка ждёт полный гейт', () => {
  const files = ['src/content/blog/peru.md', 'src/pages/index.astro'];
  const required = requiredChecks(files);

  assert.equal(isContentOnly(files), false);
  assert.equal(required.length, 26);
  assert.ok(required.includes('visual (4/4)'));
  assert.ok(required.includes('mobile (8/8)'));
});

test('слияние разрешено только когда каждый обязательный check зелёный', () => {
  const required = ['build', 'scan'];

  assert.deepEqual(evaluateChecks(required, []), {
    ready: false,
    missing: ['build', 'scan'],
    pending: [],
    failed: [],
  });

  assert.deepEqual(evaluateChecks(required, [
    { name: 'build', status: 'completed', conclusion: 'success' },
    { name: 'scan', status: 'in_progress', conclusion: null },
  ]), {
    ready: false,
    missing: [],
    pending: ['scan'],
    failed: [],
  });

  assert.deepEqual(evaluateChecks(required, [
    { name: 'build', status: 'completed', conclusion: 'failure' },
    { name: 'scan', status: 'completed', conclusion: 'success' },
  ]), {
    ready: false,
    missing: [],
    pending: [],
    failed: ['build'],
  });

  assert.equal(evaluateChecks(required, [
    { name: 'build', status: 'completed', conclusion: 'failure' },
    { name: 'build', status: 'completed', conclusion: 'success' },
    { name: 'scan', status: 'completed', conclusion: 'success' },
  ]).ready, true);
});

test('после auto-merge явно запускается production deploy', () => {
  const workflow = readFileSync('.github/workflows/auto-merge.yml', 'utf8');

  assert.match(workflow, /^\s{2}actions: write$/m);
  assert.match(workflow, /actions\.createWorkflowDispatch/);
  assert.match(workflow, /workflow_id: 'deploy\.yml'/);
});

// Артефакт независимой оценки reviews/blog/<slug>.json — числа и текст рецензии.
// Страницу он не рисует: ни один компонент его не читает, в шапке статьи лежит
// только строка reviewRef, а сам файл разбирает лишь scripts/article-review-gate.mjs.
// Значит он обязан считаться контентом во ВСЕХ фильтрах сразу, иначе беда с любой
// стороны:
//   · нет в paths-ignore → каждая публикация статьи платит полным визуальным
//     набором и замером скорости (заявка #529: 28 проверок вместо восьми, при
//     том что из 26 файлов вне фильтра был ровно один — reviews/blog/zimovka-2027.json);
//   · нет в isContentOnly → auto-merge ждёт visual (1/4) и mobile (8/8), которых
//     GitHub из-за paths-ignore не запускал, и заявка висит до таймаута 42 минуты.
const CONTENT_ONLY_IGNORE = [
  'src/content/**',
  'news/**',
  'reviews/**',
  'public/llms*.txt',
  '**/*.md',
];

const CONTENT_SAMPLES = [
  'src/content/blog/peru.mdx',
  'news/2026-09-07-example.md',
  'reviews/blog/zimovka-2027.json',
  'public/llms-full.txt',
  'AGENTS.md',
];

const CODE_SAMPLES = [
  'src/components/Header.astro',
  'src/data/countries.json',
  'scripts/pre-push.sh',
  '.github/workflows/visual-tests.yml',
];

function pathsIgnore(workflow) {
  const text = readFileSync(`.github/workflows/${workflow}`, 'utf8');
  const block = text.match(/^ *paths-ignore:\n((?: *- *'[^']*'\n)+)/m);
  assert.ok(block, `${workflow}: не найден блок paths-ignore`);
  return [...block[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

// Прогоняем НАСТОЯЩИЙ фильтр хука, а не его пересказ: вынимаем регулярку из
// скрипта и скармливаем ей список путей тем же grep -vE, что стоит в pre-push.
function prePushCodeTouched(paths) {
  const script = readFileSync('scripts/pre-push.sh', 'utf8');
  const pattern = script.match(/grep -vE '([^']+)'/);
  assert.ok(pattern, 'scripts/pre-push.sh: не найден фильтр CODE_TOUCHED');
  const run = spawnSync('grep', ['-vE', pattern[1]], {
    input: `${paths.join('\n')}\n`,
    encoding: 'utf8',
  });
  return run.stdout.split('\n').filter(Boolean);
}

test('оба workflow и политика слияния считают контентом один и тот же список', () => {
  assert.deepEqual(pathsIgnore('visual-tests.yml'), CONTENT_ONLY_IGNORE);
  assert.deepEqual(pathsIgnore('lighthouse.yml'), CONTENT_ONLY_IGNORE);

  assert.equal(isContentOnly(CONTENT_SAMPLES), true);
  assert.equal(requiredChecks(CONTENT_SAMPLES).length, 6);

  for (const file of CODE_SAMPLES) {
    assert.equal(isContentOnly([file]), false, `${file} обязан поднимать полный гейт`);
  }
});

test('предпушевой хук относит артефакт оценки к контенту, а код — к коду', () => {
  assert.deepEqual(prePushCodeTouched(CONTENT_SAMPLES), []);
  assert.deepEqual(prePushCodeTouched(CODE_SAMPLES), CODE_SAMPLES);
});
