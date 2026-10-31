import { COUNTRIES } from './programmatic-seasons.js';

// REG.RU serves static files: Astro emits the existing instant-refresh and
// canonical redirect format. These missing directory indexes formerly gave 403.
export const SEASON_COUNTRY_REDIRECTS = Object.freeze(Object.fromEntries(
  Object.keys(COUNTRIES).map(slug => [`/seasons/${slug}`, `/${slug}/`]),
));
