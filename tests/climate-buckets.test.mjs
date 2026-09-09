// Класс климата каждой страницы сборов должен стоять на нормах, а не на догадке.
//
// 05.09.2026 Никита увидел «+18–28 °C» на Алтае в январе: у 18 направлений не
// было ни норм, ни строки в ручной таблице, и код молча подставлял тёплый класс
// на любой месяц — 216 страниц. Этот тест держит три вещи:
//   1) у каждого направления есть нормы и класс на все 12 месяцев;
//   2) дневная температура норм попадает в полосу температур своего класса
//      (±4 °C) — следствие, а не форма: неверный класс красен, даже если поле есть;
//   3) неизвестный класс не подменяется тёплым.
// Запуск: node --test tests/climate-buckets.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS } from '../src/data/directions.js';
import { getWeatherBucket, classifyMonth, PLACE_BOUND, getClimateNormals, getMonthRecord } from '../src/data/country-month-bucket.js';
import { getBucket, WEATHER_BUCKETS } from '../src/data/packing-weather-buckets.js';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const TOL = 4;        // допуск по дневной температуре
const NIGHT_TOL = 7;  // ночью разброс шире: город у моря и в долине отличаются сильнее

// Первый диапазон температур в summary класса: «+18–28 °C», «Днём 0…+5», «−10…−25».
function dayBand(summary) {
  const m = summary.replace(/−/g, '-').match(/([+-]?\d+)\s*[–…]\s*([+-]?\d+)/);
  assert.ok(m, `в summary нет полосы температур: «${summary}»`);
  const a = Number(m[1]), b = Number(m[2]);
  return [Math.min(a, b), Math.max(a, b)];
}
// Ночная полоса — число или диапазон после слова «ночью»; у классов без него
// (полярный, джунгли) ночь не проверяется.
function nightBand(summary) {
  const m = summary.replace(/−/g, '-').match(/ночью\s*([+-]?\d+)(?:\s*[–…]\s*([+-]?\d+))?/);
  if (!m) return null;
  const a = Number(m[1]), b = m[2] != null ? Number(m[2]) : a;
  return [Math.min(a, b), Math.max(a, b)];
}

// Месяц, где класс задан свойством места, а не температурой.
function placeBound(slug, monthIdx) {
  const pb = PLACE_BOUND[slug];
  return !!pb && (pb.cold?.includes(monthIdx) || pb.jungle?.includes(monthIdx) || !!pb.all);
}

test('у каждого направления есть нормы климата и класс на каждый месяц', () => {
  const bad = [];
  for (const d of DIRECTIONS) {
    const n = getClimateNormals(d.slug);
    if (!n || n.months?.length !== 12) { bad.push(`${d.slug}: нет норм ERA5`); continue; }
    for (let i = 0; i < 12; i++) {
      try { getWeatherBucket(d.slug, i); } catch (e) { bad.push(`${d.slug}/${MONTHS[i]}: ${e.message}`); }
    }
  }
  assert.deepEqual(bad, []);
});

// Сверяем класс с той записью, из которой он выведен: у стран волны 1 это
// опубликованные нормы (страница печатает их числа), у остальных — ERA5.
// Станционные нормы и реанализ расходятся на 3–4 °C на побережьях пустынь
// (Хургада), и сравнивать класс с чужим источником — ловить не ошибку, а разницу
// методик.
test('класс месяца согласуется со своими нормами: дневная температура попадает в полосу класса ±4 °C', () => {
  const bad = [];
  for (const d of DIRECTIONS) {
    for (let i = 0; i < 12; i++) {
      if (placeBound(d.slug, i)) continue;
      const rec = getMonthRecord(d.slug, i);
      if (!rec) continue;   // об этом скажет предыдущий тест
      const key = getWeatherBucket(d.slug, i);
      const summary = getBucket(key).summary;
      const [lo, hi] = dayBand(summary);
      if (rec.tmax < lo - TOL || rec.tmax > hi + TOL) bad.push(`${d.slug}/${MONTHS[i]}: днём ${rec.tmax} °C по нормам, а класс «${key}» обещает ${lo}…${hi}`);
      const night = nightBand(summary);
      if (night && (rec.tmin < night[0] - NIGHT_TOL || rec.tmin > night[1] + NIGHT_TOL)) bad.push(`${d.slug}/${MONTHS[i]}: ночью ${rec.tmin} °C по нормам, а класс «${key}» обещает ${night[0]}…${night[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('каждый класс из порогов существует и несёт полосу температур', () => {
  for (const key of ['tropical-rainy', 'warm-rainy', 'desert-hot', 'summer-hot', 'tropical-dry', 'desert-cool',
    'temperate-warm', 'temperate-cool', 'temperate-cold', 'winter-frost', 'cold-extreme']) {
    assert.ok(WEATHER_BUCKETS[key], `нет класса ${key}`);
    dayBand(WEATHER_BUCKETS[key].summary);
  }
});

test('неизвестный класс не подменяется тёплым молча', () => {
  assert.throws(() => getBucket('no-such-bucket'), /Неизвестный класс климата/);
});

test('оракул: Горно-Алтайск в январе (−3 днём, −19 ночью) — мороз, а не тёплый сезон', () => {
  assert.equal(classifyMonth({ tmax: -3, tmin: -19, mm: 38, days: 12 }), 'winter-frost');
  assert.equal(classifyMonth({ tmax: 14, tmin: 9, mm: 50, days: 13 }), 'temperate-cool');   // Рейкьявик, июль
  assert.equal(classifyMonth({ tmax: 32, tmin: 17, mm: 10, days: 2 }), 'summer-hot');        // Мадрид, июль
  assert.equal(classifyMonth({ tmax: 32, tmin: 20, mm: 0, days: 0 }), 'tropical-dry');        // Гоа, январь — побережье, не континент
  assert.equal(classifyMonth({ tmax: 21, tmin: 6, mm: 8, days: 1 }), 'desert-cool');          // Мехико и Марракеш в январе: сухо, ночи холодные
  assert.equal(classifyMonth({ tmax: 25, tmin: 14, mm: 103, days: 15 }), 'warm-rainy');       // Алтай, июль — дожди без тропической жары
  assert.equal(classifyMonth({ tmax: 33, tmin: 25, mm: 320, days: 20 }), 'tropical-rainy');   // Бангкок, сентябрь
  assert.equal(classifyMonth({ tmax: 29, tmin: 24, mm: 281, days: 19 }), 'tropical-rainy');  // Денпасар, январь
});
