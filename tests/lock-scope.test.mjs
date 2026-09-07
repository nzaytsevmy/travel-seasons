// Сторож разделения «тяжёлый прогон ждёт очереди, лёгкий идёт мимо».
//
// Замок нужен ради памяти: 04–06.09.2026 параллельные прогоны по четыре браузера
// со скриншотами трижды положили ноутбук. Послабление 07.09.2026 касается только
// прогонов без эталонных картинок и в один браузер. Эти тесты не дают послаблению
// расползтись: набор целиком, второй браузер, обновление эталонов и любой файл со
// скриншотами обязаны остаться тяжёлыми.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLightRun, LIGHT_SPECS } from './lock-scope.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const argv = (...rest) => ['node', 'playwright', ...rest];

test('перечисленные лёгкие файлы в один браузер идут без очереди', () => {
  assert.equal(isLightRun(argv(
    'tests/content-invariants.spec.ts', 'tests/ai-markup-litter.spec.ts',
    '--project=chromium-desktop',
  )), true);
  assert.equal(isLightRun(argv(
    'tests/changed-pages-structural.spec.ts', '--project', 'chromium-desktop',
  )), true);
});

test('весь набор без списка файлов остаётся тяжёлым', () => {
  assert.equal(isLightRun(argv('--project=chromium-desktop')), false);
  assert.equal(isLightRun(argv()), false);
});

test('чужой файл в списке делает прогон тяжёлым', () => {
  assert.equal(isLightRun(argv(
    'tests/content-invariants.spec.ts', 'tests/visual.spec.ts',
    '--project=chromium-desktop',
  )), false);
  assert.equal(isLightRun(argv('tests/visual.spec.ts', '--project=chromium-desktop')), false);
});

test('второй браузер и отсутствие браузера делают прогон тяжёлым', () => {
  assert.equal(isLightRun(argv('tests/content-invariants.spec.ts')), false);
  assert.equal(isLightRun(argv(
    'tests/content-invariants.spec.ts', '--project=chromium-desktop', '--project=webkit-desktop',
  )), false);
  assert.equal(isLightRun(argv(
    'tests/content-invariants.spec.ts', '--project=chromium-desktop,webkit-desktop',
  )), false);
});

test('обновление эталонов всегда тяжёлое', () => {
  assert.equal(isLightRun(argv(
    'tests/content-invariants.spec.ts', '--project=chromium-desktop', '--update-snapshots',
  )), false);
});

test('в белом списке нет ни одного файла со снимками эталонов', () => {
  for (const spec of LIGHT_SPECS) {
    const body = readFileSync(join(here, spec), 'utf8');
    assert.ok(
      !body.includes('toHaveScreenshot'),
      `${spec} снимает эталонный скриншот — такому файлу нельзя идти мимо очереди`,
    );
  }
});

test('каждый файл белого списка существует', () => {
  const present = new Set(readdirSync(here).filter((f) => f.endsWith('.spec.ts')));
  for (const spec of LIGHT_SPECS) {
    assert.ok(present.has(spec), `${spec} из белого списка нет в tests/ — список протух`);
  }
});
