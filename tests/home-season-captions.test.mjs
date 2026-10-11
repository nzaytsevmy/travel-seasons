import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS } from '../src/data/directions.js';
import climate from '../src/data/climate-normals.generated.json' with { type: 'json' };
import { HOME_SEASON_CAPTIONS, withHomeSeasonCaptions } from '../src/data/home-season-captions.js';
import { PRICES } from '../src/data/prices.js';
import { VISA_DETAILS } from '../src/data/visa-details.js';
import { ACTIVITY_TAGS } from '../src/data/country-activity-tags.js';
import { createDestinationRows, directionForMonth } from '../src/utils/destination-selection.js';

test('каждое направление получает 12 коротких подписей без старых обещаний идеального сезона', () => {
  assert.deepEqual(Object.keys(HOME_SEASON_CAPTIONS).sort(), DIRECTIONS.map(d => d.slug).sort());
  for (const d of DIRECTIONS) {
    const notes = HOME_SEASON_CAPTIONS[d.slug];
    assert.equal(notes.length, 12, d.slug);
    for (const [i, text] of notes.entries()) {
      assert.ok(text.length >= 35 && text.length <= 180, `${d.slug}/${i + 1}: ${text}`);
      assert.doesNotMatch(text, /идеал|гарант|без дожд|меньше турист|дешевле|ниже цен/i);
    }
  }
});

test('зимний Алтай не становится тёплым, октябрь на юге Новой Зеландии не становится летом', () => {
  assert.ok(climate.places.altai.months[0].tmax < 0);
  assert.match(HOME_SEASON_CAPTIONS.altai[0], /мороз|холод/i);
  assert.match(HOME_SEASON_CAPTIONS['new-zealand'][9], /весна/i);
  assert.match(HOME_SEASON_CAPTIONS['new-zealand'][9], /прохлад|холод/i);
  assert.match(HOME_SEASON_CAPTIONS['australia-east'][9], /весна/i);
});

test('разные берега не получают обещание общего сухого сезона', () => {
  assert.match(HOME_SEASON_CAPTIONS.thailand[10], /Самуи.*дожд/i);
  assert.match(HOME_SEASON_CAPTIONS['sri-lanka'][6], /восточн/i);
  assert.match(HOME_SEASON_CAPTIONS['sri-lanka'][6], /юго-запад.*дожд/i);
  assert.match(HOME_SEASON_CAPTIONS['south-africa'][6], /Крюгер/i);
  assert.match(HOME_SEASON_CAPTIONS['south-africa'][6], /Кейптаун.*дожд/i);
  assert.match(HOME_SEASON_CAPTIONS['japan-hokkaido'][9], /снег/i);
  assert.match(HOME_SEASON_CAPTIONS.turkey[9], /Анталь/i);
  assert.match(HOME_SEASON_CAPTIONS.karelia[9], /рейс|расписан/i);
});

test('главная использует свои подписи, не меняя общий каталог и данные бюджетов', () => {
  const rows = createDestinationRows(DIRECTIONS, PRICES, VISA_DETAILS, { USD: 84.3363, EUR: 97.7626 }, ACTIVITY_TAGS);
  const before = structuredClone(rows);
  const home = withHomeSeasonCaptions(rows);
  assert.deepEqual(rows, before);
  for (const row of home) {
    assert.equal(row.budgets, rows.find(r => r.slug === row.slug).budgets);
    for (let month = 1; month <= 12; month++) {
      assert.equal(directionForMonth(row, month).seasonReason, HOME_SEASON_CAPTIONS[row.slug][month - 1]);
    }
  }
  assert.throws(() => withHomeSeasonCaptions([{ slug: 'unknown' }]), /unknown/);
});
