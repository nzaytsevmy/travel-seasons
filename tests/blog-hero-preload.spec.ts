import { test, expect, type Response } from './browser-fixture';
import sharp from 'sharp';

const paths = ['/blog/novyy-god-tailand-2027/', '/blog/novyy-god-vietnam-2027/', '/blog/chile-guide-2026/'];

test.describe('wide cover at mobile DPR 2', () => {
  test.use({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true });
  test('uses a sufficiently detailed 1024px image within the cover weight budget', async ({ page }) => {
    const responses: Response[] = [];
    page.on('response', response => responses.push(response));
    expect((await page.goto('/blog/solnechnoe-zatmenie-2027/', { waitUntil: 'networkidle' }))?.status()).toBe(200);
    const selected = await page.locator('.post-cover img').evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const source = img.closest('picture')!.querySelector('source[type="image/webp"]')!;
      const candidates = (source.getAttribute('srcset') || '').split(',').map(part => {
        const [url, width] = part.trim().split(/\s+/);
        return { url: new URL(url, location.href).href, width: Number.parseInt(width, 10) };
      });
      return { url: img.currentSrc, width: candidates.find(item => item.url === img.currentSrc)?.width };
    });
    expect(selected.width).toBe(1024);
    const response = responses.find(item => item.url() === selected.url);
    expect(response?.status()).toBe(200);
    expect((await response!.body()).byteLength).toBeLessThanOrEqual(150 * 1024);
  });
});

test('Vietnam cover has a decodable WebP fallback when AVIF is unavailable', async ({ page }) => {
  expect((await page.goto('/blog/novyy-god-vietnam-2027/'))?.status()).toBe(200);
  const cover = page.locator('.post-cover img');
  await page.locator('.post-cover source[type="image/avif"]').evaluate(node => node.remove());
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/\.webp(?:\?|$)/);
  expect(await cover.evaluate(async (img: HTMLImageElement) => { await img.decode(); return img.naturalWidth; })).toBeGreaterThan(0);
});

for (const fallback of ['webp', 'jpeg'] as const) {
  test(`unsupported preferred formats do not preload and fall back to ${fallback}`, async ({ page }) => {
    const requested: string[] = [];
    const image = sharp({ create: { width: 8, height: 8, channels: 3, background: '#a34c28' } });
    const webp = await image.clone().webp().toBuffer();
    const jpeg = await image.clone().jpeg().toBuffer();
    page.on('request', request => requested.push(new URL(request.url()).pathname));
    await page.route('**/__qa-cover/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/page')) {
        const webpType = fallback === 'webp' ? 'image/webp' : 'image/x-unsupported-webp';
        await route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>
          <link rel="preload" as="image" type="image/x-unsupported-avif" href="/__qa-cover/unsupported.avif" imagesrcset="/__qa-cover/unsupported.avif 8w" imagesizes="8px">
          </head><body><picture><source type="image/x-unsupported-avif" srcset="/__qa-cover/unsupported.avif">
          <source type="${webpType}" srcset="/__qa-cover/fallback.webp"><img src="/__qa-cover/fallback.jpg" alt="Cover"></picture></body></html>` });
      } else if (path.endsWith('.webp')) await route.fulfill({ contentType: 'image/webp', body: webp });
      else if (path.endsWith('.jpg')) await route.fulfill({ contentType: 'image/jpeg', body: jpeg });
      else await route.fulfill({ status: 500, body: 'unsupported format must not be requested' });
    });
    expect((await page.goto('/__qa-cover/page', { waitUntil: 'networkidle' }))?.status()).toBe(200);
    const selected = await page.locator('picture img').evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      return { url: new URL(img.currentSrc).pathname, width: img.naturalWidth };
    });
    const expected = fallback === 'webp' ? '/__qa-cover/fallback.webp' : '/__qa-cover/fallback.jpg';
    expect(selected).toEqual({ url: expected, width: 8 });
    expect(requested.filter(path => /\.(avif|webp|jpg)$/.test(path))).toEqual([expected]);
  });
}

for (const path of paths) {
  test(`article cover uses one matching preload ${path}`, async ({ page }) => {
    const requests: string[] = [];
    const responses: Response[] = [];
    page.on('request', request => requests.push(request.url()));
    page.on('response', response => responses.push(response));
    await page.setViewportSize({ width: 402, height: 900 });
    expect((await page.goto(path, { waitUntil: 'networkidle' }))?.status()).toBe(200);
    const blogCrumb = page.locator('.breadcrumbs a[href="/blog/"]');
    await expect(blogCrumb).toHaveAttribute('data-astro-prefetch', 'hover');
    expect(requests.filter(url => new URL(url).pathname === '/blog/')).toHaveLength(0);
    await blogCrumb.focus();
    await expect(blogCrumb).toBeFocused();
    const preload = page.locator('link[rel="preload"][as="image"][imagesrcset]');
    const preferredType = path === '/blog/novyy-god-vietnam-2027/' ? 'image/avif' : 'image/webp';
    const source = page.locator(`.post-cover source[type="${preferredType}"]`);
    const image = page.locator('.post-cover img');
    await expect(preload).toHaveCount(1);
    await expect(source).toHaveCount(1);
    await expect(page.locator('.post-cover source[type="image/webp"]')).toHaveCount(1);
    if (preferredType === 'image/avif') await expect(preload).toHaveAttribute('type', 'image/avif');
    await expect(image).toBeVisible();
    const selected = await image.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      return { url: img.currentSrc, width: img.naturalWidth };
    });
    expect(selected.width).toBeGreaterThan(0);
    const srcset = await source.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    expect(await preload.getAttribute('imagesrcset')).toBe(srcset);
    expect(await preload.getAttribute('imagesizes')).toBe(await source.getAttribute('sizes'));
    const candidates = await page.locator('.post-cover source, .post-cover img').evaluateAll(nodes => nodes.flatMap(node => {
      const srcset = node.getAttribute('srcset') || '';
      return [...srcset.split(',').map(part => part.trim().split(/\s+/)[0]), node.getAttribute('src') || ''].filter(Boolean);
    }));
    const variants = new Set(candidates.map(url => new URL(url, page.url()).href));
    expect(requests.filter(url => variants.has(url))).toEqual([selected.url]);
    const response = responses.find(item => item.url() === selected.url);
    expect(response?.status()).toBe(200);
    expect((await response!.body()).byteLength).toBeGreaterThan(0);
    await blogCrumb.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new URL('/blog/', page.url()).href);
  });
}

for (const scale of [1.75, 2.625, 3]) {
  test.describe(`article cover crops at DPR ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test('selected image has enough pixels for its visible crop', async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium-desktop', 'Controlled DPR is checked once');
      test.setTimeout(120_000);
      for (const path of paths) for (const width of [360, 412, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect((await page.goto(path))?.status()).toBe(200);
        const result = await page.locator('.post-cover').evaluate(async root => {
          const img = root.querySelector('img')!;
          await img.decode();
          const sources = [...root.querySelectorAll('source')];
          const source = sources.find(node => (node.getAttribute('srcset') || '').split(',').some(part => {
            const url = part.trim().split(/\s+/)[0];
            return url && new URL(url, location.href).href === img.currentSrc;
          }));
          if (!source) throw new Error('Selected cover is absent from picture sources');
          const candidates = source.getAttribute('srcset')!.split(',').map(part => {
            const [url, width] = part.trim().split(/\s+/);
            return { url: new URL(url, location.href).href, width: Number.parseInt(width, 10) };
          });
          const box = img.getBoundingClientRect();
          return {
            selected: candidates.find(candidate => candidate.url === img.currentSrc)?.width,
            required: Math.max(box.width, box.height * img.naturalWidth / img.naturalHeight) * devicePixelRatio,
            largest: Math.max(...candidates.map(candidate => candidate.width)),
          };
        });
        expect(result.selected).toBeDefined();
        expect(result.selected!).toBeGreaterThanOrEqual(Math.floor(Math.min(result.required, result.largest)));
      }
    });
  });
}
