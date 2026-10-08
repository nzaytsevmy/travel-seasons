import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../src/content/blog/travelata-2026.mdx', import.meta.url), 'utf8');
const body = raw.split('---').slice(2).join('---');

test('итог сравнения учитывает пару с разницей ровно 200 рублей', () => {
  const table = body.slice(body.indexOf('| Гостиница |')).split('\n\n')[0];
  const deltas = table.split('\n').map(row => {
    const cells = row.split('|');
    const amounts = [cells[3], cells[4]].map(v => Number(v?.replace(/[^\d]/g, '')));
    return amounts.every(n => n > 0) ? Math.abs(amounts[0] - amounts[1]) : null;
  }).filter(n => n !== null);
  assert.equal(deltas.length, 12, 'проверка должна охватывать все 12 строк исходной таблицы');
  assert.deepEqual(deltas.filter(n => n > 0 && n <= 200).sort((a,b) => a-b), [179, 200]);
  assert.ok(!/менее чем на 200 ₽|меньше чем на 200 ₽/i.test(body), 'итог исключает существующую в таблице разницу ровно 200 рублей');
});
