import { test, expect } from './browser-fixture';

test('a long article tag remains visible at 200% text size', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 900 });
  expect((await page.goto('/blog/wadi-rum-iz-akaby/', { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = '200%';
    await document.fonts.ready;
  });
  const tag = page.locator('.post-tags .ptag').filter({ hasText: 'Достопримечательности' });
  await expect(tag).toHaveCount(1);
  await expect(tag).toBeVisible();
  const fits = await tag.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const tagBox = node.getBoundingClientRect();
    const parentBox = node.parentElement!.getBoundingClientRect();
    const left = Math.max(0, tagBox.left, parentBox.left) - 2;
    const right = Math.min(document.documentElement.clientWidth, tagBox.right, parentBox.right) + 2;
    const rects = [...range.getClientRects()];
    return rects.length > 0 && rects.every(rect => rect.left >= left && rect.right <= right);
  });
  expect(fits).toBe(true);
});
