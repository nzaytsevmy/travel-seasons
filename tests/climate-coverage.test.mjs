import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS } from '../src/data/directions.js';
import { MONTHLY_WEATHER, CLIMATE_GENERATED_AT } from '../src/data/country-monthly-weather.js';

// Сторож полноты погоды (решение Никиты 05.09.2026: один источник, зафиксировать
// и забыть). Единственное, что может сломать «забыть», — новая страна без норм:
// раньше страница молча выходила без погоды, теперь сборка не пройдёт, пока не
// прогнан scripts/fetch-climate-normals.mjs. Пороги — физические, не вкусовые:
// ниже −60 и выше +55 на Земле у городов не бывает, дней в месяце не больше 31.

test('у каждого направления сайта есть 12 месяцев погоды из одного источника', () => {
  const bad = [];
  for (const d of DIRECTIONS) {
    const w = MONTHLY_WEATHER[d.slug];
    if (!w) { bad.push(`${d.slug}: нет норм — прогони scripts/fetch-climate-normals.mjs`); continue; }
    if (!w.city) bad.push(`${d.slug}: нет города замера`);
    if (!Array.isArray(w.months) || w.months.length !== 12) { bad.push(`${d.slug}: месяцев ${w.months?.length ?? 0}, нужно 12`); continue; }
    w.months.forEach((m, i) => {
      const ok = Number.isFinite(m.tmin) && Number.isFinite(m.tmax) && Number.isFinite(m.mm) && Number.isFinite(m.days)
        && m.tmin <= m.tmax && m.tmin >= -60 && m.tmax <= 55 && m.mm >= 0 && m.mm <= 2500 && m.days >= 0 && m.days <= 31;
      if (!ok) bad.push(`${d.slug}: месяц ${i + 1} вне разумных пределов — ${JSON.stringify(m)}`);
      if (!/°C$/.test(m.temp) || !/мм \/ \d+ дн$/.test(m.rain)) bad.push(`${d.slug}: месяц ${i + 1} — строки для страниц не в формате`);
    });
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('у файла норм есть дата съёма — она печатается под графиком', () => {
  assert.match(String(CLIMATE_GENERATED_AT), /^\d{4}-\d{2}-\d{2}$/, 'generatedAt в climate-normals.generated.json должен быть датой');
});
