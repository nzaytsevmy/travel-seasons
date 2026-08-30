import test from 'node:test';
import assert from 'node:assert/strict';
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
