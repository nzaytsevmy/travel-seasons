import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { requiredChecks } from '../scripts/auto-merge-policy.mjs';

// ⛔ Автослияние ждёт проверки по ИМЕНАМ. Переименуй работу в расписании — и заявки
// перестанут сливаться без единого красного креста: GitHub молча держит их в «Waiting for
// status to be reported». До 12.09.2026 сторож сверял только фильтры путей и число имён,
// а что имя совпадает с настоящей работой, не проверял никто (аудит проверок, находка 5).

// Анализ кода CodeQL даёт настройка GitHub «default setup» — в репозитории его работ нет.
const FROM_GITHUB_SETTINGS = /^Analyze \(/;

export function producedNames(dir = '.github/workflows') {
  const names = new Set();
  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    const text = readFileSync(`${dir}/${file}`, 'utf8');
    const jobsAt = text.search(/^jobs:\s*$/m);
    if (jobsAt < 0) continue;
    for (const block of text.slice(jobsAt).split(/^ {2}(?=[A-Za-z0-9_-]+:\s*$)/m).slice(1)) {
      const id = block.match(/^([A-Za-z0-9_-]+):/)[1];
      let out = [(block.match(/^ {4}name:\s*(.+?)\s*$/m)?.[1] ?? id).replace(/^['"]|['"]$/g, '')];
      for (const m of block.matchAll(/^\s+([A-Za-z0-9_-]+):\s*\[([^\]]*)\]\s*$/gm)) {
        const token = `\${{ matrix.${m[1]} }}`;
        if (!out.some((n) => n.includes(token))) continue;
        const values = m[2].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
        out = out.flatMap((n) => values.map((v) => n.split(token).join(v)));
      }
      out.forEach((n) => names.add(n));
    }
  }
  return names;
}

const missing = (required, names) => required.filter((n) => !FROM_GITHUB_SETTINGS.test(n) && !names.has(n));

test('каждая обязательная проверка автослияния производится работой в расписаниях', () => {
  const names = producedNames();
  const required = requiredChecks(['src/pages/index.astro']);
  assert.ok(required.length > 20, `политика вернула подозрительно мало имён: ${required.length}`);
  assert.deepEqual(missing(required, names), []);
});

test('сторож видит переименованную работу', () => {
  const names = producedNames();
  assert.deepEqual(missing(['visual (5/4)', 'Analyze (python)', 'build'], names), ['visual (5/4)']);
});
