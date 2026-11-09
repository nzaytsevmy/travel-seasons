import { test, expect, type Response } from './browser-fixture';

const paths = ['/blog/novyy-god-tailand-2027/', '/blog/novyy-god-vietnam-2027/', '/blog/chile-guide-2026/'];

for (const path of paths) {
  test(`article cover uses one matching preload ${path}`, async ({ page }) => {
    const requests: string[] = [];
    const responses: Response[] = [];
    page.on('request', request => requests.push(request.url()));
    page.on('response', response => responses.push(response));
    await page.setViewportSize({ width: 402, height: 900 });
    expect((await page.goto(path, { waitUntil: 'networkidle' }))?.status()).toBe(200);
    const preload = page.locator('link[rel="preload"][as="image"][imagesrcset]');
    const source = page.locator('.post-cover source[type="image/webp"]');
    const image = page.locator('.post-cover img');
    await expect(preload).toHaveCount(1);
    await expect(source).toHaveCount(1);
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
          const source = root.querySelector('source[type="image/webp"]')!;
          await img.decode();
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
