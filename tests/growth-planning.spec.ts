import { test, expect } from './browser-fixture';
import { SEASON_COUNTRY_REDIRECTS } from '../src/data/season-country-redirects.js';
import { getPackingRelatedGuides } from '../src/data/packing-page-advice.js';

test('legacy country directories emit instant redirects and stay out of the sitemap', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const [from, target] of Object.entries(SEASON_COUNTRY_REDIRECTS)) {
    const response = await request.get(`${from}/`);
    expect(response.ok(), from).toBeTruthy();
    const html = await response.text();
    expect(html, from).toContain(`content="0;url=${target}"`);
    expect(html, from).toContain(`rel="canonical" href="https://traveltribe.ru${target}"`);
    expect(sitemap, from).not.toContain(`<loc>https://traveltribe.ru${from}/</loc>`);
    expect((await request.get(target)).ok(), target).toBeTruthy();
  }
});

for (const country of ['egypt', 'georgia', 'armenia', 'china', 'hainan', 'nepal']) {
  test(`existing checklist continues into verified planning answers: ${country}`, async ({ page }) => {
    await page.goto(`/packing/${country}/december/`);
    const block = page.locator('.packing-next');
    await expect(block).toBeVisible();
    for (const guide of getPackingRelatedGuides(country, 'december')) {
      await expect(block.locator(`a[href="${guide.href}"]`)).toHaveText(guide.label);
    }
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`https://traveltribe.ru/packing/${country}/december/`);
  });
}

test('unselected destinations and Egyptian summer do not receive the planning block', async ({ page }) => {
  for (const path of ['/packing/turkey/december/', '/packing/egypt/july/']) {
    await page.goto(path);
    await expect(page.locator('.packing-next')).toHaveCount(0);
  }
});

for (const width of [360, 402, 768, 1024, 1280]) {
  for (const path of ['/packing/egypt/december/', '/trips/january/armenia/', '/compare/georgia-vs-armenia/']) {
    test(`planning fits the reading width ${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const planning = page.locator('.packing-next, .cmpg-planning').first();
      await expect(planning).toBeVisible();
      await planning.scrollIntoViewIfNeeded();
      const geometry = await planning.evaluate(element => ({
        documentWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        clipped: Array.from(element.querySelectorAll('a,p,span')).filter(e => e.scrollWidth > e.clientWidth + 1).length,
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.clipped).toBe(0);
      const link = planning.locator('a').first();
      await link.focus();
      await expect(link).toBeFocused();
      const href = await link.getAttribute('href');
      await link.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    });
  }
}
