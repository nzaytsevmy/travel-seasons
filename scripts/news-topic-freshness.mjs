import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { parse, transform } from '@astrojs/compiler';
import { build, transformSync } from 'esbuild';
import { parse as parseJs } from 'acorn';
import { addedAt, formatDateRu, newsCompactGist, newsUrl, feedEntries } from '../src/data/news.js';
import { NEWS_TOPICS, NEWS_TOPIC_PAGE_SIZE, newsTopicUrl } from '../src/data/news-topics.js';
import { newsFrontmatter } from '../src/data/news-frontmatter.js';
import { gitEnvironment } from './release-scope.mjs';

// Before the culture/navigation release. This main commit remains an ancestor
// after squash. Its sitemap used a generic fallback, which is not evidence of
// a topic page's actual change date, so it supplies no baseline dates.
export const TOPIC_HISTORY_ANCHOR = '67864f186c62154371edf977d27942204cfb5b2b';
export const TOPIC_BASE_DATES = Object.freeze({});
// A semantic change to the template or helper code does not prove that every
// rendered page changed. Hold such a release for page-by-page reconciliation
// instead of automatically advancing every lastmod. Plain news edits and
// literal topic titles/descriptions are handled by the content projection.
export const TOPIC_PROJECTION_HASH = '643f0c27fa3a71c6fc7978b40b9fcf5937372ccd819bdbed61cc2f6c33ab1d83';
// Exact published b947d98 projection, retained only to verify the one-way
// personal -> editorial authorship migration. Unknown versions still fail.
export const TOPIC_LEGACY_PERSON_PROJECTION_HASH = '82e7a926173bfd958a4567aea6df1f1e4c6a367827f46f23bad6271fa5e5d522';
const knownProjection = hash => hash === TOPIC_PROJECTION_HASH || hash === TOPIC_LEGACY_PERSON_PROJECTION_HASH;
const TEMPLATES = ['src/pages/novosti/tema/[topic]/[...page].astro', 'src/components/NewsCompact.astro'];
const HELPERS = ['src/data/news.js', 'src/data/news-topics.js', 'src/data/freshness.js', 'src/data/news-frontmatter.js'];
const SELF = 'scripts/news-topic-freshness.mjs', LOCK = 'package-lock.json';
const WATCHED = ['src/content/news', ...TEMPLATES, ...HELPERS, SELF, LOCK];
const WATCH_PATHS = WATCHED.map(file => `:(literal)${file}`);
const DIRTY_PATHS = [...WATCH_PATHS, ':(literal)astro.config.mjs', ':(literal)package.json'];
const sha = value => createHash('sha256').update(value).digest('hex');
const gitEnv = gitEnvironment();
const git = (root, args, options = {}) => execFileSync('git', args, {
  cwd: root, env: gitEnv, maxBuffer: 64 * 1024 * 1024, ...options,
});
const instant = stamp => {
  if (typeof stamp !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(stamp))
    throw new Error('Git commit time needs an explicit timezone');
  const date = new Date(stamp);
  if (!Number.isFinite(date.valueOf())) throw new Error('Invalid Git commit date');
  return date;
};
function entryFromSource(file, source) {
  const slug = path.basename(file).replace(/\.mdx?$/, '');
  const data = newsFrontmatter(source);
  return { slug, data: { ...data, date: new Date(data.date), checked: new Date(data.checked),
    added: data.added ? new Date(data.added) : undefined } };
}
export function newsEntries(root = '.') {
  const dir = path.join(root, 'src/content/news');
  return readdirSync(dir).filter(file => /\.mdx?$/.test(file))
    .map(file => entryFromSource(file, readFileSync(path.join(dir, file), 'utf8')));
}

// One batch request fetches all required historical blobs, including missing
// paths (newly added files). No partial history is silently accepted.
function blobs(refs, root) {
  if (!refs.length) return new Map();
  const output = git(root, ['cat-file', '--batch'], { input: refs.join('\n') + '\n' });
  let offset = 0;
  const result = new Map();
  for (const ref of refs) {
    const end = output.indexOf(10, offset);
    if (end < 0) throw new Error('Incomplete Git blob header');
    const header = output.subarray(offset, end).toString('utf8');
    if (header === ref + ' missing') { result.set(ref, null); offset = end + 1; continue; }
    const match = header.match(/^[a-f0-9]{40} blob (\d+)$/);
    if (!match) throw new Error(`Cannot read committed blob: ${ref}`);
    const start = end + 1, finish = start + Number(match[1]);
    if (finish >= output.length || output[finish] !== 10) throw new Error(`Incomplete committed blob: ${ref}`);
    result.set(ref, output.subarray(start, finish).toString('utf8'));
    offset = finish + 1;
  }
  // A missing path is valid for a newly added file. A path present in the
  // tree whose blob is missing is repository corruption, never an addition.
  const missingByTree = new Map();
  for (const [ref, value] of result) if (value === null) {
    const separator = ref.indexOf(':');
    if (separator < 1) throw new Error('Invalid historical Git object reference');
    const tree = ref.slice(0, separator), file = ref.slice(separator + 1);
    if (!missingByTree.has(tree)) missingByTree.set(tree, []);
    missingByTree.get(tree).push(file);
  }
  for (const [tree, files] of missingByTree) {
    const present = new Set(git(root, ['ls-tree', '-r', '-z', '--name-only', tree, '--',
      ...files.map(file => `:(literal)${file}`)], { encoding: 'utf8' }).split('\0').filter(Boolean));
    for (const file of files) if (present.has(file)) throw new Error(`Missing historical Git object: ${file}`);
  }
  return result;
}
export function newsEntriesFromTree(ref, root = '.') {
  const commit = git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
  const files = git(root, ['ls-tree', '-r', '-z', '--name-only', commit, '--', 'src/content/news'], { encoding: 'utf8' })
    .split('\0').filter(file => /\.mdx?$/.test(file));
  if (files.some(file => !/^src\/content\/news\/[a-z0-9-]+\.mdx?$/.test(file))) throw new Error('Unsafe news source path');
  const refs = files.map(file => `${commit}:${file}`), values = blobs(refs, root);
  return files.map((file, i) => {
    const source = values.get(refs[i]);
    if (source === null) throw new Error(`Missing committed news: ${file}`);
    return entryFromSource(file, source);
  });
}

// Remove only parser-identified HTML comments. JS/CSS comments are removed by
// Astro and esbuild, so comments cannot make the sitemap claim an update.
export async function normalizeAstro(source, file) {
  const parsed = await parse(source, { position: true });
  const ranges = [];
  const walk = node => {
    if (node.type === 'comment') ranges.push([node.position.start.offset - 4, node.position.end.offset]);
    for (const child of node.children || []) walk(child);
  };
  walk(parsed.ast);
  const bytes = Buffer.from(source);
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0])) {
    if (bytes.subarray(start, start + 4).toString() !== '<!--' || bytes.subarray(end - 3, end).toString() !== '-->')
      throw new Error(`Unexpected Astro comment location in ${file}`);
  }
  const parts = []; let offset = 0;
  for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
    parts.push(bytes.subarray(offset, start)); offset = end;
  }
  parts.push(bytes.subarray(offset));
  const output = await transform(Buffer.concat(parts).toString('utf8'), { filename: file });
  return transformSync(output.code, { loader: 'ts', minify: true, legalComments: 'none' }).code;
}

// These literals are editorial data, not a reason to redate every page. Parse
// them without executing historical code, and fail if their shape changes.
export function topicDefinitions(source) {
  const tree = parseJs(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const variables = new Map();
  for (const statement of tree.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : null;
    if (declaration?.type === 'VariableDeclaration') for (const item of declaration.declarations) {
      if (item.id.type === 'Identifier') variables.set(item.id.name, item.init);
    }
  }
  const list = variables.get('NEWS_TOPICS'), size = variables.get('NEWS_TOPIC_PAGE_SIZE');
  if (list?.type !== 'ArrayExpression' || size?.type !== 'Literal' || !Number.isSafeInteger(size.value) || size.value < 1)
    throw new Error('News topic definitions need a reviewable literal shape');
  const topics = list.elements.map(item => {
    if (item?.type !== 'ObjectExpression') throw new Error('Invalid topic definition');
    const result = {};
    for (const prop of item.properties) {
      if (prop.type !== 'Property' || prop.computed || prop.value.type !== 'Literal' || typeof prop.value.value !== 'string')
        throw new Error('Invalid topic definition field');
      const key = prop.key.name ?? prop.key.value;
      if (!['topic', 'slug', 'title', 'description'].includes(key) || Object.hasOwn(result, key))
        throw new Error('Unexpected topic definition field');
      result[key] = prop.value.value;
    }
    if (Object.keys(result).length !== 4) throw new Error('Incomplete topic definition');
    return result;
  });
  return { topics, pageSize: size.value, spans: [[list.start, list.end, '[]'], [size.start, size.end, '30']] };
}
function topicDefinitionsFromTree(ref, root) {
  const key = `${ref}:${HELPERS[1]}`, value = blobs([key], root).get(key);
  if (value == null) return { topics: [], pageSize: 30 };
  return topicDefinitions(value);
}

// Bundle only exports used by topic pages, rather than treating unrelated news
// helper edits as page changes. All source text comes from the requested tree.
async function normalizeHelpers(sources) {
  if (HELPERS.some(file => sources[file] == null)) return 'older-revision-before-topic-helper';
  const definitions = topicDefinitions(sources[HELPERS[1]]);
  let topicSource = sources[HELPERS[1]];
  for (const [start, end, replacement] of definitions.spans.sort((a, b) => b[0] - a[0]))
    topicSource = topicSource.slice(0, start) + replacement + topicSource.slice(end);
  sources = { ...sources, [HELPERS[1]]: topicSource };
  const paths = { 'virtual:news': HELPERS[0], 'virtual:topics': HELPERS[1] };
  try {
    const result = await build({
      stdin: { contents: "export { addedAt, formatDateRu, newsCompactGist, newsUrl, feedEntries } from 'virtual:news'; export { NEWS_TOPICS, activeNewsTopics, newsTopicPages, newsTopicUrl } from 'virtual:topics';", resolveDir: '/' },
      bundle: true, write: false, format: 'esm', platform: 'node', minify: true, legalComments: 'none', logLevel: 'silent',
      plugins: [{ name: 'committed-topic-code', setup(b) {
        b.onResolve({ filter: /^virtual:/ }, args => ({ path: paths[args.path], namespace: 'topic-snapshot' }));
        b.onResolve({ filter: /^\./, namespace: 'topic-snapshot' }, args => {
          const file = path.posix.normalize(path.posix.join(path.posix.dirname(args.importer), args.path));
          return HELPERS.includes(file) ? { path: file, namespace: 'topic-snapshot' } : { path: file, external: true };
        });
        b.onLoad({ filter: /.*/, namespace: 'topic-snapshot' }, args => ({ contents: sources[args.path], loader: 'js' }));
      } }],
    });
    return result.outputFiles[0].text + transformSync(sources[HELPERS[3]], { loader: 'js', minify: true, legalComments: 'none' }).code;
  } catch (error) {
    // A historical template can predate the exports introduced here.
    if (/No matching export/.test(String(error))) return 'older-revision-before-topic-helper';
    throw error;
  }
}
async function topicLayoutHashSources(sources) {
  const rendered = [];
  for (const file of TEMPLATES) rendered.push(sources[file] == null ? 'missing' : await normalizeAstro(sources[file], file));
  rendered.push(await normalizeHelpers(sources));
  if (sources[SELF] == null) rendered.push('pre-release-script');
  else {
    const marker = /(?<=export const TOPIC_PROJECTION_HASH = ')[a-f0-9]{64}(?=';)/g;
    if ([...sources[SELF].matchAll(marker)].length !== 1) throw new Error('Invalid projection hash marker');
    rendered.push(transformSync(sources[SELF].replace(marker, '0'.repeat(64)),
      { loader: 'js', minify: true, legalComments: 'none' }).code);
  }
  if (sources[LOCK] == null) throw new Error('Missing package lock');
  const lock = JSON.parse(sources[LOCK]);
  rendered.push(['@astrojs/compiler', 'acorn', 'esbuild', 'yaml']
    .map(name => [name, lock.packages?.[`node_modules/${name}`]?.version ?? null]));
  return sha(JSON.stringify(rendered));
}
export async function topicLayoutHashFromTree(ref, root = '.') {
  const files = [...TEMPLATES, ...HELPERS, SELF, LOCK], refs = files.map(file => `${ref}:${file}`), values = blobs(refs, root);
  return topicLayoutHashSources(Object.fromEntries(files.map((file, i) => [file, values.get(refs[i])])));
}
export async function topicLayoutHashFromWorktree(root = '.') {
  const files = [...TEMPLATES, ...HELPERS, SELF, LOCK];
  return topicLayoutHashSources(Object.fromEntries(files.map(file => [file, readFileSync(path.join(root, file), 'utf8')])));
}

// Only content actually rendered in topic lists and their structured data.
export function topicFingerprints(entries, layoutHash, definitions = { topics: NEWS_TOPICS, pageSize: NEWS_TOPIC_PAGE_SIZE }) {
  const authorship = layoutHash === TOPIC_PROJECTION_HASH
    ? { author: 'https://traveltribe.ru/#org', byline: 'Редакция TravelTribe', channel: 'https://t.me/traveltriberu' }
    : { author: 'https://traveltribe.ru/about/#person', byline: 'Ведёт Никита Зайцев', channel: null };
  const all = feedEntries(entries), active = new Set(all.map(entry => entry.data.topic));
  const nav = definitions.topics.filter(topic => active.has(topic.topic))
    .map(topic => ({ title: topic.title, url: newsTopicUrl(topic.slug) }));
  const pages = definitions.topics.flatMap(topic => {
    const rows = all.filter(entry => entry.data.topic === topic.topic);
    const totalPages = Math.ceil(rows.length / definitions.pageSize);
    return Array.from({ length: totalPages }, (_, i) => ({
      topic, page: i + 1, totalPages, items: rows.slice(i * definitions.pageSize, (i + 1) * definitions.pageSize),
    }));
  });
  return Object.fromEntries(pages.map(page => {
    const url = newsTopicUrl(page.topic.slug, page.page);
    const visible = { nav, authorship, title: page.topic.title,
      description: page.topic.description, page: page.page, totalPages: page.totalPages,
      items: page.items.map(entry => {
        const date = new Date(addedAt(entry));
        return { url: newsUrl(entry), title: entry.data.title, date: date.toISOString().slice(0, 10),
          dateText: formatDateRu(date), gist: newsCompactGist(entry.data.tldr ?? '') };
      }) };
    return [url, sha(JSON.stringify(visible))];
  }));
}

function changes(root, before, after) {
  const output = git(root, ['diff', '--name-status', '--no-renames', before, after, '--', ...WATCH_PATHS], { encoding: 'utf8' });
  return output.split('\n').filter(Boolean).map(line => {
    const [status, file, extra] = line.split('\t');
    if (extra !== undefined || !/^[AMD]$/.test(status)) throw new Error(`Unsupported change in topic history: ${line}`);
    if (/^src\/content\/news\/[a-z0-9-]+\.mdx?$/.test(file)) return { status, file, news: true };
    if (TEMPLATES.includes(file) || HELPERS.includes(file) || [SELF, LOCK].includes(file)) return { status, file, news: false };
    // Images do not appear in compact topic rows.
    if (/^src\/content\/news\/_images\//.test(file)) return null;
    throw new Error(`Unexpected topic history path: ${file}`);
  }).filter(Boolean);
}
function commitStamp(root, commit) {
  return git(root, ['show', '-s', '--format=%cI', commit], { encoding: 'utf8' }).trim();
}

// A draft was never visible to readers. Compare its final candidate tree with
// the published base once; only a net page change gets the candidate commit
// time. On main, walk first-parent source states, including reverts. Git alone
// cannot prove a deploy succeeded; a separate deploy/live check is mandatory.
export async function topicLastmodFromGit({ root = '.', head = 'HEAD', base, anchor = TOPIC_HISTORY_ANCHOR,
  baseDates = TOPIC_BASE_DATES, entries } = {}) {
  const resolve = ref => git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
  if (git(root, ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() !== 'false')
    throw new Error('Topic lastmod requires full Git history');
  head = resolve(head); anchor = resolve(anchor);
  if (resolve('HEAD') !== head || git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...DIRTY_PATHS], { encoding: 'utf8' }))
    throw new Error('Uncommitted topic sources or a different checkout: commit before building the sitemap');
  base = resolve(base || git(root, ['merge-base', head, 'refs/remotes/origin/main'], { encoding: 'utf8' }).trim());
  try {
    git(root, ['merge-base', '--is-ancestor', anchor, base]);
    git(root, ['merge-base', '--is-ancestor', base, head]);
  } catch { throw new Error('Topic baseline is not an ancestor of the release'); }
  if (!git(root, ['rev-list', '--first-parent', base], { encoding: 'utf8' }).split('\n').includes(anchor))
    throw new Error('Topic baseline is not on the published first-parent history');

  const currentEntries = newsEntriesFromTree(head, root);
  const headHash = await topicLayoutHashFromTree(head, root);
  if (headHash !== TOPIC_PROJECTION_HASH)
    throw new Error('Topic rendering code changed: reconcile actual rendered page dates before release');
  const headDefinitions = topicDefinitionsFromTree(head, root);
  const headProjection = topicFingerprints(currentEntries, headHash, headDefinitions);
  if (entries && JSON.stringify(topicFingerprints(entries, headHash, headDefinitions)) !== JSON.stringify(headProjection))
    throw new Error('Uncommitted news differ from the release tree; commit before building the sitemap');

  const remaining = new Set(Object.keys(headProjection)), dates = {};
  const anchorHash = await topicLayoutHashFromTree(anchor, root);
  let reachedInitialProjection = knownProjection(anchorHash);
  let snapshots = new Map(currentEntries.map(entry => [entry.slug, entry]));
  let layoutHash = headHash, definitions = headDefinitions, current = headProjection;
  let latestAllowed = Date.now();

  if (head !== base) {
    const candidate = instant(commitStamp(root, head));
    if (candidate.valueOf() > latestAllowed) throw new Error('Future commit time in topic history');
    latestAllowed = candidate.valueOf();
    const baseHash = await topicLayoutHashFromTree(base, root);
    if (!knownProjection(baseHash)) {
      if (baseHash !== anchorHash || changes(root, anchor, base).length !== 0)
        throw new Error('Unknown base topic rendering code: reconcile actual rendered page dates before release');
      reachedInitialProjection = true;
    }
    const baseEntries = newsEntriesFromTree(base, root);
    const baseDefinitions = topicDefinitionsFromTree(base, root);
    const baseProjection = topicFingerprints(baseEntries, baseHash, baseDefinitions);
    for (const url of remaining) if (baseProjection[url] !== current[url]) {
      dates[url] = candidate.toISOString(); remaining.delete(url);
    }
    snapshots = new Map(baseEntries.map(entry => [entry.slug, entry]));
    layoutHash = baseHash; definitions = baseDefinitions; current = baseProjection;
  }

  const history = git(root, ['log', '--first-parent', '--full-history', '--diff-merges=first-parent',
    '--format=%H', `${anchor}..${base}`, '--', ...WATCH_PATHS], { encoding: 'utf8' }).split('\n').filter(Boolean);
  if (history.length > 2000) throw new Error('Topic history exceeds the safe review limit; establish a verified baseline');
  const prepared = history.map(commit => ({
    before: resolve(`${commit}^1`), after: commit, stamp: commitStamp(root, commit),
    changes: changes(root, resolve(`${commit}^1`), commit),
  })).filter(commit => commit.changes.length);

  // Guard every main-branch code version even when later changes already dated
  // all pages. A source code A→B→A must never hide the unknown B version.
  for (const commit of prepared) {
    if (!commit.changes.some(change => !change.news)) continue;
    const previousHash = await topicLayoutHashFromTree(commit.before, root);
    const nextHash = await topicLayoutHashFromTree(commit.after, root);
    if (!knownProjection(nextHash))
      throw new Error('Historical topic rendering code changed: reconcile actual rendered page dates before release');
    if (previousHash === TOPIC_PROJECTION_HASH && nextHash === TOPIC_LEGACY_PERSON_PROJECTION_HASH)
      throw new Error('Historical editorial projection reverted to legacy personal authorship');
    if (knownProjection(previousHash)) continue;
    if (previousHash === anchorHash && changes(root, anchor, commit.before).length === 0) {
      reachedInitialProjection = true;
      continue;
    }
    throw new Error('Historical topic rendering code changed: reconcile actual rendered page dates before release');
  }
  if (!reachedInitialProjection) throw new Error('Cannot verify the initial topic projection boundary');

  const refs = [...new Set(prepared.flatMap(commit => commit.changes.filter(change => change.news)
    .map(change => `${commit.before}:${change.file}`)))];
  const oldBlobs = blobs(refs, root);
  for (const commit of prepared) {
    const changedAt = instant(commit.stamp);
    if (changedAt.valueOf() > latestAllowed) throw new Error('Future or out-of-order commit time in topic history');
    latestAllowed = changedAt.valueOf();
    for (const change of commit.changes.filter(change => change.news)) {
      const old = oldBlobs.get(`${commit.before}:${change.file}`);
      const slug = path.basename(change.file).replace(/\.mdx?$/, '');
      if (change.status === 'A' && old === null) snapshots.delete(slug);
      else if (old === null || old === undefined) throw new Error(`Missing historical content: ${change.file}`);
      else snapshots.set(slug, entryFromSource(change.file, old));
    }
    if (commit.changes.some(change => !change.news)) {
      layoutHash = await topicLayoutHashFromTree(commit.before, root);
      definitions = topicDefinitionsFromTree(commit.before, root);
    }
    const previous = topicFingerprints([...snapshots.values()], layoutHash, definitions);
    for (const url of remaining) if (previous[url] !== current[url]) {
      dates[url] = changedAt.toISOString(); remaining.delete(url);
    }
    current = previous;
  }
  for (const url of remaining) {
    const stamp = baseDates[url];
    if (typeof stamp !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(stamp) ||
        !Number.isFinite(new Date(stamp).valueOf()) || new Date(stamp).valueOf() > Date.now())
      throw new Error(`No verified baseline for topic page: ${url}`);
    dates[url] = stamp;
  }
  return dates;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dates = await topicLastmodFromGit();
  console.log(JSON.stringify({ status: 'PASS', pages: Object.keys(dates).length, dates }));
}
