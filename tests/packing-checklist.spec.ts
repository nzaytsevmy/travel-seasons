import { test, expect, type Page } from '@playwright/test';

// Функциональный тест чек-листа сборов. Ловит потерю работы человека: галочки
// сохраняются в localStorage, а ФИЛЬТРЫ — нигде. Вернувшись на страницу, человек
// получает дефолтный пресет (неделя / взрослый / самолёт), пункты его набора
// скрыты вместе с отметками, а «Собрано N из M» считает только видимое и потому
// показывает другое число.
// Компонент стоит на 890 страницах, раздел /packing/ даёт половину трафика из Google.
// На страницах /packing/<страна>/<месяц>/ ось «тип поездки» заблокирована пресетом,
// поэтому переключаем то, что там реально есть: длительность, кто едет, транспорт.

const PAGE = '/packing/japan/july/';
const STORAGE_UID = 'pmu-japan-july';
// Пункты, которых нет в дефолтном наборе (неделя / взрослый / самолёт) и которые
// появляются при «месяц + с детьми + на машине». Возраст ребёнка оставляем дефолтный,
// иначе часть пунктов зависит ещё и от него.
const KIDS_ONLY = ['kids-clothes', 'kids-toys'];

async function clearState(page: Page) {
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) if (k.startsWith('pck:')) localStorage.removeItem(k);
  });
}

// Радио спрятано под стилизованный чип — кликаем по подписи, как это делает человек.
const chip = (page: Page, axis: string, value: string) =>
  page.locator(`.pck label.pck-chip:has(input[data-filter="${axis}"][value="${value}"])`).first();

const radio = (page: Page, axis: string, value: string) =>
  page.locator(`.pck input[data-filter="${axis}"][value="${value}"]`).first();

test.describe('Чек-лист сборов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await clearState(page);
    await page.reload();
  });

  test('фильтры и отметки переживают перезагрузку', async ({ page }) => {
    await chip(page, 'duration', 'month').click();
    await chip(page, 'who', 'kids').click();
    await chip(page, 'transport', 'car').click();

    for (const id of KIDS_ONLY) {
      const cb = page.locator(`.pck .pck-cb[data-item="${id}"]`).first();
      await expect(cb).toBeVisible();
      await cb.check();
    }
    const progressBefore = (await page.locator('.pck-progress-txt').first().textContent())!.trim();

    await page.reload();

    // 1. Набор фильтров должен вернуться тем же, каким его оставили.
    await expect(radio(page, 'duration', 'month')).toBeChecked();
    await expect(radio(page, 'who', 'kids')).toBeChecked();
    await expect(radio(page, 'transport', 'car')).toBeChecked();

    // 2. Отмеченные пункты на месте и видимы, а не спрятаны сменой набора.
    for (const id of KIDS_ONLY) {
      const cb = page.locator(`.pck .pck-cb[data-item="${id}"]`).first();
      await expect(cb).toBeVisible();
      await expect(cb).toBeChecked();
    }

    // 3. Прогресс не врёт: то же число из того же знаменателя.
    await expect(page.locator('.pck-progress-txt').first()).toHaveText(progressBefore);
  });

  test('уже сохранённые отметки старого формата не теряются', async ({ page }) => {
    // Обратная совместимость: до правки ключ выглядел так и уже лежит у людей в браузере.
    await page.evaluate((uid) => localStorage.setItem(`pck:${uid}:passport-int`, '1'), STORAGE_UID);
    await page.reload();
    await expect(page.locator('.pck .pck-cb[data-item="passport-int"]').first()).toBeChecked();
  });
});
