import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = join(import.meta.dirname, '..');
const ГАЙДЫ = ['armenia','bali','chile','egypt','georgia','hainan','kenya',
                'morocco','sri-lanka','thailand','turkey','uae','vietnam'];

/** Данные точек читаем через node — файл на ES-модулях. */
function точки(): Record<string, any> {
  const код = `const m=require("./src/data/country-pois.js");console.log(JSON.stringify(m.POIS))`;
  return JSON.parse(execFileSync('node', ['-e', код], { cwd: REPO, encoding: 'utf8' }));
}
const POIS = точки();

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

// ── 8 ─ карта рисуется: пины совпадают с данными, таблица — с пинами ───────
// ⛔ Проверяем ВСЕ гайды, а не образец: беда бывает в данных одной страны
//    (потерянная точка, лишняя запятая), и на соседней её не видно.
for (const slug of ГАЙДЫ) {
test(`8. ${slug}: пины и строки таблицы совпадают с данными`, async ({ page }) => {
  await page.goto(`/blog/${slug}-guide-2026/`, { waitUntil: 'domcontentloaded' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.locator('.cm').scrollIntoViewIfNeeded();
  // ⛔ Фиксированная пауза флейкует под параллельной нагрузкой: карта не
  //    успевает отрисоваться, и тест краснеет на исправном коде. Ждём саму
  //    отрисовку — столько, сколько ей нужно.
  await page.waitForFunction(
    (n) => document.querySelectorAll('.leaflet-marker-icon').length >= n,
    POIS[slug].pois.length, { timeout: 20000 });
  await page.waitForTimeout(400);

  const r = await page.evaluate(() => ({
    пины: document.querySelectorAll('.leaflet-marker-icon').length,
    строки: document.querySelectorAll('.cm-dash tbody tr').length,
    плитки: document.querySelectorAll('.leaflet-tile-loaded').length,
    высота: Math.round((document.querySelector('.cm-map') as HTMLElement).getBoundingClientRect().height),
    номера: [...document.querySelectorAll('.cm-dash tbody .cm-no')].map((e) => e.textContent!.trim()),
  }));
  const ожидалось = POIS[slug].pois.length;
  expect(r.пины, 'пинов столько же, сколько точек в данных').toBe(ожидалось);
  expect(r.строки, 'строк таблицы столько же').toBe(ожидалось);
  expect(r.плитки, 'подложка карты загрузилась').toBeGreaterThan(3);
  expect(r.высота, 'карта не схлопнута').toBeGreaterThan(200);
  expect(r.номера, 'нумерация подряд с 01').toEqual(
    Array.from({ length: ожидалось }, (_, i) => String(i + 1).padStart(2, '0')));
});
}

// ── 9 ─ без скриптов читатель всё равно получает координаты ────────────────
test('9. без JavaScript таблица с координатами остаётся на месте', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/blog/turkey-guide-2026/', { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(() => ({
    строки: document.querySelectorAll('.cm-dash tbody tr').length,
    первая: document.querySelector('.cm-dash tbody .cm-coord')?.textContent?.trim() || '',
    ссылки: document.querySelectorAll('.cm-links a').length,
  }));
  await ctx.close();
  expect(r.строки, 'таблица есть и без скриптов').toBe(POIS['turkey'].pois.length);
  expect(r.первая, 'координаты видны').toMatch(/^\d+\.\d+, \d+\.\d+$/);
  expect(r.ссылки, 'ссылки на карты по две на точку').toBe(POIS['turkey'].pois.length * 2);
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
    () => document.querySelectorAll('.leaflet-marker-icon').length > 0, null, { timeout: 20000 });
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
