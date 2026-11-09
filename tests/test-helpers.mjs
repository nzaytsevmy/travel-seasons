// Isolate publication-preflight tests from the real, separately tested Git
// history projection while retaining an observable, fail-closed invocation.
export function installTopicPreflightFixture(put) {
  put('scripts/news-topic-freshness.mjs', `import { writeFileSync } from 'node:fs';
export async function topicLastmodFromGit({ root, head, base }) {
  if (!root || !/^[a-f0-9]{40}$/.test(head) || !/^[a-f0-9]{40}$/.test(base)) throw new Error('invalid freshness scope');
  writeFileSync('freshness-called.txt', JSON.stringify({ root, head, base }));
  if (process.env.TT_FIXTURE_FRESHNESS_FAILURE === '1') throw new Error('fixture freshness rejected');
  return { fixture: '2026-10-10T00:00:00.000Z' };
}\n`);
  for (const file of ['src/data/news-frontmatter.js', 'src/data/news-topics.js', 'src/data/news.js',
    'src/data/freshness.js', 'src/pages/novosti/tema/[topic]/[...page].astro', 'src/components/NewsCompact.astro']) {
    put(file, '// isolated publication fixture\n');
  }
}
