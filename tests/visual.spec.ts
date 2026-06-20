import { test, expect } from '@playwright/test';

// Блокируем сторонние трекеры на КАЖДОМ тесте — чтобы Playwright не накручивал
// Я.Метрику и Ahrefs (визиты с localhost попадали в реальную статистику).
test.beforeEach(async ({ page }) => {
  await page.route(/mc\.yandex\.ru|analytics\.ahrefs\.com|googletagmanager|google-analytics/, route => route.abort());
});

// 8 ключевых страниц для visual regression.
// Меняется любое — baseline снимок ловит diff.
const PAGES = [
  { slug: '/',                              name: 'home' },
  { slug: '/blog/',                         name: 'blog-index' },
  { slug: '/seasons/',                      name: 'seasons' },
  { slug: '/trips/',                        name: 'trips' },
  { slug: '/countries/',                    name: 'countries' },
  { slug: '/blog/japan-guide-2026/',        name: 'blog-japan' },
  { slug: '/blog/bolivia-guide-2026/',      name: 'blog-bolivia' },   // 4-кол таблица сезонов + PricingCards
  { slug: '/blog/peru-guide-2026/',         name: 'blog-peru' },      // wide table (Inca Trail vs Salkantay vs Lares)
  { slug: '/blog/kamchatka-guide-2026/',    name: 'blog-kamchatka' }, // РФ-пилот: TOC + FlightRoutes + богатые сезоны
  { slug: '/blog/chto-vzyat-na-more-2026/', name: 'blog-more-checklist' }, // пиллар + интерактив-чеклист (sea preset, locked)
  { slug: '/packing/egypt/june/',           name: 'packing-egypt-june' },  // [month] + встроенный чеклист (sea)
  { slug: '/blog/ees-2026/',                name: 'blog-ees' },            // YMYL explainer + тул-таблица (SEO-аудit)
  { slug: '/blog/kuda-na-more-s-rebenkom-2026/', name: 'blog-kuda-more-deti' }, // дискавери-пилот: листикл + встроенный чеклист
  { slug: '/packing/',                      name: 'packing-landing' },        // /packing/ landing: 70 country cards
  { slug: '/packing/japan/',                name: 'packing-country-japan' },  // консолидированный хаб: упаковка по сезонам
  { slug: '/blog/ozero-ritsa-2026/',        name: 'blog-ritsa' },             // support-страница Абхазии: POI + PricingCards
  { slug: '/blog/novoafonskaya-peschera-2026/', name: 'blog-novoafon' },      // support-страница Абхазии: POI + таблицы
];

for (const page of PAGES) {
  test(`${page.name} — visual`, async ({ page: pwPage }) => {
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
    await expect(pwPage).toHaveScreenshot(`${page.name}.png`, { fullPage: true });
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
