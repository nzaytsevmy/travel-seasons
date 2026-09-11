// Две сборки одного коммита дают один и тот же сайт.
//
// Беда, из-за которой тест появился (11.09.2026): две сборки одного коммита подряд дали
// по 10 666 файлов, и 65 из них разошлись. Причин две:
//  1. У блока карты страны id с хвостом из Math.random — на 44 страницах хабов и гайдов
//     он свой в каждой сборке.
//  2. Ленты сравнивали только даты. При равенстве сортировка оставляла порядок коллекции,
//     а он зависит от того, какой файл сборка дочитала первым: статьи и заметки одного дня
//     менялись местами в ленте блога, на страницах тегов, в RSS, в ленте Дзена, в карте
//     картинок, в архивах месяцев новостей и в ссылках «предыдущая / следующая» у заметок.
//
// Тест писался КРАСНЫМ: до правки равные даты сохраняли порядок загрузки, у лент блога не
// было общего порядка по дате публикации, а карта брала случайное число.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as fresh from '../src/data/freshness.js';
import { feedEntries } from '../src/data/news.js';

const post = (slug, pubDate, updatedDate) => ({
  slug,
  data: { pubDate: new Date(pubDate), ...(updatedDate ? { updatedDate: new Date(updatedDate) } : {}) },
});
const note = (slug, date, added) => ({
  slug,
  data: { title: slug, date: new Date(date), checked: new Date(added), added: new Date(added) },
});

// Один и тот же список в прямом и обратном порядке загрузки — как две сборки одного коммита.
const bothWays = (list, order) => [
  order([...list]).map((e) => e.slug),
  order([...list].reverse()).map((e) => e.slug),
];

test('лента блога: статьи с одной датой свежести стоят одинаково при любом порядке загрузки', () => {
  // Живой случай 11.09.2026: пять статей с датой свежести 3 сентября, среди них
  // «3 сентября: куда поехать…» и «Алеан…»; у Египта это дата переработки.
  const list = [
    post('alean-2026', '2026-09-03'),
    post('egypt-guide-2026', '2026-06-06', '2026-09-03'),
    post('3-sentyabrya-kuda-poehat', '2026-09-03'),
    post('oman-guide-2026', '2026-09-06'),
  ];
  const [a, b] = bothWays(list, (l) => l.sort(fresh.byFreshness));
  assert.deepEqual(a, b, 'порядок статей одного дня зависит от порядка чтения файлов');
  assert.equal(a[0], 'oman-guide-2026', 'свежее сверху — как и было');
});

test('RSS и лента Дзена: статьи с одной датой публикации стоят одинаково при любом порядке загрузки', () => {
  assert.equal(typeof fresh.byPubDate, 'function', 'у лент блога нет общего порядка по дате публикации');
  const list = [
    post('alean-2026', '2026-09-03'),
    post('egypt-guide-2026', '2026-06-06', '2026-09-03'),
    post('3-sentyabrya-kuda-poehat', '2026-09-03'),
    post('luchshie-oteli-mira-2026', '2026-09-03'),
  ];
  const [a, b] = bothWays(list, (l) => l.sort(fresh.byPubDate));
  assert.deepEqual(a, b, 'порядок статей одного дня зависит от порядка чтения файлов');
  assert.equal(a.at(-1), 'egypt-guide-2026', 'ленты идут по дате первой публикации, а не свежести — как и было');
});

test('лента заметок: заметки одного дня выпуска и одного события стоят одинаково при любом порядке загрузки', () => {
  const list = [
    note('2026-08-27-b', '2026-08-26', '2026-08-27'),
    note('2026-08-27-a', '2026-08-26', '2026-08-27'),
    note('2026-08-28-c', '2026-08-20', '2026-08-28'),
  ];
  const [a, b] = bothWays(list, (l) => feedEntries(l));
  assert.deepEqual(a, b, 'порядок заметок одного дня зависит от порядка чтения файлов');
  assert.equal(a[0], '2026-08-28-c', 'свежий выпуск сверху — как и было');
});

// Сторожа на шаблоны. Порядок лент живёт в src/data (freshness.js, news.js): там у равных
// дат есть второй ключ. Своё сравнение по одной дате в шаблоне — ровно та беда, что выше.
// ⛔ Находки собираются по всем файлам и только потом падают: assert в цикле замолчал бы
// после первого файла.
const walk = (dir) =>
  readdirSync(new URL(`../${dir}/`, import.meta.url), { recursive: true })
    .filter((f) => /\.(astro|js|ts|mjs)$/.test(f))
    .map((f) => `${dir}/${f}`);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const TEMPLATES = ['src/pages', 'src/components', 'src/layouts'].flatMap(walk);

test('ни один шаблон не сортирует статьи и заметки своим сравнением по дате', () => {
  const bad = [];
  for (const path of TEMPLATES) {
    read(path).split('\n').forEach((line, i) => {
      if (/\.sort\(/.test(line) && /pubDate|updatedDate|data\.date\b|addedAt/.test(line)) bad.push(`${path}:${i + 1}`);
    });
  }
  assert.deepEqual(bad, [], `сравнение только по дате — при равных датах порядок свой в каждой сборке: ${bad.join(', ')}`);
});

test('разметка не берёт случайных чисел', () => {
  const bad = [];
  for (const path of TEMPLATES) {
    const src = read(path);
    // У .astro при сборке исполняется только шапка между `---`; скрипты ниже работают в браузере.
    const atBuild = path.endsWith('.astro') ? (src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '') : src;
    if (/Math\.random\(|randomUUID\(/.test(atBuild)) bad.push(path);
  }
  assert.deepEqual(bad, [], `случайное число в разметке — страница своя в каждой сборке: ${bad.join(', ')}`);
});
