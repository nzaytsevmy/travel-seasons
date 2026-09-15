// Фукуок в данных сезонов — по нормам станции острова, а не «по ощущению».
//
// 15.09.2026: пометка Вьетнама на октябрь говорила «на Фукуоке только начинается
// сезон», а страницы «Вьетнам в октябре» — что своей метеостанции у острова нет и
// ясное окно принято отсчитывать с октября. Станция есть (ВМО 48917), и по её нормам
// в октябре 326 мм — мокрее мая и ноября; сухо с декабря по март.
// Нормы Токийского климатического центра ВМО, сняты 15.09.2026:
// https://ds.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=48917
//
// Тест держит три вещи:
//   1) каждое число, названное про Фукуок в данных сезонов Вьетнама, есть в нормах станции;
//   2) страница «Вьетнам в октябре» называет октябрьскую норму острова и не пишет, что станции нет;
//   3) месячная пометка Вьетнама про Фукуок в мокрый месяц (от 100 мм) говорит о дожде.
// Запуск: node --test tests/phu-quoc-season-claims.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES } from '../src/data/programmatic-seasons.js';
import { regionsRich } from '../src/data/regions-rich.js';

const PHU_QUOC_MM = [31.0, 20.6, 89.5, 137.0, 230.4, 368.7, 438.1, 415.3, 542.3, 325.6, 179.9, 76.9];
const ROUNDED = new Set(PHU_QUOC_MM.map(Math.round));
const WET_MM = 100;

function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

// Предложения про остров. Проценты и градусы — не осадки, их не сверяем.
function phuQuocSentences(texts) {
  return texts.flatMap((t) => t.split(/(?<=[.!?])\s+/)).filter((s) => /Фукуок/.test(s));
}

test('числа про Фукуок в данных сезонов Вьетнама есть в нормах станции 48917', () => {
  const texts = [...strings(COUNTRIES.vietnam.months), ...strings(regionsRich.vietnam)];
  const bad = [];
  for (const s of phuQuocSentences(texts)) {
    for (const m of s.matchAll(/(\d+(?:[.,]\d+)?)(?!\s*[%°\d])/g)) {
      const n = Number(m[1].replace(',', '.'));
      if (!ROUNDED.has(n)) bad.push(`${n} нет в нормах: «${s}»`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('«Вьетнам в октябре» называет октябрьскую норму Фукуока и не отрицает станцию', () => {
  const oct = COUNTRIES.vietnam.months.october;
  const text = [oct.regionsNote, ...oct.warnings].join(' ');
  const october = String(Math.round(PHU_QUOC_MM[9]));
  const sentences = phuQuocSentences([oct.regionsNote, ...oct.warnings]);
  assert.ok(sentences.some((s) => s.includes(october)), `про Фукуок в октябре нет нормы ${october} мм`);
  assert.doesNotMatch(text, /метеостанци\p{L}*\s+у\s+острова\s+нет/iu);
  assert.doesNotMatch(text, /ясное окно[^.]*октябр/iu);
});

test('пометка Вьетнама про Фукуок в мокрый месяц говорит о дожде', () => {
  const { notes, negatives } = regionsRich.vietnam;
  const bad = [];
  PHU_QUOC_MM.forEach((mm, i) => {
    for (const text of [notes[i], negatives[i]]) {
      if (!text || !/Фукуок/.test(text) || mm < WET_MM) continue;
      if (!/дожд|ливн|льёт/i.test(text)) bad.push(`месяц ${i + 1}, ${Math.round(mm)} мм: «${text}»`);
    }
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});
