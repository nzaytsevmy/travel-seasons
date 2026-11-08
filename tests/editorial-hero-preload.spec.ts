import { test, expect, type Page, type Response } from './browser-fixture';

const pages = [
  { path: '/novosti/2026-05-01-torres-del-paine-tariff/', image: '.nvp-fig img', source: '.nvp-fig img', candidates: '.nvp-fig img' },
  { path: '/blog/hram-uluvatu-bali/', image: '.post-cover img', source: '.post-cover source[type="image/webp"]', candidates: '.post-cover source, .post-cover img' },
  { path: '/bali/', image: '.om-hero img', source: '.om-hero img', candidates: '.om-hero img' },
];

async function measureCrop(page: Page, selector: string, capped: boolean) {
  return page.locator(selector).evaluate(async (root, cap) => {
    const img = root.querySelector('img')!;
    const source = root.querySelector('source[type="image/webp"]') || img;
    await img.decode();
    const candidates = source.getAttribute('srcset')!.split(',').map(part => {
      const [url, width] = part.trim().split(/\s+/);
      return { url: new URL(url, location.href).href, width: parseInt(width, 10) };
    });
    const selected = candidates.find(candidate => candidate.url === img.currentSrc);
    const box = img.getBoundingClientRect();
    const effectiveDpr = cap && devicePixelRatio >= 2.9 ? devicePixelRatio * 0.67
      : cap && devicePixelRatio >= 2.3 ? devicePixelRatio * 0.76 : devicePixelRatio;
    const cropWidth = Math.max(box.width, box.height * img.naturalWidth / img.naturalHeight);
    return { selected: selected?.width, required: cropWidth * effectiveDpr,
      largest: Math.max(...candidates.map(candidate => candidate.width)) };
  }, capped);
}

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

for (const scale of [1.75, 2.625, 3]) {
  test.describe(`cover crops at DPR ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test('selects enough pixels for each visible crop', async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium-desktop', 'Controlled DPR is checked once');
      test.setTimeout(120_000);
      const entries = [
        { path: '/blog/hram-uluvatu-bali/', root: '.post-cover', capped: false },
        { path: '/novosti/2026-08-20-akagera-big-five/', root: '.nvp-fig', capped: false },
        { path: '/bali/', root: '.om-hero', capped: true },
      ];
      for (const entry of entries) for (const width of [360, 390, 412, 444, 740, 768]) {
        await page.setViewportSize({ width, height: 900 });
        expect((await page.goto(entry.path))?.status()).toBe(200);
        const size = await measureCrop(page, entry.root, entry.capped);
        expect(size.selected).toBeDefined();
        expect(size.selected!).toBeGreaterThanOrEqual(Math.floor(Math.min(size.required, size.largest)));
        if (entry.path === '/bali/' && width === 412 && scale === 1.75) expect(size.selected).toBe(700);
      }
    });
  });
}

test.describe('Bali crop at the Safari width boundary', () => {
  test.use({ deviceScaleFactor: 3 });
  test('preserves the requested crop around 392px', async ({ page }, info) => {
    test.skip(info.project.name !== 'webkit-mobile', 'Controlled WebKit DPR is checked once');
    for (const width of [360, 390, 392, 393, 412]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto('/bali/'))?.status()).toBe(200);
      const size = await measureCrop(page, '.om-hero', true);
      expect(size.selected).toBeDefined();
      expect(size.selected!).toBeGreaterThanOrEqual(Math.floor(Math.min(size.required, size.largest)));
      expect(size.selected).toBe(828);
    }
  });
});

test.describe('Bali crop at Safari DPR 1.75', () => {
  test.use({ deviceScaleFactor: 1.75 });
  test('chooses the 700px source at 412px', async ({ page }, info) => {
    test.skip(info.project.name !== 'webkit-mobile', 'Controlled WebKit DPR is checked once');
    await page.setViewportSize({ width: 412, height: 900 });
    expect((await page.goto('/bali/'))?.status()).toBe(200);
    const size = await measureCrop(page, '.om-hero', true);
    expect(size.selected).toBe(700);
    expect(size.selected!).toBeGreaterThanOrEqual(Math.floor(Math.min(size.required, size.largest)));
  });
});
