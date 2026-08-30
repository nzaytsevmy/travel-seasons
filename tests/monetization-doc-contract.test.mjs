import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('денежный канон требует зрелой выручки и причинного эксперимента', async () => {
  const standard = await read('MONETIZATION-2026.md');

  for (const required of [
    'approved net revenue / 1 000 eligible assigned organic sessions',
    'intention-to-treat',
    'A/A',
    'Sample Ratio Mismatch',
    'MDE',
    'окно зрелости',
  ]) {
    assert.match(standard, new RegExp(required.replaceAll('/', '\\/'), 'i'), required);
  }

  assert.doesNotMatch(standard, /один вариант на период/i);
  assert.match(standard, /до[^\n]{0,20}после[^\n]{0,80}не[^\n]{0,30}причин/i);
});

test('внешние исследования отделены от локальных денежных доказательств', async () => {
  const canon = await read('research/monetization-placement-canon.md');

  assert.match(canon, /иерархия доказательств/i);
  assert.match(canon, /не оценивают[^\n]+выручк[^\n]+TravelTribe/i);
  assert.match(canon, /рандомиз/i);
  assert.match(canon, /гипотез/i);
  assert.doesNotMatch(canon, /matomo\.org|slate\.com/i);
});

test('операционные правила не возвращают выдуманные бенчмарки', async () => {
  const claude = await read('CLAUDE.md');
  const invariants = await read('tests/content-invariants.spec.ts');
  const operationalPrompts = [
    await read('DAILY-ARTICLE-PROMPT.md'),
    await read('PACKING-MONEY-PROMPT.md'),
    await read('research/seo-sources.md'),
  ].join('\n');
  const forbidden = [
    /\+30[–-]50% CTR/i,
    /[×x]1[.,]5[–-]2 earnings/i,
    /CTR >1%/i,
    /конверсия >2%/i,
    /content-affiliate [×x]2[.,]4/i,
    /≥3 точки CTA/i,
    /одной кнопки на 150 слов/i,
    /mobile = \+64% конверсии/i,
    /First-person CTA \([×x]~?90%/i,
  ];

  for (const pattern of forbidden) assert.doesNotMatch(claude, pattern);
  assert.doesNotMatch(invariants, /MIN_WORDS_PER_CTA|у кнопок есть потолок|каждый блог-пост содержит|у каждого направления есть предложение/i);
  assert.doesNotMatch(operationalPrompts, /кнопк[аи] на 150 слов|главная касса[^\n]+авторские туры/i);
  assert.match(claude, /подтвержд[её]нн[^\n]+чист[^\n]+доход/i);
});

test('плановая статья наследует полный денежный канон и его гейты', async () => {
  const prompt = await read('DAILY-ARTICLE-PROMPT.md');

  for (const required of [
    'MONETIZATION-2026.md',
    'research/monetization-placement-canon.md',
    'approved net revenue',
    'intention-to-treat',
    'npm run check:monetization',
    'npm run check:monetization:browser',
  ]) {
    assert.match(prompt, new RegExp(required.replaceAll('/', '\\/'), 'i'), required);
  }

  assert.match(prompt, /intent[^\n]+none[^\n]+без[^\n]+партн[её]р/i);
  assert.match(prompt, /CTR[^\n]+диагностик/i);
  assert.match(prompt, /партн[её]рск[\s\S]{0,40}выгрузк[\s\S]{0,40}не[\s\S]{0,30}подключен/i);
  assert.match(prompt, /не[^\n]+эксперимент[^\n]+без[^\n]+рандомиз/i);
  assert.doesNotMatch(prompt, /у каждой денежной кнопки должна быть метка рекламы/i);
});
