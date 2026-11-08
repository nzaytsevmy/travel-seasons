import test from 'node:test';
import assert from 'node:assert/strict';
import { activeNewsTopics, inactiveNewsTopicPaths, newsTopicPages, newsTopicRoutes, newsTopicUrl } from '../src/data/news-topics.js';
import { TOPIC_LABEL } from '../src/data/news.js';
import { readFileSync } from 'node:fs';
import { parseNote } from '../scripts/news-gate.mjs';
import { newsFrontmatter } from '../src/data/news-frontmatter.js';
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
  assert.deepEqual(activeNewsTopics([{ slug: 'old', data: { topic: 'culture', archived: true } }]), []);
  const old = [{ slug: 'old', data: { topic: 'culture', archived: true } }];
  assert(inactiveNewsTopicPaths(old).includes('/novosti/tema/kultura-i-sobytiya/'));
  const retired = newsTopicRoutes(old).find(page => page.topic.topic === 'culture');
  assert.equal(retired.retired, true);
  assert.deepEqual(retired.items, []);
  assert(newsTopicRoutes([]).some(page => page.topic.topic === 'culture' && page.retired));
  assert.deepEqual(newsFrontmatter('---\ntopic: culture # editorial\narchived: true # ended\n---\n'),
    { topic: 'culture', archived: true });
});
test('the three reviewed cultural events use the cultural topic even if later archived', () => {
  for (const slug of ['2026-11-08-loi-krathong-2026', '2026-10-09-rome-fayum-portraits-presale',
    '2026-10-10-bangkok-royal-barges-november']) {
    const note = parseNote(readFileSync(`src/content/news/${slug}.md`, 'utf8'), slug);
    assert.equal(note.data.topic, 'culture', slug);
  }
});
test('culture stories have their own labelled archive without changing nature', () => {
  const date = new Date('2026-11-08');
  const entry = (slug, topic) => ({ slug, data: { topic, added: date, checked: date, date } });
  const entries = [entry('festival', 'culture'), entry('exhibition', 'culture'), entry('whale', 'nature')];
  const pages = newsTopicPages(entries);
  const culture = pages.find(page => page.topic.topic === 'culture');
  const nature = pages.find(page => page.topic.topic === 'nature');
  assert.equal(TOPIC_LABEL.culture, 'Культура и события');
  assert.equal(newsTopicUrl(culture.topic.slug), '/novosti/tema/kultura-i-sobytiya/');
  assert.deepEqual(culture.items.map(item => item.slug), ['exhibition', 'festival']);
  assert.deepEqual(nature.items.map(item => item.slug), ['whale']);
  assert.deepEqual(activeNewsTopics(entries).map(item => item.topic), ['nature', 'culture']);
  const more = Array.from({ length: 31 }, (_, index) => entry(`culture-${index}`, 'culture'));
  assert.deepEqual(newsTopicPages(more).map(page => page.items.length), [30, 1]);
});
