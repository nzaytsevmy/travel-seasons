import { test, expect } from './browser-fixture';

const articles = [
  'sossusvlei-deadvlei-namibia', 'zion-bryce-horseshoe-bend-usa',
  'norway-trolltunga-lofoten', 'iceland-five-places', 'sao-paulo-two-three-days',
];
const expectedGalleries = [2, 2, 2, 4, 2];

for (const slug of articles) {
  for (const width of [402, 1280]) {
    test(`авторские фотографии: ${slug} на ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto(`/blog/${slug}/`))?.status()).toBe(200);
      const galleries = page.locator('.post-gallery');
      await expect(galleries).toHaveCount(expectedGalleries[articles.indexOf(slug)]);
      const ids = await galleries.locator('[role="region"]').evaluateAll(nodes => nodes.map(node => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const container of await galleries.all()) {
        const gallery = container.locator('[role="region"]');
        await gallery.scrollIntoViewIfNeeded();
        const images = gallery.locator('img');
        const count = await images.count();
        expect(count).toBeGreaterThanOrEqual(3);
        const sources = await images.evaluateAll(nodes => nodes.map(node => (node as HTMLImageElement).src));
        expect(new Set(sources).size).toBe(count);
        await images.evaluateAll(nodes => nodes.forEach(node => (node as HTMLImageElement).loading = 'eager'));
        await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => {
          const image = node as HTMLImageElement;
          return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && image.alt.length >= 15;
        })), { timeout: 30_000 }).toBe(true);
        const previous = container.locator('[data-photo-prev]');
        const next = container.locator('[data-photo-next]');
        await expect(previous).toBeDisabled();
        await expect(next).toBeVisible();
        for (let index = 1; index < count; index++) {
          await next.click();
          await expect.poll(() => gallery.evaluate(node => {
            const figures = [...node.querySelectorAll('figure')];
            return figures.reduce((best, figure, i) => Math.abs(figure.offsetLeft - figures[0].offsetLeft - node.scrollLeft) < Math.abs(figures[best].offsetLeft - figures[0].offsetLeft - node.scrollLeft) ? i : best, 0);
          })).toBe(index);
        }
        await expect(next).toBeDisabled();
        await expect(previous).toBeEnabled();
        await previous.focus();
        await page.keyboard.press('Enter');
        await expect(next).toBeEnabled();
        await next.focus();
        await page.keyboard.press('Space');
        await expect(next).toBeDisabled();
        await gallery.focus();
        const end = await gallery.evaluate(node => node.scrollLeft);
        await page.keyboard.press('ArrowLeft');
        await expect.poll(() => gallery.evaluate(node => node.scrollLeft)).toBeLessThan(end);
        await expect(gallery).toBeFocused();
        expect(await gallery.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
        const before = await gallery.evaluate(node => node.scrollLeft);
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => gallery.evaluate(node => node.scrollLeft)).toBeGreaterThan(before);
        expect(await images.first().evaluate(node => {
          const style = getComputedStyle(node);
          return [style.marginTop, style.marginBottom];
        })).toEqual(['0px', '0px']);
        const box = await previous.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await expect(gallery.locator('figcaption').first()).toContainText(`1 / ${count}`);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}
