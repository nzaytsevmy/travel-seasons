import { test, expect } from '@playwright/test';

// Блокируем сторонние трекеры на КАЖДОМ тесте — чтобы Playwright не накручивал
// Я.Метрику и Ahrefs (визиты с localhost попадали в реальную статистику).
test.beforeEach(async ({ page }) => {
  await page.route(/mc\.yandex\.ru|analytics\.ahrefs\.com|googletagmanager|google-analytics/, route => route.abort());
});

// Страницы для visual regression.
// ПОЛИТИКА: пиксельно снимаем ШАБЛОНЫ (лендинги, хабы, тулы) и две статьи-канарейки.
// Обычные статьи помечены content: true и пиксельно НЕ снимаются — их текст мы
// намеренно обновляем ради свежести (Яндекс её поощряет), и каждый такой рефреш
// ломал бы эталон и тянул пересъёмку linux. Их держат структурные тесты ниже
// (no-overflow / no-broken-images / no-css-escapes), они от правок текста не падают.
// Канарейки на блоговую вёрстку (пиксельные, правишь — пересними эталон):
//   blog-kamchatka — единственный пост со всеми блоговыми компонентами сразу
//                    (AffiliateNote + PricingCards + FlightRoutes + TOC);
//   blog-novoafon  — прозовые markdown-таблицы (18 строк) + AffiliateNote.
const PAGES: { slug: string; name: string; dynamic?: boolean; content?: boolean }[] = [
  { slug: '/',                              name: 'home' },
  // dynamic: листинг блога меняется на КАЖДЫЙ новый пост (featured-карточка, счётчик
  // статей, облако тегов) → пиксельный снапшот тут даёт ложный фейл каждую публикацию
  // и тянет пересъёмку linux-эталонов. Best practice — не снапшотить волатильный
  // контент. Структуру ленты держат тесты no-overflow / no-broken-images ниже, а вид
  // карточек — baseline'ы самих постов. Итог: новый пост эталоны НЕ трогает.
  { slug: '/blog/',                         name: 'blog-index', dynamic: true },
  { slug: '/seasons/',                      name: 'seasons' },
  { slug: '/trips/',                        name: 'trips' },
  { slug: '/countries/',                    name: 'countries' },
  { slug: '/blog/japan-guide-2026/',        name: 'blog-japan', content: true },
  { slug: '/blog/bolivia-guide-2026/',      name: 'blog-bolivia', content: true },   // 4-кол таблица сезонов + PricingCards
  { slug: '/blog/peru-guide-2026/',         name: 'blog-peru', content: true },      // wide table (Inca Trail vs Salkantay vs Lares)
  { slug: '/blog/kamchatka-guide-2026/',    name: 'blog-kamchatka' }, // РФ-пилот: TOC + FlightRoutes + богатые сезоны
  { slug: '/blog/chto-vzyat-na-more-2026/', name: 'blog-more-checklist', content: true }, // пиллар + интерактив-чеклист (sea preset, locked)
  { slug: '/packing/egypt/june/',           name: 'packing-egypt-june' },  // [month] + встроенный чеклист (sea)
  { slug: '/blog/ees-2026/',                name: 'blog-ees', content: true },            // YMYL explainer + тул-таблица (SEO-аудit)
  { slug: '/blog/kuda-na-more-s-rebenkom-2026/', name: 'blog-kuda-more-deti', content: true }, // дискавери-пилот: листикл + встроенный чеклист
  { slug: '/packing/',                      name: 'packing-landing' },        // /packing/ landing: 70 country cards
  { slug: '/packing/japan/',                name: 'packing-country-japan' },  // консолидированный хаб: упаковка по сезонам
  { slug: '/blog/ozero-ritsa-2026/',        name: 'blog-ritsa', content: true },             // support-страница Абхазии: POI + PricingCards
  { slug: '/blog/novoafonskaya-peschera-2026/', name: 'blog-novoafon' },      // support-страница Абхазии: POI + таблицы
  { slug: '/blog/kareliya-guide-2026/',     name: 'blog-karelia', content: true },           // пиллар Карелии: PricingCards + таблицы
  { slug: '/blog/gornyy-park-ruskeala-2026/', name: 'blog-ruskeala', content: true },        // POI Карелии: бюджет-таблицы
  { slug: '/blog/ostrov-kizhi-2026/',       name: 'blog-kizhi', content: true },             // POI Карелии
  { slug: '/blog/ostrov-valaam-2026/',      name: 'blog-valaam', content: true },            // POI Карелии
  { slug: '/turkey/',                       name: 'country-hub-turkey' },     // хаб страны: manifest + TripSaveButton + aff-CTA
  { slug: '/trips/july/turkey/',            name: 'trips-july-turkey' },      // trips-детальная: findcta + TripSaveButton
  { slug: '/bezviz/',                       name: 'bezviz' },                 // интент-лендинг: таблица безвиза + МИД-источники
  { slug: '/compare/',                      name: 'compare-index' },          // компаратор-тул: пикер + динамический результат + CTA
  { slug: '/compare/turkey-vs-egypt/',      name: 'compare-pair' },           // кураторская пара: CompareTable + byline + CTA
  { slug: '/events/',                       name: 'events-index' },           // годовой хаб событий + byline
  { slug: '/events/july/',                  name: 'events-july' },            // месяц: списки событий + byline + CTA
  { slug: '/my/',                           name: 'my' },                     // «Моя поездка» (noindex, клиентское состояние)
];

for (const page of PAGES) {
  test(`${page.name} — visual`, async ({ page: pwPage }) => {
    // Динамические листинги пиксельно не сравниваем (см. коммент к PAGES): их структуру
    // держат тесты no-overflow / no-broken-images / no-css-escapes ниже.
    test.skip(!!page.dynamic, 'динамический листинг: снапшот меняется на каждый пост');
    test.skip(!!page.content, 'контентная статья: пиксельный снапшот ломался бы от каждого обновления текста');
    await pwPage.goto(page.slug);
    // Дай шрифтам и lazy-картинкам подгрузиться
    await pwPage.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    // Принудительно сбрось theme в light чтобы baseline стабилен
    await pwPage.evaluate(() => {
      localStorage.removeItem('theme');
      document.documentElement.classList.remove('dark-theme');
    });
    // Сбрось анимации (для стабильных скринов)
    await pwPage.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    // Детерминизм fullPage: догрузить lazy-картинки и дать им декодироваться ДО скрина —
    // иначе на длинных постах (kamchatka и др.) картинки догружаются во время capture → флейк.
    await pwPage.evaluate(() => {
      document.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      });
    });
    await pwPage.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 600));
    });
    await pwPage.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(img => img.decode().catch(() => {})));
    });
    // Главную клипуем до вьюпорта (не fullPage): её лента «Свежие истории» ниже сгиба
    // и в кадр не попадает, поэтому верхний регион стабилен. Контентные страницы — fullPage.
    const listing = page.name === 'home';
    // timeout 20с (дефолт expect — 5с). toHaveScreenshot крутит цикл стабилизации
    // (снимок → сравнить с предыдущим → повтор до совпадения двух подряд, внутри
    // ждёт и шрифты). На двух самых длинных fullPage (blog-japan, country-hub-turkey)
    // в webkit на linux-раннере 5с не хватало — падал на «waiting for fonts». 20с
    // даёт циклу дойти до совпадения. Строгость (maxDiffPixelRatio/threshold) та же:
    // это НЕ ослабление сравнения, а запас времени на устаканивание. timeout — опция
    // ВЫЗОВА (в конфиге expect.toHaveScreenshot этого ключа в текущей версии нет).
    await expect(pwPage).toHaveScreenshot(`${page.name}.png`, { fullPage: !listing, timeout: 20_000 });
  });

  test(`${page.name} — no overflow horizontal`, async ({ page: pwPage }) => {
    await pwPage.goto(page.slug);
    await pwPage.waitForLoadState('domcontentloaded');
    const overflow = await pwPage.evaluate(() => {
      const vw = window.innerWidth;
      const bad: { tag: string; cls: string; w: number; right: number }[] = [];
      // Утилита: элемент внутри overflow-scroll контейнера? Это норма (карты, таблицы)
      const inScrollContainer = (el: Element): boolean => {
        let p: Element | null = el.parentElement;
        while (p && p !== document.body) {
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
          p = p.parentElement;
        }
        return false;
      };
      document.querySelectorAll('*').forEach(el => {
        if (inScrollContainer(el)) return;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0 && r.left < vw) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            cls: (el as HTMLElement).className?.toString().slice(0, 60) || '',
            w: Math.round(r.width),
            right: Math.round(r.right),
          });
        }
      });
      return bad;
    });
    expect(overflow, JSON.stringify(overflow, null, 2)).toEqual([]);
  });

  test(`${page.name} — no broken images`, async ({ page: pwPage }) => {
    await pwPage.goto(page.slug);
    await pwPage.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    // Сделай все картинки eager (lazy в Playwright не успевает) и подожди декодирование
    await pwPage.evaluate(() => {
      document.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      });
    });
    // Прокрутим страницу постепенно — Intersection Observer triggers
    await pwPage.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 1500));
    });
    // Дополнительный wait — decode всех картинок которые получили src
    await pwPage.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(img => img.decode().catch(() => {})));
    });
    const broken = await pwPage.evaluate(() => {
      const bad: { src: string; alt: string }[] = [];
      document.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        if (img.naturalWidth === 0 && (img.currentSrc || img.src)) {
          bad.push({ src: (img.currentSrc || img.src).split('/').pop() || '', alt: img.alt.slice(0, 60) });
        }
      });
      return bad;
    });
    expect(broken, `Broken images: ${JSON.stringify(broken, null, 2)}`).toEqual([]);
  });

  test(`${page.name} — no literal CSS escapes`, async ({ page: pwPage }) => {
    await pwPage.goto(page.slug);
    await pwPage.waitForLoadState('domcontentloaded');
    // Catches "\00a0", "\\nnnn" в rendered text content (как баг с table data-label).
    const matches = await pwPage.evaluate(() => {
      const text = document.body.innerText;
      const regex = /\\[0-9a-fA-F]{4}/g;
      const m = text.match(regex);
      return m ? Array.from(new Set(m)) : [];
    });
    expect(matches, `Found literal CSS escapes in text: ${matches.join(', ')}`).toEqual([]);
  });
}
