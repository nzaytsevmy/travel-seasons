import { test, expect } from './browser-fixture';
import sharp from 'sharp';

test('Uluwatu photographs paint in WebKit after decoding', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('webkit'), 'Pixel evidence is needed from both WebKit projects');
  test.setTimeout(120_000);
  const widths = info.project.name === 'webkit-mobile' ? [402] : [402, 1280];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto('/blog/hram-uluvatu-bali/'))?.status()).toBe(200);
    const photos = page.locator('.post-cover img, p img[alt="Ворота храма Улувату со скульптурами на фоне океана"], .post-gallery figure img');
    await expect(photos).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const photo = photos.nth(i);
      await photo.scrollIntoViewIfNeeded();
      const source = await photo.evaluate(async (img: HTMLImageElement) => {
        await img.decode();
        if (!img.naturalWidth || !img.naturalHeight) throw new Error('The image has no decoded pixels');
        return img.currentSrc;
      });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await photo.evaluate((img: HTMLImageElement) => img.currentSrc)).toBe(source);
      const pixels = await photo.screenshot({ animations: 'disabled' });
      const stats = await sharp(pixels).stats();
      expect(Math.max(...stats.channels.slice(0, 3).map(channel => channel.stdev))).toBeGreaterThan(5);
      await info.attach(`uluwatu-photo-${i + 1}-${width}`, { body: pixels, contentType: 'image/png' });
    }
  }
});
