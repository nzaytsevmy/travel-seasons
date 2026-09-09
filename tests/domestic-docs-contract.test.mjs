import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// ⛔ ЗАЧЕМ. 04.09.2026 замер Google показал 900 показов и НОЛЬ переходов по группе
// «нужен ли загранпаспорт в Дагестан»: один и тот же запрос делили /visa/dagestan/
// и /packing/dagestan/. Причина нашлась в шаблоне сборов — он на каждом направлении
// печатал «Загранпаспорт — срок действия 6+ месяцев», включая четыре региона России
// и четыре страны по внутреннему паспорту. То есть страница сборов отвечала на
// визовый вопрос, и отвечала НЕВЕРНО, споря с нашей же визовой страницей.
// Месячный шаблон то же самое давно делает правильно через docsMode. Тест сторожит,
// чтобы страновой шаблон не разъехался с месячным снова.

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

const TEMPLATES = [
  'src/pages/packing/[country].astro',
  'src/pages/packing/[country]/[month].astro',
];

test('шаблоны сборов не требуют загранпаспорт там, где он не нужен', async () => {
  for (const file of TEMPLATES) {
    const src = await read(file);
    const passportLines = src
      .split('\n')
      .filter((line) => /Загранпаспорт<\/(?:b|strong)>/.test(line));

    assert.ok(passportLines.length > 0, `${file}: строка про загранпаспорт исчезла совсем`);
    for (const line of passportLines) {
      assert.match(
        line,
        /docsMode === 'abroad'/,
        `${file}: требование загранпаспорта не ограничено docsMode === 'abroad' — оно попадёт на регионы России и страны по внутреннему паспорту`,
      );
    }

    assert.match(src, /docsMode === 'ru'/, `${file}: нет ветки для поездок по России`);
    assert.match(src, /docsMode === 'id'/, `${file}: нет ветки для въезда по внутреннему паспорту`);
  }
});

test('страница сборов по России не обещает платную медицину вместо ОМС', async () => {
  const src = await read('src/pages/packing/[country].astro');
  const paidCare = src.split('\n').filter((line) => /медпомощь платная/.test(line));
  assert.ok(paidCare.length > 0, 'строка про платную медицину исчезла совсем');
  for (const line of paidCare) {
    assert.doesNotMatch(
      line,
      /^\s*<li>/,
      'утверждение о платной медицине стоит безусловно — на Камчатке, в Карелии, Дагестане и на Алтае работает ОМС',
    );
  }
  assert.match(src, /Полис ОМС/, 'для поездок по России не сказано про ОМС');
});

test('вопрос про загранпаспорт закреплён за визовой страницей', async () => {
  const [visaDetails, packing] = await Promise.all([
    read('src/data/visa-details.js'),
    read('src/pages/packing/[country].astro'),
  ]);
  // Визовая страница обязана отвечать на этот запрос заголовком.
  assert.match(visaDetails, /h1: 'Нужен ли загранпаспорт в Дагестан'/);
  // А страница сборов обязана уводить туда, а не конкурировать.
  assert.match(packing, /нужен ли загранпаспорт \{d\.cases\.vP\}/);
});
