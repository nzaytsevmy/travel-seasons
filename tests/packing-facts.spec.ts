import { test, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { видимыйТекст } from './visible-text';

// Проверяем готовый HTML: исправление только в данных, Schema или невидимом
// элементе не должно сделать тест зелёным, оставив прежний совет читателю.
const root = process.env.PACKING_AUDIT_DIST || 'dist';
function page(path) {
  const html = readFileSync(join(root, path, 'index.html'), 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main, `main: ${path}`);
  const text = видимыйТекст(main)
    .replace(/[\u2060\u200b]/g, '').replace(/\s+/g, ' ').trim();
  return { html, text };
}
const months = ['turkey/october', 'egypt/october', 'uzbekistan/october', 'vietnam/november', 'hainan/november'];

test('Турция: срок паспорта согласован в списке и пояснениях', () => {
  const { text } = page('packing/turkey/october');
  assert.match(text, /120 дней/);
  assert.doesNotMatch(text, /6\+ месяцев|27–32|22–25/);
});

test('Египет: нет обещания отказа в визе без полиса', () => {
  const { text } = page('packing/egypt/october');
  assert.match(text, /eVisa Египта/);
  assert.doesNotMatch(text, /Без полиса визу не дадут|обязательна для визы|джунгл/i);
});

for (const path of ['packing/uzbekistan', 'packing/uzbekistan/october']) {
  test(`${path}: регистрация отделена от безвиза`, () => {
    const { text } = page(path);
    assert.match(text, /От регистрации освобождают на 15 дней/);
    assert.doesNotMatch(text, /Виза не нужна — 15 дней/);
  });
}

test('Вьетнам: ответ различает регионы и не обещает сухой ноябрь всей стране', () => {
  const { text } = page('packing/vietnam/november');
  assert.match(text, /Таблица относится к Хошимину/);
  assert.match(text, /Дананг/);
  assert.doesNotMatch(text, /дождей почти нет|дожди редки/i);
});

test('Общий список Узбекистана учитывает морозы и не советует вещи для морского побережья', () => {
  const { text } = page('packing/uzbekistan');
  assert.match(text, /В Самарканде зимой бывают морозы/);
  assert.doesNotMatch(text, /на побережье|песок на пляже|Купальник \+ парео|Днём \+8–15/);
});

test('Хайнань: погода согласована, название туров соответствует Китаю', () => {
  const { text } = page('packing/hainan/november');
  assert.match(text, /40 мм/);
  assert.doesNotMatch(text, /58 мм|27–32|авторские туры на Хайнань/);
  assert.match(text, /авторские туры по Китаю/);
});

for (const path of months) {
  test(`${path}: расчётная цена не выдана за доступный билет, аптечка не назначает лоперамид всем`, () => {
    const { text, html } = page(`packing/${path}`);
    assert.doesNotMatch(text, /Перелёт от|Посмотреть цены на эти даты — от|Лоперамид \+ регидрон/);
    assert.doesNotMatch(html, /class="pmu-price"/);
    assert.match(text, /Найти билет Москва/);
  });
}

test('Страховая статья: нет прежних универсальных исключений и текущего обещания 413 рублей', () => {
  const { text } = page('blog/strahovka-dlya-puteshestviy-2026');
  assert.doesNotMatch(text, /счётчик обнуляется только выездом|ломают полис целиком|при одинаковой защите|Подобрать полис от 413|Сравнить полисы от 413|через 5–10 дней/);
  assert.match(text, /суммарн/);
  assert.match(text, /365/);
  assert.match(text, /17 июля 2026/);
});

test('Все партнёрские кнопки страховой статьи обходятся без неподтверждённой цены', async ({ page }) => {
  await page.goto('/blog/strahovka-dlya-puteshestviy-2026/');
  const links = page.locator('a[rel~="sponsored"]');
  expect(await links.count()).toBeGreaterThan(0);
  const labels = await links.allTextContents();
  expect(labels.filter(label => /413/.test(label))).toEqual([]);
  await expect(page.getByRole('link', { name: 'Собрать полис под свои даты', exact: true })).toBeVisible();
});

test('Уточнённый пункт паспорта сохраняет отметку после перезагрузки', async ({ page }) => {
  await page.goto('/packing/turkey/october/');
  const passport = page.locator('.pck-cb[data-item="passport-int"]');
  await expect(passport.locator('..')).toContainText('120 дней');
  await passport.check();
  await page.reload();
  await expect(passport).toBeChecked();
  await expect(passport.locator('..')).toContainText('120 дней');
});
