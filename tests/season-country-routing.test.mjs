import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRIES } from '../src/data/programmatic-seasons.js';
import { DIRECTIONS } from '../src/data/directions.js';
import { SEASON_COUNTRY_REDIRECTS } from '../src/data/season-country-redirects.js';

test('every legacy seasons country directory resolves to an existing country hub', () => {
  const destinations = new Set(DIRECTIONS.map(({ slug }) => slug));
  assert.equal(Object.keys(SEASON_COUNTRY_REDIRECTS).length, Object.keys(COUNTRIES).length);
  for (const slug of Object.keys(COUNTRIES)) {
    assert.ok(destinations.has(slug), slug);
    assert.equal(SEASON_COUNTRY_REDIRECTS[`/seasons/${slug}`], `/${slug}/`);
  }
  for (const slug of ['japan', 'georgia', 'turkey', 'bali', 'thailand']) {
    assert.equal(SEASON_COUNTRY_REDIRECTS[`/seasons/${slug}`], `/${slug}/`);
  }
  const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /\.\.\.SEASON_COUNTRY_REDIRECTS/);
});

test('monthly seasons breadcrumbs link straight to the country hub', () => {
  const source = readFileSync(new URL('../src/pages/seasons/[country]/[month].astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /'position': 3[^\n]*\/seasons\/\$\{country\.slug\}\//);
});
