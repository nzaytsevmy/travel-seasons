import test from 'node:test';
import assert from 'node:assert/strict';
import { proseHash } from '../scripts/article-review-gate.mjs';
import { articleProse } from '../scripts/edit-kind.mjs';

const post = lead => `---\ntitle: "Возврат"\ndescription: "Условия возврата"\n${lead}\n---\nУсловия в заказе.\n`;

test('подмена многострочного короткого ответа ломает хеш ревью', () => {
  const original = post('lead: |\n  Возврат зависит от тарифа.');
  const changed = original.replace('зависит от тарифа', 'гарантирован всегда');
  assert.notEqual(proseHash(original), proseHash(changed));
});

test('первое слово короткого ответа доступно языковому контролю', () => {
  const prose = articleProse(post('lead: "Очень полезный совет."'));
  assert.match(prose, /(^|[\s(«—-])очень([\s.,;:!?»)]|$)/im);
});
