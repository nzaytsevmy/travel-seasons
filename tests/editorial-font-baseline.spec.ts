import { test, expect } from './browser-fixture';

for (const route of ['/blog/', '/blog/bali-guide-2026/', '/novosti/2026-05-01-torres-del-paine-tariff/']) {
  test(`compare live and candidate heading ${route}`, async ({ page, request }, info) => {
    test.skip(process.env.TT_COMPARE_LIVE_FONTS !== '1', 'Only for the temporary diagnostic run');
    await page.setViewportSize({ width: 402, height: 900 });
    const identity = async () => (await request.get(`https://traveltribe.ru/build-version.json?fontqa=${Date.now()}`)).json();
    const before = await identity();
    expect(before.commit).toBe('67864f186c62154371edf977d27942204cfb5b2b');
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['traveltribe.ru', 'localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    const platform: object[] = [];
    for (const [label, url] of [['live', `https://traveltribe.ru${route}`], ['candidate', route]]) {
      expect((await page.goto(url, { waitUntil: 'networkidle' }))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      const heading = page.locator('main h1').first();
      await expect(heading).toBeVisible();
      for (const size of [100, 200]) {
        await page.evaluate(value => { document.documentElement.style.fontSize = `${value}%`; }, size);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        if (info.project.name === 'chromium-desktop') {
          const cdp = await page.context().newCDPSession(page);
          await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
          const doc = await cdp.send('DOM.getDocument');
          const extras = route === '/blog/' ? ['main h1 em', '.blog-lead', '.tf-label']
            : route.startsWith('/blog/') ? ['.prose p:not(:has(img))', '.post-meta-top time'] : ['.nv-tldr', '.nvp-meta time'];
          for (const selector of ['main h1', ...extras]) {
            await page.locator(selector).first().scrollIntoViewIfNeeded();
            const node = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector });
            expect(node.nodeId, selector).toBeGreaterThan(0);
            const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
            expect(fonts.fonts.some(font => font.glyphCount > 0), selector).toBe(true);
            platform.push({ label, size, selector, fonts: fonts.fonts });
          }
          await cdp.detach();
        }
        await info.attach(`${label}-heading-${size}`, { body: await heading.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
      }
    }
    await info.attach('platform-fonts', { body: Buffer.from(JSON.stringify(platform)), contentType: 'application/json' });
    expect(await identity()).toEqual(before);
  });
}
