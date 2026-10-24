import { test, expect } from './browser-fixture';
import { DIRECTIONS } from '../src/data/directions.js';
import { tourCollection } from '../src/data/tour-picks.js';

for (const destination of DIRECTIONS.map(d => d.slug)) {
  test(`подборка и точные партнёрские переходы: ${destination}`, async ({ page }) => {
    const tours = tourCollection(destination);
    await page.goto(`/${destination}/`);
    const section = page.locator('[data-tour-picks]');
    expect(tours.length, `${destination}: at least three reviewed offers`).toBeGreaterThanOrEqual(3);
    await expect(section.locator('.tour-card')).toHaveCount(tours.length);
    await section.scrollIntoViewIfNeeded();
    for (const tour of tours) {
      const card = section.locator(`[data-tour-id="${tour.id}"].tour-card`);
      await card.scrollIntoViewIfNeeded();
      const link = card.locator('a');
      await expect(link).toHaveAttribute('data-cta-prepared', '1');
      await expect(link).toHaveAttribute('data-destination', destination);
      await expect(link).toHaveAttribute('rel', /sponsored/);
      const href = new URL(await link.getAttribute('href') as string);
      const target = new URL(href.searchParams.get(tour.partner === 'youtravel' ? 'redirect' : 'u') as string);
      const expected = new URL(tour.url);
      expect(target.origin + target.pathname).toBe(expected.origin + expected.pathname);
      if (tour.partner === 'youtravel') {
        expect(target.searchParams.get('partner')).toBe('affise');
        expect(target.searchParams.get('sid')).toBe(href.searchParams.get('pid'));
        expect(target.searchParams.get('click_id')).toBe('{clickid}');
      } else expect(target.search).toBe('');
      expect(href.searchParams.get(tour.partner === 'youtravel' ? 'sub1' : 'sub_id')).toContain('tour');
      await expect(card.locator('img')).toHaveAttribute('loading', 'lazy');
      await expect.poll(() => card.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const pixels = await card.locator('img').evaluate(async (img: HTMLImageElement) => {
        const probe = new Image();
        probe.src = img.currentSrc;
        await probe.decode();
        return { encodedWidth:probe.naturalWidth, requiredWidth:Math.ceil(img.getBoundingClientRect().width * devicePixelRatio) };
      });
      expect(pixels.encodedWidth + 1, `${tour.id}: photo resolution at device pixel ratio`).toBeGreaterThanOrEqual(pixels.requiredWidth);
      expect(await link.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [360, 402, 768, 1280]) {
  test(`лента экскурсий и многодневный тур, ширина ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/kyrgyzstan/');
    const section = page.locator('[data-tour-picks]');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.tour-group')).toHaveCount(2);
    const multi = section.locator('.tour-group').last();
    await expect(multi.locator('h3')).toHaveText('Авторские туры на несколько дней');
    await expect(multi.locator('.tour-includes')).toContainText('проживание');
    const list = section.locator('.tour-list').first();
    const dimensions = await list.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    if (width < 768) {
      expect(dimensions.scroll).toBeGreaterThan(dimensions.client);
      await list.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => list.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    } else {
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if ([402,1280].includes(width)) {
      await section.scrollIntoViewIfNeeded();
      await list.evaluate(el => { el.scrollLeft=0; });
      await test.info().attach(`tour-picks-${width}`, {body:await section.screenshot({style:'header { visibility: hidden !important; }'}),contentType:'image/png'});
    }
  });
}
