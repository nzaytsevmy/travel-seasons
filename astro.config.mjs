import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://traveltribe.ru',

  image: {
    domains: ['images.unsplash.com'],
  },

  integrations: [
    partytown({ config: { forward: ['ym'] } }),
    sitemap(),
  ],

  adapter: cloudflare()
});