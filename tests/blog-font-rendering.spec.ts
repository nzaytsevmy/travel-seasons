import { test, expect } from './browser-fixture';

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
  });
}
