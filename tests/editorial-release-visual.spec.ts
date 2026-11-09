import { test, expect } from './browser-fixture';

// Keep the screenshots with the CI report for a human review of each changed
// page type; automated structure checks remain independent of these captures.
const pages = [
  { path: '/', focus: ['.news-strip'] },
  { path: '/blog/', focus: ['.featured-section', '.posts-grid .post-card'] },
  { path: '/blog/hram-uluvatu-bali/', focus: [
    '.post-cover', 'p:has(img[alt="Ворота храма Улувату со скульптурами на фоне океана"])',
    '.post-gallery figure:nth-of-type(1)', '.post-gallery figure:nth-of-type(2)',
    '.post-gallery figure:nth-of-type(3)', 'article table',
    'p:has-text("экскурсии Sputnik8 к храму и на Джимбаран")',
  ] },
  { path: '/blog/bali-guide-2026/', focus: [
    '.post-cover', 'li:has(a[href="/blog/hram-uluvatu-bali/"])',
    'p:has-text("Медицинскую страховку рекомендуем оформить заранее")',
    'p:has-text("Медицинскую страховку рекомендуем.")',
    'li:has(a:has-text("Оформить страховку для тропиков"))',
  ] },
  { path: '/bali/', focus: ['a[href="/blog/hram-uluvatu-bali/"]'] },
  { path: '/blog/tag/%D0%91%D0%B0%D0%BB%D0%B8/', focus: ['.posts-grid a[href="/blog/hram-uluvatu-bali/"]'] },
  { path: '/novosti/', focus: ['.nv-topics'] },
  { path: '/novosti/tema/kultura-i-sobytiya/', focus: ['.nvt-list li'] },
  { path: '/novosti/2026-11-08-loi-krathong-2026/', focus: ['.nvp-fig', '.nvp-section:has(a[href="/novosti/tema/kultura-i-sobytiya/"])'] },
  { path: '/novosti/2026-10-09-rome-fayum-portraits-presale/', focus: ['.nvp-fig', '.nvp-section:has(a[href="/novosti/tema/kultura-i-sobytiya/"])'] },
  { path: '/novosti/2026-10-10-bangkok-royal-barges-november/', focus: ['.nvp-fig', '.nvp-section:has(a[href="/novosti/tema/kultura-i-sobytiya/"])'] },
];

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'Capture one consistent browser; the full suite covers all projects');
});

for (const entry of pages) {
  test(`editorial release visual ${entry.path}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    for (const width of [402, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(entry.path, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        const visible = [...document.images].filter((img) => {
          const box = img.getBoundingClientRect();
          return box.top < innerHeight && box.bottom > 0 && box.width > 0 && box.height > 0;
        });
        await Promise.all(visible.map(async (img) => {
          await img.decode();
          if (!img.naturalWidth) throw new Error('Visible image has no decoded pixels');
        }));
      });
      await info.attach(`first-screen-${width}`, {
        body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png',
      });

      for (const [index, selector] of entry.focus.entries()) {
        const target = page.locator(selector).first();
        if (entry.path === '/blog/bali-guide-2026/' && selector === 'p:has-text("Медицинскую страховку рекомендуем.")') {
          const faq = target.locator('xpath=ancestor::details[1]');
          await expect(faq).toHaveCount(1);
          await expect(faq.locator('summary')).toContainText('Нужна ли страховка на Бали?');
          await faq.locator('summary').click();
        }
        await expect(target).toBeVisible();
        await target.scrollIntoViewIfNeeded();
        const images = target.locator('img');
        for (let i = 0; i < await images.count(); i++) {
          await images.nth(i).evaluate(async (img: HTMLImageElement) => {
            await img.decode();
            if (!img.naturalWidth) throw new Error('Focused image has no decoded pixels');
          });
        }
        await info.attach(`focus-${index}-${width}`, {
          body: await target.screenshot({ animations: 'disabled' }), contentType: 'image/png',
        });
      }
    }
  });
}
