import { test, expect } from '@playwright/test';

// Дашборд знал про чек-лист только «начат / не начат», хотя число собранных
// пунктов считается прямо в виджете сборов. Человеку перед вылетом важно именно
// «сколько осталось», а не факт, что он однажды открывал список.

const TRIP = { slug: 'peru', nom: 'Перу', monthIdx: 6, days: 7, people: 1, savedAt: 1 };

test.describe('Дашборд: прогресс сборов', () => {
  test('показывает, сколько пунктов собрано, а не просто «начат»', async ({ page }) => {
    // 1. Собираем часть чемодана на странице сборов.
    await page.goto('/packing/peru/july/');
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('pck:')) localStorage.removeItem(k);
    });
    await page.reload();

    const boxes = page.locator('.pck .pck-item:not([hidden]) .pck-cb');
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await boxes.nth(2).check();
    const progress = (await page.locator('.pck-progress-txt').first().textContent())!.trim();
    expect(progress).toMatch(/^Собрано 3 из \d+$/);

    // 2. Открываем дашборд с сохранённой поездкой в тот же месяц.
    await page.evaluate((t) => localStorage.setItem('tt_trips', JSON.stringify([t])), TRIP);
    await page.goto('/my/');

    // Ожидаем то же число, что видит человек в самом чек-листе.
    await expect(page.locator('#mypPacking')).toContainText(progress);
  });

  test('без начатых сборов зовёт открыть чек-лист', async ({ page }) => {
    await page.goto('/my/');
    await page.evaluate((t) => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('pck:')) localStorage.removeItem(k);
      localStorage.setItem('tt_trips', JSON.stringify([t]));
    }, TRIP);
    await page.reload();
    await expect(page.locator('#mypPacking')).toContainText('Ещё не открыт');
  });
});

test.describe('Дашборд: шенгенские дни', () => {
  test('показывает остаток дней, посчитанный калькулятором', async ({ page }) => {
    // Считаем в калькуляторе на статье…
    await page.goto('/blog/ees-2026/');
    await page.evaluate(() => localStorage.removeItem('eesc:trips:v1'));
    await page.reload();
    const set = async (sel: string, v: string) => {
      await page.evaluate(({ sel, v }) => {
        const el = document.querySelector('.eesc')!.querySelector(sel) as HTMLInputElement;
        el.value = v; el.dispatchEvent(new Event('change', { bubbles: true }));
      }, { sel, v });
    };
    await set('[data-checkdate]', '2026-09-01');
    await set('[data-in]', '2026-06-01');
    await set('[data-out]', '2026-06-10');
    const left = (await page.locator('.eesc [data-left]').first().textContent())!.trim();
    expect(left).toBe('80');

    // …и ждём ту же цифру на дашборде.
    await page.evaluate((t) => localStorage.setItem('tt_trips', JSON.stringify([t])),
      { slug: 'peru', nom: 'Перу', monthIdx: 6, days: 7, people: 1, savedAt: 1 });
    await page.goto('/my/');
    const box = page.locator('#mypSchengenWrap');
    await expect(box).toBeVisible();
    await expect(box).toContainText('80');
  });

  test('без шенгенских поездок блок не показывается', async ({ page }) => {
    await page.goto('/my/');
    await page.evaluate((t) => {
      localStorage.removeItem('eesc:trips:v1');
      localStorage.removeItem('eesc:summary:v1');
      localStorage.setItem('tt_trips', JSON.stringify([t]));
    }, { slug: 'peru', nom: 'Перу', monthIdx: 6, days: 7, people: 1, savedAt: 1 });
    await page.reload();
    await expect(page.locator('#mypSchengenWrap')).toBeHidden();
  });
});
