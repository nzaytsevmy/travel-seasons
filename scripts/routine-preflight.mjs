#!/usr/bin/env node
// Publication source checks run locally; the existing automatic merge requires all CI checks.
import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { gitChanges, gitEnvironment } from './release-scope.mjs';
import { classifyEdit } from './edit-kind.mjs';
import { readPostMeta, proseHash, checkArticleReview } from './article-review-gate.mjs';
import { requiredChecks } from './auto-merge-policy.mjs';

try {
  const { values } = parseArgs({ options: { base: { type: 'string' }, head: { type: 'string', default: 'HEAD' } } });
  if (!values.base) throw new Error('Usage: routine-preflight.mjs --base REF [--head REF]');
  const root = process.cwd(), env = gitEnvironment();
  const scope = gitChanges(values.base, values.head, root);
  if (!scope.changes.length) throw new Error('Пустая область выпуска');
  const git = args => execFileSync('git', args, { cwd: root, env, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const blob = (sha, path) => git(['show', `${sha}:${path}`]);
  const checked = new Set();
  function committed(path) {
    if (checked.has(path)) return;
    let expected;
    try { expected = blob(scope.head, path); }
    catch { throw new Error(`${path}: обязательный файл review/источников отсутствует в коммите HEAD`); }
    const file = join(root, path);
    if (!existsSync(file) || !lstatSync(file).isFile() || !readFileSync(file).equals(expected)) {
      throw new Error(`${path}: рабочий файл отличается от коммита HEAD`);
    }
    checked.add(path);
  }
  for (const change of scope.changes) {
    if (change.status === 'D') {
      if (existsSync(join(root, change.path))) throw new Error(`${change.path}: удалён в HEAD, но существует на диске`);
    } else {
      if (!['100644', '100755'].includes(change.newMode)) throw new Error(`${change.path}: неподдерживаемый режим ${change.newMode}`);
      committed(change.path);
    }
  }
  let articles = 0;
  const news = [];
  for (const change of scope.changes.filter(c => c.status !== 'D')) {
    if (/^src\/content\/blog\/[^/]+\.mdx?$/.test(change.path)) {
      const after = blob(scope.head, change.path).toString('utf8');
      const before = change.status === 'A' ? null : blob(scope.base, change.path).toString('utf8');
      if (!['new', 'rework'].includes(classifyEdit(before, after).kind)) continue;
      const meta = readPostMeta(after);
      if (!meta.reviewed || !meta.reviewRef) throw new Error(`${change.path}: нет reviewed/reviewRef независимой оценки`);
      if (!/^reviews\/blog\/[a-z0-9][a-z0-9-]*\.json$/.test(meta.reviewRef)) throw new Error(`${change.path}: небезопасный reviewRef`);
      committed(meta.reviewRef);
      const result = checkArticleReview({ slug: basename(change.path).replace(/\.mdx?$/, ''), meta, proseHash: proseHash(after) }, root);
      if (!result.ok) throw new Error(`${change.path}: ${result.reason}`);
      articles += 1;
    }
    if (/^src\/content\/news\/[^/]+\.md$/.test(change.path)) {
      const raw = blob(scope.head, change.path).toString('utf8');
      const ref = raw.match(/^reviewRef:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1]?.trim();
      if (ref && /^news\/reviews\/[a-z0-9][a-z0-9-]*\.json$/.test(ref)) committed(ref);
      news.push(change.path);
    }
  }
  if (news.length) {
    committed('news/config.json');
    const run = (file, args = [], input) => execFileSync(process.execPath, [file, ...args], {
      cwd: root, env, input, encoding: 'utf8', timeout: 360000, maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    process.stdout.write(run('scripts/news-gate.mjs', ['--paths-stdin'], news.join('\n') + '\n'));
    process.stdout.write(run('scripts/news-lifecycle.mjs'));
  }
  const checks = requiredChecks(scope.changes.map(c => c.path));
  console.log(`✔ исходники HEAD ${scope.head}: ${scope.changes.length} файлов, ${articles} оценок статей, ${news.length} заметок. Перед merge обязательны ${checks.length} CI-проверок; их успех здесь не заявляется.`);
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  console.error(`routine-preflight: ${error.message}`);
  process.exitCode = 1;
}
