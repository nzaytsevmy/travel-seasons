import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';
import { VISA_DETAILS } from '../src/data/visa-details.js';
import { ACTIVITY_TAGS } from '../src/data/country-activity-tags.js';
import { COUNTRY_PHOTOS } from '../src/data/country-photos.js';
import { HOME_HERO, HOME_STORIES, HOME_STORY_PHOTOS, HOME_MOODS, countryPhotoSources, allocateHomePhotos } from '../src/data/home-journal.js';
import { homePhotoProvenance, photoSourceKey } from '../src/utils/home-photo-provenance.js';
import { createDestinationRows, homeCollections } from '../src/utils/destination-selection.js';
const key = p => p.key || 'src/content/blog/_images/' + p.file;
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const rows = createDestinationRows(DIRECTIONS, PRICES, VISA_DETAILS, { USD: 84.3363, EUR: 97.7626 }, ACTIVITY_TAGS);
const pools = Object.fromEntries(rows.map(r => [r.slug, countryPhotoSources(r.slug).map(p => ({ ...p, key: key(p), id: homePhotoProvenance(key(p)).id }))]));
const fixed = [key(HOME_HERO), key(COUNTRY_PHOTOS.kenya.practice[1]), ...HOME_MOODS.map(m => key(m.photo)), ...Object.values(HOME_STORY_PHOTOS)];

test('в каждом месяце исходная главная содержит 30 разных реальных файлов, а не кропы одного кадра', () => {
  const reserved = fixed.map(f => homePhotoProvenance(f).id);
  assert.equal(new Set(reserved).size, 14);
  for (let m = 1; m <= 12; m++) {
    const c = allocateHomePhotos(homeCollections(rows, { m }), pools, reserved, m);
    const images = [...reserved, ...Object.values(c).flat().map(r => r.photo.id)];
    assert.equal(images.length, 30, `месяц ${m}`);
    assert.equal(new Set(images).size, 30, `месяц ${m}`);
  }
});

test('подбор не теряет фотографии при всех 900 сочетаниях месяца, бюджета, въезда и отдыха', () => {
  const reserved = fixed.map(f => homePhotoProvenance(f).id);
  for (let m = 1; m <= 12; m++) for (const max_budget of [0, 100000, 200000])
    for (const visa of ['any', 'free', 'free_evisa', 'evisa', 'required'])
      for (const vibe of ['', 'beach', 'mountains', 'city', 'nature']) {
        const c = allocateHomePhotos(homeCollections(rows, { m, max_budget, visa, vibe }), pools, reserved, m);
        const images = [...reserved, ...Object.values(c).flat().map(r => r.photo.id)];
        assert.equal(new Set(images).size, images.length, JSON.stringify({ m, max_budget, visa, vibe }));
      }
});

test('весь пул главной имеет подтверждённое происхождение, кропы одного оригинала получают один ID', () => {
  for (const file of [...fixed, ...Object.values(pools).flat().map(p => p.key)]) assert.ok(homePhotoProvenance(file).id, file);
  const licensed = { creator: 'Photographer', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/?curid=12345' };
  assert.equal(photoSourceKey('crop-a', licensed), photoSourceKey('crop-b', licensed));
  const own = { creator: 'Никита Зайцев', license: 'Авторское фото', originalPath: '/Тонга/Фото 1.jpg' };
  assert.equal(photoSourceKey('small', own), photoSourceKey('large', own));
  assert.notEqual(photoSourceKey('same-size-a', { ...own, originalPath: '/Тонга/Фото 2.jpg' }), photoSourceKey('same-size-a', own));
});

test('все восемь обложек принадлежат выбранным существующим статьям', () => {
  for (const slug of HOME_STORIES) {
    const article = `src/content/blog/${slug}.${existsSync(`src/content/blog/${slug}.mdx`) ? 'mdx' : 'md'}`;
    const source = readFileSync(article, 'utf8');
    const relative = source.match(/^coverImage:\s*["']([^"']+)["']/m)?.[1];
    assert.ok(relative, slug);
    const actual = new URL(relative, new URL('../' + article, import.meta.url));
    assert.equal(hash(actual), hash(HOME_STORY_PHOTOS[slug]), slug);
  }
});
