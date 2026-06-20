import { test, expect, type Page } from '@playwright/test';

// Функциональный тест калькулятора 90/180. Ловит регресс: пересчёт должен идти
// и по событию `change` (iOS Safari у date-пикера шлёт change, не всегда input),
// и при добавлении второй поездки.

// Имитация выбора даты нативным пикером iOS: ставим value и шлём ТОЛЬКО `change`.
async function setByChange(page: Page, selector: string, value: string) {
  await page.evaluate(({ selector, value }) => {
    const el = document.querySelector('.eesc')!.querySelector(selector) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { selector, value });
}

test.describe('EES калькулятор 90/180', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/ees-2026/');
    await page.evaluate(() => localStorage.removeItem('eesc:trips:v1'));
    await page.reload();
  });

  test('пересчитывает по change (iOS date-picker), не только input', async ({ page }) => {
    const used = page.locator('.eesc [data-used]').first();
    const left = page.locator('.eesc [data-left]').first();
    await expect(left).toHaveText('90');

    await setByChange(page, '[data-checkdate]', '2026-09-01'); // фикс-окно, не зависит от часов
    await setByChange(page, '[data-in]', '2026-06-01');
    await setByChange(page, '[data-out]', '2026-06-10');       // 10 дней включительно

    await expect(used).toHaveText('10');
    await expect(left).toHaveText('80');
  });

  test('вторая поездка меняет остаток дней', async ({ page }) => {
    const used = page.locator('.eesc [data-used]').first();
    const left = page.locator('.eesc [data-left]').first();

    await setByChange(page, '[data-checkdate]', '2026-09-01');
    await setByChange(page, '[data-in]', '2026-06-01');
    await setByChange(page, '[data-out]', '2026-06-10');       // 10 дней
    await expect(used).toHaveText('10');

    await page.locator('.eesc [data-add]').click();
    // вторая строка — заполняем через change
    await page.evaluate(() => {
      const rows = document.querySelectorAll('.eesc .eesc-trip');
      const r2 = rows[1];
      const set = (el: HTMLInputElement, v: string) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
      set(r2.querySelector('[data-in]') as HTMLInputElement, '2026-06-15');
      set(r2.querySelector('[data-out]') as HTMLInputElement, '2026-06-20'); // 6 дней
    });

    await expect(used).toHaveText('16'); // 10 + 6
    await expect(left).toHaveText('74');
  });
});
