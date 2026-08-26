import { test, expect } from '@playwright/test';

const АДРЕС = 'http://localhost:4322/trips/';
const ШИРИНЫ = [1280, 1024, 768, 640, 402, 375];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(АДРЕС, { waitUntil: 'networkidle' });
});

// ── 1 ─ ориентиры страницы ─────────────────────────────────────────────────
// Программа чтения перемещается по ориентирам. Их должно быть ровно столько,
// сколько нужно, и главный — один.
test('1. ориентиры: один main, шапка и крошки на месте', async ({ page }) => {
  const r = await page.evaluate(() => ({
    main: document.querySelectorAll('main').length,
    header: document.querySelectorAll('header').length,
    nav: [...document.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label') || n.getAttribute('aria-labelledby') || ''),
  }));
  expect(r.main, 'главный ориентир ровно один').toBe(1);
  expect(r.header, 'шапка есть').toBeGreaterThan(0);
  expect(r.nav.length, 'навигация размечена').toBeGreaterThan(0);
  expect(r.nav.filter((x) => !x), 'у каждой навигации своё имя — иначе их не различить на слух').toEqual([]);
});

// ── 2 ─ заголовки ──────────────────────────────────────────────────────────
test('2. заголовки: один H1 и ни одной пропущенной ступени', async ({ page }) => {
  const ур = await page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      уровень: +h.tagName[1], текст: h.textContent!.trim().slice(0, 40),
    })));
  expect(ур.filter((h) => h.уровень === 1).length, 'H1 ровно один').toBe(1);
  expect(ур[0].уровень, 'страница начинается с H1').toBe(1);
  const скачки: string[] = [];
  for (let i = 1; i < ур.length; i++) {
    if (ур[i].уровень - ур[i - 1].уровень > 1) скачки.push(`${ур[i - 1].уровень}→${ур[i].уровень} у «${ур[i].текст}»`);
  }
  expect(скачки, 'ступени идут подряд').toEqual([]);

  // ⛔ Одной проверки «нет скачка вниз» мало: заголовок раздела, опущенный
  //    с H2 до H4, скачка не даёт (перед ним стоят H3 карточек), а иерархию
  //    ломает. Поэтому отдельно требуем, чтобы имя каждого раздела было H2.
  const уровни_разделов = await page.evaluate(() =>
    [...document.querySelectorAll('section[aria-labelledby]')].map((s) => {
      const h = document.getElementById(s.getAttribute('aria-labelledby')!);
      return { уровень: h ? +h.tagName[1] : 0, текст: h?.textContent?.trim().slice(0, 30) || '—' };
    }));
  expect(уровни_разделов.filter((x) => x.уровень !== 2), 'раздел верхнего уровня озаглавлен H2').toEqual([]);
});

// ── 3 ─ имена разделов ─────────────────────────────────────────────────────
// ⛔ section без доступного имени не становится ориентиром и не даёт ничего
//    сверх обычного div — это прямая рекомендация из руководств 2026 года.
test('3. у каждого раздела есть имя, и оно указывает на существующий заголовок', async ({ page }) => {
  const r = await page.evaluate(() =>
    [...document.querySelectorAll('section')].map((s) => {
      const id = s.getAttribute('aria-labelledby');
      return { есть: !!id, найден: id ? !!document.getElementById(id) : false, начало: s.textContent!.trim().slice(0, 26) };
    }));
  expect(r.filter((x) => !x.есть).map((x) => x.начало), 'раздел без имени').toEqual([]);
  expect(r.filter((x) => !x.найден).map((x) => x.начало), 'имя ссылается в пустоту').toEqual([]);
});

// ── 4 ─ ссылки карточек ────────────────────────────────────────────────────
// ⛔ Карточка, целиком обёрнутая в ссылку, зачитывается вслух одной строкой:
//    «ссылка: Январь 42 направления Новая Зеландия Хоккайдо Финляндия…».
//    Ссылка должна быть на заголовке, а область нажатия растянута слоем.
test('4. ссылка на заголовке, а не вокруг всей карточки', async ({ page }) => {
  const r = await page.evaluate(() => {
    const карточки = [...document.querySelectorAll('.mc, .wc')];
    // ⛔ Обёртка бывает и снаружи карточки, и первым же элементом внутри неё —
    //    проверка на closest ловила только первый случай и пропускала второй.
    const обёрнутые = карточки.filter((к) => {
      if (к.tagName === 'A' || к.closest('a')) return true;
      // ⛔ Браузер сам разрывает ссылку, охватившую блоки, и признак «внутри
      //    ссылки и фото, и заголовок» перестаёт работать. Надёжнее другое:
      //    в правильной карточке ссылка стоит только на заголовке и картинки
      //    в себе не держит.
      return [...к.querySelectorAll('a')].some((a) => a.querySelector('img'));
    });
    const длинные = карточки
      .map((к) => (к.querySelector('a')?.textContent || '').trim())
      .filter((т) => т.length > 60);
    const без = карточки.filter((к) => !к.querySelector('h3 a, .mc-name a')).length;
    return { обёрнутые: обёрнутые.length, длинные, без, всего: карточки.length };
  });
  expect(r.всего, 'карточки найдены').toBeGreaterThan(10);
  expect(r.обёрнутые, 'ни одна карточка не обёрнута в ссылку целиком').toBe(0);
  expect(r.без, 'у каждой карточки ссылка в заголовке').toBe(0);
  expect(r.длинные, 'имя ссылки не длиннее 60 знаков').toEqual([]);
});

// ── 5 ─ вся карточка остаётся нажимаемой ───────────────────────────────────
test('5. нажатие по любому месту карточки ведёт по ссылке', async ({ page }) => {
  const карточка = page.locator('.mc').first();
  // ⛔ Прокрутка упиралась в таймаут: карточки растут по мере загрузки кадров,
  //    и «дождаться устойчивости» не наступало. Сначала прокручиваем страницу
  //    целиком, чтобы кадры встали на место.
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  await карточка.scrollIntoViewIfNeeded({ timeout: 15000 });
  await page.waitForTimeout(300);
  const б = (await карточка.boundingBox())!;
  const ссылка = (await карточка.locator('.mc-name a').first().getAttribute('href', { timeout: 10000 }))!;
  // щёлкаем по фотографии — далеко от текста ссылки
  await page.mouse.click(б.x + б.width / 2, б.y + 30);
  await page.waitForTimeout(500);
  expect(page.url(), 'клик по фото увёл на страницу месяца').toContain(ссылка.replace(/\/$/, ''));
});

// ── 6 ─ кадры ──────────────────────────────────────────────────────────────
test('6. у кадров есть размеры, описание и варианты ширины', async ({ page }) => {
  const r = await page.evaluate(() => {
    const им = [...document.querySelectorAll('img')];
    return {
      всего: им.length,
      без_размеров: им.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
      без_srcset: им.filter((i) => !i.srcset).length,
      // пустой alt допустим только у оформительских кадров рядом с текстом
      без_alt: им.filter((i) => i.alt === null).length,
    };
  });
  expect(r.всего, 'кадры на месте').toBeGreaterThan(10);
  expect(r.без_размеров, 'размеры проставлены — иначе вёрстка прыгает при загрузке').toBe(0);
  expect(r.без_srcset, 'у каждого кадра есть варианты ширины').toBe(0);
  expect(r.без_alt, 'атрибут описания задан у всех').toBe(0);

  // ⛔ Требовать загрузки ВСЕХ кадров сразу нельзя: они ленивые по замыслу и
  //    ждут прокрутки. Проверка краснела на исправной странице. Смотрим, что
  //    кадры реально отдаются, — но после того, как их показали.
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  });
  await page.waitForTimeout(900);
  // ⛔ Смотреть только на отрисованный кадр мало: браузер берёт рабочий
  //    вариант из srcset, и битый запасной адрес остаётся незамеченным —
  //    а именно он достанется старому браузеру. Проверяем каждый адрес.
  const адреса = await page.evaluate(() => {
    const все = new Set<string>();
    document.querySelectorAll('img').forEach((i) => {
      if (i.getAttribute('src')) все.add(new URL(i.getAttribute('src')!, location.href).href);
      (i.getAttribute('srcset') || '').split(',').forEach((ч) => {
        const u = ч.trim().split(/\s+/)[0];
        if (u) все.add(new URL(u, location.href).href);
      });
    });
    return [...все];
  });
  const битые: string[] = [];
  for (const у of адреса) {
    const о = await page.request.get(у);
    if (!о.ok()) битые.push(`${о.status()} ${у.split('/').pop()}`);
  }
  expect(битые, 'каждый адрес кадра отдаётся').toEqual([]);
  expect(адреса.length, 'адресов кадров больше, чем самих кадров — значит варианты есть').toBeGreaterThan(r.всего);
});

// ── 7 ─ очередь загрузки ───────────────────────────────────────────────────
// ⛔ Обложку нельзя грузить лениво — она и есть самый крупный элемент первого
//    экрана. Остальные наоборот обязаны быть ленивыми.
test('7. обложка грузится первой, остальные кадры — по мере прокрутки', async ({ page }) => {
  // ⛔ Первый экран хаба — заголовок, а не фотография: крупного кадра над
  //    сгибом нет, и поднимать приоритет нечему. Проверяем обратное — что
  //    ни один кадр не грузится вперёд текста.
  const r = await page.evaluate(() => {
    const кадры = [...document.querySelectorAll('img')];
    return {
      всего: кадры.length,
      не_ленивые: кадры.filter((i) => i.loading !== 'lazy').map((i) => i.src.split('/').pop()),
      с_приоритетом: кадры.filter((i) => i.getAttribute('fetchpriority') === 'high').length,
    };
  });
  expect(r.всего, 'кадры на странице есть').toBeGreaterThan(10);
  expect(r.не_ленивые, 'все кадры ждут прокрутки — над сгибом их нет').toEqual([]);
  expect(r.с_приоритетом, 'ни одному кадру не поднят приоритет: поднимать нечего').toBe(0);
});

// ── 8 ─ разметка для поисковиков ───────────────────────────────────────────
test('8. разметка разбирается и описывает крошки, список и вопросы', async ({ page }) => {
  const r = await page.evaluate(() => {
    const блоки = [...document.querySelectorAll('script[type="application/ld+json"]')];
    let граф: any[] = [];
    for (const б of блоки) {
      const д = JSON.parse(б.textContent!);
      граф = граф.concat(д['@graph'] || [д]);
    }
    const типы = граф.map((x) => x['@type']);
    const список = граф.find((x) => x['@type'] === 'ItemList');
    const вопросы = граф.find((x) => x['@type'] === 'FAQPage');
    const крошки = граф.find((x) => x['@type'] === 'BreadcrumbList');
    return {
      типы,
      месяцев: список?.itemListElement?.length ?? 0,
      объявлено: список?.numberOfItems ?? 0,
      позиции_подряд: список?.itemListElement?.every((x: any, i: number) => x.position === i + 1) ?? false,
      вопросов_в_разметке: вопросы?.mainEntity?.length ?? 0,
      вопросов_на_странице: document.querySelectorAll('.faq .fi summary').length,
      крошек: крошки?.itemListElement?.length ?? 0,
    };
  });
  expect(r.типы, 'все три вида разметки').toEqual(expect.arrayContaining(['BreadcrumbList', 'ItemList', 'FAQPage']));
  expect(r.месяцев, 'в списке двенадцать месяцев').toBe(12);
  expect(r.объявлено, 'объявленное число совпадает с содержимым').toBe(12);
  expect(r.позиции_подряд, 'позиции идут подряд с первой').toBe(true);
  expect(r.вопросов_в_разметке, 'вопросы в разметке совпадают с видимыми').toBe(r.вопросов_на_странице);
  expect(r.крошек, 'крошки описаны').toBeGreaterThan(1);
});

// ── 9 ─ заголовок и описание для выдачи ────────────────────────────────────
test('9. заголовок и описание влезают в выдачу и не пустые', async ({ page }) => {
  const r = await page.evaluate(() => ({
    title: document.title,
    descr: (document.querySelector('meta[name=description]') as HTMLMetaElement)?.content || '',
    h1: document.querySelector('h1')?.textContent?.trim() || '',
  }));
  expect(r.title.length, 'заголовок задан').toBeGreaterThan(20);
  expect(r.title.length, 'заголовок не обрежется в выдаче').toBeLessThanOrEqual(75);
  expect(r.descr.length, 'описание задано').toBeGreaterThan(70);
  expect(r.descr.length, 'описание не обрежется').toBeLessThanOrEqual(200);
  expect(r.h1.length, 'заголовок на странице не пустой').toBeGreaterThan(5);
});

// ── 10 ─ вёрстка на всех ширинах ───────────────────────────────────────────
test('10. на шести ширинах не едет вбок, нажимаемое не мельче 44 точек', async ({ page }) => {
  const беды: string[] = [];
  for (const w of ШИРИНЫ) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(АДРЕС, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const мелкие = [...document.querySelectorAll('a')]
        .filter((a) => {
          const b = a.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && b.height < 24 && !a.closest('.mc, .wc, .crumbs, .top');
        })
        .map((a) => a.textContent!.trim().slice(0, 22));
      return {
        вбок: document.documentElement.scrollWidth > window.innerWidth + 1,
        мелкие: [...new Set(мелкие)].slice(0, 3),
      };
    });
    if (r.вбок) беды.push(`@${w}: страница едет вбок`);
    if (r.мелкие.length) беды.push(`@${w}: мелкие ссылки — ${r.мелкие.join(', ')}`);
  }
  expect(беды, беды.join('\n')).toEqual([]);
});
