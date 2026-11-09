import { test, expect } from './browser-fixture';

test('distant blog cards remain readable, searchable and stable while scrolling', async ({ page }, info) => {
  test.setTimeout(120_000);
  expect((await page.goto('/blog/'))?.status()).toBe(200);
  const cards = page.locator('.posts-grid > a.post-card:not(.promo-card)');
  expect(await cards.count()).toBeGreaterThan(80);
  const target = cards.nth(70);
  const href = await target.getAttribute('href');
  const title = (await target.locator('.post-title').textContent())!.trim();
  expect(title.length).toBeGreaterThan(5);

  for (const width of [402, 768, 1280]) for (const scale of [1, 2]) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto('/blog/'))?.status()).toBe(200);
    await page.evaluate((value) => { document.documentElement.style.fontSize = `${100 * value}%`; }, scale);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const state = window as typeof window & { __blogShifts?: number[]; __blogShiftObserver?: PerformanceObserver; __blogShiftSupported?: boolean };
      state.__blogShifts = [];
      state.__blogShiftSupported = typeof PerformanceObserver !== 'undefined' && Boolean(PerformanceObserver.supportedEntryTypes?.includes('layout-shift'));
      if (state.__blogShiftSupported) {
        state.__blogShiftObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) state.__blogShifts!.push((entry as PerformanceEntry & { value: number }).value);
        });
        state.__blogShiftObserver.observe({ type: 'layout-shift', buffered: false });
      }
    });
    const heights: { beforeScroll: number; afterScroll: number; settled: number }[] = [];
    for (const index of [5, 15, 30, 50, 70]) {
      const anchor = cards.nth(index);
      const beforeScroll = await page.evaluate(() => document.documentElement.scrollHeight);
      await anchor.scrollIntoViewIfNeeded();
      const before = await anchor.boundingBox();
      const afterScroll = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const after = await anchor.boundingBox();
      const settled = await page.evaluate(() => document.documentElement.scrollHeight);
      heights.push({ beforeScroll, afterScroll, settled });
      expect(before && after).toBeTruthy();
      expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(afterScroll - settled)).toBeLessThanOrEqual(2);
    }
    await expect(target.locator('.post-title')).toBeVisible();
    await target.focus();
    await expect(target).toBeFocused();
    await expect(target).toHaveAccessibleName(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')));
    const before = await target.boundingBox();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const after = await target.boundingBox();
    expect(before && after).toBeTruthy();
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(2);
    const shiftEvidence = await page.evaluate(() => {
      const state = window as typeof window & { __blogShifts?: number[]; __blogShiftObserver?: PerformanceObserver; __blogShiftSupported?: boolean };
      for (const entry of state.__blogShiftObserver?.takeRecords() ?? []) {
        state.__blogShifts!.push((entry as PerformanceEntry & { value: number }).value);
      }
      state.__blogShiftObserver?.disconnect();
      return { supported: state.__blogShiftSupported ?? false, values: state.__blogShifts ?? [] };
    });
    await info.attach(`scroll-evidence-${width}-${scale}`, { body: Buffer.from(JSON.stringify({ heights, shifts: shiftEvidence })), contentType: 'application/json' });
    if (info.project.name.startsWith('chromium')) expect(shiftEvidence.supported).toBe(true);
    if (shiftEvidence.supported) expect(shiftEvidence.values.reduce((sum, value) => sum + value, 0)).toBeLessThan(0.1);
    if (width === 402 && scale === 2) {
      await info.attach('far-card-402-200-percent', { body: await target.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('.featured-title')).toBeVisible();
  }

  // Check the DOM search API. Safari's native Find uses a different path and
  // remains a separate manual live check.
  expect(await page.evaluate((needle) => window.find(needle), title)).toBe(true);
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL(href!, page.url()).href);
});
