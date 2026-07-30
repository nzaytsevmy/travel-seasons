import { test, expect, type Page } from '@playwright/test';

// До 30.07.2026 сохранённая поездка была одна: ключ tt_trip хранил объект, а не
// список. Человек отмечал Перу, потом Турцию — и Перу молча исчезало. Это потеря
// уже сделанной работы, а не неудобство.

const read = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('tt_trips');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

test.describe('Несколько сохранённых поездок', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/peru/');
    await page.evaluate(() => { localStorage.removeItem('tt_trip'); localStorage.removeItem('tt_trips'); });
    await page.reload();
  });

  test('вторая страна не затирает первую', async ({ page }) => {
    await page.locator('.tsb').first().click();
    await page.goto('/turkey/');
    await page.locator('.tsb').first().click();

    const trips = await read(page);
    expect(trips, 'обе поездки должны сохраниться').toHaveLength(2);
    expect(trips.map((t: any) => t.slug).sort()).toEqual(['peru', 'turkey']);
  });

  test('повторный клик убирает только свою страну', async ({ page }) => {
    await page.locator('.tsb').first().click();
    await page.goto('/turkey/');
    await page.locator('.tsb').first().click();
    await page.locator('.tsb').first().click(); // снять Турцию

    const trips = await read(page);
    expect(trips.map((t: any) => t.slug)).toEqual(['peru']);
    await expect(page.locator('.tsb-txt').first()).toHaveText('Хочу сюда');
  });

  test('старый формат из одной поездки переносится без потери', async ({ page }) => {
    // Так лежит у людей, кто пользовался сайтом до правки.
    await page.evaluate(() => localStorage.setItem(
      'tt_trip',
      JSON.stringify({ slug: 'peru', nom: 'Перу', monthIdx: 4, days: 7, people: 1, savedAt: 1 }),
    ));
    await page.reload();

    const trips = await read(page);
    expect(trips, 'старая поездка должна переехать в список').toHaveLength(1);
    expect(trips[0].slug).toBe('peru');
    // И кнопка на этой же стране обязана показывать, что она уже сохранена.
    await expect(page.locator('.tsb-txt').first()).toHaveText('Убрать из планов');
  });

  test('на дашборде видны обе поездки', async ({ page }) => {
    await page.locator('.tsb').first().click();
    await page.goto('/turkey/');
    await page.locator('.tsb').first().click();

    await page.goto('/my/');
    const picker = page.locator('#mypTrips');
    await expect(picker).toBeVisible();
    await expect(picker.locator('[data-trip]')).toHaveCount(2);
  });
});
