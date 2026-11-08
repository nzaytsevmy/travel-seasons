import { test, expect } from './browser-fixture';

for (const path of ['/blog/', '/blog/hram-uluvatu-bali/', '/novosti/2026-05-01-torres-del-paine-tariff/']) {
  test(`editorial type remains readable at 200% ${path}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 402, height: 900 });
    expect((await page.goto(path, { waitUntil: 'networkidle' }))?.status()).toBe(200);
    const result = await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%';
      const sample = 'ЯёБали Aé ₽≈7';
      const families = ['Golos Text Variable', 'Old Standard TT', 'PT Mono'];
      await Promise.all(families.map(family => document.fonts.load(`32px "${family}"`, sample)));
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 70;
      const ctx = canvas.getContext('2d')!;
      const missing: string[] = [];
      for (const family of families) {
        ctx.font = `32px "${family}", sans-serif`;
        const draw = (character: string) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillText(character, 8, 45);
          return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data).join(',');
        };
        const absent = draw('\u{10FFFF}');
        for (const character of ['Я', 'ё', 'A', 'é', '₽', '≈', '7']) {
          if (draw(character) === absent) missing.push(`${family}: ${character}`);
        }
      }
      return { missing, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(result.missing).toEqual([]);
    expect(result.overflow).toBeLessThanOrEqual(1);
    await info.attach('type-200-percent', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
  });
}
