import { test, expect } from '@playwright/test';

// Дашборд «Моя поездка» (/my/) собран полностью, но до 30.07.2026 был недостижим:
// в собранном сайте ноль видимых ссылок на него, а единственная скрытая
// раскрывалась только на той же странице, где нажали «Хочу сюда». Сохранил Перу,
// ушёл читать про Турцию — вернуться к своей поездке уже нельзя.

test.describe('«Хочу сюда» и вход в дашборд', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/peru/');
    await page.evaluate(() => localStorage.removeItem('tt_trip'));
    await page.reload();
  });

  test('без сохранённого дашборд не предлагается', async ({ page }) => {
    await expect(page.locator('.tsb-open').first()).toBeHidden();
  });

  test('ссылка на дашборд видна и на ДРУГОЙ странице', async ({ page }) => {
    await page.locator('.tsb').first().click();
    await expect(page.locator('.tsb-open').first()).toBeVisible();

    // Уходим на другое направление — вход в свою поездку обязан остаться.
    await page.goto('/turkey/');
    const open = page.locator('.tsb-open').first();
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute('href', '/my/');
    // Кнопка на чужой стране при этом остаётся приглашением, а не «убрать».
    await expect(page.locator('.tsb-txt').first()).toHaveText('Хочу сюда');
  });

  test('снятие сохранения убирает вход', async ({ page }) => {
    await page.locator('.tsb').first().click();
    await expect(page.locator('.tsb-open').first()).toBeVisible();
    await page.locator('.tsb').first().click();
    await expect(page.locator('.tsb-open').first()).toBeHidden();
  });
});
