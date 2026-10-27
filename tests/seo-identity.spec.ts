import { test, expect } from './browser-fixture';
import { checkPageStructure, WIDTHS } from '../scripts/structural-checks.mjs';

const paths = ['/visa/japan/', '/visa/japan-hokkaido/', '/visa/italy-north/', '/visa/italy-south/', '/seasons/'];
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'address-specific structure uses the existing Chromium project');
});
for (const path of paths) for (const width of WIDTHS) {
  test(`SEO publication ${path} @${width}`, async ({ page }, info) => {
    expect(await checkPageStructure(page, path, width)).toEqual([]);
    expect(await page.locator('head link[rel="canonical"]').getAttribute('href')).toBe(`https://traveltribe.ru${path}`);
    if (width === 402 || width === 1280) {
      await info.attach('changed-page', { body: await page.screenshot(), contentType: 'image/png' });
    }
  });
}
test('regional visa pages keep independent titles, descriptions and canonicals', async ({ page }) => {
  const titles = new Set(), descriptions = new Set();
  for (const path of paths.filter(p=>p.startsWith('/visa/'))) {
    await page.goto(path);
    titles.add(await page.title());
    descriptions.add(await page.locator('meta[name="description"]').getAttribute('content'));
    expect(await page.locator('head link[rel="canonical"]').getAttribute('href')).toBe(`https://traveltribe.ru${path}`);
  }
  expect(titles.size).toBe(4);
  expect(descriptions.size).toBe(4);
});
