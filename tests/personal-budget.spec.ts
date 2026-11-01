import { test, expect } from './browser-fixture';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';

const index = (slug: string) => PRICES.findIndex(p => p.name === DIRECTIONS.find(d => d.slug === slug)?.price?.name);
const money = (s: string | null) => Number((s || '').replace(/[^0-9]/g, ''));
const costs = { flight: '10000', hotel: '1000', food: '500', entry: '0', transport: '2000', activities: '0', insurance: '1000', other: '0' };

test('личный бюджет: ночи, номера, оплаченное, валюта, сохранение и ссылка', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__budgetEvents = [];
    document.addEventListener('tt:calculator-event', e => (window as any).__budgetEvents.push((e as CustomEvent).detail));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copied = text; } } });
  });
  await page.goto(`/calculator/?r=${index('dagestan')}&d=7&t=2`);
  expect(await page.evaluate(() => (window as any).__budgetEvents)).toEqual([]);
  await page.locator('#personalNights').fill('6');
  await page.locator('#personalRooms').fill('2');
  await page.locator('#cost-flight').focus();
  for (const [id, value] of Object.entries(costs)) await page.locator(`#cost-${id}`).fill(value);
  await expect(page.locator('.tc-hero-label')).toHaveText('Оценка поездки');
  expect(money(await page.locator('.tc-hero-amount').textContent())).toBe(32000);
  expect(money(await page.locator('[data-total=remaining]').textContent())).toBe(35200);
  await page.locator('[data-paid=flight]').check();
  expect(money(await page.locator('.tc-hero-amount').textContent())).toBe(32000);
  expect(money(await page.locator('[data-total=paid]').textContent())).toBe(10000);
  expect(money(await page.locator('[data-total=remaining]').textContent())).toBe(24200);
  await page.locator('[data-cur=usd]').click();
  await page.locator('[data-cur=rub]').click();
  await expect(page.locator('#cost-flight')).toHaveValue('10000');
  expect(money(await page.locator('[data-total=remaining]').textContent())).toBe(24200);
  await page.locator('#copyTgBtn').click();
  expect(await page.evaluate(() => (window as any).__copied)).toContain('Оплачено: 10');
  await page.locator('#saveBudgetBtn').click();
  await expect(page.locator('#calcNotice')).toContainText('сохранён');
  await page.locator('#shareBudgetBtn').click();
  const shared = await page.evaluate(() => (window as any).__copied);
  expect(shared).toContain('#budget=');
  const events = await page.evaluate(() => (window as any).__budgetEvents);
  expect(events.filter((x: any) => x.action === 'start')).toHaveLength(1);
  expect(events.filter((x: any) => x.action === 'result')).toHaveLength(1);
  for (const e of events) expect(Object.keys(e).sort()).toEqual(['action', 'destination', 'mode', 'version']);
  await page.goto('/calculator/');
  await expect(page.locator('#cost-flight')).toHaveValue('10000');
  await expect(page.locator('[data-paid=flight]')).toBeChecked();
  await page.goto(`/calculator/?r=${index('georgia')}`);
  await expect(page.locator('[data-paid=flight]')).not.toBeChecked();
  await expect(page.locator('.tc-hero-label')).toHaveText('Известная часть бюджета');
  await expect(page.locator('[data-exclude=insurance]')).toHaveCount(0);
  await page.goto(shared);
  await expect(page.locator('#personalNights')).toHaveValue('6');
  expect(money(await page.locator('[data-total=remaining]').textContent())).toBe(24200);
});

test('сравнение хранит расходы отдельно; неизвестное можно явно исключить или задать ноль', async ({ page }) => {
  await page.goto(`/calculator/?r=${index('dagestan')}`);
  await page.locator('#cost-flight').fill('12345');
  await page.locator('#addCountrySelect').selectOption(String(index('georgia')));
  await page.locator(`[data-edit="${index('georgia')}"]`).click();
  await expect(page.locator('#cost-flight')).not.toHaveValue('12345');
  await page.locator('#cost-flight').fill('23456');
  await page.locator(`[data-edit="${index('dagestan')}"]`).click();
  await expect(page.locator('#cost-flight')).toHaveValue('12345');
  await page.locator('.tc-cmp-remove').click();
  for (const id of ['transport', 'activities', 'insurance']) await page.locator(`[data-exclude=${id}]`).check();
  await page.locator('#cost-other').fill('0');
  await expect(page.locator('.tc-hero-label')).toHaveText('Оценка поездки');
  await page.locator('#cost-other').fill('');
  await expect(page.locator('.tc-incomplete')).toContainText('прочие расходы');
});

test('неверная сумма блокирует сохранение; отказ storage и clipboard даёт рабочий выход', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('unavailable'); } } });
    Storage.prototype.setItem = () => { throw new Error('unavailable'); };
  });
  await page.goto(`/calculator/?r=${index('dagestan')}`);
  await page.locator('#cost-flight').fill('-1');
  await expect(page.locator('#cost-flight')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#saveBudgetBtn').click();
  await expect(page.locator('#calcNotice')).toContainText('Проверь');
  await page.locator('#cost-flight').fill('25000,50');
  await page.locator('#saveBudgetBtn').click();
  await expect(page.locator('#calcNotice')).toContainText('не удалось');
  await page.locator('#shareBudgetBtn').click();
  await expect(page.getByRole('textbox', { name: 'Текст для копирования' })).toHaveValue(/#budget=/);
});

test('расходы и итог доступны на телефоне, планшете и широком экране', async ({ page }, info) => {
  for (const width of [402, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/calculator/?r=${index('dagestan')}`);
    await expect(page.locator('.tc-hero-amount')).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      amountBottom: document.querySelector('.tc-hero-amount')!.getBoundingClientRect().bottom,
    }));
    expect(layout.width).toBeLessThanOrEqual(width + 1);
    expect(layout.amountBottom).toBeLessThanOrEqual(900);
    if (info.project.name === 'chromium-desktop') {
      await page.screenshot({ path: info.outputPath(`calculator-${width}.png`) });
    }
    await page.locator('#cost-flight').fill('25000');
    await page.locator('[data-paid=flight]').check();
    await page.locator('#budgetSummaryBtn').click();
    await expect(page.locator('#calcResult')).toBeFocused();
    expect(money(await page.locator('[data-total=paid]').textContent())).toBe(25000);
    expect(page.url()).toContain('#budget=');
    await page.locator('[data-edit]').click();
    await expect(page.locator('#personalNights')).toBeFocused();
    if (info.project.name === 'chromium-desktop') {
      await page.screenshot({ path: info.outputPath(`calculator-expenses-${width}.png`) });
    }
  }
});
