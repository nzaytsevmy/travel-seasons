#!/usr/bin/env node
// Source-only part of the existing journal gate, shared with the browser suite.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gitChanges } from './release-scope.mjs';

export function journalMetadataProblems(source, { rel = 'article', today = new Date().toISOString().slice(0, 10) } = {}) {
  const fm = source.split('---')[1] ?? '';
  if (!/^checks:/m.test(fm)) return [];
  const bad = [];
  const dates = [...fm.matchAll(/^\s+- date:\s*(\d{4}-\d{2}-\d{2})/gm)].map(m => m[1]);
  const whats = [...fm.matchAll(/^\s+what:\s*"([^"]*)"/gm)].map(m => m[1]);
  const changed = [...fm.matchAll(/^\s+changed:\s*"([^"]*)"/gm)].map(m => m[1]);
  if (dates.length !== whats.length || dates.length !== changed.length)
    return [`${rel}: в журнале ${dates.length} дат, ${whats.length} описаний и ${changed.length} итогов — записи неполные`];
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] > today) bad.push(`${rel}: запись журнала датирована будущим (${dates[i]})`);
    if (whats[i].length < 15) bad.push(`${rel}: в записи ${dates[i]} не сказано, что сверяли`);
    if (changed[i].length < 10) bad.push(`${rel}: в записи ${dates[i]} не сказано, что изменилось («без изменений» — тоже ответ)`);
    const head = changed[i].split(/(?<=\.)\s/)[0] ?? changed[i];
    if (head.length > 90) bad.push(`${rel}: первая фраза записи ${dates[i]} длиной ${head.length} — она идёт наверх страницы, нужно до 90`);
  }
  const upd = fm.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const last = dates.slice().sort().at(-1);
  if (upd && last && upd > last)
    bad.push(`${rel}: дата обновления ${upd} новее последней сверки ${last} — свежесть без проверки`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: {
      base: { type: 'string' }, head: { type: 'string', default: 'HEAD' },
    } });
    if (values.base && positionals.length) throw new Error('Choose a Git range or explicit article files, not both');
    let articles;
    if (values.base) {
      const data = gitChanges(values.base, values.head);
      articles = data.changes.filter(c => c.status !== 'D' && /^src\/content\/blog\/.*\.mdx?$/.test(c.path))
        .map(c => ({ rel: c.path, source: execFileSync('git', ['show', `${data.head}:${c.path}`], { encoding: 'utf8' }) }));
    } else {
      if (!positionals.length) throw new Error('Pass article paths, or --base REF [--head REF]');
      articles = positionals.map(path => {
        const rel = relative(process.cwd(), resolve(path));
        if (!/^src\/content\/blog\/.*\.mdx?$/.test(rel)) throw new Error(`Not a blog article: ${rel}`);
        return { rel, source: readFileSync(path, 'utf8') };
      });
    }
    const bad = articles.flatMap(a => journalMetadataProblems(a.source, { rel: a.rel }));
    console.log(`Journal preflight: ${articles.length} article(s), ${bad.length} problem(s)`);
    if (bad.length) { console.error(bad.join('\n')); process.exitCode = 1; }
  } catch (error) {
    console.error(`Journal preflight: ${error.message}`);
    process.exitCode = 1;
  }
}
