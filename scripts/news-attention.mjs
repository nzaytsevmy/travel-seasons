// Public Google Trends RSS is a signal of a recent search surge, not monthly
// demand or a prediction of TravelTribe traffic. Failure stays UNKNOWN.
import { parseFragment } from 'parse5';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 2 * 1024 * 1024;
const walk = (node, name) => [
  ...(node.tagName === name ? [node] : []),
  ...(node.childNodes ?? []).flatMap(child => walk(child, name)),
];
const nodeText = node => node ? (node.value ?? (node.childNodes ?? []).map(nodeText).join('')) : '';
const field = (node, name) => nodeText(walk(node, name)[0]).trim();
export function parseAttentionFeed(xml, { observedAt, region = 'RU' }) {
  if (Buffer.byteLength(xml) > MAX_BYTES) throw new Error('Trends RSS exceeds the size limit.');
  if (!/^[A-Z]{2}$/.test(region) || !Number.isFinite(Date.parse(observedAt))) throw new Error('Invalid observation context.');
  const root = parseFragment(xml);
  if (walk(root, 'rss').length !== 1 || walk(root, 'channel').length !== 1) throw new Error('Expected a Trends RSS channel.');
  const items = walk(root, 'item').map(item => {
    const query = field(item, 'title');
    const startedAt = field(item, 'pubdate');
    if (!query || !Number.isFinite(Date.parse(startedAt))) throw new Error('Trends item lacks its query or date.');
    return { query, startedAt: new Date(startedAt).toISOString(),
      reportedTraffic: field(item, 'ht:approx_traffic') || null,
      coverage: walk(item, 'ht:news_item').map(news => ({
        title: field(news, 'ht:news_item_title'), url: field(news, 'ht:news_item_url'),
        publisher: field(news, 'ht:news_item_source'),
      })),
    };
  });
  return { schemaVersion: 1, status: 'ok', provider: 'Google Trends Trending now',
    region, observedAt, scope: 'recent_search_surge', count: items.length, items };
}

const tokens = text => String(text ?? '').toLocaleLowerCase('ru').replace(/ё/g, 'е').match(/[\p{L}\p{N}]+/gu) ?? [];
export function attentionMatches(queries, feed, now = new Date()) {
  const age = new Date(now) - new Date(feed?.observedAt);
  if (feed?.status !== 'ok' || feed.region !== 'RU' || !Number.isFinite(age) || age < 0 || age > 48 * 3600000) return null;
  const forms = queries.map(tokens).filter(form => form.length > 0);
  return feed.items.filter(item => {
    const itemTime = Date.parse(item.startedAt);
    if (!Number.isFinite(itemTime) || itemTime > new Date(now).valueOf() || new Date(now) - itemTime > 48 * 3600000) return false;
    const words = new Set(tokens(item.query));
    return forms.some(form => form.every(word => words.has(word)));
  }).map(({ query, startedAt, reportedTraffic }) => ({ query, startedAt, reportedTraffic }));
}

export async function collectAttention({ region = 'RU', output = '.run/news-attention.json' } = {}) {
  if (!/^[A-Z]{2}$/.test(region)) throw new Error('Expected an ISO country code.');
  const url = `https://trends.google.com/trending/rss?geo=${region}`;
  const observedAt = new Date().toISOString();
  let report;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'traveltribe-news-radar/1.0 (+https://traveltribe.ru/)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const chunks = []; let bytes = 0;
    for await (const chunk of res.body) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) throw new Error('Trends RSS exceeds the size limit.');
      chunks.push(chunk);
    }
    report = { ...parseAttentionFeed(Buffer.concat(chunks).toString('utf8'), { observedAt, region }), url };
  } catch (error) {
    report = { schemaVersion: 1, status: 'unavailable', region, observedAt, url,
      error: error.message, count: null, items: null };
  }
  mkdirSync(dirname(resolve(output)), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  collectAttention().then(report => {
    console.log(JSON.stringify({ status: report.status, region: report.region, count: report.count,
      observedAt: report.observedAt, error: report.error ?? null, output: '.run/news-attention.json' }));
    if (report.status !== 'ok') process.exitCode = 1;
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
