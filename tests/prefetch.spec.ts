import { test, expect } from './browser-fixture';

test('ошибка фоновой предзагрузки не ломает страницу и переход по ссылке', async ({ page, browserName }) => {
  // WebKit uses fetch for prefetching; Chromium uses a link element.
  test.skip(browserName !== 'webkit', 'Проверяем fetch-предзагрузку WebKit');
  const errors: string[] = [];
  let failedPrefetches = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/legal/privacy/', async route => {
    if (route.request().isNavigationRequest()) return route.continue();
    failedPrefetches += 1;
    await route.abort('failed');
  });

  await page.goto('/countries/');
  const privacy = page.locator('footer a[href="/legal/privacy/"]');
  await privacy.scrollIntoViewIfNeeded();
  await expect.poll(() => failedPrefetches).toBeGreaterThan(0);
  await page.waitForLoadState('networkidle');
  expect(errors, 'Фоновый запрос не должен создавать необработанную ошибку').toEqual([]);

  // Only speculative requests failed. The actual user navigation must still work.
  await privacy.click();
  await expect(page).toHaveURL(/\/legal\/privacy\/$/);
  await expect(page.locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
});


test('отложенная предзагрузка ждёт возврата активной страницы', async ({ page }) => {
  await page.addInitScript(() => {
    const supports = DOMTokenList.prototype.supports;
    DOMTokenList.prototype.supports = function (token) {
      return token === 'prefetch' ? false : supports.call(this, token);
    };
    const original = window.fetch.bind(window);
    (window as any).__speculativePrivacyRequests = 0;
    window.fetch = (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
      if (url.pathname === '/legal/privacy/' && init?.priority === 'low') {
        (window as any).__speculativePrivacyRequests++;
      }
      return original(input, init);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/countries/');
  // Allow the prefetch module to install its lifecycle and viewport observers.
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => (window as any).__speculativePrivacyRequests)).toBe(0);
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    document.querySelector('footer a[href="/legal/privacy/"]')!.scrollIntoView();
  });
  // The actual viewport callback waits 300 ms; exercise it while the page is inactive.
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as any).__speculativePrivacyRequests), 'Закрывающийся документ не начинает фоновый запрос').toBe(0);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect.poll(() => page.evaluate(() => (window as any).__speculativePrivacyRequests)).toBeGreaterThan(0);
  await page.locator('footer a[href="/legal/privacy/"]').click();
  await expect(page).toHaveURL(/\/legal\/privacy\/$/);
  await expect(page.locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('ожидающий переход не запускает предзагрузку старого документа', async ({ page }) => {
  await page.addInitScript(() => {
    const supports = DOMTokenList.prototype.supports;
    DOMTokenList.prototype.supports = function(token) {
      return token === 'prefetch' ? false : supports.call(this, token);
    };
    (window as any).__pendingPrivacyPrefetch = 0;
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
      if (url.pathname === '/legal/privacy/' && init?.priority === 'low') (window as any).__pendingPrivacyPrefetch++;
      return original(input, init);
    };
  });
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  let observed: number | undefined;
  await page.exposeBinding('__pendingPrivacyResult', (_source, count: number) => {
    observed = count;
    release();
  });
  await page.route('**/legal/terms/', async route => {
    if (route.request().isNavigationRequest()) await blocked;
    await route.continue();
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/countries/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      (window as any).navigation.addEventListener('navigate', (event: any) => event.preventDefault(), { once: true });
      location.href = '/legal/terms/';
    });
    await page.locator('footer a[href="/legal/privacy/"]').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => (window as any).__pendingPrivacyPrefetch), {
      message: 'Отмена перехода сохраняет предзагрузку активного документа',
    }).toBeGreaterThan(0);
    await page.goto('/countries/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      // Browser timers keep running while the destination response is pending.
      // Schedule inside this document: Playwright waits for the new context
      // before executing another page.evaluate during a pending navigation.
      setTimeout(() => document.querySelector('footer a[href="/legal/privacy/"]')!.scrollIntoView(), 10);
      setTimeout(() => (window as any).__pendingPrivacyResult((window as any).__pendingPrivacyPrefetch), 700);
      location.href = '/legal/terms/';
    });
    await expect.poll(() => observed, {timeout: 5000}).toBeDefined();
    expect(observed, 'Переход уже начался, хотя pagehide ещё не наступил').toBe(0);
  } finally {
    release();
    await expect(page).toHaveURL(/\/legal\/terms\/$/);
    await expect(page.locator('h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
