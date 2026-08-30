import { test, expect } from '@playwright/test';
import sharp from 'sharp';

/**
 * Первый экран главной.
 *
 * ⛔ Зачем отдельно. Главная помечена в визуальном прогоне как изменчивая
 *    (там живая выдача направлений и месяц), и пиксельный снимок для неё не
 *    делается ВОВСЕ. То есть первый экран не охраняет ничто: 27.08.2026 он был
 *    переделан целиком — вместо текста на светлом листе появился кадр во весь
 *    экран, — и все 431 проверка остались зелёными.
 *
 *    Кадр под текстом ломается иначе, чем обычная вёрстка: он может не
 *    загрузиться, может перекрыть шапку, может стать светлым ровно там, где
 *    стоит белая строка. Поэтому здесь меряем не пиксели, а четыре вещи,
 *    каждая из которых уже случалась в этой правке.
 */

test.beforeEach(({}, testInfo) => {
  test.skip(!['chromium-desktop', 'webkit-mobile'].includes(testInfo.project.name),
    'первый экран смотрим на настольном и телефонном движке');
});

test('1. кадр на первом экране есть и он загрузился', async ({ page }) => {
  await page.goto('/');
  const кадр = page.locator('.manifest > .hero-ph');
  await expect(кадр).toBeVisible();
  const м = await кадр.evaluate((e: HTMLImageElement) => ({
    ширина_файла: e.naturalWidth,
    ширина: Math.round(e.getBoundingClientRect().width),
    высота: Math.round(e.getBoundingClientRect().height),
  }));
  expect(м.ширина_файла, 'кадр не загрузился — файл пустой').toBeGreaterThan(300);
  expect(м.ширина, 'кадр не во всю ширину').toBeGreaterThan(340);
  expect(м.высота, 'кадр слишком низкий для первого экрана').toBeGreaterThan(420);
});

test('2. шапка видна поверх кадра, а не под ним', async ({ page }) => {
  // ⛔ Кадр дважды накрывал шапку целиком: первый раз из-за отрицательного
  //    отступа, второй — из-за собственного слоя наложения у блока.
  await page.goto('/');
  const марка = page.locator('.sw-head .wm');
  await expect(марка).toBeVisible();
  const м = await page.evaluate(() => {
    const wm = document.querySelector('.sw-head .wm')!.getBoundingClientRect();
    const точка = document.elementFromPoint(
      Math.round(wm.x + wm.width / 2), Math.round(wm.y + wm.height / 2));
    return { сверху: Math.round(wm.top), перекрыта: !точка?.closest('.sw-head') };
  });
  expect(м.сверху, 'марка ушла за верх экрана').toBeGreaterThanOrEqual(0);
  expect(м.сверху, 'марка уехала слишком низко').toBeLessThan(120);
  expect(м.перекрыта, 'марку перекрыл кадр — по ней нельзя попасть').toBe(false);
});

test('3. текст поверх кадра читается по контрасту', async ({ page }) => {
  // ⛔ Со слабой вуалью белый заголовок на светлом небе давал 2,35 к 1 при
  //    норме 3,0 для крупного текста, а подпись — 3,90 при норме 4,5.
  //    Средний цвет фона тут врёт: хватает светлого пятна размером в слово.
  await page.goto('/');
  await page.waitForTimeout(600);

  const цели = [
    { имя: 'заголовок', с: '.h1',  норма: 3.0 },
    { имя: 'подпись',   с: '.sub', норма: 4.5 },
    { имя: 'разделы',   с: '.vi-l', норма: 4.5 },
  ];

  for (const ц of цели) {
    const узел = page.locator(ц.с).first();
    if (!(await узел.count())) continue;
    const цвет = await узел.evaluate((e) => getComputedStyle(e).color);
    expect(цвет, `${ц.имя}: цвет поверх кадра обязан быть задан явно`).toMatch(/rgb/);

    const кор = await узел.boundingBox();
    if (!кор || кор.width < 4 || кор.height < 4) continue;

    // Снимаем фон под текстом, спрятав сам текст.
    await узел.evaluate((e) => { (e as HTMLElement).style.visibility = 'hidden'; });
    const снимок = await page.screenshot({
      clip: { x: Math.max(0, кор.x), y: Math.max(0, кор.y),
              width: Math.min(кор.width, 400), height: Math.min(кор.height, 50) },
    });
    await узел.evaluate((e) => { (e as HTMLElement).style.visibility = ''; });

    const к = await худшийКонтраст(снимок, цвет);
    expect(к, `${ц.имя}: контраст к самому светлому месту кадра под ним`)
      .toBeGreaterThanOrEqual(ц.норма);
  }
});

test('4. первый экран не даёт сдвига разметки', async ({ page }) => {
  // Кадр во весь экран — первый подозреваемый в сдвиге: если у него нет
  // заданного места, страница дёргается в момент загрузки.
  await page.goto('/', { waitUntil: 'load' });
  const сдвиг = await page.evaluate(() => new Promise<number>((res) => {
    let сумма = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) сумма += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res(+сумма.toFixed(4)), 2500);
  }));
  expect(сдвиг, 'первый экран дёргает страницу при загрузке').toBeLessThan(0.1);
});

test('5. на телефоне первый экран не уезжает вбок', async ({ page }) => {
  for (const w of [360, 402, 640]) {
    await page.setViewportSize({ width: w, height: 850 });
    await page.goto('/');
    await page.waitForTimeout(400);
    const м = await page.evaluate(() => ({
      вбок: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      портрет: Math.round(document.querySelector('.me-ph')?.getBoundingClientRect().width || 0),
    }));
    expect(м.вбок, `ширина ${w}: страница уехала вбок`).toBe(false);
    expect(м.портрет, `ширина ${w}: портрет автора пропал`).toBeGreaterThanOrEqual(32);
  }
});

/** Худший (самый светлый) участок фона против цвета текста — по формуле WCAG. */
async function худшийКонтраст(png: Buffer, цветТекста: string): Promise<number> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const к = info.channels;
  const текст = яркость(разобратьЦвет(цветТекста));
  let худший = 21;
  for (let i = 0; i + к <= data.length; i += к * 4) {
    const c = контраст(яркость([data[i], data[i + 1], data[i + 2]]), текст);
    if (c < худший) худший = c;
  }
  return худший;
}

function яркость([r, g, b]: number[]): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function контраст(a: number, b: number): number {
  const [св, тм] = a > b ? [a, b] : [b, a];
  return (св + 0.05) / (тм + 0.05);
}

function разобратьЦвет(s: string): number[] {
  const m = s.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
}


test('6. развороты дневника на месте и по-русски', async ({ page }) => {
  // ⛔ Главная в визуальном прогоне помечена изменчивой — снимка нет, и блоки
  //    дневника не охраняет ничто. Плюс живой промах: «сезон до сентябрь» —
  //    самодельное усечение месяца сломало падеж, увидели на снимке.
  await page.goto('/');
  await expect(page.locator('.jr .tape')).toBeVisible();
  await expect(page.locator('.pola')).toHaveCount(3);
  await expect(page.locator('.stamp')).toHaveCount(4);
  await expect(page.locator('.prow')).toHaveCount(6);
  await expect(page.locator('.anchor2 .anote')).toBeVisible();

  const подписи = await page.locator('.pcap').allTextContents();
  for (const т of подписи) {
    expect(т, 'подпись полароида без сезона').toMatch(/сезон до /);
    expect(т, `падеж месяца сломан: «${т.slice(0, 40)}»`)
      .toMatch(/до (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/);
  }
  // тройка совпадает с порядком сезона — как таблица сортировала
  const имена = await page.locator('.pola .pcap').allTextContents();
  expect(имена.length).toBe(3);
});

test('7. текст подготовки не прилипает к следующему кадру', async ({ page }) => {
  // Между связанным списком и новым полноширинным разделом нужен внешний
  // ритм: 32 px на телефоне и 48 px на десктопе по 8pt-шкале сайта.
  for (const ширина of [402, 1280]) {
    await page.setViewportSize({ width: ширина, height: 900 });
    await page.goto('/');

    const зазор = await page.evaluate(() => {
      const текст = document.querySelector('.before .blist')!.getBoundingClientRect();
      const кадр = document.querySelector('.anchor2')!.getBoundingClientRect();
      return Math.round(кадр.top - текст.bottom);
    });

    const минимум = ширина <= 760 ? 32 : 48;
    expect(зазор, `ширина ${ширина}: текст прилип к кадру`).toBeGreaterThanOrEqual(минимум);
  }
});
