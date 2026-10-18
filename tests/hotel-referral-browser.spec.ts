import { test, expect } from './browser-fixture';
import { readyHotelCollections } from '../src/data/hotels.js';

for (const [country, collection] of readyHotelCollections()) {
  test(`каждый отель сохраняет цель и уникальный click_id: ${country}`, async ({ page, context }) => {
    test.setTimeout(180_000);
    await context.route('https://ostrovok.tpk.mx/**', route => route.fulfill({ status: 200, body: 'Hotel QA' }));
    await page.goto(`/hotels/${country}/`);
    for (const hotel of collection.hotels) {
      const booking = page.locator(`.hotel-entry[id="${hotel.id}"] .hotel-entry-book`);
      const clickIds = new Set<string>();
      for (const button of ['left', 'middle', 'left'] as const) {
        const pending = page.waitForEvent('popup');
        await booking.click({ button });
        const popup = await pending;
        try {
          await expect.poll(() => popup.url()).toContain('ostrovok.tpk.mx');
          const url = new URL(popup.url());
          expect(url.searchParams.get('u')).toBe(hotel.booking.target);
          expect(url.searchParams.get('erid')).toBe('2VtzqvE1cv3');
          const subId = url.searchParams.get('sub_id') || '';
          expect(subId).toMatch(/^tt2__/);
          const clickId = subId.split('__').at(-1)!;
          expect(clickId).toMatch(/^c[0-9a-f]{20}$/);
          expect(clickIds.has(clickId)).toBe(false);
          clickIds.add(clickId);
        } finally { await popup.close(); }
      }
    }
  });
}
