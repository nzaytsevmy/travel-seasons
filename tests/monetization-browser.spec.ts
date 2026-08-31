import { test, expect } from '@playwright/test';

async function freezeInsideAaWindow(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const RealDate = Date;
    (globalThis as any).Date = new Proxy(RealDate, {
      construct(target, args) {
        return Reflect.construct(target, args.length ? args : ['2026-09-10T12:00:00Z']);
      },
    });
  });
}

const samples = [
  { path: '/packing/turkey/september/', type: 'packing_month', intent: 'high', destination: 'turkey' },
  { path: '/trips/july/georgia/', type: 'trips_country_month', intent: 'high', destination: 'georgia' },
  { path: '/visa/japan/', type: 'visa_country', intent: 'high', destination: 'japan' },
  { path: '/blog/georgia-guide-2026/', type: 'blog_article', intent: 'medium', destination: 'georgia' },
  { path: '/novosti/2026-08-30-eagle-migration-russia-uganda/', type: 'news_article', intent: 'none', destination: '' },
];

for (const sample of samples) {
  test(`денежный контракт страницы: ${sample.path}`, async ({ page }) => {
    await page.goto(sample.path);
    await expect(page.locator('body')).toHaveAttribute('data-page-type', sample.type);
    await expect(page.locator('body')).toHaveAttribute('data-monetization-intent', sample.intent);
    await expect(page.locator('body')).toHaveAttribute('data-destination', sample.destination);
  });
}

test('каждая партнёрская ссылка получает CTA-level атрибуцию до клика', async ({ page }) => {
  await page.goto('/packing/turkey/september/');
  const result = await page.locator('a[rel~="sponsored"]').evaluateAll((links) => links.map((link) => {
    const anchor = link as HTMLAnchorElement;
    const url = new URL(anchor.href);
    return {
      ctaId: anchor.dataset.ctaId,
      partner: anchor.dataset.partner,
      offer: anchor.dataset.offer,
      placement: anchor.dataset.placement,
      subId: url.searchParams.get('sub_id') || url.searchParams.get('sub1') || url.searchParams.get('utm_content') || url.searchParams.get('sharedID'),
    };
  }));
  expect(result.length).toBeGreaterThan(3);
  for (const link of result) {
    expect(link.ctaId).toMatch(/^[a-z0-9_]{5,64}$/);
    expect(link.partner).toBeTruthy();
    expect(link.offer).toBeTruthy();
    expect(link.placement).toBeTruthy();
    expect(link.subId).toContain(link.ctaId!);
  }
});

test('общие офферы старой статьи уточняются до страны до первого клика', async ({ page }) => {
  await page.goto('/blog/georgia-guide-2026/');
  const links = await page.locator('a[data-deep-link="destination"]').evaluateAll((items) => items.map((item) => ({
    partner: (item as HTMLAnchorElement).dataset.partner,
    href: (item as HTMLAnchorElement).href,
  })));
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    const url = new URL(link.href);
    const target = url.searchParams.get('u') || url.searchParams.get('redirect') || '';
    expect(target).toMatch(/georgia|грузия/i);
  }
});

test('многострановой материал не маскируется под одну страну', async ({ page }) => {
  await page.goto('/blog/safari-afrika-2026/');
  await expect(page.locator('body')).toHaveAttribute('data-destination', '');
  await expect(page.locator('a[data-deep-link="destination"]')).toHaveCount(0);
});

test('клик отправляет в Метрику полный денежный контекст без персональных данных', async ({ page }) => {
  await freezeInsideAaWindow(page);
  await page.addInitScript(() => {
    (window as any).__goals = [];
    (window as any).ym = (...args: unknown[]) => (window as any).__goals.push(args);
    window.addEventListener('click', (event) => {
      if ((event.target as Element)?.closest?.('a[data-cta-id]')) event.preventDefault();
    }, true);
  });
  await page.goto('/packing/turkey/september/');
  // Нативный dispatch проверяет сам делегированный обработчик и не зависит от
  // того, перекрыл ли первый CTA мобильный sticky-слой в конкретном движке.
  await page.locator('a[data-cta-id]').first().evaluate((anchor) => {
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const goal = await page.evaluate(() => (window as any).__goals.find((args: unknown[]) => args[2] === 'outbound_link'));
  expect(goal?.[0]).toBe(95832375);
  expect(goal?.[1]).toBe('reachGoal');
  expect(goal?.[2]).toBe('outbound_link');
  expect(goal?.[3]).toMatchObject({
    page_type: 'packing_month', intent: 'high', destination: 'turkey',
  });
  expect(goal?.[3].cta_id).toMatch(/^[a-z0-9_]+$/);
  expect(goal?.[3].partner).toBeTruthy();
  expect(goal?.[3].offer).toBeTruthy();
  expect(goal?.[3].placement).toBeTruthy();
  expect(goal?.[3].click_id).toMatch(/^c[a-f0-9]{20}$/);
  expect(goal?.[3].experiment_id).toBe('monetization_aa_click_join_v1');
  expect(goal?.[3].variant).toMatch(/^[ab]$/);
  const clickedHref = await page.locator('a[data-cta-id]').first().getAttribute('href');
  const clickedSubId = new URL(clickedHref!, 'http://127.0.0.1').searchParams.get('sub_id');
  expect(clickedSubId).toContain(`__${goal?.[3].click_id}`);
  expect(JSON.stringify(goal?.[3])).not.toMatch(/email|phone|cookie|user_id|client_id/i);
});

test('A/A назначается до outbound, стабильно на устройстве и новый click id выдаётся на каждый клик', async ({ page }) => {
  await freezeInsideAaWindow(page);
  await page.addInitScript(() => {
    (window as any).__goals = [];
    (window as any).ym = (...args: unknown[]) => (window as any).__goals.push(args);
    window.addEventListener('click', (event) => {
      if ((event.target as Element)?.closest?.('a[data-cta-id]')) event.preventDefault();
    }, true);
  });
  await page.goto('/packing/turkey/september/');
  const firstVariant = await page.locator('body').getAttribute('data-experiment-variant');
  const link = page.locator('a[data-cta-id][data-partner="aviasales"]').first();
  await link.evaluate((anchor) => anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await link.evaluate((anchor) => anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  const goals = await page.evaluate(() => (window as any).__goals);
  const visitParams = goals.find((args: unknown[]) => args[1] === 'params');
  const assignmentIndex = goals.findIndex((args: unknown[]) => args[2] === 'experiment_assignment');
  const outbound = goals.filter((args: unknown[]) => args[2] === 'outbound_link');
  expect(assignmentIndex).toBeGreaterThanOrEqual(0);
  expect((visitParams?.[2] as any)?.monetization_experiment?.monetization_aa_click_join_v1).toBe(firstVariant);
  expect(goals.findIndex((args: unknown[]) => args[2] === 'outbound_link')).toBeGreaterThan(assignmentIndex);
  expect(outbound).toHaveLength(2);
  expect(outbound[0][3].click_id).not.toBe(outbound[1][3].click_id);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-experiment-variant', firstVariant!);
});

test('свой Telegram остаётся отдельной целью и не становится рекламой', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__goals = [];
    (window as any).ym = (...args: unknown[]) => (window as any).__goals.push(args);
    window.addEventListener('click', (event) => {
      if ((event.target as Element)?.closest?.('a[href*="t.me"]')) event.preventDefault();
    }, true);
  });
  await page.goto('/');
  const telegram = page.locator('a[href*="t.me"]').first();
  await expect(telegram).not.toHaveAttribute('rel', /sponsored/);
  await telegram.click();
  const goals = await page.evaluate(() => (window as any).__goals);
  expect(goals.some((args: unknown[]) => args[2] === 'telegram_click')).toBe(true);
  expect(goals.some((args: unknown[]) => args[2] === 'outbound_link')).toBe(false);
});
