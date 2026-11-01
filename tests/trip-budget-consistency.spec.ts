import { test, expect } from './browser-fixture';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';

const amount = (s: string) => Number(s.replace(/[^0-9]/g, ''));
const priceIndex = (slug: string) => PRICES.findIndex(p => p.name === DIRECTIONS.find(d => d.slug === slug)?.price?.name);

test('сравнение двух и трёх поездок не обрезает цены и сохраняет удобные денежные ссылки', async ({ page }) => {
  await page.goto(`/calculator/?r=${priceIndex('kyrgyzstan')}&m=7`);
  await expect(page.locator('.tc-hero-amount')).toBeVisible();
  for (const [slug, count] of [['georgia', 2], ['dagestan', 3]] as const) {
    await page.locator('#addCountrySelect').selectOption(String(priceIndex(slug)));
    await expect(page.locator('.tc-cmp-card')).toHaveCount(count);
    for (const width of [360, 402, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const cards = await page.locator('.tc-cmp-card').evaluateAll(elements => elements.map(element => ({
        name: element.querySelector('h3')!.textContent,
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
      })));
      for (const card of cards) expect(card.scrollWidth, `${width}px: ${card.name}`).toBeLessThanOrEqual(card.clientWidth + 1);
      const partners = await page.locator('#calcResult a[data-offer], .tc-cmp-remove').evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect();
        return { offer: (element as HTMLElement).dataset.offer || 'remove', width: box.width, height: box.height };
      }));
      for (const partner of partners) {
        expect(partner.width, `${width}px: ${partner.offer}`).toBeGreaterThanOrEqual(44);
        expect(partner.height, `${width}px: ${partner.offer}`).toBeGreaterThanOrEqual(44);
      }
    }
    await expect(page.locator('.tc-cmp-badge')).toHaveCount(0);
    await expect(page.locator('.tc-cmp-card').filter({ hasText: 'Грузия' }).locator('.tc-incomplete')).toContainText('медицинская страховка');
  }
});

test('поля каталога и калькулятора читаются без увеличения и имеют зону касания 44px', async ({ page }) => {
  for (const type of ['catalog', 'calculator']) {
    await page.goto(type === 'catalog' ? '/countries/?m=7' : `/calculator/?r=${priceIndex('kyrgyzstan')}&m=7`);
    if (type === 'catalog') await expect(page.locator('#catMonth')).toHaveValue('7');
    else await expect(page.locator('.tc-hero-amount')).toBeVisible();
    for (const width of [360, 402, 768]) {
      await page.setViewportSize({ width, height: 800 });
      const selector = type === 'catalog' ? '.cfilters input, .cfilters select' : '#tcForm select, #tcForm button';
      const controls = await page.locator(selector).evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect();
        return { id: element.id, isInput: element.tagName !== 'BUTTON', fontSize: parseFloat(getComputedStyle(element).fontSize), width: box.width, height: box.height };
      }).filter(element => element.width && element.height));
      for (const control of controls) {
        if (control.isInput) expect(control.fontSize, `${type} ${width}px: ${control.id}`).toBeGreaterThanOrEqual(16);
        expect(control.width, `${type} ${width}px: ${control.id}`).toBeGreaterThanOrEqual(44);
        expect(control.height, `${type} ${width}px: ${control.id}`).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test('текст данных калькулятора не превращается в HTML при выводе результата', async ({ page }) => {
  const payload = '"><img src="/__budget_xss_probe" onerror="window.__budgetXss=1">';
  await page.route('**/calculator/**', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script\b[^>]*\bid="calculatorData"[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, open, json, close) => {
        const data = JSON.parse(json);
        data.MONTH_FULL = data.MONTH_FULL.map(() => payload);
        data.PRICES[priceIndex('dagestan')].name = payload;
        for (const visa of Object.values(data.priceIdxToVisa) as Array<{ slug: string }>) visa.slug = payload;
        for (const key of Object.keys(data.priceIdxToSlug)) data.priceIdxToSlug[key] = payload;
        return open + JSON.stringify(data).replace(/</g, '\\u003c') + close;
      },
    );
    await route.fulfill({ response, body });
  });
  await page.goto(`/calculator/?r=${priceIndex('dagestan')}&d=7&l=0&c=rub&t=1`);
  await expect(page.locator('.tc-nudge')).toContainText(payload);
  await expect(page.locator('#calcResult img')).toHaveCount(0);
  await expect(page.locator('.tc-visa-pill')).toHaveAttribute('href', '/visa/' + encodeURIComponent(payload) + '/');
  await page.locator('#addCountrySelect').selectOption(String(priceIndex('georgia')));
  await expect(page.locator('.tc-cmp-card')).toHaveCount(2);
  await expect(page.locator('#calcResult img')).toHaveCount(0);
  for (const link of await page.locator('.tc-cmp-visa a').all()) {
    await expect(link).toHaveAttribute('href', '/visa/' + encodeURIComponent(payload) + '/');
  }
  expect(await page.evaluate(() => (window as any).__budgetXss)).toBeUndefined();
});

test.beforeEach(async ({ page }) => {
  // Старый калькулятор менял курс после первого рендера. Детерминированный ответ
  // воспроизводит исходный баг без зависимости проверки от чужого сервера.
  await page.route('https://open.er-api.com/**', route => route.fulfill({ json: { result: 'success', rates: { RUB: 84.3363 } } }));
});

test('одна эконом-неделя: главная, каталог и калькулятор показывают одну сумму', async ({ page }) => {
  const month = '7';
  await page.goto('/?m=' + month);
  await expect(page.locator('[data-home-month]').first()).toHaveText('июле');
  const offers = await page.locator('#homeCheap .home-card').evaluateAll(rows => rows.map(row => ({
    slug: (row.getAttribute('href') || row.querySelector('a')!.getAttribute('href')!).split('/')[1],
    price: Number(row.getAttribute('data-budget')),
  })));
  expect(offers).toHaveLength(6);
  await page.goto(`/countries/?m=${month}`);
  const catalog = await page.locator('.cd').evaluateAll(cards => Object.fromEntries(cards.map(card => [
    (card.getAttribute('href') || card.querySelector('.cd-name')!.getAttribute('href')!).split('/')[1],
    Number(card.getAttribute('data-budget')),
  ])));
  for (const offer of offers) {
    expect(catalog[offer.slug], offer.slug + ': каталог').toBe(offer.price);
    await page.goto(`/calculator/?r=${priceIndex(offer.slug)}&d=7&l=0&c=rub&t=1&m=${month}`);
    await expect(page.locator('.tc-hero-amount')).toBeVisible();
    await expect.poll(async () => amount(await page.locator('.tc-hero-amount').innerText()), { message: offer.slug + ': калькулятор', timeout: 5000 }).toBe(offer.price);
  }
});

test('цена в фотокарточке открывает расчёт, название открывает путеводитель', async ({ page }) => {
  await page.goto('/?m=10');
  // The requested month replaces SSR cards after planner data loads. Its visible
  // label is updated after that replacement; scrolling the SSR node races it.
  await expect(page.locator('[data-home-month]').first()).toHaveText('октябре');
  const rows = page.locator('#homeCheap .home-card');
  await expect(rows).toHaveCount(6);
  const first = rows.first();
  await first.scrollIntoViewIfNeeded();
  const guide = first.locator('h3 a');
  await guide.scrollIntoViewIfNeeded();
  await expect(guide).toBeVisible();
  await expect(guide).toHaveText(/\S/, { useInnerText: true });
  const slug = (await guide.getAttribute('href'))!.split('/')[1];
  const name = (await guide.innerText()).trim();
  const price = first.locator('.home-budget');
  await expect(first.locator('.home-entry')).toBeVisible();
  const href = new URL((await price.getAttribute('href'))!, 'https://traveltribe.ru');
  expect(href.pathname).toBe('/calculator/');
  expect(Object.fromEntries(href.searchParams)).toMatchObject({ r: String(priceIndex(slug)), d: '7', l: '0', c: 'rub', t: '1' });
  await price.click();
  await expect(page).toHaveURL(/\/calculator\//);
  await expect(page.locator('#calcRegion')).toHaveValue(String(priceIndex(slug)));
  await expect(page.locator('#calcDaysDisplay')).toHaveText('7');
  await expect(page.locator('#travelersDisplay')).toHaveText('1');
  await expect(page.locator('#levelGroup [data-lvl="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#monthSelect')).toHaveValue('10');
  await page.goBack();
  await expect(page.locator('[data-home-month]').first()).toHaveText('октябре');
  await page.locator('#homeCheap .home-card h3').getByRole('link', { name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/' + slug + '/$'));
});

test('все цены каталога ведут на своё направление; смена параметров и возврат работают', async ({ page }) => {
  const errors: string[] = [];
  const inFlight = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => inFlight.add(request));
  page.on('requestfinished', request => inFlight.delete(request));
  page.on('requestfailed', request => inFlight.delete(request));
  const settlePrefetch = async () => {
    // Astro запускает viewport-prefetch через 300 мс после IntersectionObserver.
    // networkidle, однажды достигнутый документом, не ждёт будущий таймер:
    // трасса PR #723 показала click через 217 мс и fetch уже при уничтожении страницы.
    await page.evaluate(async () => {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await new Promise<void>(resolve => setTimeout(resolve, 350));
    });
    await expect.poll(() => inFlight.size, { timeout: 10000,
      message: 'Запросы завершаются до перехода, перезагрузки или возврата' }).toBe(0);
  };
  await page.goto('/countries/');
  const cards = await page.locator('.cd').evaluateAll(cards => cards.map(card => ({
    slug: card.querySelector('.cd-name')!.getAttribute('href')?.split('/')[1],
    price: card.querySelector('.cd-price')!.getAttribute('href'),
  })));
  for (const card of cards) {
    expect(card.slug).toBeTruthy();
    expect(new URL(card.price!, 'https://traveltribe.ru').searchParams.get('r')).toBe(String(priceIndex(card.slug!)));
  }
  const dagestan = page.locator('.cd').filter({ has: page.getByRole('link', { name: 'Дагестан', exact: true }) });
  const originalPrice = amount(await dagestan.locator('.cd-price').innerText());
  await dagestan.locator('.cd-price').scrollIntoViewIfNeeded();
  await dagestan.locator('.cd-price').hover();
  await settlePrefetch();
  await dagestan.locator('.cd-price').click();
  await expect(page.locator('#calcRegion')).toHaveValue(String(priceIndex('dagestan')));
  await page.locator('#daysUp').click();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await expect.poll(async () => amount(await page.locator('.tc-hero-amount').innerText())).toBeGreaterThan(originalPrice);
  await settlePrefetch();
  await page.reload();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await page.locator('#currGroup [data-cur="usd"]').click();
  await expect(page.locator('.tc-hero-amount')).toContainText('$');
  await page.locator('#currGroup [data-cur="rub"]').click();
  await expect(page.locator('.tc-hero-amount')).toContainText('₽');
  await page.locator('.tc-visa-pill').scrollIntoViewIfNeeded();
  await page.locator('.tc-visa-pill').hover();
  await settlePrefetch();
  await page.locator('.tc-visa-pill').click();
  await expect(page).toHaveURL(/\/visa\/dagestan\//);
  await settlePrefetch();
  await page.goBack();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await page.locator('#daysUp').click();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('9');
  await settlePrefetch();
  expect(errors).toEqual([]);
});
