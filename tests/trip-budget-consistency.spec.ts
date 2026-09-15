import { test, expect } from '@playwright/test';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';

const amount = (s: string) => Number(s.replace(/[^0-9]/g, ''));
const priceIndex = (slug: string) => PRICES.findIndex(p => p.name === DIRECTIONS.find(d => d.slug === slug)?.price?.name);

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
  await page.goto('/');
  const offers = await page.locator('.pass .prow').evaluateAll(rows => rows.map(row => ({
    slug: (row.getAttribute('href') || row.querySelector('a')!.getAttribute('href')!).split('/')[1],
    price: Number(row.lastElementChild!.textContent!.replace(/[^0-9]/g, '')),
  })));
  expect(offers).toHaveLength(6);
  await page.goto('/countries/');
  const catalog = await page.locator('.cd').evaluateAll(cards => Object.fromEntries(cards.map(card => [
    (card.getAttribute('href') || card.querySelector('.cd-name')!.getAttribute('href')!).split('/')[1],
    Number(card.getAttribute('data-budget')),
  ])));
  for (const offer of offers) {
    expect(catalog[offer.slug], offer.slug + ': каталог').toBe(offer.price);
    await page.goto(`/calculator/?r=${priceIndex(offer.slug)}&d=7&l=0&c=rub&t=1&m=0`);
    await expect(page.locator('.tc-hero-amount')).toBeVisible();
    await expect.poll(async () => amount(await page.locator('.tc-hero-amount').innerText()), { message: offer.slug + ': калькулятор', timeout: 5000 }).toBe(offer.price);
  }
});

test('цена в талоне открывает расчёт, название открывает путеводитель', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('.pass .prow');
  const first = rows.first();
  const guide = first.locator('a').first();
  const slug = (await guide.getAttribute('href'))!.split('/')[1];
  const name = (await guide.innerText()).trim();
  const price = first.locator('a').last();
  await expect(first.locator('a')).toHaveCount(2);
  const href = new URL((await price.getAttribute('href'))!, 'https://traveltribe.ru');
  expect(href.pathname).toBe('/calculator/');
  expect(Object.fromEntries(href.searchParams)).toMatchObject({ r: String(priceIndex(slug)), d: '7', l: '0', c: 'rub', t: '1' });
  await price.click();
  await expect(page).toHaveURL(/\/calculator\//);
  await expect(page.locator('#calcRegion')).toHaveValue(String(priceIndex(slug)));
  await expect(page.locator('#calcDaysDisplay')).toHaveText('7');
  await expect(page.locator('#travelersDisplay')).toHaveText('1');
  await expect(page.locator('#levelGroup [data-lvl="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#monthSelect')).toHaveValue('0');
  await page.goBack();
  await page.locator('.pass .prow').getByRole('link', { name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/' + slug + '/$'));
});

test('все цены каталога ведут на своё направление; смена параметров и возврат работают', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
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
  await dagestan.locator('.cd-price').click();
  await expect(page.locator('#calcRegion')).toHaveValue(String(priceIndex('dagestan')));
  await page.locator('#daysUp').click();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await expect.poll(async () => amount(await page.locator('.tc-hero-amount').innerText())).toBeGreaterThan(originalPrice);
  // В WebKit Astro предзагружает видимые ссылки через fetch без catch. Дождёмся
  // этих запросов перед принудительной перезагрузкой, чтобы не оборвать их тестом.
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await page.locator('#currGroup [data-cur="usd"]').click();
  await expect(page.locator('.tc-hero-amount')).toContainText('$');
  await page.locator('#currGroup [data-cur="rub"]').click();
  await expect(page.locator('.tc-hero-amount')).toContainText('₽');
  await page.waitForLoadState('networkidle');
  await page.locator('.tc-visa-pill').click();
  await expect(page).toHaveURL(/\/visa\/dagestan\//);
  await page.goBack();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('8');
  await page.locator('#daysUp').click();
  await expect(page.locator('#calcDaysDisplay')).toHaveText('9');
  expect(errors).toEqual([]);
});
