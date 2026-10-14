import test from 'node:test';
import assert from 'node:assert/strict';
import { newsTopicPages, newsTopicUrl } from '../src/data/news-topics.js';
test('topic archives preserve every eligible story with a bounded crawlable page size', () => {
  const entries = Array.from({ length: 63 }, (_, i) => ({ slug: `story-${i}`, data: {
    topic: 'nature', added: new Date('2026-10-14'), checked: new Date('2026-10-14'), date: new Date('2026-10-14'),
  } }));
  const pages = newsTopicPages(entries);
  assert.deepEqual(pages.map(p => p.items.length), [30, 30, 3]);
  assert.equal(new Set(pages.flatMap(p => p.items.map(e => e.slug))).size, 63);
  assert.equal(newsTopicUrl('priroda'), '/novosti/tema/priroda/');
  assert.equal(newsTopicUrl('priroda', 2), '/novosti/tema/priroda/2/');
});
test('empty topics create no thin pages and archived stories are not resurfaced', () => {
  assert.deepEqual(newsTopicPages([]), []);
  assert.deepEqual(newsTopicPages([{ slug: 'old', data: { topic: 'nature', archived: true } }]), []);
});
