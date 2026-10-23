import sharp from 'sharp';
import { inspectHotelViewport } from '../scripts/hotel-retina-loading.mjs';
import { test, expect } from './browser-fixture';
import { readyHotelCollections, hotelGuideHubs } from '../src/data/hotels.js';

test.use({ deviceScaleFactor: 2 });
const widths = [402, 767, 768, 1024, 1280, 1440, 1920];

for (const [country] of readyHotelCollections()) {
  test(`фотографии отелей сохраняют детализацию 2×: ${country}`, async ({ context, request }) => {
    test.setTimeout(180_000);
    const dimensions = new Map<string, { width: number; height: number }>();
    const decodedImages = new Map<string, { width: number; height: number }>();
    for (const path of [`/hotels/${country}/`, ...hotelGuideHubs(country).map(hub => `/${hub.slug}/`)]) {
    for (const width of widths) {
      // A new context must perform its own decode, even for a previously seen URL.
      decodedImages.clear();
      await inspectHotelViewport(context.browser(), path, width, async images => {
      await images.evaluateAll(async nodes => {
        nodes.forEach(node => { (node as HTMLImageElement).loading = 'eager'; });
        // Let the freshly selected source reach a rendered frame before decoding.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      await expect.poll(async () => {
        const result = await images.evaluateAll(async (nodes, cachedDimensions) => {
          // Decode one immutable URL on a fresh, single-source image. It cannot
          // inherit a responsive element's stale decode promise after resizing.
          // The independent HTTP/Sharp check below still verifies encoded pixels.
          const pending: string[] = [];
          // Decode each immutable, hashed URL once. Geometry and displayed-source
          // readiness are still checked at every width and on every poll.
          const decoded = new Map(cachedDimensions);
          for (let offset = 0; offset < nodes.length; offset += 4) {
          await Promise.all(nodes.slice(offset, offset + 4).map(async node => {
            const image = node as HTMLImageElement;
            const selected = image.currentSrc;
            // A responsive request can still be replaced after resizing. Wait
            // for the displayed image before probing the same URL: otherwise
            // its in-flight request and the probe race in the image loader.
            if (!selected || !image.complete || image.naturalWidth <= 0) {
              pending.push(`${selected || image.src}: displayed source is not ready`);
              return;
            }
            try {
              let actual = decoded.get(selected);
              if (!actual) {
                const probe = new Image();
                probe.src = selected;
                await probe.decode();
                if (probe.naturalWidth <= 0 || probe.naturalHeight <= 0) throw new Error('Empty decoded image');
                actual = { width: probe.naturalWidth, height: probe.naturalHeight };
                decoded.set(selected, actual);
              }
              // WebKit can keep the previously loaded source briefly after a
              // resize. Completion alone does not mean the new selection is ready.
              const frame = image.getBoundingClientRect();
              if (actual.width + 1 < Math.ceil(frame.width * 2) || actual.height + 1 < Math.ceil(frame.height * 2))
                throw new Error('Responsive source does not yet cover the new frame at 2×');
            } catch (error) {
              pending.push(`${image.currentSrc || image.src}: ${String(error)}`);
              return;
            }
            if (!image.complete || image.naturalWidth <= 0 || selected !== image.currentSrc)
              pending.push(`${image.currentSrc || image.src}: responsive source still changing`);
          }));
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
      const missingUrls = [...new Set(rows.map(row => row.url))].filter(url => !dimensions.has(url));
      for (let offset = 0; offset < missingUrls.length; offset += 4) {
        await Promise.all(missingUrls.slice(offset, offset + 4).map(async url => {
          // One retry for ECONNRESET only; HTTP and pixel failures still fail.
          const response = await request.get(url, { maxRetries: 1 });
          expect(response.status()).toBe(200);
          const metadata = await sharp(await response.body()).metadata();
          dimensions.set(url, { width: metadata.width!, height: metadata.height! });
        }));
      }
      for (const row of rows) {
        const actual = dimensions.get(row.url)!;
        // naturalWidth is density-corrected by the browser and cannot prove file resolution.
        expect(actual.width + 1, `${country} ${width}px ${row.alt}: horizontal 2× pixels`).toBeGreaterThanOrEqual(Math.ceil(row.width * 2));
        expect(actual.height + 1, `${country} ${width}px ${row.alt}: vertical 2× pixels`).toBeGreaterThanOrEqual(Math.ceil(row.height * 2));
      }
      });
    }
    }
  });
}
