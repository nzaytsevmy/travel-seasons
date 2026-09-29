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
