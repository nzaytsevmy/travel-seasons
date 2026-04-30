import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://traveltribe.ru',

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

  adapter: cloudflare()
});