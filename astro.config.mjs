import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://traveltribe.ru',
  integrations: [
    partytown({ config: { forward: ['ym'] } }),
    sitemap(),
  ],
});
