import { test, expect } from './browser-fixture';
import { typo } from '../src/utils/typo.js';

const normalizeTitle = (text: string) => text.replace(/\u2060/g, '').replace(/\s+/g, ' ').trim();
const normalizeHref = (href: string) => new URL(href, 'https://traveltribe.ru').href;

for (const width of [402, 1280]) {
  test(`каталог блога: изображения и переход с клавиатуры на ${width}px`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto('/blog/'))?.status()).toBe(200);
    // Avoid prefetching the many visible topics/cards until the reader shows intent.
    const deferredLinks = page.locator('.tag-filter a, .featured-card, .posts-grid > a.post-card:not(.promo-card)');
    expect(await deferredLinks.count()).toBeGreaterThan(20);
    await expect(page.locator('.tag-filter a:not([data-astro-prefetch="hover"]), .featured-card:not([data-astro-prefetch="hover"]), .posts-grid > a.post-card:not(.promo-card):not([data-astro-prefetch="hover"])')).toHaveCount(0);

    const cover = page.locator('.featured-img img');
    await expect.poll(() => cover.evaluate((node: HTMLImageElement) =>
      node.complete && node.naturalWidth > 0)).toBe(true);
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    expect(await preload.getAttribute('imagesrcset')).toBe(await cover.getAttribute('srcset'));
    expect(await preload.getAttribute('imagesizes')).toBe(await cover.getAttribute('sizes'));
    await page.waitForLoadState('networkidle');
    const image = await cover.evaluate((node: HTMLImageElement) => {
      const candidates = node.srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        return { url: new URL(url, location.href).href, width: Number.parseInt(size, 10) };
      });
      return {
        renderedWidth: node.getBoundingClientRect().width,
        deviceScale: devicePixelRatio,
        selectedWidth: candidates.find(candidate => candidate.url === node.currentSrc)?.width ?? 0,
        maxWidth: Math.max(...candidates.map(candidate => candidate.width)),
        requestedCandidates: performance.getEntriesByType('resource')
          .filter(entry => candidates.some(candidate => candidate.url === entry.name)).map(entry => entry.name),
        transfers: performance.getEntriesByType('resource')
          .filter(entry => candidates.some(candidate => candidate.url === entry.name)
            && (entry as PerformanceResourceTiming).transferSize > 0).length,
        currentSrc: node.currentSrc,
      };
    });
    expect([...new Set(image.requestedCandidates)]).toEqual([image.currentSrc]);
    if (browserName === 'chromium') expect(image.transfers).toBe(1);
    expect(image.selectedWidth).toBeGreaterThanOrEqual(
      Math.min(Math.ceil(image.renderedWidth * image.deviceScale), image.maxWidth),
    );

    const cards = page.locator('.posts-grid > a.post-card:not(.promo-card)');
    expect(await cards.count()).toBeGreaterThan(20);
    const card = cards.nth(12);
    const href = await card.getAttribute('href');
    expect(href).toMatch(/^\/blog\/[^/]+\/$/);
    await card.focus();
    await expect(card).toBeFocused();
    await expect(card.locator('.post-title')).toBeVisible();
    const title = await card.locator('.post-title').innerText();
    const titlePattern = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\u2060/g, '\\u2060?').replace(/\s+/g, '\\s+');
    await expect(card).toHaveAccessibleName(new RegExp(titlePattern, 'u'));
    await expect(card.locator('.post-meta')).toContainText(/\d{4}\s*(?:г\.)?\s*·\s*\d+\s*мин/);

    const nextCard = cards.nth(13);
    const macWebKit = process.platform === 'darwin' && browserName === 'webkit';
    await page.keyboard.press(macWebKit ? 'Alt+Tab' : 'Tab');
    await expect(nextCard).toBeFocused();
    await expect(nextCard).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press(macWebKit ? 'Alt+Shift+Tab' : 'Shift+Tab');
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new URL(href!, page.url()).href);
  });
}

test.describe('каталог блога на мобильном экране Lighthouse', () => {
  test.use({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
  });
  test('выбирает обложку достаточного размера', async ({ page, browserName }) => {
    expect((await page.goto('/blog/'))?.status()).toBe(200);
    const cover = page.locator('.featured-img img');
    await expect.poll(() => cover.evaluate((node: HTMLImageElement) =>
      node.complete && node.naturalWidth > 0)).toBe(true);
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    expect(await preload.getAttribute('imagesrcset')).toBe(await cover.getAttribute('srcset'));
    expect(await preload.getAttribute('imagesizes')).toBe(await cover.getAttribute('sizes'));
    await page.waitForLoadState('networkidle');
    const image = await cover.evaluate((node: HTMLImageElement) => {
      const candidates = node.srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        return { url: new URL(url, location.href).href, width: Number.parseInt(size, 10) };
      });
      return {
        selectedWidth: candidates.find(candidate => candidate.url === node.currentSrc)?.width ?? 0,
        requiredWidth: Math.ceil(node.getBoundingClientRect().width * devicePixelRatio),
        requestedCandidates: performance.getEntriesByType('resource')
          .filter(entry => candidates.some(candidate => candidate.url === entry.name)).map(entry => entry.name),
        transfers: performance.getEntriesByType('resource')
          .filter(entry => candidates.some(candidate => candidate.url === entry.name)
            && (entry as PerformanceResourceTiming).transferSize > 0).length,
        currentSrc: node.currentSrc,
      };
    });
    expect([...new Set(image.requestedCandidates)]).toEqual([image.currentSrc]);
    if (browserName === 'chromium') expect(image.transfers).toBe(1);
    expect(image.selectedWidth).toBeGreaterThanOrEqual(image.requiredWidth);
    if (browserName === 'chromium') expect(image.selectedWidth).toBe(720);
  });
});

test.describe('каталог блога без JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 360, height: 900 } });
  test('ссылки и метаданные доступны при увеличенном тексте', async ({ page }, testInfo) => {
    const response = await page.goto('/blog/');
    expect(response?.status()).toBe(200);
    const cards = page.locator('.posts-grid > a.post-card:not(.promo-card)');
    const hrefs = await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(20);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    const html = await response!.text();
    for (const href of hrefs) expect(html).toContain(`href="${href}"`);

    // The complete, crawlable JSON-LD remains server-rendered; the cover is
    // discoverable before the large article list even without JavaScript.
    expect(html.indexOf('class="featured-img"')).toBeGreaterThan(-1);
    expect(html.indexOf('type="application/ld+json"')).toBeGreaterThan(html.indexOf('class="featured-img"'));
    await expect(page.locator('body > script[type="application/ld+json"]')).toHaveCount(1);
    const structured = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = structured.flatMap(raw => {
      const data = JSON.parse(raw);
      return Array.isArray(data['@graph']) ? data['@graph'] : [data];
    });
    const blog = nodes.find(node => node['@type'] === 'Blog');
    expect(blog).toBeTruthy();
    const expected = blog.blogPost.map((post: { url: string; headline: string }) => ({
      href: normalizeHref(post.url),
      title: normalizeTitle(typo(post.headline)),
    }));
    const featured = page.locator('.featured-section a.featured-card');
    const featuredHref = (await featured.getAttribute('href'))!;
    const featuredTitle = (await featured.locator('.featured-title').textContent())!;
    const actualFeatured = {
      href: normalizeHref(featuredHref),
      title: normalizeTitle(featuredTitle),
    };
    const actualCardsRaw = await cards.evaluateAll(items => items.map(node => ({
      href: node.getAttribute('href'),
      title: node.querySelector('.post-title')?.textContent ?? '',
      meta: node.querySelector('.post-meta')?.textContent ?? '',
    })));
    const actualCards = actualCardsRaw.map(card => ({ href: normalizeHref(card.href!), title: normalizeTitle(card.title) }));
    expect([actualFeatured, ...actualCards]).toEqual(expected);
    if (testInfo.project.name === 'chromium-desktop') {
      const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
      const snapshot = {
        featured: {
          href: featuredHref,
          title: clean(featuredTitle),
          meta: clean((await featured.locator('.post-meta').textContent())!),
        },
        cards: actualCardsRaw.map(card => ({
          href: card.href,
          title: clean(card.title),
          meta: clean(card.meta),
        })),
      };
      await testInfo.attach('blog-index-snapshot', {
        body: Buffer.from(JSON.stringify(snapshot)),
        contentType: 'application/json',
      });
      await testInfo.attach('blog-structured-data-snapshot', {
        body: Buffer.from(JSON.stringify(structured.map(raw => JSON.parse(raw)))),
        contentType: 'application/json',
      });
    }

    // page.addStyleTag can wait indefinitely when page JavaScript is disabled.
    // Playwright's automation context can still set CSS directly without
    // enabling the page's scripts; assert the resulting scale, not just the style.
    const zoom = await page.evaluate(() => {
      const root = document.documentElement;
      const before = Number.parseFloat(getComputedStyle(root).fontSize);
      root.style.setProperty('font-size', '200%', 'important');
      return { before, after: Number.parseFloat(getComputedStyle(root).fontSize) };
    });
    expect(zoom.after).toBeGreaterThanOrEqual(zoom.before * 1.9);
    const card = cards.nth(12);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('.post-title')).toBeVisible();
    await expect(card.locator('.post-meta')).toContainText(/\d{4}\s*(?:г\.)?\s*·\s*\d+\s*мин/);
    const fits = await card.locator('.post-meta').evaluate(node => node.scrollWidth <= node.clientWidth + 1);
    expect(fits).toBe(true);
  });
});
