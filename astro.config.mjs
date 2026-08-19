import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import compress from 'astro-compress';
import brokenLinks from 'astro-broken-links-checker';
import { readFileSync, readdirSync } from 'node:fs';
import remarkNumerals from './tools/remark-numerals.mjs';
import { archivedMonths, monthKey } from './src/data/news.js';
import rehypeTableWrap from './tools/rehype-table-wrap.mjs';
import rehypeFaqAccordion from './tools/rehype-faq-accordion.mjs';
import rehypeCountryRow from './tools/rehype-country-row.mjs';
import { DATA_UPDATED } from './src/data/meta.js';
import { DIRECTIONS, MONTHS } from './src/data/directions.js';
import { NICHE_TRIPS } from './src/data/niche-trips.js';

// Trips/packing closed (status='X' — направление недоступно в месяц) → noindex,
// исключаем из sitemap (noindex-URL в sitemap = противоречивый сигнал).
// Остальные trips-страницы индексируются после расширения шаблона
// (FAQ, бюджет 7/14/21, 12-month grid).
const CLOSED_TRIPS = new Set();
for (let i = 0; i < MONTHS.length; i++) {
  for (const d of DIRECTIONS) {
    if (d.r[i] === 'X') {
      CLOSED_TRIPS.add(`https://traveltribe.ru/trips/${MONTHS[i].slug}/${d.slug}/`);
      CLOSED_TRIPS.add(`https://traveltribe.ru/packing/${d.slug}/${MONTHS[i].slug}/`);
    }
  }
}

// Реальный lastmod вместо даты сборки: посты — по updatedDate/pubDate
// из frontmatter, программные страницы (visa/hub/seasons/trips/countries)
// — по DATA_UPDATED. Иначе sitemap инфлирует свежесть всех URL.
const BLOG_DIR = new URL('./src/content/blog/', import.meta.url);
const blogLastmod = {};
for (const f of readdirSync(BLOG_DIR)) {
  if (!/\.mdx?$/.test(f)) continue;
  const fm = (readFileSync(new URL(f, BLOG_DIR), 'utf8').split(/^---\s*$/m)[1]) || '';
  const raw = (fm.match(/^updatedDate:\s*(.+)$/m)?.[1] || fm.match(/^pubDate:\s*(.+)$/m)?.[1] || '').replace(/['"]/g, '').trim();
  if (raw) blogLastmod[`https://traveltribe.ru/blog/${f.replace(/\.mdx?$/, '')}/`] = new Date(raw);
}
// Свежесть новостей — из самих заметок, а не из общей даты сайта. Единственный
// ежедневный раздел стоял с пометкой «обновляется раз в год» и датой сборки: и
// лента выглядела мёртвой, и замороженный архив притворялся свежим.
// Границу «свежее / архив» берём из того же места, что и сама лента, иначе она
// разъедется с тем, что видит читатель.
const NEWS_DIR = new URL('./src/content/news/', import.meta.url);
const newsChecked = [];
for (const f of readdirSync(NEWS_DIR)) {
  if (!/\.mdx?$/.test(f)) continue;
  const fm = (readFileSync(new URL(f, NEWS_DIR), 'utf8').split(/^---\s*$/m)[1]) || '';
  const date = (fm.match(/^date:\s*(.+)$/m)?.[1] || '').replace(/['"]/g, '').trim();
  const checked = (fm.match(/^checked:\s*(.+)$/m)?.[1] || '').replace(/['"]/g, '').trim();
  if (date && checked) newsChecked.push({ date: new Date(date), checked: new Date(checked) });
}
// archivedMonths ждёт записи коллекции и отдаёт МНОЖЕСТВО ключей месяцев,
// а не «архивна ли эта дата» — оборачиваем свои данные в ту же форму.
const newsArchived = archivedMonths(newsChecked.map((e) => ({ data: { date: e.date } })));
const maxChecked = (list) => (list.length ? new Date(Math.max(...list.map((e) => e.checked))) : null);
const newsFeedLastmod = maxChecked(newsChecked.filter((e) => !newsArchived.has(monthKey(e.date))));
const newsMonthLastmod = {};
for (const e of newsChecked.filter((x) => newsArchived.has(monthKey(x.date)))) {
  const k = monthKey(e.date);
  if (!newsMonthLastmod[k] || e.checked > newsMonthLastmod[k]) newsMonthLastmod[k] = e.checked;
}

const DATA_DATE = new Date(DATA_UPDATED + 'T00:00:00Z');

export default defineConfig({
  site: 'https://traveltribe.ru',
  trailingSlash: 'always',
  // Редиректы: .htaccess на REG.RU (nginx) НЕ применяется → через Astro (генерит
  // served-стабы с meta-refresh + canonical). Легаси-URL из старой выдачи.
  redirects: {
    '/japan_momiji': '/blog/japan-guide-2026/',
    '/japan-momiji': '/blog/japan-guide-2026/',
    '/mexico_old': '/blog/',
    // /altai: legacy-редирект старого тур-лендинга снят 2026-07 — направление
    // добавлено на сайт, бэклинки leadgid 2024 теперь ведут на тематический хаб.
  },
  build: {
    // Все стили inline в HTML — убирает render-blocking CSS (164ms по GTmetrix).
    // Trade-off: HTML +5-15KB, brotli сжимает до ~1-3KB. Net win.
    inlineStylesheets: 'always',
  },
  image: {
    domains: ['images.unsplash.com'],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  markdown: {
    remarkPlugins: [remarkNumerals],
    rehypePlugins: [rehypeTableWrap, rehypeFaqAccordion, rehypeCountryRow],
  },
  integrations: [
    mdx(),
    // Partytown снят 30.07.2026. Он был настроен на forward:['ym',…], то есть
    // подменял window.ym пересылкой в Web Worker — а аналитику в воркер намеренно
    // НЕ выносили (Вебвизору нужен DOM, об этом прямо сказано в Layout.astro).
    // Скриптов type="text/partytown" в репозитории не было ни одного, поэтому
    // воркер грузился впустую: 2582 байта инлайна на каждой из 2339 страниц плюс
    // два запроса partytown-sandbox-sw.html за визит. Итог проверки на проде:
    // window.ym не существовал вовсе, а обработчик исходящих ссылок защищён
    // условием `"function" == typeof window.ym` — единственная цель сайта не
    // срабатывала ни разу. Сторож от возврата: тест в content-invariants.spec.ts.
    //
    // astro-compress: минификация HTML/CSS/JS/SVG/JSON на build.
    // -5-15% размер страниц.
    //
    // ⛔ Минификация HTML выключена совсем — решение 19.08.2026 по замеру.
    //
    // 01.08.2026 её отключили только для проверок, а на выкладку оставили: она
    // самая дорогая часть сборки. Сегодня замерено, сколько она даёт НА САМОМ
    // ДЕЛЕ, и картина другая. Сервер отдаёт страницы с gzip (nginx, проверено
    // заголовком ответа), а после gzip разница между сжатым и несжатым HTML —
    // 6,5%: 46 995 против 50 225 байт на статье про Абхазию, 47 611 против
    // 51 138 на главной. Это 3,3 КБ на страницу.
    //
    // Стоит это половины времени сборки: 347 секунд со сжатием против 164 без
    // (два прогона подряд на одной машине). В выкладке сборка занимала 3 минуты
    // 26 секунд из 5 минут 43 секунд общего времени.
    //
    // Итог: 3,3 КБ на странице не стоят трёх минут на каждой выкладке, когда
    // сервер и так жмёт. Это компромисс, а не бесплатный выигрыш: страницы
    // стали на 6,5% тяжелее по сети. Вернуть — поставить HTML: true.
    compress({
      CSS: true,
      HTML: false,
      JavaScript: true,
      SVG: true,
      Image: false,  // изображения уже сжаты через astro:assets (AVIF/WebP)
    }),
    // Broken links checker: фейлит build если ссылка ведёт на несуществующую страницу.
    // На 800 страниц с программными ссылками — критично.
    brokenLinks({
      checkExternalLinks: false,  // не дёргать внешние API при build (slow + flaky)
    }),
    sitemap({
      filter: (page) => !page.includes('/404')
        && !page.includes('/blog/tag/')
        && !page.includes('sitemap-images')
        && !page.includes('/og/')
        // юр-страницы noindex (privacy/cookie/terms) — не в sitemap (только индексируемые)
        && !page.includes('/legal/')
        // /my/ — персональный дашборд из localStorage, noindex, не в sitemap
        && !page.includes('/my/')
        // /status/ — служебная панель состояния статей, noindex, не в sitemap
        && !page.includes('/status/')
        // /data/trip/*.json — служебный endpoint для /my/, не HTML-страница
        && !page.includes('/data/trip/')
        // нишевые trips-направления noindex (≈0 трафика) — не в sitemap
        && ![...NICHE_TRIPS].some((s) => page.includes(`/trips/`) && page.endsWith(`/${s}/`))
        // /seasons/[c]/[m]/ — дубль /trips/[m]/[c]/; canonical ведёт на trips,
        // поэтому из sitemap исключаем (только canonical+200). Хаб /seasons/ остаётся.
        && !/\/seasons\/[^/]+\/[^/]+\//.test(page)
        && !CLOSED_TRIPS.has(page),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: DATA_DATE,
      serialize(item) {
        const url = item.url;
        item = { ...item, lastmod: blogLastmod[url] || DATA_DATE };
        // Лента новостей обновляется ежедневно, архив месяца — уже никогда.
        if (url === 'https://traveltribe.ru/novosti/') {
          return { ...item, lastmod: newsFeedLastmod || item.lastmod, priority: 0.8, changefreq: 'daily' };
        }
        const m = url.match(/^https:\/\/traveltribe\.ru\/novosti\/(\d{4}-\d{2})\/$/);
        if (m) {
          return { ...item, lastmod: newsMonthLastmod[m[1]] || item.lastmod, priority: 0.4, changefreq: 'yearly' };
        }
        // Homepage and main tools — top priority, daily-ish updates
        if (url === 'https://traveltribe.ru/') {
          return { ...item, priority: 1.0, changefreq: 'daily' };
        }
        if (url === 'https://traveltribe.ru/seasons/' || url === 'https://traveltribe.ru/calculator/' || url === 'https://traveltribe.ru/compare/') {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        // Blog index and trips — high priority, weekly
        if (url === 'https://traveltribe.ru/blog/' || url === 'https://traveltribe.ru/trips/') {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        // Individual blog posts — solid priority, monthly
        if (url.startsWith('https://traveltribe.ru/blog/') && !url.includes('/tag/')) {
          return { ...item, priority: 0.7, changefreq: 'monthly' };
        }
        // Tag pages — lower
        if (url.includes('/blog/tag/')) {
          return { ...item, priority: 0.5, changefreq: 'monthly' };
        }
        // /trips/<month>/ — seasonal
        if (url.startsWith('https://traveltribe.ru/trips/')) {
          return { ...item, priority: 0.6, changefreq: 'monthly' };
        }
        // /about/ etc.
        return { ...item, priority: 0.4, changefreq: 'yearly' };
      },
    }),
  ],
});
