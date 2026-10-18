import { test, expect } from './browser-fixture';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasReadingObstruction } from '../scripts/mobile-reading-contract.mjs';

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
        if (hasReadingObstruction(html)) failures.push(file);
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
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('nav[aria-label^="Разделы направления:"], .sticky-cta')).toHaveCount(0);
    const hasAffiliate = await page.locator('main a[rel~="sponsored"], [data-trip-planning] a[rel~="sponsored"]').count();
    expect(hasAffiliate, 'affiliate actions must remain in the document').toBeGreaterThan(0);
    for (const width of [320, 360, 390, 402, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await page.evaluate(() => ({
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        bottom: parseFloat(getComputedStyle(document.body).paddingBottom),
        worst: [...document.querySelectorAll('main *')].map(e => ({
          tag: e.tagName, cls: typeof e.className === 'string' ? e.className : '',
          right: Math.round(e.getBoundingClientRect().right),
          width: Math.round(e.getBoundingClientRect().width), text: e.textContent?.slice(0, 60),
        })).filter(e => e.width > 0 && e.right > innerWidth + 1).sort((a,b) => b.right-a.right).slice(0,4),
      }));
      expect(geometry.overflow, `${path} overflow at ${width}: ${JSON.stringify(geometry.worst)}`).toBeLessThanOrEqual(1);
      expect(geometry.bottom, `${path} stale panel reserve at ${width}`).toBe(0);
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

for (const path of ['/australia-east/', '/oman/', '/japan/', '/packing/japan/', '/visa/turkey/', '/blog/strahovka-dlya-puteshestviy-2026/', '/about/', '/legal/privacy/']) {
  test(`mobile page shell uses one gutter ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const edges = await page.evaluate(() => {
      const title = document.querySelector('h1')!.getBoundingClientRect();
      const crumbs = document.querySelector('.breadcrumbs');
      return { title: title.left, crumbs: crumbs ? crumbs.getBoundingClientRect().left + parseFloat(getComputedStyle(crumbs).paddingLeft) : null, footer: parseFloat(getComputedStyle(document.querySelector('.site-footer')!).paddingLeft) };
    });
    expect(edges.title, path).toBeCloseTo(16, 0);
    if (path === '/about/' || path === '/legal/privacy/') expect(edges.crumbs, path).toBeNull();
    else expect(edges.crumbs, path).toBeCloseTo(16, 0);
    expect(edges.footer, path).toBeCloseTo(16, 0);
  });
}

test('season search has a full mobile touch target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/seasons/');
  expect((await page.getByRole('searchbox', { name: 'Поиск по таблице' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

for (const path of ['/about/', '/legal/privacy/', '/legal/cookie/', '/legal/terms/', '/legal/photos/', '/my/', '/cards/', '/izmeneniya/', '/status/', '/seasons/japan/january/', '/novosti/2026-05-01-torres-del-paine-tariff/']) {
  test(`auxiliary template geometry ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('nav[aria-label^="Разделы направления:"], .sticky-cta')).toHaveCount(0);
    for (const width of [320, 360, 390, 402, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth), `${path} @${width}`).toBeLessThanOrEqual(1);
    }
  });
}

for (const path of ['/australia-east/', '/oman/', '/japan/', '/antarctica/', '/visa/turkey/', '/packing/japan/', '/packing/egypt/june/', '/trips/july/turkey/', '/blog/strahovka-dlya-puteshestviy-2026/']) {
  test(`mobile reading survives doubled text size ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth), path).toBeLessThanOrEqual(1);
    await expect(page.locator('h1')).toBeVisible();
  });
}
