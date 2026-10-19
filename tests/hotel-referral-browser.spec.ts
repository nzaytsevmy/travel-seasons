import { test, expect } from './browser-fixture';
import { readyHotelCollections } from '../src/data/hotels.js';

for (const [country, collection] of readyHotelCollections()) {
  test(`каждый отель сохраняет цель и уникальный click_id: ${country}`, async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const receipts: { country: string; id: string; mode: string; href: string; target: string }[] = [];
    await context.route('https://ostrovok.tpk.mx/**', route => route.fulfill({ status: 200, body: 'Hotel QA' }));
    await page.goto(`/hotels/${country}/`);
    await page.evaluate(() => {
      document.addEventListener('tt:affiliate-click', event => {
        document.documentElement.dataset.hotelQaClickId = (event as CustomEvent).detail.click_id;
      });
    });
    for (const hotel of collection.hotels) {
      const booking = page.locator(`.hotel-entry[id="${hotel.id}"] .hotel-entry-book`);
      const clickIds = new Set<string>();
      const buttons: ('left' | 'middle')[] = testInfo.project.use.isMobile ? ['left', 'left'] : ['left', 'middle', 'left'];
      for (const button of buttons) {
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
          expect(await page.locator('html').getAttribute('data-hotel-qa-click-id')).toBe(clickId);
          expect(clickIds.has(clickId)).toBe(false);
          receipts.push({ country, id: hotel.id,
            mode: button === 'middle' ? 'new-tab' : clickIds.size ? 'repeat' : 'normal',
            href: popup.url(), target: hotel.booking.target });
          clickIds.add(clickId);
        } finally { await popup.close(); }
      }
    }
    await testInfo.attach(`hotel-referral-clicks-${country}`, {
      body: Buffer.from(JSON.stringify({ kind: 'HOTEL_REFERRAL_CLICK_RECEIPTS', project: testInfo.project.name, rows: receipts })),
      contentType: 'application/json',
    });
  });
}
