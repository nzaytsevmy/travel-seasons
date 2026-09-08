import test from 'node:test';
import assert from 'node:assert/strict';
import { feedEntries, monthKeys, entriesOfMonth, monthKey, FEED_SIZE, FULL_ON_FEED } from '../src/data/news.js';

// Длина ленты /novosti/ и достижимость заметки.
//
// Беда, из-за которой тест появился (замер 08.09.2026 на живом сайте): лента
// показывала ВСЁ, чей месяц ещё не уехал в архив, а граница архива стояла на
// «последний день месяца старше 30 дней». При 2–4 заметках в день это давало
// на странице 87 заметок и 230 КБ — восемь целиком и семьдесят девять строкой,
// причём длина зависела не от замысла, а от дня месяца и темпа публикации.
// 10.08.2026 ровно эту беду уже чинили срезом «восемь целиком», и через месяц
// она вернулась с другой стороны — через хвост.
//
// Новый договор: лента показывает ПОСТОЯННОЕ число свежих заметок, а всё
// остальное лежит в архиве своего месяца, и архив есть у КАЖДОГО месяца с
// заметками, включая текущий. Тогда заметка видна с первого дня и навсегда,
// а страница не растёт.
//
// Тесты писались КРАСНЫМИ: до правки в модуле нет ни FEED_SIZE, ни monthKeys,
// а лента резалась по месяцу.

const note = (slug, date, added) => ({
  slug,
  data: { title: slug, date: new Date(date), checked: new Date(added), added: new Date(added) },
});

// Сто заметок за сто дней до вчерашнего — примерно то, что накопилось к
// 08.09.2026. Отсчёт от «сегодня», чтобы тест не протух со сменой месяца.
const many = [];
for (let i = 1; i <= 100; i++) {
  const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
  many.push(note(`n-${i}`, d, d));
}

test('лента не растёт с числом заметок', () => {
  assert.equal(feedEntries(many, FEED_SIZE).length, FEED_SIZE);
  // И при вдвое большем архиве — та же длина.
  assert.equal(feedEntries([...many, ...many.map((e) => ({ ...e, slug: e.slug + '-b' }))], FEED_SIZE).length, FEED_SIZE);
});

test('целиком показывается меньше, чем всего в ленте', () => {
  assert.ok(FULL_ON_FEED < FEED_SIZE, 'иначе компактного хвоста нет и «раньше в ленте» пусто');
});

test('у каждого месяца с заметками есть ключ архива, включая текущий', () => {
  const keys = monthKeys(many);
  const ожидаемые = [...new Set(many.map((e) => monthKey(e.data.date)))].sort().reverse();
  assert.deepEqual(keys, ожидаемые);
  // Текущий месяц выборки — самый свежий — обязан быть среди ключей: без его
  // страницы заметка, вытесненная из ленты сегодняшними, не видна нигде.
  assert.ok(keys.includes(ожидаемые[0]));
});

test('заметка, вытесненная из ленты, лежит в архиве своего месяца', () => {
  const наЛенте = new Set(feedEntries(many, FEED_SIZE).map((e) => e.slug));
  const вытесненные = many.filter((e) => !наЛенте.has(e.slug));
  assert.ok(вытесненные.length > 0, 'выборка мала — тест перестал что-либо проверять');

  const ключи = new Set(monthKeys(many));
  const потерянные = вытесненные.filter((e) => {
    const k = monthKey(e.data.date);
    return !ключи.has(k) || !entriesOfMonth(many, k).some((x) => x.slug === e.slug);
  });
  assert.deepEqual(потерянные.map((e) => e.slug), [], 'заметка не видна ни в ленте, ни в архиве');
});

test('свежая заметка сегодняшнего дня видна в ленте, а не только в архиве', () => {
  const сегодня = new Date();
  const свежая = note('today', сегодня.toISOString().slice(0, 10), сегодня.toISOString().slice(0, 10));
  const лента = feedEntries([...many, свежая], FEED_SIZE).map((e) => e.slug);
  assert.equal(лента[0], 'today');
});
