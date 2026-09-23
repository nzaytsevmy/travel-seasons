import { test, expect, type Browser, type BrowserContext } from './browser-fixture';

test.describe('Изоляция браузера сохраняет настройки проверки', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({
    viewport: { width: 512, height: 640 },
    locale: 'ru-RU',
    extraHTTPHeaders: { 'X-Playwright': '1', 'X-Fixture-Probe': 'enabled' },
    contextOptions: { reducedMotion: 'reduce' },
  });
  let previousBrowser: Browser | null;
  let previousContext: BrowserContext;

  test('параметры проекта и test.use действуют в новом контексте', async ({ page, context, deviceScaleFactor, userAgent }) => {
    await page.route('**/__fixture_probe__', route => route.fulfill({
      contentType: 'text/html',
      body: '<meta name="viewport" content="width=device-width"><h1>Проверка контекста</h1>',
    }));
    const response = await page.goto('/__fixture_probe__');
    expect(response?.request().headers()['x-fixture-probe']).toBe('enabled');
    expect(response?.request().headers()['x-playwright']).toBe('1');
    const actual = await page.evaluate(() => ({
      width: innerWidth, language: navigator.language, dpr: devicePixelRatio,
      date: new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-02-17T00:00:00Z')),
      expectedDate: new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-02-17T00:00:00Z')),
      motion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      ua: navigator.userAgent,
    }));
    expect(actual.width).toBe(512);
    // WebKit нормализует ru-RU до ru и с обычной fixture Playwright.
    // Проверяем реальное форматирование фиксированной даты, а не имя алиаса.
    expect(actual.language.split('-')[0]).toBe('ru');
    expect(actual.date).toBe(actual.expectedDate);
    expect(actual.dpr).toBe(deviceScaleFactor ?? 1);
    expect(actual.motion).toBe(true);
    if (userAgent) expect(actual.ua).toBe(userAgent);
    previousBrowser = context.browser();
    previousContext = context;
  });

  test('следующий тест получает новый контекст, а на Mac — новый процесс браузера', async ({ context }) => {
    expect(context).not.toBe(previousContext);
    expect(previousContext.pages()).toHaveLength(0);
    if (process.platform === 'darwin') {
      expect(previousBrowser?.isConnected()).toBe(false);
      expect(context.browser()).not.toBe(previousBrowser);
    }
  });
});
