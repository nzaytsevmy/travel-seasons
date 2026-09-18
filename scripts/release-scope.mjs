#!/usr/bin/env node
// Only the editorial queue is non-rendered accounting. Unknown scope stays full.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export function classifyRelease(changes) {
  return changes.length > 0 && changes.every(c => c.path === 'DAILY-ARTICLE-QUEUE.md'
    && c.status === 'M' && c.oldMode === '100644' && c.newMode === '100644')
    ? 'accounting' : 'full';
}

export function gitChanges(base, head = 'HEAD', cwd = process.cwd()) {
  const git = args => execFileSync('git', args, {
    cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const commit = ref => git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
  const baseSha = commit(base), headSha = commit(head);
  const raw = git(['diff', '--no-ext-diff', '--raw', '-z', '--no-renames', '--no-abbrev', baseSha, headSha]);
  const fields = raw.split('\0');
  if (fields.pop() !== '') throw new Error('Incomplete Git diff');
  const changes = [];
  for (let i = 0; i < fields.length; i += 2) {
    const match = fields[i].match(/^:(\d{6}) (\d{6}) [a-f0-9]+ [a-f0-9]+ ([A-Z][0-9]*)$/);
    if (!match || !fields[i + 1]) throw new Error('Unrecognised Git diff record');
    changes.push({ path: fields[i + 1], oldMode: match[1], newMode: match[2], status: match[3] });
  }
  return { base: baseSha, head: headSha, changes };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { values } = parseArgs({ options: {
      base: { type: 'string' }, head: { type: 'string', default: 'HEAD' },
      'mode-only': { type: 'boolean' }, 'github-output': { type: 'string' },
    } });
    if (!values.base) throw new Error('Usage: node scripts/release-scope.mjs --base REF [--head REF]');
    const data = gitChanges(values.base, values.head);
    const mode = classifyRelease(data.changes);
    if (values['github-output']) appendFileSync(values['github-output'], `mode=${mode}\n`);
    console.log(values['mode-only'] ? mode : JSON.stringify({ mode, files: data.changes.length, base: data.base, head: data.head }));
  } catch (error) {
    console.error(`release-scope: ${error.message}`);
    process.exitCode = 1;
  }
}
