import { test, expect } from './browser-fixture';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkPageStructure, WIDTHS } from '../scripts/structural-checks.mjs';

// The new composed route must be tested after the real Astro build, including
// every pagination page. Content-file mapping alone does not cover these URLs.
const root = join(process.cwd(), 'dist', 'novosti', 'tema');
function pages(dir: string, prefix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? pages(join(dir, entry.name), `${prefix}${entry.name}/`)
    : entry.name === 'index.html' ? [prefix] : []);
}
const urls = existsSync(root) ? pages(root, '/novosti/tema/') : [];
const newsRoot = join(process.cwd(), 'dist', 'novosti');
const archiveUrls = existsSync(newsRoot) ? readdirSync(newsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
  .map(entry => `/novosti/${entry.name}/`) : [];
test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium-desktop'));
test('each news topic has a real built landing page', () => {
  for (const slug of ['vizy-i-vezd', 'transport-i-dostup', 'priroda'])
    expect(urls).toContain(`/novosti/tema/${slug}/`);
});
for (const url of [...urls, '/novosti/', ...archiveUrls]) {
  for (const width of WIDTHS) {
    test(`news discovery ${url} @${width}`, async ({ page }) => {
      expect(await checkPageStructure(page, url, width)).toEqual([]);
      await expect(page.locator('main h1')).toHaveCount(1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`https://traveltribe.ru${url}`);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).not.toContain('noindex');
      if (url.startsWith('/novosti/tema/')) {
        const count = await page.locator('main ol.nvt-list > li').count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(30);
      }
    });
  }
}
