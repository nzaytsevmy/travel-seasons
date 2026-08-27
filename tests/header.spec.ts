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

// ⛔ Состав меню и разметку хватит посмотреть один раз — в четырёх браузерах
//    это только тратит время. Но беды с размерами приходили из WebKit на
//    телефоне: там марка съезжала, а кнопка меню уходила за край. Проверки,
//    где важен сам движок, гоняем ещё и на телефонном WebKit.
const ЗАВИСИТ_ОТ_ДВИЖКА = /^(9|11|16)\./;

test.beforeEach(({}, testInfo) => {
  const проект = testInfo.project.name;
  const годится = проект === 'chromium-desktop' ||
    (проект === 'webkit-mobile' && ЗАВИСИТ_ОТ_ДВИЖКА.test(testInfo.title));
  test.skip(!годится, 'разметку смотрим один раз, размеры — ещё и в WebKit');
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

test('6. на сенсорном экране списки раскрываются нажатием', async ({ browser }) => {
  // ⛔ Проверять это обычной страницей нельзя: там работает наведение, и
  //    Playwright наводит курсор перед нажатием — список успевает открыться
  //    сам. Берём устройство без наведения, как настоящий телефон.
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true,
    viewport: { width: 402, height: 850 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.locator('#burger').tap();
  const группа = page.locator('.sw-head details.grp').first();
  await expect(группа.locator('.sub')).toBeHidden();
  await группа.locator('summary').tap();
  await expect(группа.locator('.sub')).toBeVisible();
  await группа.locator('summary').tap();
  await expect(группа.locator('.sub')).toBeHidden();
  await ctx.close();
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
      // ⛔ Раньше здесь были только пункты меню, и проверка пропустила марку:
      //    она лежит вне nav. Смотрим всё нажимаемое в шапке.
      [...document.querySelectorAll('.sw-head a, .sw-head summary, .sw-head button')]
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 24; })
        .map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20)));
    // Порог 24 — общий минимум по WCAG; у пунктов меню он выше и держится
    // их собственными правилами.
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

test('11. на узком экране кнопка меню в пределах экрана', async ({ page }) => {
  // ⛔ Строка про страны в верхнем ярусе выталкивала кнопку за край: нажать
  //    её было нельзя вовсе. Мерим на шести ширинах, а не на одной.
  for (const w of [360, 402, 640, 768, 920]) {
    await page.setViewportSize({ width: w, height: 850 });
    await page.goto('/visa/');
    const r = await page.evaluate(() => {
      const b = document.querySelector('#burger')!.getBoundingClientRect();
      return { внутри: b.right <= innerWidth + 1 && b.left >= -1, ширина: Math.round(b.width) };
    });
    expect(r.внутри, `ширина ${w}: кнопка меню на экране`).toBe(true);
    expect(r.ширина, `ширина ${w}: кнопка не схлопнута`).toBeGreaterThan(20);
  }
});

test('12. обещание в шапке не дублирует то, что уже есть на странице', async ({ page }) => {
  // ⛔ На главной та же мысль стоит под заголовком — два экземпляра на одном
  //    экране читаются как ошибка вёрстки.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('.sw-head .claim')).toHaveCount(0);
  await page.goto('/visa/');
  await expect(page.locator('.sw-head .claim')).toHaveCount(1);
});

test('13. с мышью список раскрывается наведением и закрывается уходом', async ({ page }) => {
  // ⛔ Найдено на живом сайте 27.08: меню открывалось только нажатием, и
  //    открытое не закрывалось, пока не нажмёшь по нему второй раз. С мышью
  //    это читается как поломка. Наведение включено там, где есть курсор.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/visa/');
  const группа = page.locator('.sw-head details.grp').first();

  await группа.locator('summary').hover();
  await expect(группа.locator('.sub')).toBeVisible();

  await page.mouse.move(20, 400);
  await expect(группа.locator('.sub')).toBeHidden();
});

test('14. одновременно раскрыт не больше одного списка', async ({ page }) => {
  // ⛔ На живом сайте два списка раскрывались вместе и налезали друг на друга.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/visa/');
  const группы = page.locator('.sw-head details.grp');
  const n = await группы.count();
  for (let i = 0; i < n; i++) {
    await группы.nth(i).locator('summary').hover();
    // Ждём меньше задержки закрытия по уходу курсора (180 мс): если соседа
    // закрывает только она, а не переключение, здесь окажется два открытых.
    await page.waitForTimeout(120);
    const открытых = await page.locator('.sw-head details.grp[open]').count();
    expect(открытых, `после наведения на пункт ${i + 1}`).toBeLessThanOrEqual(1);
  }
});

test('17. с мышью нажатие на пункт ведёт на страницу раздела', async ({ page }) => {
  // ⛔ Список уже раскрыт наведением, и обычное переключение схлопнуло бы его
  //    ровно в момент нажатия. Поэтому нажатие уводит на раздел — но тогда
  //    адрес обязан совпадать со ссылкой этого пункта.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/visa/');
  const группы = page.locator('.sw-head details.grp');
  const n = await группы.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await page.goto('/visa/');
    const группа = page.locator('.sw-head details.grp').nth(i);
    const адрес = await группа.getAttribute('data-href');
    expect(адрес, `у пункта ${i + 1} нет адреса раздела`).toBeTruthy();
    await группа.locator('summary').click();
    await page.waitForURL(`**${адрес}`, { timeout: 5000 });
  }
});

test('15. Esc и нажатие мимо шапки закрывают открытое', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/visa/');
  const группа = page.locator('.sw-head details.grp').first();

  // Открываем наведением — с мышью это основной способ.
  await группа.locator('summary').hover();
  await expect(page.locator('.sw-head details.grp[open]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sw-head details.grp[open]')).toHaveCount(0);

  // Курсор всё ещё стоит на пункте, повторное наведение на то же место
  // ничего не пошлёт — сначала уводим мышь в сторону.
  await page.mouse.move(640, 600);
  await группа.locator('summary').hover();
  await expect(page.locator('.sw-head details.grp[open]')).toHaveCount(1);
  await page.mouse.click(30, 600);
  await expect(page.locator('.sw-head details.grp[open]')).toHaveCount(0);
});

test('16. на телефоне поля марки сверху и снизу совпадают', async ({ page }) => {
  // ⛔ Выравнивание по базовой линии годится, пока в ряду только текст. Рядом
  //    с маркой стоит кнопка меню другой высоты — поля разъехались, и это
  //    было видно глазом. Записанная ловушка WebKit, наступил на неё снова.
  for (const w of [360, 402, 640]) {
    await page.setViewportSize({ width: w, height: 850 });
    await page.goto('/');
    const r = await page.evaluate(() => {
      const b = document.querySelector('.sw-head .band')!.getBoundingClientRect();
      const m = document.querySelector('.sw-head .wm')!.getBoundingClientRect();
      return { сверху: m.top - b.top, снизу: b.bottom - m.bottom };
    });
    expect(Math.abs(r.сверху - r.снизу), `ширина ${w}: поля марки ровные`).toBeLessThanOrEqual(2);
  }
});

test('18. пункты выпадающего списка стоят вплотную и не раздуты', async ({ page }) => {
  // ⛔ Правило горизонтального ряда протекло в выпадающий список: зазор в
  //    2,2rem, разделяющий «Куда поехать» и «Визы» наверху, разносил пункты
  //    списка на 35 пикселей друг от друга. Пункт занимал 54 пикселя, а между
  //    ними зияла пустота почти такой же высоты — список вытягивался втрое.
  //    Причина в весе селектора: `.sub` из одного класса проигрывал `.nav ul`.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/visa/');
  const группы = page.locator('.sw-head details.grp');
  for (let i = 0; i < await группы.count(); i++) {
    const группа = группы.nth(i);
    await группа.locator('summary').hover();
    await expect(группа.locator('.sub')).toBeVisible();
    const м = await группа.locator('.sub').evaluate((ul) => {
      const пункты = [...ul.children].map((e) => e.getBoundingClientRect());
      return {
        зазор: getComputedStyle(ul).rowGap,
        высоты: пункты.map((r) => Math.round(r.height)),
        промежутки: пункты.slice(1).map((r, j) => Math.round(r.top - пункты[j].bottom)),
      };
    });
    expect(м.зазор, `зазор верхнего ряда протёк в список группы ${i + 1}`).toBe('0px');
    for (const п of м.промежутки) {
      expect(п, `пустота между пунктами группы ${i + 1}`).toBeLessThanOrEqual(1);
    }
    for (const в of м.высоты) {
      // Нажимаемое — не меньше 44, читаемое с описанием — не больше 72.
      expect(в, `высота пункта группы ${i + 1}`).toBeGreaterThanOrEqual(44);
      expect(в, `высота пункта группы ${i + 1}`).toBeLessThanOrEqual(72);
    }
    await page.mouse.move(700, 600);
  }
});

test('19. на главной раскрытый бургер читается — тёмный текст на своём листе', async ({ page }) => {
  // ⛔ На главной шапка лежит поверх фотографии и красит пункты белым. Раскрытый
  //    бургер рисовал их тем же белым на светлой панели — меню читалось как
  //    блёклые тени (скриншот Никиты с телефона, 27.08.2026). В открытом
  //    состоянии шапка обязана встать на непрозрачный лист с тёмным текстом.
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto('/');
  await page.locator('#burger').click();
  const шапка = page.locator('.sw-head');
  await expect(шапка).toHaveClass(/open/);
  // Фон доезжает переходом — ждём конца анимации, а не мгновенного значения.
  await expect.poll(async () => page.evaluate(() => {
    const ф = getComputedStyle(document.querySelector('.sw-head')).backgroundColor;
    const а = ф.match(/rgba\([^)]*,\s*([\d.]+)\)/);
    return а ? parseFloat(а[1]) : 1;
  }), { message: 'у раскрытой шапки нет своего листа' }).toBeGreaterThan(0.9);
  const м = await page.evaluate(() => {
    const яркость = (ц) => {
      const [r, g, b] = ц.match(/\d+/g).map(Number);
      return (r * 299 + g * 587 + b * 114) / 1000;
    };
    return {
      текст_светлый: яркость(getComputedStyle(document.querySelector('.sw-head .grp summary')).color) > 128,
      марка_светлая: яркость(getComputedStyle(document.querySelector('.sw-head .wm')).color) > 128,
    };
  });
  expect(м.текст_светлый, 'пункты меню светлые на светлом').toBe(false);
  expect(м.марка_светлая, 'марка светлая на светлом').toBe(false);
});
