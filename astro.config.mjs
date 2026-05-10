import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import icon from 'astro-icon';
import partytown from '@astrojs/partytown';
import compress from 'astro-compress';
import brokenLinks from 'astro-broken-links-checker';
import remarkNumerals from './tools/remark-numerals.mjs';
import rehypeTableWrap from './tools/rehype-table-wrap.mjs';
import rehypeFaqAccordion from './tools/rehype-faq-accordion.mjs';

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
    pagefind(),
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
        && !page.includes('/pagefind/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = item.url;
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
