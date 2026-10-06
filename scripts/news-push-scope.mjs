#!/usr/bin/env node
// A fast local gate is safe only for ordinary editorial news files. The PR
// still runs its build, content/browser checks, scan and required CI.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gitChanges } from './release-scope.mjs';

const NOTE = /^src\/content\/news\/[a-z0-9-]+\.md$/;
const IMAGE = /^src\/content\/news\/_images\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp|avif)$/;
const REVIEW = /^news\/reviews\/[a-z0-9-]+\.json$/;
const SNAPSHOT = /^news\/snapshots\/[a-f0-9]+\.json$/;
const SELECTION = /^news\/selection\/\d{4}-\d{2}-\d{2}\.json$/;

export function classifyNewsPush(changes) {
  const full = { mode: 'full', paths: [] };
  if (!Array.isArray(changes) || changes.length === 0) return full;
  const notes = new Set();
  for (const change of changes) {
    const { path, status, oldMode, newMode } = change;
    if (!((status === 'A' && oldMode === '000000' && newMode === '100644')
      || (status === 'M' && oldMode === '100644' && newMode === '100644'))) return full;
    if (NOTE.test(path)) notes.add(path);
    else if (!IMAGE.test(path) && !REVIEW.test(path) && !SNAPSHOT.test(path)
      && !SELECTION.test(path) && path !== 'news/log.jsonl') return full;
  }
  return notes.size > 0 ? { mode: 'news', paths: [...notes].sort() } : full;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { values } = parseArgs({ options: {
      base: { type: 'string' }, head: { type: 'string', default: 'HEAD' },
      'paths-only': { type: 'boolean' },
    } });
    if (!values.base) throw new Error('Usage: news-push-scope.mjs --base REF [--head REF] --paths-only');
    const result = classifyNewsPush(gitChanges(values.base, values.head).changes);
    if (values['paths-only']) {
      if (result.mode === 'news') console.log(result.paths.join('\n'));
      else process.exitCode = 2;
    } else console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`news-push-scope: ${error.message}`);
    process.exitCode = 1;
  }
}
