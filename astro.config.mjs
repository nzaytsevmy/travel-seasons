import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://traveltribe.ru',
  integrations: [
    partytown({
      config: {
        forward: ['ym'],
      },
    }),
  ],
});
