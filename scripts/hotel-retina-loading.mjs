import assert from 'node:assert/strict';

// Each viewport is a fresh visit in a disposable context. Rapid repeated full
// navigations in one WebKit page left pending image loads and navigation errors.
// Playwright Test applies the project's device, headers, baseURL and test.use()
// options to explicit newContext() calls. Match setViewportSize() by overriding
// the viewport and screen together; retain all other device and test options.
export async function inspectHotelViewport(browser, path, width, inspect) {
  assert(browser, 'Hotel viewport needs its test browser');
  const context = await browser.newContext({ viewport: { width, height: 900 }, screen: { width, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(path);
    const images = page.locator('.hotel-gallery img, .best-hotels img');
    const count = await images.count();
    assert(count > 0, `No hotel photographs at ${path}`);
    for (let offset = 0; offset < count; offset += 4) {
      const results = await Promise.allSettled(
        Array.from({ length: Math.min(4, count - offset) }, (_, index) => inspect(images.nth(offset + index))),
      );
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
    }
  } finally {
    await context.close();
  }
}
