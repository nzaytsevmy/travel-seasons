import { test, expect } from './browser-fixture';

for (const path of ['/blog/', '/blog/bali-guide-2026/', '/blog/hram-uluvatu-bali/', '/bali/']) {
  test(`secondary font preloads have low priority on ${path}`, async ({ page }) => {
    expect((await page.goto(path, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
    const secondary = page.locator('link[rel="preload"][as="font"][fetchpriority="low"]');
    await expect(secondary).toHaveCount(2);
    const hrefs = await secondary.evaluateAll(nodes => nodes.map(node => node.getAttribute('href') || ''));
    expect(hrefs.some(href => href.includes('old-standard-tt-700'))).toBe(true);
    expect(hrefs.some(href => href.includes('pt-mono-400'))).toBe(true);
    await expect(page.locator('link[rel="preload"][as="font"][href*="golos-text-cyrillic"]')).not.toHaveAttribute('fetchpriority', 'low');
  });
}
