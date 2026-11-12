import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { normalizeAstro, topicFingerprints, topicLastmodFromGit } from '../scripts/news-topic-freshness.mjs';
import { NEWS_TOPICS, NEWS_TOPIC_PAGE_SIZE, newsTopicPages, newsTopicUrl } from '../src/data/news-topics.js';

const date = value => new Date(`${value}T00:00:00Z`);
const story = (slug, topic = 'culture') => ({ slug, body: 'body', data: {
  topic, title: slug, tldr: `Short ${slug}. More details.`, date: date('2026-11-01'),
  checked: date('2026-11-08'), added: date('2026-11-08'), archived: false,
} });
const fingerprint = entries => topicFingerprints(entries, 'layout');

// A preview is one proposed release: net-changed pages use the candidate
// commit instant. Main first-parent states are source history; live is checked separately.
test('body-only and invisible fact-check changes do not change a topic page', () => {
  const entries = [story('festival'), story('museum')];
  const same = structuredClone(entries);
  same[0].body = 'a revised body'; same[0].data.checked = date('2026-11-09');
  same[0].data.tldr = 'Short festival. Different second sentence.';
  assert.deepEqual(fingerprint(same), fingerprint(entries));
  delete same[0].data.added;
  assert.notDeepEqual(fingerprint(same), fingerprint(entries));
});

test('visible items, ordering, archives and navigation change affected pages', () => {
  const base = [story('a'), story('b'), story('whale', 'nature')], old = fingerprint(base);
  const edited = structuredClone(base); edited[0].data.title = 'New title';
  assert.notEqual(fingerprint(edited)['/novosti/tema/kultura-i-sobytiya/'], old['/novosti/tema/kultura-i-sobytiya/']);
  const moved = structuredClone(base); moved[0].data.topic = 'nature';
  assert.notEqual(fingerprint(moved)['/novosti/tema/priroda/'], old['/novosti/tema/priroda/']);
  const archived = structuredClone(base); archived[0].data.archived = true;
  assert.notEqual(fingerprint(archived)['/novosti/tema/kultura-i-sobytiya/'], old['/novosti/tema/kultura-i-sobytiya/']);
  const reordered = structuredClone(base); reordered[0].data.added = date('2026-11-09');
  assert.notEqual(fingerprint(reordered)['/novosti/tema/kultura-i-sobytiya/'], old['/novosti/tema/kultura-i-sobytiya/']);
  assert.notEqual(fingerprint([...base, story('train', 'transport')])['/novosti/tema/priroda/'], old['/novosti/tema/priroda/']);
  const many = Array.from({ length: 31 }, (_, i) => story(`s-${i}`));
  const before = fingerprint(many), after = fingerprint(many.slice(0, 30));
  assert(before['/novosti/tema/kultura-i-sobytiya/2/']);
  assert(!after['/novosti/tema/kultura-i-sobytiya/2/']);
  assert.notEqual(before['/novosti/tema/kultura-i-sobytiya/'], after['/novosti/tema/kultura-i-sobytiya/']);
});

test('projection has the same URLs as the actual archive and ignores internal topic IDs', () => {
  const entries = [story('a'), story('whale', 'nature')];
  const projected = fingerprint(entries);
  assert.deepEqual(Object.keys(projected), newsTopicPages(entries).map(page => newsTopicUrl(page.topic.slug, page.page)));
  const changedEntries = structuredClone(entries);
  changedEntries[1].data.topic = 'wildlife';
  const topics = NEWS_TOPICS.map(topic => topic.topic === 'nature' ? { ...topic, topic: 'wildlife' } : topic);
  assert.deepEqual(topicFingerprints(changedEntries, 'layout', { topics, pageSize: NEWS_TOPIC_PAGE_SIZE }), projected);
});

test('template comments are ignored, visible copy remains significant', async () => {
  const source = '---\nconst x = 1;\n---\n<div>Привет <!-- заметка --> мир</div><style>.x { color: red }</style>';
  const normalized = await normalizeAstro(source, 'topic.astro');
  assert.equal(await normalizeAstro(source.replace(' заметка ', ' другой комментарий '), 'topic.astro'), normalized);
  assert.equal(await normalizeAstro(source.replace('const x = 1;', '// comment\nconst x = 1;'), 'topic.astro'), normalized);
  assert.equal(await normalizeAstro(source.replace('<style>', '<style>/* comment */'), 'topic.astro'), normalized);
  assert.notEqual(await normalizeAstro(source.replace('Привет', 'Здравствуйте'), 'topic.astro'), normalized);
});

function fixture(t, { nature = false, stagedOrdering = false, timedOrder = false, explicitActive = false, crossTopics = false, oldProjection = false, legacyAuthorship = false } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'tt-topic-history-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (args, stamp) => execFileSync('git', args, { cwd: root, encoding: 'utf8',
    env: { ...process.env, ...(stamp ? { GIT_AUTHOR_DATE: stamp.includes('T') ? stamp : `${stamp}T09:00:00Z`,
      GIT_COMMITTER_DATE: stamp.includes('T') ? stamp : `${stamp}T09:00:00Z` } : {}) } }).trim();
  git(['init', '-q']); git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.invalid']);
  const put = (file, value) => { const target = path.join(root, file); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, value); };
  const projectionFiles = ['src/pages/novosti/tema/[topic]/[...page].astro', 'src/components/NewsCompact.astro',
    'src/data/news.js', 'src/data/news-topics.js', 'src/data/freshness.js', 'src/data/news-frontmatter.js',
    'scripts/news-topic-freshness.mjs', 'package-lock.json'];
  const upgrade = () => { for (const file of projectionFiles) put(file, readFileSync(file)); };
  const downgrade = () => { for (const file of projectionFiles) put(file,
    execFileSync('git', ['show', `b947d98b01c29f2e651e6f5f3aecb72c93779ff5:${file}`])); };
  if (legacyAuthorship) downgrade(); else upgrade();
  if (oldProjection) {
    const file = 'src/data/news.js', source = readFileSync(path.join(root, file), 'utf8');
    put(file, source.replace('first.length <= 130', 'first.length <= 131'));
  }
  const note = (title, topic = 'culture', body = 'Body.', gist = 'Short description. More details.') => `---\ndate: '2026-11-01'\nchecked: '2026-11-01'\nadded: '2026-11-01'\ntopic: ${topic}\ntitle: '${title}'\ntldr: '${gist}'\n---\n${body}\n`;
  const file = 'src/content/news/festival.md';
  put(file, explicitActive ? note('Festival').replace('topic: culture\n', 'topic: culture\narchived: false\n') : note('Festival'));
  if (nature) {
    put('src/content/news/whale.md', note('Whale', 'nature'));
    put('src/content/news/festival-two.md', note('Other festival'));
  }
  if (stagedOrdering) put('src/content/news/festival-two.md',
    note('Other festival').replace("date: '2026-11-01'", "date: '2026-10-01'"));
  if (timedOrder) put('src/content/news/festival-two.md',
    note('Other festival').replace("added: '2026-11-01'", "added: '2026-11-01T01:00:00Z'"));
  if (crossTopics) put('src/content/news/whale.md',
    note('Whale', 'nature').replace("added: '2026-11-01'", "added: '2026-11-01T01:00:00Z'"));
  const commit = stamp => { git(['add', '-A']); git(['commit', '-qm', stamp], stamp); return git(['rev-parse', 'HEAD']); };
  const anchor = commit('2026-11-01');
  const baseDates = { '/novosti/tema/kultura-i-sobytiya/': '2026-11-01' };
  if (nature || crossTopics) baseDates['/novosti/tema/priroda/'] = '2026-11-01';
  const scanInstant = (head, base) => topicLastmodFromGit({ root, head, base, anchor, baseDates });
  const scan = async (head, base) => Object.fromEntries(Object.entries(await scanInstant(head, base))
    .map(([url, value]) => [url, value.slice(0, 10)]));
  return { root, git, put, note, file, commit, anchor, scan, scanInstant, upgrade, downgrade };
}

test('verified personal-to-editorial migration dates every topic, then preserves invisible edits', async t => {
  const f = fixture(t, { nature: true, legacyAuthorship: true });
  f.upgrade(); const migrated = f.commit('2026-11-02');
  const dates = await f.scan(migrated, migrated);
  assert.equal(Object.keys(dates).length, 2);
  assert.ok(Object.values(dates).every(value => value === '2026-11-02'));
  f.put(f.file, f.note('Festival', 'culture', 'A body-only revision.'));
  const later = f.commit('2026-11-03');
  assert.deepEqual(await f.scan(later, later), dates);
});

test('a known legacy revert after editorial publication cannot be hidden by returning to editorial', async t => {
  const f = fixture(t, { nature: true, legacyAuthorship: true });
  f.upgrade(); f.commit('2026-11-02');
  f.downgrade(); f.commit('2026-11-03');
  f.upgrade(); const head = f.commit('2026-11-04');
  await assert.rejects(f.scan(head, head), /editorial projection reverted to legacy/);
});

test('editing one topic description does not redate other topics', async t => {
  const f = fixture(t, { nature: true });
  const file = 'src/data/news-topics.js';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace('Открытия о животных, природные явления и события с датой:',
    'Новые наблюдения за животными и природные явления:'));
  const head = f.commit('2026-11-02');
  const dates = await f.scan(head, head);
  assert.equal(dates['/novosti/tema/priroda/'], '2026-11-02');
  assert.equal(dates['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('draft changes reverted before squash do not advance lastmod', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put(f.file, f.note('Festival')); const head = f.commit('2026-11-03');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('a proposed changed page uses the candidate instant, not an unpublished intermediate edit', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put('unrelated.txt', 'Unrelated'); const head = f.commit('2026-11-03');
  assert.equal((await f.scanInstant(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-03T09:00:00.000Z');
});

test('a published squash records its exact source instant', async t => {
  const f = fixture(t), branch = f.git(['branch', '--show-current']);
  f.git(['checkout', '-qb', 'feature']);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.git(['checkout', '-q', branch]); f.git(['merge', '--squash', 'feature']);
  const head = f.commit('2026-11-04');
  assert.equal((await f.scanInstant(head, head))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04T09:00:00.000Z');
});

test('a Moscow day boundary never advances lastmod past the source instant', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-03T22:30:00Z');
  assert.equal((await f.scanInstant(head, head))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-03T22:30:00.000Z');
});

test('a hidden second sentence alone does not change the proposed topic page', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Temporary', 'culture', 'Body.', 'Temporary first. More details.')); f.commit('2026-11-02');
  f.put(f.file, f.note('Festival', 'culture', 'Body.', 'Short description. New hidden details.'));
  const head = f.commit('2026-11-03');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('equivalent date representations alone do not change the proposed topic page', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Festival').replace("added: '2026-11-01'", "added: '2026-10-31T23:00:00Z'"));
  f.commit('2026-11-02');
  f.put(f.file, f.note('Festival').replace("added: '2026-11-01'", "added: '2026-11-01T03:00:00Z'"));
  const head = f.commit('2026-11-03');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('renaming an internal topic ID alone preserves the published page date', async t => {
  const f = fixture(t), file = 'src/data/news-topics.js';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace("topic: 'culture'", "topic: 'festival'"));
  f.put(f.file, f.note('Festival', 'festival'));
  const head = f.commit('2026-11-02');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('a candidate only updates topics whose final projection actually changed', async t => {
  const f = fixture(t, { nature: true });
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-02');
  const dates = await f.scan(head, f.anchor);
  assert.equal(dates['/novosti/tema/kultura-i-sobytiya/'], '2026-11-02');
  assert.equal(dates['/novosti/tema/priroda/'], '2026-11-01');
});

test('a reverted draft helper change does not block a later news edit', async t => {
  const f = fixture(t);
  const helper = 'src/data/news.js';
  const source = readFileSync(path.join(f.root, helper), 'utf8');
  f.put(helper, source.replace('first.length <= 130', 'first.length <= 129')); f.commit('2026-11-02');
  f.put(helper, source); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after reverted topic description and lasting news edit', async t => {
  const f = fixture(t);
  const file = 'src/data/news-topics.js';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace('Выставки, фестивали и культурные события:',
    'Временное описание культурной рубрики:')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed')); f.commit('2026-11-03');
  f.put(file, source); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after one topic description reverts and another changes', async t => {
  const f = fixture(t, { nature: true });
  const file = 'src/data/news-topics.js';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace('Выставки, фестивали и культурные события:',
    'Временное описание культурной рубрики:')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed')); f.commit('2026-11-03');
  f.put(file, source.replace('Открытия о животных, природные явления и события с датой:',
    'Новые наблюдения за животными и природные явления:'));
  const head = f.commit('2026-11-04');
  const dates = await f.scan(head, f.anchor);
  assert.equal(dates['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
  assert.equal(dates['/novosti/tema/priroda/'], '2026-11-04');
});

test('candidate after a reverted title and lasting story change', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Temporary')); f.commit('2026-11-02');
  f.put(f.file, f.note('Temporary', 'culture', 'Body.', 'A new description.')); f.commit('2026-11-03');
  f.put(f.file, f.note('Festival', 'culture', 'Revised body.', 'A new description.'));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after a reverted gist and a hidden second-sentence edit', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Festival', 'culture', 'Body.', 'Temporary first. More details.')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed', 'culture', 'Body.', 'Temporary first. More details.')); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed', 'culture', 'Body.', 'Short description. New hidden details.'));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate with equivalent added and checked dates', async t => {
  const f = fixture(t), replaceAdded = text => text.replace("added: '2026-11-01'", "added: '2026-11-02'");
  f.put(f.file, replaceAdded(f.note('Festival'))); f.commit('2026-11-02');
  f.put(f.file, replaceAdded(f.note('Changed'))); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'\n", ''));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate with a different time but stable visible order', async t => {
  const f = fixture(t), added = (text, value) => text.replace("added: '2026-11-01'", `added: '${value}'`);
  f.put(f.file, added(f.note('Festival'), '2026-10-31T23:00:00Z')); f.commit('2026-11-02');
  f.put(f.file, added(f.note('Changed'), '2026-10-31T23:00:00Z')); f.commit('2026-11-03');
  f.put(f.file, added(f.note('Changed'), '2026-11-01T03:00:00Z')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate retains a real same-day reorder', async t => {
  const f = fixture(t, { timedOrder: true });
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  const moved = f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T03:00:00Z'");
  f.put(f.file, moved); f.commit('2026-11-03');
  f.put(f.file, moved.replace('Body.', 'Revised body.')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('a timestamp reorder against a newly added story remains significant', async t => {
  const f = fixture(t);
  f.put('src/content/news/festival-two.md',
    f.note('Other festival').replace("added: '2026-11-01'", "added: '2026-11-01T01:00:00Z'"));
  f.commit('2026-11-02');
  f.put(f.file, f.note('Changed')); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T03:00:00Z'"));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after temporary reorder against a new story', async t => {
  const f = fixture(t);
  f.put('src/content/news/festival-two.md',
    f.note('Other festival').replace("added: '2026-11-01'", "added: '2026-11-01T04:00:00Z'"));
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T05:00:00Z'"));
  f.commit('2026-11-03');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T03:00:00Z'"));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after unrelated cross-topic ordering changes', async t => {
  const f = fixture(t, { crossTopics: true });
  f.put('src/content/news/festival-two.md',
    f.note('Other festival').replace("added: '2026-11-01'", "added: '2026-11-01T04:00:00Z'"));
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T05:00:00Z'"));
  f.commit('2026-11-03');
  f.put(f.file, f.note('Changed').replace("added: '2026-11-01'", "added: '2026-11-01T03:00:00Z'"));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after temporary second-key reorder against a new story', async t => {
  const f = fixture(t);
  f.put('src/content/news/festival-two.md',
    f.note('Other festival').replace("date: '2026-11-01'", "date: '2026-10-15'"));
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed').replace("date: '2026-11-01'", "date: '2026-09-01'"));
  f.commit('2026-11-03');
  f.put(f.file, f.note('Changed').replace("date: '2026-11-01'", "date: '2026-11-02'"));
  const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after a temporary sort change', async t => {
  const f = fixture(t, { stagedOrdering: true });
  const withDate = (title, value) => f.note(title).replace("date: '2026-11-01'", `date: '${value}'`);
  f.put(f.file, withDate('Festival', '2026-09-01')); f.commit('2026-11-02');
  f.put(f.file, withDate('Changed', '2026-09-01')); f.commit('2026-11-03');
  f.put(f.file, withDate('Changed', '2026-11-02')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate retains a real sort change after a body-only edit', async t => {
  const f = fixture(t, { stagedOrdering: true });
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  const reordered = f.note('Changed').replace("date: '2026-11-01'", "date: '2026-09-01'");
  f.put(f.file, reordered); f.commit('2026-11-03');
  f.put(f.file, reordered.replace('Body.', 'Revised body.')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after temporary archival of an active topic', async t => {
  const f = fixture(t);
  const archive = text => text.replace('topic: culture\n', 'topic: culture\narchived: true\n');
  f.put(f.file, archive(f.note('Festival'))); f.commit('2026-11-02');
  f.put(f.file, archive(f.note('Changed'))); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate with equivalent false and absent archived flags', async t => {
  const f = fixture(t, { explicitActive: true });
  const archive = text => text.replace('topic: culture\n', 'topic: culture\narchived: true\n');
  f.put(f.file, archive(f.note('Festival'))); f.commit('2026-11-02');
  f.put(f.file, archive(f.note('Changed'))); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after an internal topic ID rename', async t => {
  const f = fixture(t), file = 'src/data/news-topics.js';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace("topic: 'culture'", "topic: 'festival'")); f.commit('2026-11-02');
  f.put(f.file, f.note('Changed')); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed', 'festival', 'Revised body.')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after temporary deletion and restoration', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.git(['rm', '-q', f.file]); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed', 'culture', 'Revised body.')); const head = f.commit('2026-11-04');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
});

test('candidate after temporary topic navigation reorder', async t => {
  const f = fixture(t, { nature: true });
  const file = 'src/data/news-topics.js', source = readFileSync(path.join(f.root, file), 'utf8');
  const start = source.indexOf("  { topic: 'nature'"), next = source.indexOf("  { topic: 'culture'", start);
  const end = source.indexOf('];', next);
  assert(start >= 0 && next > start && end > next);
  f.put(file, source.slice(0, start) + source.slice(next, end) + source.slice(start, next) + source.slice(end));
  f.commit('2026-11-02');
  f.put(f.file, f.note('Changed')); f.commit('2026-11-03');
  f.put(file, source.replace('Открытия о животных, природные явления и события с датой:',
    'Новые наблюдения за животными и природные явления:'));
  const head = f.commit('2026-11-04');
  const dates = await f.scan(head, f.anchor);
  assert.equal(dates['/novosti/tema/kultura-i-sobytiya/'], '2026-11-04');
  assert.equal(dates['/novosti/tema/priroda/'], '2026-11-04');
});

test('candidate source instant follows the final PR commit', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put('unrelated.txt', 'Unrelated'); const head = f.commit('2026-11-03');
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-03');
});

test('synthetic merge preview uses the candidate source instant', async t => {
  const f = fixture(t);
  const originalBranch = f.git(['branch', '--show-current']);
  f.git(['checkout', '-qb', 'feature']);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.git(['checkout', '-q', originalBranch]);
  f.git(['merge', '--no-ff', '-qm', 'merge', 'feature'], '2026-11-03');
  const head = f.git(['rev-parse', 'HEAD']);
  assert.equal((await f.scan(head, f.anchor))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-03');
});

test('one commit moving a story updates both affected topics', async t => {
  const f = fixture(t, { nature: true });
  f.put(f.file, f.note('Festival', 'nature'));
  const head = f.commit('2026-11-02');
  const dates = await f.scan(head, head);
  assert.equal(dates['/novosti/tema/kultura-i-sobytiya/'], '2026-11-02');
  assert.equal(dates['/novosti/tema/priroda/'], '2026-11-02');
});

test('a published change and later published revert both advance lastmod', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-02');
  f.put(f.file, f.note('Festival')); const head = f.commit('2026-11-03');
  assert.equal((await f.scan(head, head))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-03');
});

test('a body-only edit does not change topic lastmod', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Festival', 'culture', 'New body.')); const head = f.commit('2026-11-02');
  assert.equal((await f.scan(head, head))['/novosti/tema/kultura-i-sobytiya/'], '2026-11-01');
});

test('a missing historical blob cannot masquerade as a new story', async t => {
  const f = fixture(t);
  const old = f.git(['rev-parse', `${f.anchor}:${f.file}`]);
  f.put(f.file, f.note('Festival', 'culture', 'New body.')); const head = f.commit('2026-11-02');
  rmSync(path.join(f.root, '.git/objects', old.slice(0, 2), old.slice(2)));
  await assert.rejects(f.scan(head, head), /Missing historical (content|Git object)/);
});

test('a missing helper blob in the current tree stops sitemap generation', async t => {
  const f = fixture(t);
  const helper = 'src/data/news-frontmatter.js';
  const object = f.git(['rev-parse', `${f.anchor}:${helper}`]);
  rmSync(path.join(f.root, '.git/objects', object.slice(0, 2), object.slice(2)));
  await assert.rejects(f.scan(f.anchor, f.anchor), /Missing historical Git object/);
});

test('an uncommitted topic template stops sitemap generation', async t => {
  const f = fixture(t);
  const template = 'src/components/NewsCompact.astro';
  f.put(template, readFileSync(path.join(f.root, template), 'utf8').replace('Архив', 'Прошлое'));
  await assert.rejects(f.scan(f.anchor, f.anchor), /Uncommitted/);
});

test('changed rendering code does not automatically redate every page', async t => {
  const f = fixture(t);
  const helper = 'src/data/news.js';
  const source = readFileSync(path.join(f.root, helper), 'utf8');
  f.put(helper, source.replace('first.length <= 130', 'first.length <= 129'));
  const head = f.commit('2026-11-02');
  await assert.rejects(f.scan(head, head), /reconcile actual rendered page dates/);
});

test('a changed projection script requires reconciliation', async t => {
  const f = fixture(t);
  const file = 'scripts/news-topic-freshness.mjs';
  const source = readFileSync(path.join(f.root, file), 'utf8');
  f.put(file, source.replace('Invalid Git commit date', 'Bad Git commit date'));
  const head = f.commit('2026-11-02');
  await assert.rejects(f.scan(head, head), /reconcile actual rendered page dates/);
});

test('a published code change and revert cannot hide an unknown projection', async t => {
  const f = fixture(t);
  const helper = 'src/data/news.js';
  const source = readFileSync(path.join(f.root, helper), 'utf8');
  f.put(helper, source.replace('first.length <= 130', 'first.length <= 129'));
  f.commit('2026-11-02');
  f.put(helper, source); const head = f.commit('2026-11-03');
  await assert.rejects(f.scan(head, head), /Historical topic rendering code changed/);
});

test('published code change and revert remain blocked after a later news edit', async t => {
  const f = fixture(t);
  const helper = 'src/data/news.js';
  const source = readFileSync(path.join(f.root, helper), 'utf8');
  f.put(helper, source.replace('first.length <= 130', 'first.length <= 129')); f.commit('2026-11-02');
  f.put(helper, source); f.commit('2026-11-03');
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-04');
  await assert.rejects(f.scan(head, head), /Historical topic rendering code changed/);
});

test('an unknown main code version before initial projection cannot be hidden by a revert', async t => {
  const f = fixture(t, { oldProjection: true });
  const helper = 'src/data/news.js', original = readFileSync(path.join(f.root, helper), 'utf8');
  f.put(helper, original.replace('first.length <= 131', 'first.length <= 132')); f.commit('2026-11-02');
  f.put(helper, original); f.commit('2026-11-03');
  f.put(helper, original.replace('first.length <= 131', 'first.length <= 130'));
  f.put(f.file, f.note('Changed')); const head = f.commit('2026-11-04');
  await assert.rejects(f.scan(head, head), /Historical topic rendering code changed/);
});

test('future and non-monotonic commit dates fail closed', async t => {
  const f = fixture(t);
  f.put(f.file, f.note('Changed')); f.commit('2026-11-05');
  f.put(f.file, f.note('Again')); const head = f.commit('2026-11-03');
  await assert.rejects(f.scan(head, head), /out-of-order/);
});

test('a shallow repository cannot supply verified topic dates', async t => {
  const f = fixture(t);
  writeFileSync(path.join(f.root, '.git/shallow'), f.anchor + '\n');
  await assert.rejects(f.scan(f.anchor, f.anchor), /full Git history/);
});
