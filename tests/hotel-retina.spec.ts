import sharp from 'sharp';
import { test, expect } from './browser-fixture';
import { readyHotelCollections, hotelGuideHubs } from '../src/data/hotels.js';

test.use({ deviceScaleFactor: 2 });
const widths = [402, 767, 768, 1024, 1280, 1440, 1920];

for (const [country] of readyHotelCollections()) {
  test(`фотографии отелей сохраняют детализацию 2×: ${country}`, async ({ page, request }) => {
    test.setTimeout(180_000);
    const dimensions = new Map<string, { width: number; height: number }>();
    for (const path of [`/hotels/${country}/`, ...hotelGuideHubs(country).map(hub => `/${hub.slug}/`)]) {
    await page.goto(path);
    const images = page.locator('.hotel-gallery img, .best-hotels img');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await images.evaluateAll(nodes => nodes.forEach(node => { (node as HTMLImageElement).loading = 'eager'; }));
      await images.evaluateAll(nodes => Promise.all(nodes.map(node => (node as HTMLImageElement).decode())));
      const rows = await images.evaluateAll(nodes => nodes.map(node => {
        const image = node as HTMLImageElement;
        const frame = image.getBoundingClientRect();
        return { url: image.currentSrc, width: frame.width, height: frame.height, alt: image.alt };
      }));
      for (const row of rows) {
        if (!dimensions.has(row.url)) {
          const response = await request.get(row.url);
          expect(response.status()).toBe(200);
          const metadata = await sharp(await response.body()).metadata();
          dimensions.set(row.url, { width: metadata.width!, height: metadata.height! });
        }
        const actual = dimensions.get(row.url)!;
        // naturalWidth is density-corrected by the browser and cannot prove file resolution.
        expect(actual.width + 1, `${country} ${width}px ${row.alt}: horizontal 2× pixels`).toBeGreaterThanOrEqual(Math.ceil(row.width * 2));
        expect(actual.height + 1, `${country} ${width}px ${row.alt}: vertical 2× pixels`).toBeGreaterThanOrEqual(Math.ceil(row.height * 2));
      }
    }
    }
  });
}
