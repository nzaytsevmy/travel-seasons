import { test, expect, type Response } from './browser-fixture';

const pages = [
  { path: '/novosti/2026-05-01-torres-del-paine-tariff/', image: '.nvp-fig img', source: '.nvp-fig img', candidates: '.nvp-fig img' },
  { path: '/blog/hram-uluvatu-bali/', image: '.post-cover img', source: '.post-cover source[type="image/webp"]', candidates: '.post-cover source, .post-cover img' },
];

for (const entry of pages) {
  test(`responsive cover is fetched once ${entry.path}`, async ({ page }) => {
    const requests: string[] = [];
    const responses: Response[] = [];
    page.on('request', request => requests.push(request.url()));
    page.on('response', response => responses.push(response));
    await page.setViewportSize({ width: 402, height: 900 });
    expect((await page.goto(entry.path, { waitUntil: 'networkidle' }))?.status()).toBe(200);

    const preload = page.locator('link[rel="preload"][as="image"][imagesrcset]');
    const source = page.locator(entry.source);
    const image = page.locator(entry.image);
    await expect(preload).toHaveCount(1);
    await expect(source).toHaveCount(1);
    await expect(image).toBeVisible();
    const attrs = await image.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      return { currentSrc: img.currentSrc, width: img.naturalWidth };
    });
    expect(attrs.width).toBeGreaterThan(0);
    const srcset = await source.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    expect(await preload.getAttribute('imagesrcset')).toBe(srcset);
    expect(await preload.getAttribute('imagesizes')).toBe(await source.getAttribute('sizes'));

    const selectedVariants = new Set(srcset!.split(',').map(part => new URL(part.trim().split(/\s+/)[0], page.url()).href));
    expect(selectedVariants.has(attrs.currentSrc)).toBe(true);
    const rawCandidates = await page.locator(entry.candidates).evaluateAll(nodes => nodes.flatMap(node => {
      const srcset = node.getAttribute('srcset') || '';
      return [...srcset.split(',').map(part => part.trim().split(/\s+/)[0]), node.getAttribute('src') || ''].filter(Boolean);
    }));
    const variants = new Set(rawCandidates.map(url => new URL(url, page.url()).href));
    expect(requests.filter(url => variants.has(url))).toEqual([attrs.currentSrc]);
    const response = responses.find(item => item.url() === attrs.currentSrc);
    expect(response?.status()).toBe(200);
    expect((await response!.body()).byteLength).toBeGreaterThan(0);
  });
}

test.describe('article cover at the mobile width boundary', () => {
  test.use({ deviceScaleFactor: 1.75 });
  test('selects enough physical pixels around mobile breakpoints', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'Controlled DPR is checked once');
    for (const width of [444, 740, 768]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto('/blog/hram-uluvatu-bali/'))?.status()).toBe(200);
      const size = await page.locator('.post-cover').evaluate(async (cover) => {
        const img = cover.querySelector('img')!;
        const source = cover.querySelector('source[type="image/webp"]')!;
        await img.decode();
        const selected = source.getAttribute('srcset')!.split(',').map(part => {
          const [url, width] = part.trim().split(/\s+/);
          return { url: new URL(url, location.href).href, width: parseInt(width, 10) };
        }).find(candidate => candidate.url === img.currentSrc);
        return { selected: selected?.width, required: img.getBoundingClientRect().width * devicePixelRatio };
      });
      expect(size.selected).toBeDefined();
      expect(size.selected!).toBeGreaterThanOrEqual(Math.ceil(size.required));
    }
  });
});
