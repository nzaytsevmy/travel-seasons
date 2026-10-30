import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getVisaDetails } from '../src/data/visa-details.js';

test('страховка не подменяет визовый режим и не обещает единое покрытие для всех стран', () => {
  const source = readFileSync(new URL('../src/pages/visa/[slug].astro', import.meta.url), 'utf8');
  const prep = source.split('<strong>Медстраховка.</strong>')[1].split('</li>')[0];
  assert.doesNotMatch(prep, /Виза не нужна|€30\s?000|от 70/);
  assert.match(prep, /требования к страховке проверяйте отдельно/);
});

test('Сингапур: документы и срок пребывания не берутся из общего шаблона eVisa', () => {
  const visa = getVisaDetails('singapore', 'evisa');
  assert.match(visa.summary, /обычн.*российск.*паспорт/);
  assert.match(visa.docs, /14A/);
  assert.match(visa.docs, /SG Arrival Card/);
  assert.match(visa.duration, /e-Pass/);
  assert.match(visa.timing, /дольше/);
  assert.doesNotMatch(visa.apply.join(' '), /90 дней|\$60–100|за 3–4/);
});
