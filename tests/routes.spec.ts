import { test, expect } from '@playwright/test';

const ROUTE = '/routes/georgia-7-days/';

test.beforeEach(async ({ page }) => {
  await page.route(/mc\.yandex\.ru|analytics\.ahrefs\.com|googletagmanager|google-analytics/, route => route.abort());
});

test('хаб индексируется, а непроверенные detail-маршруты остаются noindex', async ({ page }) => {
  await page.goto('/routes/');
  await expect(page).toHaveTitle(/Маршруты путешествий/);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
  await expect(page.locator('.routes-list li')).toHaveCount(5);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://traveltribe.ru/routes/');

  await page.goto(ROUTE);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://traveltribe.ru/routes/georgia-7-days/');
  await expect(page.locator('.route-source')).toContainText('Большой гайд по Грузии');
  await expect(page.locator('[data-route-partner]')).toHaveAttribute('rel', /sponsored/);
});

test('гость меняет, сохраняет и снова открывает маршрут без обращения к аккаунту', async ({ page }) => {
  let accountRequests = 0;
  await page.route('https://api.traveltribe.ru/**', async route => {
    accountRequests += 1;
    await route.abort();
  });
  await page.goto(ROUTE);
  await page.evaluate(() => {
    localStorage.removeItem('tt_plans_v2');
    localStorage.removeItem('tt_trips');
    localStorage.removeItem('tt_trip');
  });
  await page.reload();

  const items = page.locator('[data-stops] > li');
  const first = (await items.nth(0).locator('.rt-stop-label').textContent())!;
  const second = (await items.nth(1).locator('.rt-stop-label').textContent())!;
  await items.nth(0).locator('[data-move="down"]').click();
  await expect(items.nth(0).locator('.rt-stop-label')).toHaveText(second);
  await expect(items.nth(1).locator('.rt-stop-label')).toHaveText(first);
  await expect(items.nth(0).locator('.rt-stop-day')).toHaveText('День 1');
  await items.last().locator('[data-remove]').click();

  await page.locator('input[name="dateStart"]').fill('2026-10-03');
  await page.locator('input[name="dateStart"]').dispatchEvent('change');
  await expect(page.locator('input[name="dateEnd"]')).toHaveValue('2026-10-09');
  await page.locator('input[name="people"]').fill('2');
  await page.locator('[data-route-form]').evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator('[data-route-status]')).toContainText('Маршрут сохранён');
  await expect(page.locator('[data-open-plan]')).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_plans_v2') || '[]'));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    kind: 'route', routeSlug: 'georgia-7-days', destinationSlug: 'georgia',
    dateStart: '2026-10-03', dateEnd: '2026-10-09', people: 2,
  });
  expect(stored[0].stops).toHaveLength(6);
  expect(stored[0].stops[0].label).toBe(second);
  expect(accountRequests).toBe(0);

  await page.reload();
  await expect(items).toHaveCount(6);
  await expect(items.nth(0).locator('.rt-stop-label')).toHaveText(second);
  await page.goto('/my/');
  await expect(page.locator('#mypTitle')).toHaveText('Грузия на 7 дней');
  await expect(page.locator('#mypRouteStops li')).toHaveCount(6);
  await expect(page.locator('#mypRouteEdit')).toHaveAttribute('href', '/routes/georgia-7-days/');
});

test('21-й план не затирает ни один из двадцати сохранённых', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => {
    const plans = Array.from({ length: 20 }, (_, index) => ({
      schemaVersion: 2,
      id: `saved-${index}`,
      kind: 'destination',
      destinationSlug: `place-${index}`,
      slug: `place-${index}`,
      title: `Поездка ${index}`,
      nom: `Поездка ${index}`,
      monthIdx: null,
      days: 7,
      people: 1,
      dateStart: null,
      dateEnd: null,
      stops: [],
      savedAt: Date.now() - index,
      updatedAt: Date.now() - index,
      version: 0,
      syncStatus: 'local',
    }));
    localStorage.setItem('tt_plans_v2', JSON.stringify(plans));
  });
  await page.reload();
  await page.locator('[data-route-form]').evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator('[data-route-status]')).toContainText('Лимит — 20 планов');
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_plans_v2') || '[]').map((plan: any) => plan.id));
  expect(ids).toHaveLength(20);
  expect(ids).toEqual(Array.from({ length: 20 }, (_, index) => `saved-${index}`));
});

test('старое хранилище выше нового лимита не режется при простом открытии', async ({ page }) => {
  await page.goto('/my/');
  await page.evaluate(() => {
    const plans = Array.from({ length: 21 }, (_, index) => ({
      schemaVersion: 2, id: `legacy-${index}`, kind: 'destination',
      destinationSlug: 'turkey', slug: 'turkey', title: `Старая поездка ${index}`,
      nom: `Старая поездка ${index}`, monthIdx: null, days: 7, people: 1,
      dateStart: null, dateEnd: null, stops: [], savedAt: Date.now() - index,
      updatedAt: Date.now() - index, version: 0, syncStatus: 'local',
    }));
    localStorage.setItem('tt_plans_v2', JSON.stringify(plans));
  });
  await page.reload();
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('tt_plans_v2') || '[]').map((plan: any) => plan.id));
  expect(ids).toHaveLength(21);
  expect(ids).toEqual(Array.from({ length: 21 }, (_, index) => `legacy-${index}`));
  await expect(page.locator('#mypTrips [data-trip]')).toHaveCount(21);
});

test('аналитика получает только безопасные категории без дат и ID пользователя', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__goals = [];
    (window as any).ym = (...args: unknown[]) => (window as any).__goals.push(args);
  });
  await page.goto(ROUTE);
  await page.locator('input[name="dateStart"]').fill('2026-12-24');
  await page.locator('input[name="dateStart"]').dispatchEvent('change');
  await page.locator('input[name="people"]').fill('6');
  await page.locator('input[name="people"]').dispatchEvent('change');
  await page.locator('[data-route-form]').evaluate((form: HTMLFormElement) => form.requestSubmit());

  const goals = await page.evaluate(() => (window as any).__goals);
  const routeGoals = goals.filter((args: unknown[]) => String(args[2]).startsWith('route_'));
  expect(routeGoals.map((args: unknown[]) => args[2])).toEqual(expect.arrayContaining(['route_view', 'route_start', 'route_edit', 'route_save_intent']));
  expect(JSON.stringify(routeGoals)).not.toContain('2026-12-24');
  expect(JSON.stringify(routeGoals)).not.toMatch(/user|yandex|email|phone/i);
  const edits = routeGoals.filter((args: unknown[]) => args[2] === 'route_edit');
  expect(edits.some((args: unknown[]) => (args[3] as any).people_bucket === '5_plus')).toBe(true);
});

test('маршруты не дают горизонтальный скролл на 402 и 1280 px', async ({ page }) => {
  for (const width of [402, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/routes/', ROUTE, '/my/']) {
      await page.goto(path);
      const sizes = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(sizes.scroll, `${path} @ ${width}px`).toBeLessThanOrEqual(sizes.client + 1);
    }
  }
});
