import { test, expect } from './browser-fixture';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRAVEL_PREP_PILOT } from '../src/data/travel-prep-pilot.js';

test('the ten pilot pages render in initial HTML without changing control templates', () => {
  expect(new Set(TRAVEL_PREP_PILOT).size).toBe(10);
  const load = (url: string) => readFileSync(join('dist', url, 'index.html'), 'utf8');
  for (const path of TRAVEL_PREP_PILOT) {
    const html = load(path);
    expect(html, path).toMatch(/data-prep-(opening|catalog)/);
    expect(html, path).toContain(`rel="canonical" href="https://traveltribe.ru${path}"`);
  }
  for (const path of ['/packing/egypt/january/', '/packing/japan/', '/visa/turkey/', '/visa/karelia/']) {
    expect(load(path), path).not.toMatch(/data-prep-(opening|catalog)/);
  }
});

test('packing catalogue finds the right month, handles no results and resets', async ({ page }) => {
  await page.goto('/packing/');
  const search = page.getByRole('searchbox', { name: 'Поиск страны' });
  await search.fill('Египет');
  await page.getByLabel('Месяц поездки').selectOption('december');
  await expect(page.locator('#pl-search-count')).toContainText('Найдено 1');
  await expect(page.locator('#pl-all-list a:visible')).toHaveAttribute('href', '/packing/egypt/december/');
  await search.fill('Киргизия');
  await page.getByLabel('Месяц поездки').selectOption('january');
  await expect(page.locator('#pl-all-list a:visible')).toHaveCount(0);
  await expect(page.locator('#pl-empty')).toBeVisible();
  await search.fill('Алтай');
  await expect(page.locator('#pl-all-list a:visible')).toHaveAttribute('href', '/packing/altai/january/');
  await expect(page.locator('#pl-all-list .pl-all-item:visible .pl-all-tag')).toHaveText('Зима, мороз');
  await search.fill('неттакогонаправления');
  await expect(page.locator('#pl-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить' }).click();
  await expect(search).toBeFocused();
  await expect(page.locator('#pl-search-count')).toContainText('Все 77');
});

test('pilot checklist restores family selections and supports copy and print', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('testChecklistSeeded')) {
      localStorage.setItem('pck:pmu-egypt-december:passport-int', '1');
      sessionStorage.setItem('testChecklistSeeded', '1');
    }
    window.print = () => { document.documentElement.dataset.testPrint = 'called'; };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => {
        if (document.documentElement.dataset.testClipboard !== 'allow') throw new Error('denied');
        document.documentElement.dataset.testClipboard = value;
      } },
    });
  });
  await page.goto('/packing/egypt/december/');
  await page.getByRole('link', { name: 'Открыть чек-лист' }).click();
  const section = page.locator('#packing-checklist');
  await section.getByText('Настроить список', { exact: true }).click();
  const family = section.locator('input[data-filter="who"][value="kids"]');
  await section.getByText('С ребёнком', { exact: true }).click();
  const item = section.locator('.pck-item:visible input[data-item="passport-int"]');
  await expect(item).toBeChecked();
  await item.uncheck();
  await item.check();
  await page.goto('/packing/egypt/december/');
  await expect(item).toBeChecked();
  await expect(family).toBeChecked();
  await expect(section.getByText('Детская одежда по погоде', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Скопировать список' }).click();
  const copy = section.getByRole('textbox', { name: 'Скопируйте список вручную' });
  await expect(copy).toBeFocused();
  await expect(copy).toHaveValue(/\[x\] Загранпаспорт/);
  await page.locator('html').evaluate((element) => { element.dataset.testClipboard = 'allow'; });
  await section.getByRole('button', { name: 'Скопировать список' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-test-clipboard', /\[x\] Загранпаспорт/);
  await expect(copy).toBeHidden();
  await section.getByRole('button', { name: 'Печать' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-test-print', 'called');
  await page.emulateMedia({ media: 'print' });
  await expect(section.getByRole('button', { name: 'Печать' })).toBeHidden();
  await expect(section.locator('.pck-print-title')).toHaveText('Сборы в Египет в декабре');
  await expect(section.locator('.pck-print-title')).toBeVisible();
  await expect(section.locator('.pck-item:visible').first()).toBeVisible();
  await expect(section.locator('.pck-cta')).toBeHidden();
  await expect(page.locator('main .prep-opening')).toBeHidden();
});

test('visa catalogue keeps deep-link filters and a useful no-JS response', async ({ page, browser, baseURL }) => {
  await page.goto('/visa/?visa=domestic');
  await expect(page.locator('#visaFilterCount')).toContainText('4');
  await expect(page.locator('.va-card:visible')).toHaveCount(4);
  await page.goto('/visa/?cost=cheap&dur=long');
  await expect(page.locator('.va-extra')).toHaveAttribute('open', '');
  await expect(page.locator('#visaFilterCount')).toContainText(/До\s+\$50/);
  await expect(page.locator('#visaFilterCount')).toContainText('60+ дней');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const plain = await context.newPage();
    await plain.goto('/visa/');
    await expect(plain.locator('a.va-card[href="/visa/japan/"]')).toBeVisible();
    await plain.goto('/visa/dagestan/');
    await expect(plain.getByRole('heading', { level: 1 })).toContainText('Дагестан');
    await expect(plain.locator('[data-prep-opening]')).toContainText('загранпаспорт не нужен');
    await expect(plain.locator('[data-prep-official]')).toHaveAttribute('href', /^https:\/\//);
    await plain.goto('/visa/thailand/');
    await expect(plain.getByText(/при\s+пересадке\s+без\s+прохождения\s+иммиграционного\s+контроля/iu)).toBeVisible();
    await expect(plain.getByRole('link', { name: 'Заполнить карту прибытия' })).toHaveAttribute('href', 'https://tdac.immigration.go.th/');
    await plain.goto('/packing/');
    await expect(plain.locator('#pl-all-list a[href="/packing/thailand/"]')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('visa catalogue prioritises country search without decorative counters', async ({ page }) => {
  await page.goto('/visa/');
  await expect(page.locator('#visaFilterCount')).toBeHidden();
  await expect(page.locator('.va-section-count, .va-card-num, .va-chip-n, .va-related-num')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Уточнить правила');
  const search = page.getByRole('searchbox', { name: 'Поиск страны' });
  await search.fill('Япония');
  await expect(page.locator('.va-card:visible')).toHaveCount(2);
  expect(await page.locator('.va-card:visible').last().evaluate((card) =>
    card.getBoundingClientRect().bottom <= document.querySelector('.va-money-row')!.getBoundingClientRect().top)).toBe(true);
  await expect(page.locator('#visaFilterCount')).toContainText('Япония');
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page.locator('.va-card:visible')).toHaveCount(77);
  await page.getByLabel('Условия въезда', { exact: true }).selectOption('domestic');
  await expect(page.locator('.va-card:visible')).toHaveCount(4);
  await search.fill('несуществующая страна');
  await expect(page.locator('#visaEmpty')).toBeVisible();
  await expect(page.locator('.va-money-row')).toBeHidden();
  await expect(page.locator('.va-card:visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(page.locator('.va-card:visible')).toHaveCount(77);
});
