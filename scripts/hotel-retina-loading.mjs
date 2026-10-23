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
      // The inspector already bounds actual decodes/HTTP probes to four images.
      // One locator group avoids four separate browser RPC/snapshot sequences
      // for the same bounded batch, while retaining every real image assertion.
      let group = images.nth(offset);
      for (let index = 1; index < Math.min(4, count - offset); index++) group = group.or(images.nth(offset + index));
      await inspect(group);
    }
  } finally {
    await context.close();
  }
}
