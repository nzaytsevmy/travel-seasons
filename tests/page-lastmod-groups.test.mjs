// Сторож раздачи дат по типам страниц (scripts/page-groups.mjs).
//
// ⛔ Правка файла данных обязана двигать дату только тем типам страниц, которые этот файл
//    читают. 12.09.2026 раздача «одна дата на всю страну» подняла сегодняшнюю дату у 72%
//    адресов карты, хотя страницы поездок не изменились ни на строку. Если расчёт по импортам
//    поедет (переименовали шаблон, увели импорт в компонент), этот тест краснеет.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ВХОДЫ, группыФайла, достижимые } from '../scripts/page-groups.mjs';

const root = process.cwd();

test('шаблоны типов страниц на месте', () => {
  for (const [группа, входы] of Object.entries(ВХОДЫ)) {
    for (const вход of входы) {
      const файлы = достижимые(вход, root);
      assert.ok(файлы.size > 1, `шаблон ${вход} (${группа}) не читается или ничего не импортирует`);
    }
  }
});

test('данные достаются тем типам страниц, которые их читают', () => {
  const ожидания = [
    ['src/data/country-essentials.js', ['hub'], ['trips', 'packing']],
    ['src/data/country-customs.js', ['hub'], ['trips', 'packing']],
    ['src/data/country-guides.js', ['hub', 'packing'], ['trips']],
    ['src/data/country-plug-types.js', ['hub', 'packing'], ['trips']],
    ['src/data/visa-details.js', ['hub', 'visa', 'packing'], []],
    ['src/data/niche-trips.js', ['trips'], ['hub', 'visa']],
    ['src/data/country-monthly-weather.js', ['trips', 'packing'], []],
    ['src/data/directions.js', ['hub', 'visa', 'packing', 'trips'], []],
  ];
  for (const [файл, должны, неДолжны] of ожидания) {
    const есть = группыФайла(файл, root);
    for (const г of должны) assert.ok(есть.includes(г), `${файл}: тип «${г}» обязан читать этот файл, а расчёт его не видит (${есть.join(', ') || 'ничего'})`);
    for (const г of неДолжны) assert.ok(!есть.includes(г), `${файл}: тип «${г}» этот файл не читает, а дата ему достаётся — это ложная свежесть`);
  }
});

test('прямой импорт в шаблоне обязан попадать в расчёт', () => {
  const данные = readdirSync(join(root, 'src/data')).filter((f) => /\.(js|json)$/.test(f));
  for (const [группа, входы] of Object.entries(ВХОДЫ)) {
    for (const вход of входы) {
      let текст;
      try { текст = readFileSync(join(root, вход), 'utf8'); } catch { continue; }
      for (const имя of данные) {
        if (!текст.includes(`data/${имя}`)) continue;
        const есть = группыФайла(`src/data/${имя}`, root);
        assert.ok(есть.includes(группа),
          `${вход} импортирует ${имя} напрямую, а расчёт не отдал этот файл типу «${группа}» — расчёт по импортам сломан`);
      }
    }
  }
});
