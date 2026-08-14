import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { checkFile, boldLeads, MAX_RITUAL_LEADS, MAX_MULTIDASH_PCT } from '../scripts/rhythm-gate.mjs';

// Ритм статей блога. Читает исходники, не сборку — прогон занимает секунды.
//
// Правило, ради которого всё: жирный лид-ответ допустим только под заголовком-
// вопросом. Под вопросом это единица цитирования, её забирает нейроответ. Под
// утверждением — ритуал: он ничего не отвечает, а держит форму, и именно от него
// текст читается машинным.
//
// Пороги взяты по эталонам голоса, а не по среднему: канон обязан проходить.

const DIR = 'src/content/blog';
const FILES = readdirSync(DIR).filter((f) => /\.mdx?$/.test(f));

// Эталоны голоса и единственная страница, которую реально цитируют. Если правка
// порога ломает хоть одну из них — порог неверный, а не файл.
const REFERENCE = [
  'milford-sound-2026.md',
  'uganda-safari-2026.md',
  'galapagos-2026.md',
  'roys-peak-2026.md',
  'ozero-ritsa-2026.mdx',
];

test('жирный лид под заголовком-вопросом считается отдельно от лида под утверждением', () => {
  const src = [
    '## Нужна ли виза в Грузию россиянам?',
    '',
    '**Нет, не нужна.** Пускают по загранпаспорту на 365 дней.',
    '',
    '## Немного истории',
    '',
    '**Первые туристы приехали сюда в девяностые.** Дальше проза.',
    '',
  ].join('\n');
  const r = boldLeads(src);
  expect(r.citable).toEqual(['Нужна ли виза в Грузию россиянам?']);
  expect(r.ritual).toEqual(['Немного истории']);
});

test('перечень с жирными подписями не считается ритуальным лидом', () => {
  const src = [
    '## Куда можно поехать без визы или с визой онлайн',
    '',
    '**ОАЭ, Абу-Даби.** Виза не нужна, прямые рейсы из Москвы.',
    '',
    '**Черногория.** Тридцать дней без визы, летят через Белград.',
    '',
    '**Чили.** Девяносто дней в каждые 180.',
    '',
  ].join('\n');
  expect(boldLeads(src).ritual).toEqual([]);
});

test('эталоны голоса и цитируемая страница проходят оба порога', () => {
  for (const f of REFERENCE) {
    const r = checkFile(`${DIR}/${f}`);
    expect(r.ritual.length, `${f}: ритуальных лидов ${r.ritual.length}`).toBeLessThanOrEqual(MAX_RITUAL_LEADS);
    expect(r.dashShare, `${f}: предложений с двумя тире ${r.dashShare.toFixed(1)}%`).toBeLessThanOrEqual(MAX_MULTIDASH_PCT);
  }
});

test('ни в одной статье не больше трёх жирных лидов под заголовком-утверждением', () => {
  const bad = FILES
    .map((f) => ({ f, ritual: checkFile(`${DIR}/${f}`).ritual }))
    .filter((x) => x.ritual.length > MAX_RITUAL_LEADS)
    .map((x) => `${x.f}: ${x.ritual.length} — ${x.ritual.slice(0, 3).join(' · ')}`);
  expect(bad, `сверх порога ${MAX_RITUAL_LEADS}:\n  ${bad.join('\n  ')}`).toEqual([]);
});

test('ни в одной статье не больше 14% предложений с двумя и более тире', () => {
  const bad = FILES
    .map((f) => ({ f, r: checkFile(`${DIR}/${f}`) }))
    .filter((x) => x.r.dashShare > MAX_MULTIDASH_PCT)
    .map((x) => `${x.f}: ${x.r.dashShare.toFixed(1)}% — «${(x.r.dashHits[0] || '').slice(0, 70)}…»`);
  expect(bad, `сверх порога ${MAX_MULTIDASH_PCT}%:\n  ${bad.join('\n  ')}`).toEqual([]);
});
