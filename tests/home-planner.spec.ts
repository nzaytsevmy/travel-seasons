import { test, expect } from './browser-fixture';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';
const priceIndex = (slug: string) => PRICES.findIndex(p => p.name === DIRECTIONS.find(d => d.slug === slug)?.price?.name);

test('главная объясняет основу бюджета и не обещает неработающий поиск в разметке', async ({ page }) => {
  await page.goto('/?m=10');
  await expect(page.locator('.budget-basis')).toContainText('на одного человека из Москвы');
  await expect(page.locator('.home-season').first()).not.toContainText('AFL');
  const websites = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts =>
    scripts.flatMap(script => {
      const data = JSON.parse(script.textContent || '{}');
      return data['@graph'] || [data];
    }).filter(node => node['@type'] === 'WebSite'));
  expect(websites).toHaveLength(1);
  expect(websites[0].potentialAction).toBeUndefined();
  await expect(page.locator('h1')).toHaveCount(1);
});

test('форматы кадров соответствуют роли и не растягиваются высотой соседних карточек', async ({ page }) => {
  await page.goto('/?m=10');
  for (const width of [360, 402, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const mobile = width < 768;
    for (const [selector, ratio] of [
      ['.seasonal-grid .home-card-photo', mobile ? 1 : 4 / 3],
      ['.free-grid .home-card-photo', mobile ? 1 : 4 / 5],
      ['.cheap-grid .home-card-photo', mobile ? 1 : 4 / 3],
      ['.feature-photo', mobile ? 4 / 3 : 2],
    ] as const) {
      const photos = await page.locator(selector).evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect();
        return r.width / r.height;
      }));
      for (let i = 0; i < photos.length; i++) {
        const expected = selector.startsWith('.seasonal-grid') && i === 0 ? 4 / 3 : ratio;
        expect(Math.abs(photos[i] - expected), `${width}: ${selector}, ${i}`).toBeLessThan(0.02);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('название страны набирается с пробелом, очистка поиска сохраняет остальные условия', async ({ page }) => {
  await page.goto('/countries/?m=7&max_budget=100000&visa=free_evisa');
  await expect(page.locator('#catMonth')).toHaveValue('7');
  const count = await page.locator('#catN').innerText();
  await page.locator('#catSearch').pressSequentially('Новая Зеландия');
  await expect(page.locator('#catSearch')).toHaveValue('Новая Зеландия');
  await expect(page.locator('#catSearchClear')).toBeVisible();
  await page.locator('#catSearchClear').click();
  await expect(page.locator('#catSearch')).toHaveValue('');
  await expect(page.locator('#catSearch')).toBeFocused();
  await expect(page.locator('#catMonth')).toHaveValue('7');
  await expect(page.locator('#catMaxBudget')).toHaveValue('100000');
  await expect(page).toHaveURL(/visa=free_evisa/);
  await expect(page.locator('#catN')).toHaveText(count);
});

test('четыре фотографии настроения сохраняют одинаковые пропорции на всех ширинах', async ({ page }) => {
  await page.goto('/');
  for (const width of [360, 402, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const photos = await page.locator('.mood-card img').evaluateAll(elements =>
      elements.map(element => {
        const box = element.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }));
    expect(photos).toHaveLength(4);
    const ratio = width < 768 ? 1 : 0.8;
    for (const photo of photos) {
      expect(photo.width).toBeGreaterThan(0);
      expect(Math.abs(photo.height - photo.width / ratio)).toBeLessThan(2);
    }
    await expect.poll(() => page.locator('.seasonal-grid .home-card').first().evaluate(card => {
      const caption = card.querySelector('.home-card-text')!;
      const cardBox = card.getBoundingClientRect();
      const captionBox = caption.getBoundingClientRect();
      // Desktop lead is an editorial image beside vertically centred answers.
      return innerWidth < 768
        ? cardBox.bottom - caption.lastElementChild!.getBoundingClientRect().bottom
        : Math.abs((cardBox.top + cardBox.bottom) / 2 - (captionBox.top + captionBox.bottom) / 2);
    })).toBeLessThanOrEqual(16);
  }
  for (const width of [402, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const image of await page.locator('.mood-card img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement, expectedRatio: number) =>
        element.naturalWidth > 0 && Math.abs(element.naturalWidth / element.naturalHeight - expectedRatio) < 0.02,
      width < 768 ? 1 : 0.8)).toBe(true);
    }
  }
});

test('на первом экране остаются шесть читаемых ссылок с зоной касания 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.locator('.hero-nav a')).toHaveCount(6);
  const labels = await page.locator('.hero-nav .vi-l').evaluateAll(elements =>
    elements.map(element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), overflow: element.scrollWidth - element.clientWidth })));
  for (const label of labels) {
    expect(label.fontSize).toBeGreaterThanOrEqual(13);
    expect(label.overflow).toBeLessThanOrEqual(1);
  }
  const targets = await page.locator('main a, main button').evaluateAll(elements =>
    elements.map(element => {
      const box = element.getBoundingClientRect();
      return { text: element.textContent?.trim(), width: box.width, height: box.height };
    }).filter(box => box.width > 0 && box.height > 0));
  for (const target of targets) {
    expect(target.width, target.text).toBeGreaterThanOrEqual(44);
    expect(target.height, target.text).toBeGreaterThanOrEqual(44);
  }
});

test('условия из ссылки обновляют подборки, жильё и сохраняются при возврате', async ({ page }) => {
  await page.goto('/?m=7&max_budget=100000&visa=free_evisa');
  await expect(page.locator('#homePlanner')).toHaveCount(0);
  const count = await page.locator('#homeRecommendations .home-card').count();
  await expect(page.locator('#homeResultCount')).toContainText(String(count));
  for (const a of await page.locator('#homeRecommendations .home-budget').all()) {
    expect(new URL((await a.getAttribute('href'))!, 'https://traveltribe.ru').searchParams.get('m')).toBe('7');
  }
  await expect(page.locator('#homeFree .home-card')).toHaveCount(4);
  await expect(page.locator('#homeCheap .home-card')).toHaveCount(6);
  const stay = page.locator('#homeCheap .home-stay').first();
  await expect(stay).toHaveAttribute('data-cta-prepared', '1');
  await expect(stay).toHaveAttribute('data-destination', /[a-z-]+/);
  const target = new URL((await stay.getAttribute('href'))!).searchParams;
  expect(target.get('erid')).toBeTruthy();
  expect(target.get('sub_id')).toContain('home_');
  await page.locator('#homeCatalog').click();
  await expect(page.locator('#catMonth')).toHaveValue('7');
  await expect(page.locator('#catMaxBudget')).toHaveValue('100000');
  const visible = await page.locator('#cgrid > .cd:visible').count();
  const visaCounts = await page.locator('[data-visa-count]').allTextContents();
  expect(Number(visaCounts[0]) + Number(visaCounts[1])).toBe(visible);
  await page.locator('.cf-opts[data-g="visa"] [data-v="free"]').click();
  await expect(page.locator('#cgrid > .cd:visible')).toHaveCount(Number(visaCounts[0]));
  await page.goBack();
  await expect(page.locator('[data-home-month]').first()).toHaveText('июле');
  await expect(page.locator('#homeCatalog')).toHaveAttribute('href', /max_budget=100000/);
  await expect(page.locator('#homeCatalog')).toHaveAttribute('href', /visa=free_evisa/);
});

test('меню первого экрана ведёт в существующие разделы', async ({ page }) => {
  await page.goto('/');
  const paths = ['/visa/', '/seasons/', '/calculator/', '/trips/', '/packing/', '/countries/'];
  const links = page.locator('.hero-nav a');
  for (let i = 0; i < paths.length; i++) {
    const href = await links.nth(i).getAttribute('href');
    expect(new URL(href!, page.url()).pathname).toBe(paths[i]);
  }
  await links.last().click();
  await expect(page).toHaveURL(/\/countries\/$/);
  await expect(page.locator('#catSearch')).toBeVisible();
  await expect(page.locator('#catMonth')).toBeVisible();
});

test('пустая выдача не заполняется неподходящими странами', async ({ page }) => {
  await page.goto('/?m=1&max_budget=100000&visa=required&vibe=beach');
  await expect(page.locator('#homeRecommendations .home-card')).toHaveCount(0);
  await expect(page.locator('#homeEmpty')).toBeVisible();
  await page.locator('#homeReset').click();
  await expect(page.locator('#homeRecommendations .home-card')).toHaveCount(6);
  await expect(page.locator('[data-home-month]').first()).toHaveText('январе');
});

test('переход по настроению сохраняет месяц, бюджет и ограничения въезда', async ({ page }) => {
  await page.goto('/?m=7&max_budget=100000&visa=free_evisa');
  await page.locator('[data-home-vibe="nature"]').click();
  await expect(page.locator('#catMonth')).toHaveValue('7');
  await expect(page.locator('#catMaxBudget')).toHaveValue('100000');
  await expect(page).toHaveURL(/visa=free_evisa/);
  await expect(page).toHaveURL(/vibe=nature/);
});

test('стоимость обязательной страховки Грузии явно остаётся неизвестной', async ({ page }) => {
  await page.goto(`/calculator/?r=${priceIndex('georgia')}&m=10`);
  await expect(page.locator('.tc-hero-label')).toHaveText('Известная часть бюджета');
  await expect(page.locator('.tc-incomplete')).toContainText('медицинская страховка');
  await expect(page.locator('.tc-hero-amount')).not.toHaveText('0 ₽');
});

test('главная без JavaScript сохраняет 30 фото, прямые гиды и расчёты', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL! + '/');
    await expect(page.locator('main img')).toHaveCount(32);
    await expect(page.locator('#homeRecommendations h3 a')).toHaveCount(6);
    await expect(page.locator('#homeCheap .home-budget')).toHaveCount(6);
    for (const a of await page.locator('#homeRecommendations h3 a').all()) await expect(a).toHaveAttribute('href', /^\/[a-z-]+\/$/);
    await expect(page.locator('#homePlanner')).toHaveCount(0);
    await expect(page.locator('.hero-nav a')).toHaveCount(6);
    await page.locator('.hero-nav a[href="/countries/"]').click();
    await expect(page).toHaveURL(/\/countries\/$/);
    await expect(page.locator('h1')).toBeVisible();
  } finally { await context.close(); }
});

test('месяц проходит через гид в калькулятор, денежная ссылка сохраняет страну', async ({ page }) => {
  await page.goto('/?m=10');
  const guide = page.locator('#homeCheap h3 a').first();
  const slug = (await guide.getAttribute('href'))!.split('/')[1];
  await guide.click();
  const calc = page.locator('a[href*="/calculator/?r="]').first();
  await expect(calc).toHaveAttribute('href', /[?&]m=10/);
  await calc.click();
  await expect(page.locator('#calcRegion')).toHaveValue(String(priceIndex(slug)));
  await expect(page.locator('#monthSelect')).toHaveValue('10');
  const money = page.locator('#calcResult a[data-offer="stay"]').first();
  await expect(money).toHaveAttribute('data-destination', slug);
  await expect(money).toHaveAttribute('data-cta-prepared', '1');
});

test('неизвестный въезд не превращает стоимость калькулятора в ноль или самого дешёвого победителя', async ({ page }) => {
  await page.goto(`/calculator/?r=${priceIndex('australia-east')}&m=10`);
  await expect(page.locator('.tc-hero-label')).toHaveText('Известная часть бюджета');
  await expect(page.locator('.tc-incomplete')).toContainText('Полная стоимость пока неизвестна');
  await expect(page.locator('.tc-hero-amount')).not.toHaveText('0 ₽');
  await page.locator('#addCountrySelect').selectOption(String(priceIndex('dagestan')));
  await expect(page.locator('.tc-cmp-card')).toHaveCount(2);
  await expect(page.locator('.tc-cmp-badge')).toHaveCount(0);
});
