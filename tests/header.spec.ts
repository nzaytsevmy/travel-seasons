import { test, expect } from '@playwright/test';

/**
 * Прицельная проверка шапки.
 *
 * ⛔ Зачем отдельно от визуального прогона. Тот сравнивает страницу целиком с
 *    допуском в 2% пикселей, а шапка на длинной статье занимает полпроцента
 *    площади: 26.08.2026 меню было переписано целиком — девять пунктов стали
 *    четырьмя, — и все 106 снимков остались зелёными. То есть шапку и подвал
 *    на длинных страницах пиксельный прогон не охраняет вовсе. Здесь смотрим
 *    саму шапку и её поведение, а не долю изменившихся точек.
 */

const ОЖИДАЕМЫЕ = ['Куда поехать', 'Визы', 'Сборы', 'Статьи'];
const ВНУТРИ = ['Все направления', 'По месяцам', 'Сезоны', 'Сравнить',
                'Что взять', 'Сколько стоит', 'Гайды и разборы', 'Новости'];

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'инвариант шапки — один прогон');
});

test('1. верхний уровень: те пункты и в том порядке', async ({ page }) => {
  await page.goto('/');
  const пункты = await page.locator('.sw-head nav > ul > li').evaluateAll((li) =>
    li.map((e) => (e.querySelector('summary') || e.querySelector('a'))!.textContent!.replace(/\s+/g, ' ').trim()));
  expect(пункты, 'состав и порядок шапки').toEqual(ОЖИДАЕМЫЕ);
});

test('2. пунктов не больше пяти', async ({ page }) => {
  await page.goto('/');
  const n = await page.locator('.sw-head nav > ul > li').count();
  // Медиана по тринадцати разобранным travel-сайтам — пять. Больше семи было
  // только у Т—Ж, и там ровно та же болезнь: рубрики по разным основаниям.
  expect(n, 'верхний уровень не разрастается').toBeLessThanOrEqual(5);
});

test('3. ни один раздел не потерялся из навигации', async ({ page }) => {
  await page.goto('/');
  const адреса = await page.locator('.sw-head nav a').evaluateAll((a) =>
    a.map((e) => new URL((e as HTMLAnchorElement).href).pathname));
  // ⛔ Уводить раздел с глаз можно, терять — нельзя: страница без ссылок
  //    выпадает из обхода и перестаёт получать посетителей.
  for (const надо of ['/countries/', '/visa/', '/seasons/', '/trips/',
                      '/calculator/', '/compare/', '/packing/', '/novosti/', '/blog/']) {
    expect(адреса, `раздел ${надо} есть в шапке`).toContain(надо);
  }
});

test('4. у каждого вложенного пункта есть пояснение', async ({ page }) => {
  await page.goto('/');
  const без = await page.locator('.sw-head .sub a').evaluateAll((a) =>
    a.filter((e) => !(e.querySelector('.s-d')?.textContent || '').trim())
     .map((e) => e.textContent!.trim()));
  expect(без, 'название без пояснения не даёт понять, что за ним').toEqual([]);
});

test('5. все обещанные пункты на месте', async ({ page }) => {
  await page.goto('/');
  const тексты = await page.locator('.sw-head .sub .s-n').evaluateAll((e) =>
    e.map((x) => x.textContent!.trim()));
  expect(тексты.sort(), 'состав вложенных пунктов').toEqual([...ВНУТРИ].sort());
});

test('6. списки раскрываются нажатием и не требуют наведения', async ({ page }) => {
  await page.goto('/');
  const группа = page.locator('.sw-head details.grp').first();
  await expect(группа.locator('.sub')).toBeHidden();
  await группа.locator('summary').click();
  await expect(группа.locator('.sub')).toBeVisible();
  await группа.locator('summary').click();
  await expect(группа.locator('.sub')).toBeHidden();
});

test('7. ни один список не вылезает за экран', async ({ page }) => {
  for (const w of [1280, 1100, 960]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('/');
    const n = await page.locator('.sw-head details.grp').count();
    for (let i = 0; i < n; i++) {
      const d = page.locator('.sw-head details.grp').nth(i);
      await d.locator('summary').click();
      const вылез = await page.evaluate(() => {
        const s = document.querySelector('.sw-head details[open] .sub');
        if (!s) return null;
        const b = s.getBoundingClientRect();
        return (b.right > innerWidth + 1 || b.left < -1) ? Math.round(b.right) : null;
      });
      expect(вылез, `ширина ${w}: список ${i + 1} помещается`).toBeNull();
      await d.locator('summary').click();
    }
  }
});

test('8. на телефоне шапка не едет вбок, списки внутри бургера', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 850 });
  await page.goto('/');
  await page.locator('#burger').click();
  await page.locator('.sw-head details.grp').first().locator('summary').click();
  const r = await page.evaluate(() => {
    const s = document.querySelector('.sw-head details[open] .sub')!.getBoundingClientRect();
    return {
      вбок: document.documentElement.scrollWidth > innerWidth,
      всплывает: getComputedStyle(document.querySelector('.sw-head details[open] .sub')!).position !== 'static',
      ширина: Math.round(s.width),
    };
  });
  expect(r.вбок, 'страница не едет вбок').toBe(false);
  expect(r.всплывает, 'в бургере список разворачивается внутрь, а не всплывает').toBe(false);
});

test('9. нажимаемое не мельче 44 точек', async ({ page }) => {
  for (const w of [402, 1280]) {
    await page.setViewportSize({ width: w, height: 850 });
    await page.goto('/');
    if (w < 900) await page.locator('#burger').click();
    const n = await page.locator('.sw-head details.grp').count();
    for (let i = 0; i < n; i++) await page.locator('.sw-head details.grp').nth(i).locator('summary').click();
    const мелкие = await page.evaluate(() =>
      [...document.querySelectorAll('.sw-head nav a, .sw-head summary, .sw-head #burger')]
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 44; })
        .map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20)));
    expect(мелкие, `ширина ${w}: пальцем попадают все цели`).toEqual([]);
  }
});

test('10. открытый раздел подсвечен, в том числе из вложенного', async ({ page }) => {
  // Человек должен видеть, где он находится, даже когда открыл страницу
  // из глубины группы, а не сам пункт меню.
  await page.goto('/seasons/');
  const подсвечена = await page.locator('.sw-head details.grp.on summary').first().textContent();
  expect((подсвечена || '').trim(), 'группа «Куда поехать» подсвечена на странице сезонов')
    .toContain('Куда поехать');
});
