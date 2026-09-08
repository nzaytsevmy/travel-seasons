import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { этотЖеГород } from '../scripts/geocode-match.mjs';

// ⛔ Сторож класса ошибки, а не одного места (08.09.2026). Скрипт норм климата
// брал первый результат геокодера с нужным кодом страны — проверял страну, а не
// город. На «Panaji» единственным индийским совпадением была деревня Panāji
// Muwara в Гуджарате: десять лет норм Ахмадабада уехали под подпись «Замер по
// городу Панаджи (Гоа)» на 25 живых страниц. Октябрь показывал 30 мм и «сухой
// сезон» при норме метеослужбы Индии 124,8 мм — то есть страница звала на пляж
// в конец муссона.

test('лишнее слово в названии — это другой город, а не тот же', () => {
  assert.equal(этотЖеГород('Panaji', 'Panāji Muwara'), false,
    'деревня в Гуджарате не должна пройти за столицу Гоа');
  assert.equal(этотЖеГород('Split', 'Split Rock'), false);
  assert.equal(этотЖеГород('Athens', 'New Athens'), false);
});

test('другое написание того же города совпадением считается', () => {
  assert.equal(этотЖеГород('Puerto Montt', 'Port Montt'), true);
  assert.equal(этотЖеГород('Petropavlovsk-Kamchatsky', 'Petropavlovsk-Kamchatskiy'), true);
  assert.equal(этотЖеГород('Tromsø', 'Tromso'), true);
  assert.equal(этотЖеГород('Cancun', 'Cancún'), true);
});

test('пустой ответ геокодера совпадением не считается', () => {
  assert.equal(этотЖеГород('Panaji', ''), false);
  assert.equal(этотЖеГород('', 'Panaji'), false);
});

test('скрипт норм зовёт сверку имени, а не только код страны', () => {
  const s = readFileSync(new URL('../scripts/fetch-climate-normals.mjs', import.meta.url), 'utf8');
  assert.match(s, /этотЖеГород\(p\.q, r\.name\)/,
    'geocode() обязан сверять имя города: страна одна и та же у Гоа и Гуджарата');
});

test('у Гоа точка задана явно и лежит в Гоа, а не в Гуджарате', () => {
  const s = readFileSync(new URL('../scripts/fetch-climate-normals.mjs', import.meta.url), 'utf8');
  const строка = s.match(/'india-goa':\s*\{([^}]*)\}/)[1];
  const lat = Number(строка.match(/lat:\s*(-?[\d.]+)/)[1]);
  const lon = Number(строка.match(/lon:\s*(-?[\d.]+)/)[1]);
  assert.ok(lat > 14.9 && lat < 15.8, `широта ${lat} вне Гоа (14,9–15,8° с. ш.)`);
  assert.ok(lon > 73.6 && lon < 74.4, `долгота ${lon} вне Гоа (73,6–74,4° в. д.)`);

  const нормы = JSON.parse(readFileSync(new URL('../src/data/climate-normals.generated.json', import.meta.url), 'utf8'));
  const g = нормы.places['india-goa'];
  assert.ok(g.lat > 14.9 && g.lat < 15.8 && g.lon > 73.6 && g.lon < 74.4,
    `в данных у Гоа точка ${g.lat},${g.lon} — это не Гоа`);
});
