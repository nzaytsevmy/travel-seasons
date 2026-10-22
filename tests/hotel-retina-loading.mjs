import assert from 'node:assert/strict';

// Start each viewport as a real fresh visit. Only activate the next small group
// of lazy images after the previous group has passed the unchanged pixel check.
export async function inspectHotelViewport(page, path, width, inspect) {
  await page.setViewportSize({ width, height: 900 });
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
}
