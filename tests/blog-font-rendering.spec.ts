import { test, expect } from './browser-fixture';
import sharp from 'sharp';

for (const path of ['/blog/', '/blog/novyy-god-tailand-2027/', '/blog/novyy-god-vietnam-2027/', '/blog/chile-guide-2026/']) {
  test(`blog typography renders Cyrillic and symbols at 200% ${path}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 402, height: 900 });
    expect((await page.goto(path, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
    const missing = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      const faces = [
        ['Golos Text Variable', 'normal', '400'],
        ['Old Standard TT', 'normal', '400'],
        ['Old Standard TT', 'normal', '700'],
        ['Old Standard TT', 'italic', '400'],
        ['PT Mono', 'normal', '400'],
      ];
      const sample = 'ЯёБали Aé ₽≈7';
      const loaded = await Promise.all(faces.map(([family, style, weight]) => document.fonts.load(`${style} ${weight} 32px "${family}"`, sample)));
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 70;
      const ctx = canvas.getContext('2d')!;
      const absent: string[] = [];
      for (const [index, [family, style, weight]] of faces.entries()) {
        if (!loaded[index].length || loaded[index].some(face => face.status !== 'loaded')) {
          absent.push(`${family} ${style} ${weight}: font not loaded`);
        }
        ctx.font = `${style} ${weight} 32px "${family}", sans-serif`;
        const actualWidth = ctx.measureText(sample).width;
        ctx.font = `${style} ${weight} 32px sans-serif`;
        if (Math.abs(actualWidth - ctx.measureText(sample).width) < 0.01) {
          absent.push(`${family} ${style} ${weight}: fallback metrics`);
        }
        ctx.font = `${style} ${weight} 32px "${family}", sans-serif`;
        const draw = (character: string) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillText(character, 8, 45);
          return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data).join(',');
        };
        const missingGlyph = draw('\u{10FFFF}');
        for (const character of ['Я', 'ё', 'A', 'é', '₽', '≈', '7']) {
          if (draw(character) === missingGlyph) absent.push(`${family} ${style} ${weight}: ${character}`);
        }
      }
      return absent;
    });
    expect(missing).toEqual([]);
    await info.attach('blog-type-200-percent', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    if (['chromium-desktop', 'webkit-desktop', 'webkit-mobile'].includes(info.project.name)) {
      const widths = info.project.name === 'webkit-mobile' ? [402] : [402, 1280];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        const image = page.locator(path === '/blog/' ? '.featured-img img' : '.post-cover img').first();
        await expect(image).toBeVisible();
        await page.evaluate(async () => {
          document.documentElement.style.fontSize = '';
          await document.fonts.ready;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        const decodedSource = await image.evaluate(async (img: HTMLImageElement) => {
          await img.decode();
          if (!img.naturalWidth || !img.naturalHeight) throw new Error('Cover image is empty');
          return img.currentSrc;
        });
        await page.evaluate(async () => {
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        expect(await image.evaluate((img: HTMLImageElement) => img.currentSrc)).toBe(decodedSource);
        await page.evaluate(() => window.scrollTo(0, 0));
        await info.attach(`first-screen-${width}`, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await image.scrollIntoViewIfNeeded();
        await info.attach(`cover-${width}`, { body: await image.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await info.attach(`cover-context-${width}`, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        // The featured image has a decorative gradient; hide it only for the
        // pixel check so a blank image cannot pass because of the gradient.
        const overlay = path === '/blog/' ? page.locator('.featured-overlay') : null;
        const priorStyle = overlay ? await overlay.getAttribute('style') : null;
        try {
          if (overlay) await overlay.evaluate((node: HTMLElement) => { node.style.visibility = 'hidden'; });
          await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
          const hitTest = await image.evaluate((img: HTMLImageElement) => {
            const box = img.getBoundingClientRect();
            const points = [0.2, 0.5, 0.8].flatMap(x => [0.2, 0.5, 0.8].map(y => [box.left + box.width * x, box.top + box.height * y]));
            const visible = points.filter(([x, y]) => x >= 0 && x < innerWidth && y >= 0 && y < innerHeight);
            return { checked: visible.length, covered: visible.filter(([x, y]) => document.elementFromPoint(x, y) !== img).length };
          });
          expect(hitTest.checked).toBe(9);
          expect(hitTest.covered).toBe(0);
          const pixels = await image.screenshot({ animations: 'disabled' });
          const stats = await sharp(pixels).stats();
          expect(Math.max(...stats.channels.slice(0, 3).map(channel => channel.stdev))).toBeGreaterThan(5);
        } finally {
          if (overlay) await overlay.evaluate((node: HTMLElement, style) => {
            if (style === null) node.removeAttribute('style'); else node.setAttribute('style', style);
          }, priorStyle);
        }
      }
    }
  });
}
