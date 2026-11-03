import { test, expect } from './browser-fixture';

const profiles = [
  { path: '/', selectors: ['.me-ph', '.author-end img'] },
  { path: '/about/', selectors: ['.author-photo'] },
  { path: '/oman/', selectors: ['.om-byline img', '.om-foot img'] },
  { path: '/turkey/', selectors: ['.om-byline img', '.om-foot img'] },
  { path: '/blog/fort-nizva/', selectors: ['.author-mini', '.bio-avatar-img'] },
];

for (const profile of profiles) {
  for (const width of [402, 1280]) {
    test(`author portrait preserves proportions ${profile.path} @${width}`, async ({ page }) => {
      await page.route(/mc\.yandex\.ru|analytics\.ahrefs\.com|googletagmanager|google-analytics/, route => route.abort());
      await page.setViewportSize({ width, height: 900 });
      await page.goto(profile.path, { waitUntil: 'domcontentloaded' });
      for (const selector of profile.selectors) {
        const image = page.locator(selector);
        await image.scrollIntoViewIfNeeded();
        // Lazy images can still have no currentSrc immediately after scrolling.
        // Wait for the native request before requiring a successful decode.
        await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
          !!element.currentSrc && element.complete && element.naturalWidth > 0,
        ), { message: `${profile.path} ${selector} finishes loading` }).toBe(true);
        await image.evaluate(async (element: HTMLImageElement) => {
          await element.decode();
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        const rendered = await image.evaluate((element: HTMLImageElement) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const naturalRatio = element.naturalWidth / element.naturalHeight;
          const boxRatio = rect.width / rect.height;
          return {
            src: element.currentSrc,
            natural: { width: element.naturalWidth, height: element.naturalHeight },
            box: { width: rect.width, height: rect.height },
            fit: style.objectFit,
            loaded: element.complete && element.naturalWidth > 0 && rect.width > 0 && rect.height > 0,
            hasNonUniformStretch: style.objectFit === 'fill' && Math.abs(boxRatio / naturalRatio - 1) > 0.01,
            accessibleName: element.alt,
          };
        });
        expect(rendered.loaded, `${profile.path} ${selector} is decoded and visible`).toBe(true);
        expect(rendered.hasNonUniformStretch, `${profile.path} ${selector} must crop or preserve its source ratio`).toBe(false);
        expect(rendered.accessibleName).toContain('Никита Зайцев');
        const label = `portrait-${profile.path.replace(/\//g, '_')}-${selector.replace(/[^a-z0-9]/gi, '-')}-${width}`;
        await test.info().attach(`${label}.json`, { body: Buffer.from(JSON.stringify(rendered)), contentType: 'application/json' });
        await test.info().attach(`${label}.png`, { body: await page.screenshot({ fullPage: false, animations: 'disabled' }), contentType: 'image/png' });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}
