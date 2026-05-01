import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://traveltribe.ru',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    domains: ['images.unsplash.com'],
  },
  integrations: [
    mdx(),
    partytown({ config: { forward: ['ym'] } }),
    sitemap(),
  ],
});
