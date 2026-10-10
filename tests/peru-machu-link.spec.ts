import { test, expect } from './browser-fixture';
import { checkPageStructure, WIDTHS } from '../scripts/structural-checks.mjs';

// Country data is outside CHANGED_FILES=src/content. Cover the actual changed FAQ.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'FAQ structure is checked in Chromium');
});
for (const width of WIDTHS) {
  test(`Перу: выбор билета ведёт к маршрутам Мачу-Пикчу @${width}px`, async ({ page }) => {
    expect(await checkPageStructure(page, '/peru/', width)).toEqual([]);
    const faq = page.locator('#faq');
    await expect(faq.getByText('Как купить билет на Мачу-Пикчу?', { exact: true })).toBeVisible();
    const link = faq.locator('a[href="/blog/machu-picchu-marshruty-bilety-2026/"]');
    await expect(link).toBeVisible();
    await expect(faq).toContainText('Для панорамы и прогулки по городу смотрите 2A или 2B');
    await expect(faq).not.toContainText('<a href=');
  });
}
