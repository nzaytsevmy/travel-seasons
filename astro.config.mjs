import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import partytown from '@astrojs/partytown';
import compress from 'astro-compress';
import brokenLinks from 'astro-broken-links-checker';
import { readFileSync, readdirSync } from 'node:fs';
import remarkNumerals from './tools/remark-numerals.mjs';
import rehypeTableWrap from './tools/rehype-table-wrap.mjs';
import rehypeFaqAccordion from './tools/rehype-faq-accordion.mjs';
import { DATA_UPDATED } from './src/data/meta.js';
import { DIRECTIONS, MONTHS } from './src/data/directions.js';

// Trips closed (status='X' — направление недоступно в месяц) → noindex,
// исключаем из sitemap. Остальные trips-страницы индексируются после
// расширения шаблона (FAQ, бюджет 7/14/21, 12-month grid).
const CLOSED_TRIPS = new Set();
for (let i = 0; i < MONTHS.length; i++) {
  for (const d of DIRECTIONS) {
    if (d.r[i] === 'X') {
      CLOSED_TRIPS.add(`https://traveltribe.ru/trips/${MONTHS[i].slug}/${d.slug}/`);
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
const DATA_DATE = new Date(DATA_UPDATED + 'T00:00:00Z');

export default defineConfig({
  site: 'https://traveltribe.ru',
  trailingSlash: 'always',
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
    rehypePlugins: [rehypeTableWrap, rehypeFaqAccordion],
  },
  integrations: [
    mdx(),
    icon({ include: { lucide: ['*'] } }),
    // Partytown: Я.Метрика + Ahrefs в Web Worker, не main thread.
    // Освобождает main thread на 200-400 ms (TBT/INP).
    partytown({
      config: {
        forward: ['ym', 'dataLayer.push', 'gtag'],
      },
    }),
    // astro-compress: минификация HTML/CSS/JS/SVG/JSON на build.
    // -5-15% размер страниц.
    compress({
      CSS: true,
      HTML: true,
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
        && !/\/packing\/[^/]+\/[^/]+\//.test(page)  // packing detail [страна]/[месяц] — noindex (scaled-content, 0 трафика)
        && !CLOSED_TRIPS.has(page),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: DATA_DATE,
      serialize(item) {
        const url = item.url;
        item = { ...item, lastmod: blogLastmod[url] || DATA_DATE };
        // Homepage and main tools — top priority, daily-ish updates
        if (url === 'https://traveltribe.ru/') {
          return { ...item, priority: 1.0, changefreq: 'daily' };
        }
        if (url === 'https://traveltribe.ru/seasons/' || url === 'https://traveltribe.ru/calculator/') {
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
