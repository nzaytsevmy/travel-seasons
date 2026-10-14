import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAttentionFeed, attentionMatches } from '../scripts/news-attention.mjs';
const observedAt = '2026-10-14T10:00:00Z';
const now = new Date('2026-10-14T10:30:00Z');
const xml = `<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss"><channel><title>Trends</title><item><title>Игуасу паводок &amp; закрытие</title><pubDate>Wed, 14 Oct 2026 08:00:00 GMT</pubDate><ht:approx_traffic>200+</ht:approx_traffic><ht:news_item><ht:news_item_title>Парк закрыл тропы</ht:news_item_title><ht:news_item_url>https://example.org/story</ht:news_item_url><ht:news_item_source>Издание</ht:news_item_source></ht:news_item></item></channel></rss>`;
test('RSS retains the observed query, date, market and reported traffic without inventing demand', () => {
  const feed = parseAttentionFeed(xml, { observedAt });
  assert.equal(feed.count, 1); assert.equal(feed.region, 'RU');
  assert.equal(feed.items[0].query, 'Игуасу паводок & закрытие');
  assert.equal(feed.items[0].reportedTraffic, '200+');
  assert.equal(feed.items[0].coverage[0].url, 'https://example.org/story');
  assert.equal('monthlyDemand' in feed.items[0], false);
});
test('only an exact phrase token match in a fresh Russian observation confirms a signal', () => {
  const feed = parseAttentionFeed(xml, { observedAt });
  assert.equal(attentionMatches(['Игуасу паводок'], feed, now).length, 1);
  assert.equal(attentionMatches(['гоа'], feed, now).length, 0);
  assert.equal(attentionMatches(['Игуасу'], { ...feed, region: 'GB' }, now), null);
  assert.equal(attentionMatches(['Игуасу'], { ...feed, observedAt: '2026-10-01' }, now), null);
});
test('failure, an invalid response or a future date cannot turn into zero demand', () => {
  assert.throws(() => parseAttentionFeed('<html>blocked</html>', { observedAt }), /RSS/);
  assert.throws(() => parseAttentionFeed(xml.replace('Wed, 14 Oct 2026 08:00:00 GMT', 'bad'), { observedAt }), /date/);
  assert.equal(attentionMatches(['Игуасу'], { status: 'unavailable' }, now), null);
  const feed = parseAttentionFeed(xml, { observedAt });
  assert.equal(attentionMatches(['Игуасу'], { ...feed, observedAt: '2026-10-15' }, now), null);
  assert.deepEqual(attentionMatches(['Игуасу'], { ...feed, items: [{ ...feed.items[0], startedAt: '2026-10-15' }] }, now), []);
});
