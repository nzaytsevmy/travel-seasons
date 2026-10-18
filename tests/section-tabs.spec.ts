import { test, expect } from './browser-fixture';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Owner decision 18.10.2026: destination tabs and fixed affiliate panels are
// removed everywhere. Scan the entire build so a forgotten template fails too.
test('all built routes omit destination tabs and fixed affiliate panels', () => {
  const root = process.env.DIST_DIR || join(process.cwd(), 'dist');
  const failures: string[] = [];
  let pages = 0;
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith('.html')) {
        pages++;
        const html = readFileSync(file, 'utf8');
        if (/class="(?:[^"]*\s)?(?:dt|sticky-cta)(?:\s[^"]*)?"|aria-label="Разделы направления:/.test(html)) failures.push(file);
      }
    }
  }
  scan(root);
  expect(pages, 'the complete build must be scanned').toBeGreaterThan(2000);
  expect(failures).toEqual([]);
});

for (const path of ['/', '/countries/', '/seasons/', '/trips/', '/trips/july/', '/visa/', '/packing/', '/blog/', '/novosti/', '/compare/', '/compare/turkey-vs-egypt/', '/events/', '/events/july/', '/calculator/', '/hotels/australia/', '/oman/', '/australia-east/', '/turkey/', '/japan/', '/antarctica/', '/visa/turkey/', '/packing/japan/', '/packing/egypt/june/', '/trips/july/turkey/', '/bezviz/', '/blog/strahovka-dlya-puteshestviy-2026/']) {
  test(`reading space and contextual links ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.dt, .sticky-cta')).toHaveCount(0);
    const hasAffiliate = await page.locator('main a[rel~="sponsored"], [data-trip-planning] a[rel~="sponsored"]').count();
    expect(hasAffiliate, 'affiliate actions must remain in the document').toBeGreaterThan(0);
    for (const width of [320, 360, 390, 402, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await page.evaluate(() => ({
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        bottom: parseFloat(getComputedStyle(document.body).paddingBottom),
      }));
      expect(geometry.overflow, `${path} overflow at ${width}`).toBeLessThanOrEqual(1);
      // A generic body spacing rule may remain, but the old 76px panel reserve cannot.
      expect(geometry.bottom, `${path} stale panel reserve at ${width}`).not.toBe(76);
    }
  });
}

test('mobile contents stay collapsed and their anchors remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/australia-east/');
  const details = page.locator('.om-toc details');
  await expect(details).not.toHaveAttribute('open', '');
  const summary = details.locator('summary');
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  const target = details.locator('a[href="#doroga"]');
  await target.click();
  await expect(page).toHaveURL(/#doroga$/);
  await expect(page.locator('#doroga h2')).toBeInViewport();
  await expect(page.locator('a[href="/visa/australia-east/"]').first()).toBeAttached();
  await expect(page.locator('a[href="/packing/australia-east/"]').first()).toBeAttached();
  await expect(page.locator('a[href^="/trips/"]').first()).toBeAttached();
});
