import { test, expect } from './browser-fixture';

const asRub = (value: string) => Number(value.replace(/[^0-9]/g, ''));

test.beforeEach(async ({ page }) => {
  await page.route(/mc\.yandex\.ru|analytics\.ahrefs\.com|googletagmanager|google-analytics/, route => route.abort());
});

test.describe('примеры бюджета без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('поисковик получает примеры, условия и даты вместе с HTML', async ({ page }) => {
    const response = await page.request.get('/calculator/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    for (const slug of ['turkey', 'egypt', 'thailand']) expect(html).toMatch(new RegExp(`data-example=["']${slug}["']`));
    await page.goto('/calculator/');
    await expect(page.locator('h1')).toHaveText('Калькулятор бюджета поездки');
    await expect(page.locator('#budget-examples .tc-example')).toHaveCount(3);
    await expect(page.locator('#budget-examples')).toContainText('7 дней');
    await expect(page.locator('#budget-examples')).toContainText('без запаса');
    await expect(page.locator('#budget-examples')).toContainText('Не учтены транспорт на месте');
    for (const example of await page.locator('.tc-example').all()) {
      expect(asRub(await example.locator('[data-example-total]').innerText())).toBeGreaterThan(0);
      const date = example.locator('.tc-example-date time');
      if (await date.count()) await expect(date).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
      else await expect(example.locator('.tc-example-date')).toContainText(/дата/i);
    }
    await expect(page.locator('.tc-sources a[href*="cbr.ru"]')).toHaveCount(1);
    await expect(page.locator('.tc-sources time[datetime]')).toHaveCount(3);
    await expect(page.locator('.tc-sources')).toContainText('не предложения на конкретные даты');
  });
});

test('неподтверждённая дата не показывается как свежая оценка', async ({ page }) => {
  await page.route('**/calculator/**', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script\b[^>]*\bid="calculatorData"[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, open, json, close) => {
        const data = JSON.parse(json);
        data.priceIdxToRecorded[0] = null;
        return open + JSON.stringify(data).replace(/</g, '\\u003c') + close;
      },
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/calculator/?r=0&d=7&l=0&c=rub&t=1');
  await expect(page.locator('.tc-source-date')).toContainText('дата записи справочных оценок не подтверждена', { ignoreCase: true });
  await expect(page.locator('.tc-source-date time')).toHaveCount(0);
});

test('примеры совпадают с интерактивным калькулятором и помещаются на экране', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('tt_consent', 'denied'));
  await page.goto('/calculator/');
  const values = await page.locator('.tc-example').evaluateAll(elements => elements.map(element => ({
    index: element.getAttribute('data-price-index'),
    displayed: element.querySelector('[data-example-total]')!.textContent!,
    costs: Array.from(element.querySelectorAll('[data-cost]'), item => ({
      id: item.getAttribute('data-cost'), displayed: item.textContent!,
    })),
  })));
  expect(values).toHaveLength(3);
  for (const example of values) {
    expect(example.index).toMatch(/^\d+$/);
    await page.goto(`/calculator/?r=${example.index}&d=7&l=0&c=rub&t=1`);
    await expect(page.locator('.tc-hero-amount')).toBeVisible();
    expect(asRub(await page.locator('.tc-hero-amount').innerText())).toBe(asRub(example.displayed));
    await expect(page.locator('.tc-source-date')).toContainText('не дата проверки рыночных цен');
    await expect(page.locator('.tc-source-date time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    for (const cost of example.costs) {
      const row = page.locator('.tc-expense').filter({ has: page.locator(`#cost-${cost.id}`) });
      expect(asRub(await row.locator('.tc-expense-actions > span').innerText())).toBe(asRub(cost.displayed));
    }
  }
  await page.locator('#addCountrySelect').selectOption(values[0].index!);
  await expect(page.locator('.tc-cmp-card .tc-source-date')).toHaveCount(2);
  await expect(page.locator('.tc-cmp-card .tc-source-date time')).toHaveCount(2);
  await page.locator('.tc-cmp-remove').click();
  await expect(page.locator('.tc-single .tc-source-date')).toHaveCount(1);
  await page.locator('#cost-hotel').fill('12345');
  await page.locator('.tc-source-date a').click();
  await expect(page).toHaveURL(/#sources-title$/);
  await expect(page.locator('#sources-title')).toBeVisible();
  await expect(page.locator('#sources-title')).toBeFocused();
  await expect(page.locator('#cost-hotel')).toHaveValue('12345');
  await page.reload();
  await expect(page.locator('#cost-hotel')).toHaveValue('12345');
  await page.goBack();
  await expect(page.locator('#cost-hotel')).toHaveValue('12345');
  for (const width of [360, 402, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.locator('.tc-example, .tc-sources, .tc-examples-note').evaluateAll(elements =>
      elements.map(element => ({ scroll: element.scrollWidth, width: element.clientWidth })));
    for (const item of geometry) expect(item.scroll, `${width}px`).toBeLessThanOrEqual(item.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px`).toBeLessThanOrEqual(width + 1);
    const overlaps = await page.locator('.tc-single').evaluate(element => {
      const a = element.querySelector('.tc-source-date')!.getBoundingClientRect();
      const b = element.querySelector('.tc-finances')!.getBoundingClientRect();
      return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    });
    expect(overlaps, `${width}px: дата и суммы перекрываются`).toBe(false);
    if (info.project.name === 'chromium-desktop' && [402, 768, 1280].includes(width)) {
      await page.locator('#examples-title').scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`examples-${width}.png`) });
    }
    if (info.project.name === 'chromium-desktop' && [402, 1280].includes(width)) {
      await page.locator('#sources-title').scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`sources-${width}.png`) });
    }
  }
});
