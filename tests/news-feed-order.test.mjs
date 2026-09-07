import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { feedEntries, publishedAt } from '../src/data/news.js';

// Порядок и дата в RSS-лентах заметок.
//
// Беда, из-за которой тест появился (07.09.2026, замер на живом сайте): в ленте
// /novosti/rss.xml и в ленте Дзена в поле pubDate стояла дата СОБЫТИЯ, а не дата
// выпуска. Читалки и Дзен сортируют по pubDate, поэтому у заметки, вышедшей
// 7 сентября про событие 3 сентября, дата была 3 сентября, и она уезжала ниже
// заметки от 5 сентября про событие 6 сентября. В ленте Дзена сортировка тоже
// шла по дате события, и свежая заметка дня стояла девятой.
//
// Ровно эту беду уже чинили 03.08.2026 на самой странице /novosti/ — комментарий
// об этом лежит в src/data/news.js рядом с сортировкой. До лент правка не дошла.
//
// Тест писался КРАСНЫМ: до правки функций publishedAt и feedEntries в модуле нет.

const note = (slug, eventDate, addedDate) => ({
  slug,
  data: {
    title: slug,
    date: new Date(eventDate),
    checked: new Date(addedDate),
    added: new Date(addedDate),
  },
});

test('дата в ленте — дата выпуска, а не дата события', () => {
  const e = note('a', '2026-09-03', '2026-09-07');
  assert.equal(
    publishedAt(e).toISOString().slice(0, 10),
    '2026-09-07',
    'pubDate обязан быть днём выпуска заметки, иначе читалка опустит свежее вниз',
  );
});

test('у старой заметки без поля «добавлено» датой выпуска служит дата сверки', () => {
  const e = { slug: 'old', data: { title: 'old', date: new Date('2026-07-01'), checked: new Date('2026-07-20') } };
  assert.equal(publishedAt(e).toISOString().slice(0, 10), '2026-07-20');
});

test('порядок ленты — по дате выпуска, свежее сверху', () => {
  // Точные даты живого замера 07.09.2026: заметка дня про событие 3 сентября
  // против позавчерашней заметки про событие 6 сентября.
  const fresh = note('2026-09-07-sri-lanka', '2026-09-03', '2026-09-07');
  const older = note('2026-09-05-sarawak', '2026-09-06', '2026-09-05');
  const order = feedEntries([older, fresh]).map((e) => e.slug);
  assert.deepEqual(order, ['2026-09-07-sri-lanka', '2026-09-05-sarawak']);
});

test('при одинаковом дне выпуска сверху идёт более свежее событие', () => {
  const a = note('event-later', '2026-09-06', '2026-09-07');
  const b = note('event-earlier', '2026-09-02', '2026-09-07');
  assert.deepEqual(feedEntries([b, a]).map((e) => e.slug), ['event-later', 'event-earlier']);
});

test('лента режется до заданной длины после сортировки, а не до неё', () => {
  const list = [
    note('c', '2026-09-09', '2026-09-01'),
    note('a', '2026-09-01', '2026-09-07'),
    note('b', '2026-09-02', '2026-09-05'),
  ];
  assert.deepEqual(feedEntries(list, 2).map((e) => e.slug), ['a', 'b']);
});

// Сторож на сами ленты: единственное место, где беда и жила. Пока обе ленты
// брали дату из `data.date`, этот тест краснел — именно он и был красным до правки.
const FEEDS = ['src/pages/novosti/rss.xml.js', 'src/pages/dzen-rss.xml.js'];

// ⛔ Сторож собирает находки по ВСЕМ лентам и только потом падает. Первая версия
// проверяла файлы в цикле с assert внутри: она упала на первой ленте и до ленты
// Дзена не дошла вовсе — то есть показала бы зелёное, останься беда только там.
test('ни одна лента заметок не берёт дату выпуска из даты события', () => {
  const bad = [];
  for (const path of FEEDS) {
    const src = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    src.split('\n').forEach((line, i) => {
      if (/pubDate/i.test(line) && /\bdata\.date\b/.test(line)) bad.push(`${path}:${i + 1}`);
    });
  }
  assert.deepEqual(
    bad,
    [],
    `дата выпуска взята из даты события — читалка опустит свежую заметку вниз: ${bad.join(', ')}`,
  );
});

test('лента Дзена сортирует заметки не по дате события', () => {
  const src = readFileSync(new URL('../src/pages/dzen-rss.xml.js', import.meta.url), 'utf8');
  const start = src.indexOf("getCollection('news')");
  assert.notEqual(start, -1, 'в ленте Дзена не найден отбор заметок — тест перестал что-либо проверять');
  const newsBlock = src.slice(start, src.indexOf('const items', start));
  assert.ok(newsBlock.length > 0, 'блок заметок в ленте Дзена пуст — тест перестал что-либо проверять');
  assert.ok(
    !/\.sort\(.*?data\.date/s.test(newsBlock),
    'заметки для Дзена сортируются по дате события: 07.09.2026 заметка дня стояла в ленте девятой',
  );
});

test('даты в ленте идут не по возрастанию — это и есть то, что читает читалка', () => {
  const list = [
    note('x', '2026-08-01', '2026-09-02'),
    note('y', '2026-09-30', '2026-09-01'),
    note('z', '2026-07-15', '2026-09-07'),
  ];
  const dates = feedEntries(list).map((e) => publishedAt(e).valueOf());
  for (let i = 1; i < dates.length; i++) {
    assert.ok(dates[i - 1] >= dates[i], 'в выдаче ленты дата выпуска обязана убывать');
  }
});
