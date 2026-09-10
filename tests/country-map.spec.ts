import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = join(import.meta.dirname, '..');
const ГАЙДЫ = ['armenia','bali','bolivia','chile','china','egypt','georgia','hainan',
                'kenya','morocco','peru','sri-lanka','thailand','turkey','uae','vietnam'];

/** Данные точек читаем через node — файл на ES-модулях. */
function точки(): Record<string, any> {
  const код = `const m=require("./src/data/country-pois.js");console.log(JSON.stringify(m.POIS))`;
  return JSON.parse(execFileSync('node', ['-e', код], { cwd: REPO, encoding: 'utf8' }));
}
const POIS = точки();

// ⛔ Все проверки ниже — про данные и разметку, а не про пиксели. Гонять их в
//    четырёх браузерах бессмысленно, а на общем прогоне это стоило дорого:
//    16 стран × 4 браузера = 64 запуска карты, каждый ждёт отрисовку. Под
//    нагрузкой они упирались в таймаут и блокировали чужие отправки. Один
//    прогон — как у остальных инвариантов проекта.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'инвариант карты — один прогон');
});

const исходник = (slug: string) =>
  readFileSync(join(REPO, `src/content/blog/${slug}-guide-2026.mdx`), 'utf8');

// ── 1 ─ блок карты подключён во всех гайдах, где есть данные ────────────────
test('1. карта подключена в каждом гайде, у которого есть точки', () => {
  const без: string[] = [];
  for (const slug of ГАЙДЫ) {
    const s = исходник(slug);
    const импорт = s.includes("CountryMap.astro");
    const вызов = new RegExp(`<CountryMap[^>]*slug="${slug}"`).test(s);
    if (!импорт || !вызов) без.push(`${slug}: импорт=${импорт} вызов=${вызов}`);
  }
  expect(без, без.join('\n')).toEqual([]);
});

// ── 2 ─ у каждой карты есть данные, иначе компонент молча ничего не покажет ─
test('2. у каждой подключённой карты данные на месте', () => {
  const пусто = ГАЙДЫ.filter((s) => !(POIS[s]?.pois?.length > 0));
  expect(пусто, `эти карты нарисуются пустыми: ${пусто.join(', ')}`).toEqual([]);
});

// ── 3 ─ координаты вообще возможны на Земле ────────────────────────────────
test('3. координаты в допустимых пределах и не нули', () => {
  const плохие: string[] = [];
  for (const [страна, d] of Object.entries<any>(POIS)) {
    for (const p of d.pois) {
      const ок = Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
        && !(p.lat === 0 && p.lng === 0);
      if (!ок) плохие.push(`${страна}/${p.name}: ${p.lat}, ${p.lng}`);
    }
  }
  expect(плохие, плохие.join('\n')).toEqual([]);
});

// ── 4 ─ широта и долгота не перепутаны местами ─────────────────────────────
// ⛔ Самая незаметная беда: на мелком масштабе точка «где-то там» и глазом
//    не ловится. Если поменять поля местами, точка уезжает за тысячи вёрст —
//    ловим по расстоянию от центра карты страны при обратной перестановке.
test('4. широта и долгота не перепутаны местами', () => {
  const подозрительные: string[] = [];
  for (const [страна, d] of Object.entries<any>(POIS)) {
    const c = d.center;
    for (const p of d.pois) {
      // ⛔ Мерка подобрана по данным, а не на глаз. Простое «с перестановкой
      //    ближе» ругалось на верные координаты Александрии и Сванетии: там
      //    широта и долгота близки, и перестановка почти ничего не меняет —
      //    выигрыш всего в 1,3–1,5 раза. Настоящая же перестановка (проверено
      //    подложенной бедой на Каппадокии) уводит точку в ТРИНАДЦАТЬ раз
      //    дальше. Порог втрое разводит эти два случая с большим запасом.
      const как_есть = Math.hypot(p.lat - c.lat, p.lng - c.lng);
      const если_поменять = Math.hypot(p.lng - c.lat, p.lat - c.lng);
      if (как_есть > 3 * Math.max(если_поменять, 0.01)) {
        подозрительные.push(
          `${страна}/${p.name}: ${p.lat},${p.lng} — с перестановкой втрое ближе к центру карты`);
      }
      // ⛔ ЧЕГО ЭТА ПРОВЕРКА НЕ ЛОВИТ, и почему так оставлено.
      //    Порог втрое пропускает мягкие перестановки: у Стамбула (41,0 и 28,9)
      //    подмена уводит точку всего в 1,9 раза дальше — под порог не попадает.
      //    Пробовал вторую меру, «точка вне рамки остальных точек страны»: она
      //    ловит Стамбул, но даёт шесть ложных тревог из 195 — остров Пасхи,
      //    Канары, Сардиния, Мальдивы, Чиангмай, Хиросима. Все они настоящие,
      //    просто далеко от своих соседей. Заносить их в исключения — значит
      //    подгонять меру под данные, а мера с ложными тревогами хуже, чем её
      //    отсутствие. Поэтому ловим только грубые случаи, а мягкие остаются
      //    на глаз при добавлении точек.
    }
  }
  expect(подозрительные, подозрительные.join('\n')).toEqual([]);
});

// ── 5 ─ точки не дублируются ───────────────────────────────────────────────
test('5. в одной стране нет повторяющихся точек', () => {
  const дубли: string[] = [];
  for (const [страна, d] of Object.entries<any>(POIS)) {
    const имена = d.pois.map((p: any) => p.name.trim().toLowerCase());
    const коорд = d.pois.map((p: any) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`);
    for (const [что, список] of [['имя', имена], ['координаты', коорд]] as const) {
      const повтор = список.filter((v, i) => список.indexOf(v) !== i);
      if (повтор.length) дубли.push(`${страна}: повтор по ${что} — ${[...new Set(повтор)].join(', ')}`);
    }
  }
  expect(дубли, дубли.join('\n')).toEqual([]);
});

// ── 6 ─ подпись честная: обзорная карта не выдаётся за личный маршрут ──────
test('6. личным маршрутом помечены только страны, где он действительно есть', () => {
  const свои = Object.entries<any>(POIS).filter(([, d]) => d.visited).map(([k]) => k);
  // Флаг поднимают руками, поэтому список фиксирован: новый — только осознанно.
  expect(свои.sort(), 'кто-то поднял флаг «мой маршрут» — это обещание читателю').toEqual(['japan']);
});

// ── 7 ─ у каждой карты указан источник данных ──────────────────────────────
test('7. у каждой карты подписан источник', () => {
  const без = Object.entries<any>(POIS)
    .filter(([, d]) => !(d.sources?.length > 0))
    .map(([k]) => k);
  expect(без, `карты без источника: ${без.join(', ')}`).toEqual([]);
});

// ── 8 ─ карта рисуется: пины совпадают с данными, список мест — с пинами ────
// ⛔ Отрисовку смотрим на образце из трёх стран с разным числом точек, а не на
//    всех шестнадцати: данные каждой страны уже проверены выше без браузера,
//    а здесь дорог каждый запуск. Полный проход по всем — командой
//    `npx playwright test tests/country-map.spec.ts --project=chromium-desktop -g "8\."`
//    после правки данных карты.
const ОБРАЗЕЦ = ['turkey', 'vietnam', 'armenia'];
for (const slug of ОБРАЗЕЦ) {
test(`8. ${slug}: пины и пункты списка мест совпадают с данными`, async ({ page }) => {
  await page.goto(`/blog/${slug}-guide-2026/`, { waitUntil: 'domcontentloaded' });
  // Карта инициализируется при появлении в экране. Полная прокрутка страницы
  // уводила её обратно за viewport, Chromium отменял ещё не загруженные тайлы,
  // и исправная карта получала ложный красный результат.
  // С 10.09.2026 у каждого места в списке есть кадр, блок стал в несколько экранов высотой:
  // прокрутка к середине всего блока оставляла саму карту выше экрана, и она не просыпалась.
  // Прокручиваем к карте, а не к блоку.
  await page.locator('.cm-map').scrollIntoViewIfNeeded();
  // ⛔ Фиксированная пауза флейкует под параллельной нагрузкой: карта не
  //    успевает отрисоваться, и тест краснеет на исправном коде. Ждём саму
  //    отрисовку — столько, сколько ей нужно.
  await page.waitForFunction(
    (n) => document.querySelectorAll('.leaflet-marker-icon').length >= n,
    POIS[slug].pois.length, { timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.leaflet-tile-loaded').length > 3,
    undefined, { timeout: 45000 });

  const r = await page.evaluate(() => ({
    пины: document.querySelectorAll('.leaflet-marker-icon').length,
    строки: document.querySelectorAll('.cm-list .cm-item').length,
    плитки: document.querySelectorAll('.leaflet-tile-loaded').length,
    высота: Math.round((document.querySelector('.cm-map') as HTMLElement).getBoundingClientRect().height),
    номера: [...document.querySelectorAll('.cm-list .cm-no')].map((e) => e.textContent!.trim()),
  }));
  const ожидалось = POIS[slug].pois.length;
  expect(r.пины, 'пинов столько же, сколько точек в данных').toBe(ожидалось);
  expect(r.строки, 'мест в списке столько же').toBe(ожидалось);
  expect(r.плитки, 'подложка карты загрузилась').toBeGreaterThan(3);
  expect(r.высота, 'карта не схлопнута').toBeGreaterThan(200);
  expect(r.номера, 'нумерация подряд с 01').toEqual(
    Array.from({ length: ожидалось }, (_, i) => String(i + 1).padStart(2, '0')));
});
}

// ── 9 ─ без скриптов читатель всё равно доходит до точного места ───────────
// С 10.09.2026 координаты не печатаются текстом у каждого места (пометка Никиты:
// «слишком много линий… не делать такие повторения» — у каждой строки стояли
// «Тип / Координаты / Карты»). Точка по-прежнему доходит до читателя без скриптов:
// обе ссылки на карты несут координаты места. Их и проверяем — у каждого места.
test('9. без JavaScript список мест и ссылки с координатами остаются на месте', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/blog/turkey-guide-2026/', { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(() => ({
    места: [...document.querySelectorAll('.cm-list .cm-item .cm-name')].map((e) => e.textContent!.trim()),
    ссылки: [...document.querySelectorAll('.cm-list .cm-foot a')].map((a) => (a as HTMLAnchorElement).href),
  }));
  await ctx.close();
  expect(r.места, 'список мест есть и без скриптов').toEqual(POIS['turkey'].pois.map((p: any) => p.name));
  expect(r.ссылки.length, 'ссылки на карты по две на точку').toBe(POIS['turkey'].pois.length * 2);
  const безТочки = r.ссылки.filter((u) => !/-?\d+\.\d+,-?\d+\.\d+/.test(decodeURIComponent(u)));
  expect(безТочки, 'каждая ссылка ведёт в точку с координатами').toEqual([]);
});

// ── 10 ─ карта не двигает вёрстку и не ломает ширину на телефоне ───────────
test('10. на телефоне карта не сдвигает вёрстку и не едет вбок', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 850 });
  await page.addInitScript(() => {
    (window as any).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as any) if (!e.hadRecentInput) (window as any).__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/blog/vietnam-guide-2026/', { waitUntil: 'domcontentloaded' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.locator('.cm').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelectorAll('.leaflet-marker-icon').length > 0, null, { timeout: 45000 });
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    const s = document.querySelector('.cm') as HTMLElement;
    const мимо = /leaflet-(tile|pane|layer|proxy|map)/;   // их обрезает сам контейнер карты
    const вылезло: string[] = [];
    s.querySelectorAll('*').forEach((e) => {
      const кл = String((e as HTMLElement).className || '');
      if (мимо.test(кл)) return;
      const b = (e as HTMLElement).getBoundingClientRect();
      if (b.width < 2 || b.left < -1000) return;          // скрытое за экраном — приём доступности
      if (b.right > window.innerWidth + 1) вылезло.push(e.tagName + '.' + кл.slice(0, 24));
    });
    return { cls: (window as any).__cls as number, вбок: document.documentElement.scrollWidth > window.innerWidth, вылезло };
  });
  expect(r.cls, 'карта не сдвигает вёрстку').toBeLessThan(0.1);
  expect(r.вбок, 'страница не едет вбок').toBe(false);
  expect(r.вылезло, 'ничто не вылезает за экран').toEqual([]);
});

test('в списке событий нет черт между пунктами — на всех ширинах', async ({ page }) => {
  // ⛔ С 10.09.2026 события — список по месяцам без линеек (пометка Никиты: «слишком
  //    много линий, нужно убрать их везде»). Правило стало строже прежнего «одна линия
  //    на строку»: черт внутри списка нет вовсе. История прежней беды — ниже.
  //
  // ⛔ Линии ячеек — правило горизонтальной таблицы. На телефоне ячейки
  //    становятся блоками во всю ширину, и та же линия рисуется под каждой:
  //    27.08.2026 на бою под последней строкой их было четыре вместо одной —
  //    под месяцем, под событием, под меткой и под самой строкой, а между ними
  //    зияла пустая полоса. Причина в весе селектора: `.me-r:last-child td`
  //    переживал мобильный сброс `.me-r td{border:none}`. Та же ловушка, что
  //    была с выпадающим меню.
  //
  // ⛔ Считаем линии по ПОЛОЖЕНИЮ, а не по числу элементов с рамкой: на
  //    десктопе три ячейки стоят в ряд, каждая со своей нижней рамкой, и это
  //    одна видимая линия. Счёт элементов на десктопе дал бы 18 линий на 6
  //    строк и ложную тревогу — линейка обязана мерить то, что видит человек.
  //
  // Ширины взяты вокруг границы перестроения (760) и по обоим краям: беда с
  // мобильной вёрсткой любит вылезать на планшете.
  for (const ширина of [375, 402, 640, 741, 760, 761, 768, 1024, 1280]) {
    await page.setViewportSize({ width: ширина, height: 900 });
    await page.goto('/kenya/');
    const м = await page.evaluate(() => {
      const t = document.querySelector('.me-list')!;
      const месяцев = t.querySelectorAll('.me-month').length;
      const линии = new Set<number>();
      for (const el of [t, ...t.querySelectorAll('*')]) {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        if (cs.borderTopStyle !== 'none' && cs.borderTopWidth !== '0px') линии.add(Math.round(b.top));
        if (cs.borderBottomStyle !== 'none' && cs.borderBottomWidth !== '0px') линии.add(Math.round(b.bottom));
      }
      return { месяцев, линий: линии.size };
    });
    expect(м.месяцев, `на ${ширина}px список событий не пуст`).toBeGreaterThan(0);
    expect(м.линий, `на ${ширина}px в списке событий ${м.линий} черт`).toBe(0);
  }
});
