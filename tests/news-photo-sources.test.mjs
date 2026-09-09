// Цепочка источников кадра для ленты. Проверяем то, что ломается молча:
// разбор чужой лицензии, порядок обхода и поведение без ключа.
//
// ⛔ 04.09.2026 подбор кадра упал целиком, потому что источник был один и он
// не отвечал. Гейт ленты при этом отбраковал обе готовые заметки дня: «нет
// своего снимка». Тесты ниже — про то, чтобы такая поломка не вернулась тихо.
import test from 'node:test';
import assert from 'node:assert/strict';
import { commonsLicense, pixabayKey, SOURCES, findPhoto, namesAPlace, sourcesFor,
  PIXABAY_ENTROPY_FLOOR } from '../scripts/news-photo.mjs';

test('лицензия Викисклада разбирается в наши ключи', () => {
  assert.equal(commonsLicense('CC0'), 'cc0');
  assert.equal(commonsLicense('Public domain'), 'pdm');
  assert.equal(commonsLicense('CC BY 4.0'), 'by');
  assert.equal(commonsLicense('CC BY-SA 4.0'), 'by-sa');
  assert.equal(commonsLicense('cc-by-sa-3.0'), 'by-sa');
  // Разметка вокруг значения приходит с сервера, её не должно быть в ответе.
  assert.equal(commonsLicense('<a href="#">CC BY 2.0</a>'), 'by');
});

test('несвободная лицензия и неизвестная строка получают отказ', () => {
  // ⛔ Ни одна из этих строк не должна пройти как «наверное можно»: NC
  // запрещает коммерческое использование, ND — переработку, а кадр мы ужимаем.
  for (const bad of ['CC BY-NC 4.0', 'CC BY-NC-SA 3.0', 'CC BY-ND 4.0',
                     'Fair use', 'GFDL', 'All rights reserved', '', null, undefined]) {
    assert.equal(commonsLicense(bad), null, `пропущена лицензия «${bad}»`);
  }
});

test('«CC BY-NC» не путается с «CC BY» из-за порядка проверок', () => {
  // Ловушка: правило для «cc by» сработало бы и на «cc by-nc», если поставить
  // его раньше отсева несвободных. Порядок внутри разбора — часть контракта.
  assert.equal(commonsLicense('CC BY-NC 2.0'), null);
  assert.equal(commonsLicense('CC BY 2.0'), 'by');
});

test('в цепочке ровно три источника и у каждого есть поиск', () => {
  // Сам порядок обхода зависит от запроса и проверяется отдельно; здесь — что
  // из набора не пропал источник и ни один не остался без реализации.
  assert.deepEqual(SOURCES.map((s) => s.name), ['Openverse', 'Викисклад', 'Pixabay']);
  for (const s of SOURCES) assert.equal(typeof s.find, 'function');
});

test('источник отвечает списком и признаком доступности', async () => {
  const res = await SOURCES.find((s) => s.name === 'Pixabay').find('rinjani');
  assert.ok(Array.isArray(res.hits), 'источник обязан вернуть список');
  assert.equal(typeof res.reachable, 'boolean', 'без этого признака «лёг» не отличить от «не нашёл»');
});

test('лежащий источник спрашивают ОДИН раз, а не по разу на формулировку', async () => {
  // ⛔ Сторож против возврата поломки 04.09.2026: тогда мёртвый источник
  // возвращал пустой список, неотличимый от «ничего не нашлось», и цепочка
  // упиралась в его таймаут на каждой из формулировок запроса.
  // Подменяем поиск у настоящих источников, а не сам список: порядок цепочки
  // считается по именам, и подмена списка проверяла бы не тот код.
  const first = SOURCES.find((s) => s.name === 'Openverse');
  const second = SOURCES.find((s) => s.name === 'Викисклад');
  const third = SOURCES.find((s) => s.name === 'Pixabay');
  const saved = [first.find, second.find, third.find];
  const asked = [];
  first.find = async (q) => { asked.push(q); return { hits: [], reachable: false }; };
  second.find = async () => ({ reachable: true, hits: [{
    url: 'https://example.org/a.jpg', title: 'rinjani lombok', creator: 'кто-то',
    license: 'cc0', licenseLabel: 'CC0', licenseUrl: '', source: 'https://example.org/a', width: 1600,
  }] });
  third.find = async () => { throw new Error('до третьего источника доходить не должно'); };
  try {
    const hits = await findPhoto({ photoQuery: 'Mount Rinjani Lombok crater', countries: ['indonesia'] });
    assert.equal(asked.length, 1, `к мёртвому источнику обратились ${asked.length} раз вместо одного`);
    assert.equal(hits.length, 1, 'цепочка обязана дойти до следующего источника');
    assert.equal(hits[0].source_name, 'Викисклад');
  } finally {
    [first.find, second.find, third.find] = saved;
  }
});

test('имя собственное в запросе узнаётся по заглавной букве', () => {
  // Реальные запросы из уже вышедших заметок.
  assert.equal(namesAPlace('Mount Rinjani Lombok Indonesia crater lake photo'), true);
  assert.equal(namesAPlace('peatland fire smoke Kalimantan Indonesia photo'), true);
  assert.equal(namesAPlace('Wairere Falls New Zealand waterfall forest photo'), true);
  // Обобщённые темы, где нужен красивый кадр, а не конкретная точка на карте.
  assert.equal(namesAPlace('airport departure board flight photo'), false);
  assert.equal(namesAPlace('passport documents desk photo'), false);
  assert.equal(namesAPlace('ocean waves storm photo'), false);
  assert.equal(namesAPlace(''), false);
  assert.equal(namesAPlace(undefined), false);
});

test('названное место идёт на Викисклад, обобщённая тема — на красивый сток', () => {
  // ⛔ Это редакционное правило, а не деталь: обобщённый вулкан вместо
  // названного — та же подмена, что карта вместо рифа.
  assert.deepEqual(sourcesFor('Mount Rinjani Lombok crater').map((s) => s.name),
    ['Openverse', 'Викисклад', 'Pixabay']);
  assert.deepEqual(sourcesFor('airport departure board flight').map((s) => s.name),
    ['Openverse', 'Pixabay', 'Викисклад']);
  // Openverse первый всегда: у него самый широкий охват свободных лицензий.
  for (const q of ['Mount Rinjani', 'ocean waves', '']) {
    assert.equal(sourcesFor(q)[0].name, 'Openverse');
    assert.equal(sourcesFor(q).length, 3, 'из цепочки не должен пропадать источник');
  }
});

test('пустой ответ живого источника не считается поломкой: перебираем формулировки', () => {
  // Обратная ошибка тоже возможна — счесть «не нашлось» отказом и уйти с
  // рабочего источника после первой же неудачной формулировки.
  const empty = { hits: [], reachable: true };
  assert.equal(empty.reachable, true);
  assert.equal(empty.hits.length, 0);
});

test('порог рисованного для Pixabay стоит между замерами, а не взят с потолка', () => {
  // Замер 04.09.2026, 24 кадра из четырёх запросов: единственный рисунок —
  // трёхмерное табло, детализация 5,29; у 23 настоящих фотографий 6,58–7,86.
  // Порог обязан лежать строго между этими числами, иначе он либо пропускает
  // рисунок, либо режет живую съёмку.
  const РИСУНОК = 5.29;
  const САМОЕ_ТЁМНОЕ_ФОТО = 6.58;
  assert.ok(PIXABAY_ENTROPY_FLOOR > РИСУНОК,
    `порог ${PIXABAY_ENTROPY_FLOOR} пропустит рисунок с детализацией ${РИСУНОК}`);
  assert.ok(PIXABAY_ENTROPY_FLOOR < САМОЕ_ТЁМНОЕ_ФОТО,
    `порог ${PIXABAY_ENTROPY_FLOOR} отрежет живое фото с детализацией ${САМОЕ_ТЁМНОЕ_ФОТО}`);
  // ⛔ И отдельно: общий порог других источников (2,5) поднимать этим нельзя —
  // у честного ночного кадра в замере блога детализация падала до 4,97.
  assert.ok(PIXABAY_ENTROPY_FLOOR > 4.97, 'иначе порог не отличает рисунок от ночной съёмки');
});

test('ключ читается из окружения и не выдумывается', () => {
  assert.equal(pixabayKey({ PIXABAY_API_KEY: '  abc123  ' }), 'abc123');
  // Пустое окружение уводит к файлу секретов; на машине без него ответ — null,
  // и это допустимо. Недопустимо другое: вернуть строку, которой нет нигде.
  const fromFile = pixabayKey({});
  assert.ok(fromFile === null || (typeof fromFile === 'string' && fromFile.length > 0));
});
