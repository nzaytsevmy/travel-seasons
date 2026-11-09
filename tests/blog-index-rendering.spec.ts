import { test, expect } from './browser-fixture';
import { typo } from '../src/utils/typo.js';
import { featuredImageSizes, featuredImageWidths } from '../src/data/featured-image-sizing.js';
import sharp from 'sharp';

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
    const tagLabels = page.locator('.featured-card .ptag, .posts-grid > a.post-card .ptag');
    if (await tagLabels.count()) {
      const tagMetrics = await tagLabels.first().evaluate(node => ({
        size: Number.parseFloat(getComputedStyle(node).fontSize),
        rootSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      }));
      expect(tagMetrics.size).toBeCloseTo(tagMetrics.rootSize * (width <= 768 ? 0.78 : 0.62), 1);
    }
    expect(await page.locator('.post-tags').evaluateAll(nodes =>
      nodes.filter(node => (node as HTMLElement).scrollWidth > (node as HTMLElement).clientWidth + 1).length)).toBe(0);

    const cover = page.locator('.featured-img img');
    await expect.poll(() => cover.evaluate((node: HTMLImageElement) =>
      node.complete && node.naturalWidth > 0)).toBe(true);
    const image = await cover.evaluate((node: HTMLImageElement) => {
      const candidates = node.srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        return { url: new URL(url, location.href).href, width: Number.parseInt(size, 10) };
      });
      return {
        cropWidth: Math.max(node.getBoundingClientRect().width,
          node.getBoundingClientRect().height * node.naturalWidth / node.naturalHeight),
        deviceScale: devicePixelRatio,
        selectedWidth: candidates.find(candidate => candidate.url === node.currentSrc)?.width ?? 0,
        maxWidth: Math.max(...candidates.map(candidate => candidate.width)),
      };
    });
    expect(image.selectedWidth).toBeGreaterThanOrEqual(
      Math.min(Math.floor(image.cropWidth * image.deviceScale), image.maxWidth),
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
  test('выбирает обложку достаточного размера', async ({ page }) => {
    expect((await page.goto('/blog/'))?.status()).toBe(200);
    const cover = page.locator('.featured-img img');
    await expect.poll(() => cover.evaluate((node: HTMLImageElement) =>
      node.complete && node.naturalWidth > 0)).toBe(true);
    const image = await cover.evaluate((node: HTMLImageElement) => {
      const candidates = node.srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        return { url: new URL(url, location.href).href, width: Number.parseInt(size, 10) };
      });
      return {
        selectedWidth: candidates.find(candidate => candidate.url === node.currentSrc)?.width ?? 0,
        requiredWidth: Math.max(node.getBoundingClientRect().width,
          node.getBoundingClientRect().height * node.naturalWidth / node.naturalHeight) * devicePixelRatio,
        maxWidth: Math.max(...candidates.map(candidate => candidate.width)),
      };
    });
    expect(image.selectedWidth).toBeGreaterThanOrEqual(Math.floor(Math.min(image.requiredWidth, image.maxWidth)));
  });
});

for (const scale of [1.75, 2]) {
  test.describe(`featured wide photograph at DPR ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test('the browser selects enough available pixels around the layout boundary', async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium-desktop', 'Controlled DPR is checked once');
      test.setTimeout(120_000);
      const input = 'src/content/blog/_images/sutochno-ru/cover.jpg';
      const metadata = await sharp(input).metadata();
      expect([metadata.width, metadata.height]).toEqual([1920, 689]);
      const widths = featuredImageWidths(metadata);
      const cache = new Map<number, Buffer>();
      await page.route('**/__qa-wide-cover/*.webp', async route => {
        const width = Number.parseInt(new URL(route.request().url()).pathname.split('/').pop()!, 10);
        if (!widths.includes(width)) throw new Error(`Unexpected image width ${width}`);
        if (!cache.has(width)) cache.set(width, await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer());
        await route.fulfill({ status: 200, contentType: 'image/webp', body: cache.get(width)! });
      });
      const srcset = widths.map(width => `/__qa-wide-cover/${width}.webp ${width}w`).join(', ');
      const image = page.locator('.featured-img img');
      const rows = [];
      for (const width of [402, 680, 681, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect((await page.goto('/blog/'))?.status()).toBe(200);
        await image.evaluate((node: HTMLImageElement, values) => {
          node.srcset = values.srcset;
          node.sizes = values.sizes;
        }, { srcset, sizes: featuredImageSizes(metadata) });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const measure = () => image.evaluate(async (node: HTMLImageElement) => {
          await node.decode();
          const candidates = node.srcset.split(',').map(part => {
            const [url, size] = part.trim().split(/\s+/);
            return { url: new URL(url, location.href).href, width: Number.parseInt(size, 10) };
          });
          const box = node.getBoundingClientRect();
          const required = Math.max(box.width, box.height * node.naturalWidth / node.naturalHeight) * devicePixelRatio;
          return { selected: candidates.find(candidate => candidate.url === node.currentSrc)?.width ?? 0,
            required, largest: Math.max(...candidates.map(candidate => candidate.width)) };
        });
        await expect.poll(async () => {
          const result = await measure();
          return result.selected >= Math.floor(Math.min(result.required, result.largest));
        }).toBe(true);
        const result = await measure();
        rows.push({ width, ...result, limitedByOriginal: result.required > metadata.width! });
      }
      if (scale === 1.75) {
        expect(rows.find(row => row.width === 1280)?.selected).toBe(1920);
        const otherInput = 'src/content/blog/_images/dzhakarta-chto-posmotret/fatahillah.jpg';
        const other = await sharp(otherInput).metadata();
        expect([other.width, other.height]).toEqual([1600, 821]);
        const otherWidths = featuredImageWidths(other);
        await page.route('**/__qa-wide-cover-2/*.webp', async route => {
          const width = Number.parseInt(new URL(route.request().url()).pathname.split('/').pop()!, 10);
          if (!otherWidths.includes(width)) throw new Error(`Unexpected image width ${width}`);
          const body = await sharp(otherInput).resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
          await route.fulfill({ status: 200, contentType: 'image/webp', body });
        });
        await image.evaluate((node: HTMLImageElement, values) => { node.srcset = values.srcset; node.sizes = values.sizes; },
          { srcset: otherWidths.map(width => `/__qa-wide-cover-2/${width}.webp ${width}w`).join(', '), sizes: featuredImageSizes(other) });
        await expect.poll(async () => image.evaluate((node: HTMLImageElement) => {
          const current = new URL(node.currentSrc).pathname;
          return current.includes('/__qa-wide-cover-2/') ? Number.parseInt(current.split('/').pop() || '0', 10) : 0;
        })).toBe(1600);
      }
      await info.attach('wide-featured-image-crops', { body: Buffer.from(JSON.stringify(rows)), contentType: 'application/json' });
    });
  });
}

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
      tags: node.querySelector('.post-tags')?.textContent ?? '',
    })));
    const actualCards = actualCardsRaw.map(card => ({ href: normalizeHref(card.href!), title: normalizeTitle(card.title) }));
    expect([actualFeatured, ...actualCards]).toEqual(expected);
    if (testInfo.project.name === 'chromium-desktop') {
      const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
      const tags = (text: string) => clean(text);
      const snapshot = {
        featured: {
          href: featuredHref,
          title: clean(featuredTitle),
          meta: clean((await featured.locator('.post-meta').textContent())!),
          tags: tags((await featured.locator('.post-tags').textContent())!),
        },
        cards: actualCardsRaw.map(card => ({
          href: card.href,
          title: clean(card.title),
          meta: clean(card.meta),
          tags: tags(card.tags),
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
