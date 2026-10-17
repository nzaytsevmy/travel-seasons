import { test, expect } from './browser-fixture';
import { DIRECTIONS } from '../src/data/directions.js';
import { hotelCollection, hotelCountrySlug, hotelGallery, hotelGuideHubs, hotelHubPicks, readyHotelCollections } from '../src/data/hotels.js';

const published = readyHotelCollections();

// A green build with zero hotel routes must not qualify this feature.
test('каждый страновой хаб получает опубликованную подборку с полными галереями', () => {
  for (const direction of DIRECTIONS.filter(d => d.slug !== 'antarctica')) {
    const collection = hotelCollection(direction.slug);
    expect(collection, direction.slug).toBeTruthy();
    expect(collection!.hotels).toHaveLength(10);
  }
});

async function loadedImages(images: import('@playwright/test').Locator) {
  await images.evaluateAll(elements => elements.forEach(element => {
    (element as HTMLImageElement).loading = 'eager';
  }));
  await expect.poll(() => images.evaluateAll(elements => elements.every(element => {
    const image = element as HTMLImageElement;
    return image.complete && image.naturalWidth > 0 && image.alt.trim().length > 0;
  })), { timeout: 30_000 }).toBe(true);
}

async function noOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= document.documentElement.clientWidth + 1)).toBe(true);
}

for (const [country, collection] of published) {
  test(`галереи и бронирование десяти отелей: ${country}`, async ({ page }) => {
    const response = await page.goto(`/hotels/${country}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(collection.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://traveltribe.ru/hotels/${country}/`);
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).not.toContain('noindex');
    const entries = page.locator('.hotel-entry');
    await expect(entries).toHaveCount(10);
    await loadedImages(entries.locator('img'));
    for (const hotel of collection.hotels) {
      const entry = page.locator(`.hotel-entry[id="${hotel.id}"]`);
      await expect(entry.locator('h2')).toHaveText(hotel.name);
      await expect(entry.locator('.hotel-gallery img')).toHaveCount(hotelGallery(country, hotel).length);
      const gallery = entry.locator('.hotel-gallery');
      const next = entry.locator('[data-photo-next]');
      const previous = entry.locator('[data-photo-prev]');
      await expect(next).toBeVisible();
      await expect(previous).toBeDisabled();
      await next.click();
      await expect.poll(() => gallery.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect.poll(() => gallery.evaluate(element => Math.abs(element.scrollLeft))).toBeLessThan(2);
      const booking = entry.locator('.hotel-entry-book');
      const url = new URL((await booking.getAttribute('href'))!);
      expect(url.hostname).toBe('ostrovok.tpk.mx');
      expect(url.searchParams.get('u')).toBe(hotel.booking.target);
      expect(url.searchParams.get('erid')).toBe('2VtzqvE1cv3');
      expect(url.searchParams.get('sub_id')).toContain(hotel.id.replaceAll('-', '_'));
      await expect(booking).toHaveAttribute('rel', /\bsponsored\b/);
      await expect(booking).toHaveAttribute('rel', /\bnoopener\b/);
    }
    await noOverflow(page);
    // Keep CI clicks out of partner statistics. HTTP redirect/account QA uses
    // separately tagged qa_ URLs, without making reservations.
    await page.context().route('https://ostrovok.tpk.mx/**', route => route.fulfill({ status: 200, body: 'Hotel booking link test' }));
    const popupReady = page.waitForEvent('popup');
    await entries.first().locator('.hotel-entry-book').click();
    const popup = await popupReady;
    try {
      await expect.poll(() => new URL(popup.url()).searchParams.get('u')).toBe(collection.hotels[0].booking.target);
    } finally {
      await popup.close();
    }
  });

  for (const hub of hotelGuideHubs(country)) {
    test(`из страны к подборке: ${hub.slug}`, async ({ page }) => {
      const response = await page.goto(`/${hub.slug}/`);
      expect(response?.status()).toBe(200);
      const block = page.locator('.best-hotels');
      await expect(block).toHaveCount(1);
      const picks = hotelHubPicks(hub.slug, collection);
      await expect(block.locator('.best-hotel')).toHaveCount(3);
      await loadedImages(block.locator('img'));
      for (const hotel of picks) {
        await expect(block.locator(`a.best-hotel-photo[href="/hotels/${hotelCountrySlug(hub.slug)}/#${hotel.id}"]`)).toHaveCount(1);
      }
      await block.scrollIntoViewIfNeeded();
      await noOverflow(page);
      await block.getByRole('link', { name: 'Все 10 отелей', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/hotels/${country}/$`));
      await expect(page.locator('.hotel-entry')).toHaveCount(10);
    });
  }
}
