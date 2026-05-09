import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import remarkNumerals from './tools/remark-numerals.mjs';
import rehypeTableWrap from './tools/rehype-table-wrap.mjs';

export default defineConfig({
  site: 'https://traveltribe.ru',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
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
    rehypePlugins: [rehypeTableWrap],
  },
  integrations: [
    mdx(),
    pagefind(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/blog/tag/') && !page.includes('sitemap-images'),
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
