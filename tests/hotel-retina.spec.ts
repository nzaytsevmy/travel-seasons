import sharp from 'sharp';
import { test, expect } from './browser-fixture';
import { readyHotelCollections, hotelGuideHubs } from '../src/data/hotels.js';

test.use({ deviceScaleFactor: 2 });
const widths = [402, 767, 768, 1024, 1280, 1440, 1920];

for (const [country] of readyHotelCollections()) {
  test(`фотографии отелей сохраняют детализацию 2×: ${country}`, async ({ page, request }) => {
    test.setTimeout(180_000);
    const dimensions = new Map<string, { width: number; height: number }>();
    const decodedImages = new Map<string, { width: number; height: number }>();
    for (const path of [`/hotels/${country}/`, ...hotelGuideHubs(country).map(hub => `/${hub.slug}/`)]) {
    await page.goto(path);
    const images = page.locator('.hotel-gallery img, .best-hotels img');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await images.evaluateAll(async nodes => {
        nodes.forEach(node => { (node as HTMLImageElement).loading = 'eager'; });
        // Resizing can replace a picture's selected source. Let that selection
        // reach a rendered frame before decoding the new responsive images.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      await expect.poll(async () => {
        const result = await images.evaluateAll(async (nodes, cachedDimensions) => {
          // Responsive elements can retain a rejected decode promise after a
          // source change. Decode the selected bytes independently, then verify
          // that the displayed element has finished loading that same source.
          const pending: string[] = [];
          // Decode each immutable, hashed URL once. Geometry and displayed-source
          // readiness are still checked at every width and on every poll.
          const decoded = new Map(cachedDimensions);
          for (const node of nodes) {
            const image = node as HTMLImageElement;
            const selected = image.currentSrc;
            try {
              let actual = decoded.get(selected);
              if (!actual) {
                const response = await fetch(selected);
                if (!response.ok) throw new Error(`Image HTTP ${response.status}`);
                const bitmap = await createImageBitmap(await response.blob());
                try {
                  if (bitmap.width <= 0 || bitmap.height <= 0) throw new Error('Empty image bitmap');
                  actual = { width: bitmap.width, height: bitmap.height };
                  decoded.set(selected, actual);
                } finally {
                  bitmap.close();
                }
              }
              // WebKit can keep the previously loaded source briefly after a
              // resize. Completion alone does not mean the new selection is ready.
              const frame = image.getBoundingClientRect();
              if (actual.width + 1 < Math.ceil(frame.width * 2) || actual.height + 1 < Math.ceil(frame.height * 2))
                throw new Error('Responsive source does not yet cover the new frame at 2×');
            } catch (error) {
              pending.push(`${image.currentSrc || image.src}: ${String(error)}`);
              continue;
            }
            if (!image.complete || image.naturalWidth <= 0 || selected !== image.currentSrc)
              pending.push(`${image.currentSrc || image.src}: responsive source still changing`);
          }
          return { pending, decoded: [...decoded] };
        }, [...decodedImages]);
        for (const [url, pixels] of result.decoded) decodedImages.set(url, pixels);
        return result.pending;
      }, { timeout: 15_000, message: `${country} ${width}px: selected images must finish decoding` }).toEqual([]);
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
