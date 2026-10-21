import { test, expect } from '@playwright/test';

const maps = [
  ['luvr-abu-dabi', 4], ['sigiriya', 8], ['plitvitskie-ozyora', 10],
  ['gardens-by-the-bay', 10], ['kirstenbosh', 8], ['maskat-za-odin-den', 6],
  ['samarkand-za-dva-dnya', 8], ['marrakesh-za-odin-den', 6],
  ['paromy-stambula', 12], ['diani-kenya', 9],
] as const;

for (const [slug, points] of maps) {
  for (const width of [402, 1280]) {
    test(`route map ${slug}, ${width}px: navigation and recovery without tile service`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      // A tile outage must not remove the verified coordinates, routes, or controls.
      await page.route('https://tile.openstreetmap.org/**', route => route.abort());
      await page.goto(`/maps/${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://traveltribe.ru/maps/${slug}/`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
      await expect(page.locator(`a[href="/blog/${slug}/"]`)).toBeVisible();
      const view = page.getByLabel('Показать');
      await expect(view.locator('option')).toHaveCount(points + 2);
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(points);
      const point = await page.locator('#map-data').evaluate(el => JSON.parse(el.textContent || '{}').pois[0]);
      await view.selectOption(point.key);
      await expect(page.locator('.leaflet-popup-content')).toContainText(point.name);
      await expect(page.locator('.leaflet-popup-content a')).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lon}`);
      await page.getByRole('button', { name: 'Обзор', exact: true }).click();
      await expect(view).toHaveValue('main');
      await expect(page.locator('.leaflet-popup')).toHaveCount(0);
      await view.selectOption('all');
      await expect(view).toHaveValue('all');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await expect(page.locator('main ol > li')).toHaveCount(points);
    });
  }
}
