import { test, expect } from './browser-fixture';

test.describe('культурные новости без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('архив доступен и объясняет состояние рубрики', async ({ page }) => {
    const path = '/novosti/tema/kultura-i-sobytiya/';
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveText('Новости культуры и событий');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://traveltribe.ru${path}`);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    const links = page.locator('main ol.nvt-list > li a');
    if (robots?.includes('noindex')) {
      await expect(links).toHaveCount(0);
      await expect(page.locator('main')).toContainText('нет актуальных новостей');
      await expect(page.locator('main a[href="/novosti/"]').first()).toBeVisible();
    } else {
      expect(await links.count()).toBeGreaterThan(0);
      await expect(links.first()).toBeVisible();
    }
  });
});
