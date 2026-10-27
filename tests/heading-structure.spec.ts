import { test, expect } from './browser-fixture';
import { checkPageStructure, WIDTHS } from '../scripts/structural-checks.mjs';
import { headingStructure } from '../scripts/lib/heading-structure.mjs';

const slugs = ['abkhazia-2026','aurora-murmansk-2027','australia-guide-2026','azerbaijan-guide-2026','baikal-zimoy-2027','bali-guide-2026','gagra-2026','georgia-guide-2026','goa-guide-2026','hainan-guide-2026','kamchatka-guide-2026','kenya-guide-2026','morocco-guide-2026','thailand-guide-2026','turkey-guide-2026','uae-guide-2026','zanzibar-2026'];
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'All affected URLs use address-specific Chromium structure; existing full cross-browser regression remains required.');
});
for (const slug of slugs) for (const width of WIDTHS) {
  test(`Heading hierarchy ${slug} @${width}`, async ({ page }, info) => {
    expect(await checkPageStructure(page, `/blog/${slug}/`, width)).toEqual([]);
    const routes = page.locator('.flight-routes .fr-route');
    expect(await routes.count()).toBeGreaterThan(0);
    expect(await routes.evaluateAll(nodes => nodes.every(n => n.tagName === 'H3'))).toBe(true);
    expect(headingStructure(await page.content()).findings).toEqual([]);
    if (width === 402 || width === 1280) {
      await info.attach('flight-routes', { body: await page.locator('.flight-routes').first().screenshot(), contentType: 'image/png' });
    }
  });
}
