import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { gitEnvironment } from '../scripts/release-scope.mjs';
import { proseHash } from '../scripts/article-review-gate.mjs';

const project = new URL('../', import.meta.url);
const post = `---\ntitle: Test choice\ndescription: A grounded choice\nreviewed: 2026-10-10\nauthoredBy: writer\nreviewRef: reviews/blog/test-choice.json\nqualityScore:\n  topic: 9\n  facts: 9\n  visuals: 8\n  experience: 7\n  internalLinks: 9\n  legal: 9\n  overall: 8.5\n  ceiling: Honest ceiling\n---\nA useful answer that explains the decision and its conditions.\n`;
function fixture(branch, options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'tt-routine-push-'));
  const env = gitEnvironment();
  const git = args => execFileSync('git', args, { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (path, text, mode) => { const p = join(root, path); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, text, mode ? { mode } : undefined); };
  try {
    git(['init', '-b', 'main']);
    git(['config', 'user.name', 'Test']);git(['config', 'user.email', 'test@example.invalid']);
    for (const file of ['pre-push.sh', 'release-scope.mjs', 'news-push-scope.mjs', 'article-review-gate.mjs', 'edit-kind.mjs', 'auto-merge-policy.mjs', 'routine-preflight.mjs']) {
      const src = new URL(`scripts/${file}`, project);
      if (existsSync(src)) { mkdirSync(join(root, 'scripts'), { recursive: true }); copyFileSync(src, join(root, 'scripts', file)); }
    }
    put('package.json', '{"type":"module"}\n');
    put('scripts/preview-port.mjs', 'console.log(4432);\n');
    put('scripts/secret-scan.py', 'import sys\nsys.exit(0)\n');
    put('scripts/check-journal-metadata.mjs', 'console.log("metadata fixture PASS");\n');
    put('scripts/news-gate.mjs', 'process.stdin.resume();process.stdin.on("end",()=>console.log("news source fixture PASS"));\n');
    put('scripts/news-lifecycle.mjs', 'console.log("lifecycle fixture PASS");\n');
    git(['add', 'package.json', 'scripts']);git(['commit', '-m', 'test: base']);
    const base = git(['rev-parse', 'HEAD']);git(['update-ref', 'refs/remotes/origin/main', base]);
    git(['switch', '-c', branch]);
    put('src/content/blog/test-choice.md', post);
    put('src/data/country-guides.js', 'export const countries={peru:{answer:"Choose the route"}};\n');
    put('reviews/blog/test-choice.json', JSON.stringify({ schemaVersion: 1, slug: 'test-choice', reviewer: 'independent', reviewedAt: '2026-10-10', qualityScore: { topic:9, facts:9, visuals:8, experience:7, internalLinks:9, legal:9, overall:8.5, ceiling:'Honest ceiling' }, rationale:'Independent review of the useful answer and all its conditions.', proseHash: options.staleReview ? '0000000000000000' : proseHash(post) }));
    if (options.missingReview) rmSync(join(root, 'reviews/blog/test-choice.json'));
    git(['add', 'src/content/blog/test-choice.md', 'src/data/country-guides.js']);
    if (!options.missingReview) git(['add', 'reviews/blog/test-choice.json']);
    git(['commit', '-m', 'test: article and country data']);
    if (options.draft) put('src/content/blog/test-choice.md', post + 'An unreviewed change.\n');
    put('fake-bin/npm', '#!/bin/sh\ncase "$*" in "run build") echo LOCAL_BUILD_STARTED >&2; exit 42;; *) exit 0;; esac\n', 0o755);
    put('fake-bin/npx', '#!/bin/sh\necho LOCAL_BROWSER_STARTED >&2\nexit 43\n', 0o755);
    const result = spawnSync('bash', ['scripts/pre-push.sh'], { cwd: root, env: { ...env, PATH: join(root, 'fake-bin') + ':' + env.PATH }, encoding: 'utf8', input: '', timeout: 20000 });
    return { ...result, output: result.stdout + result.stderr };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('normal publication push forwards the complete code scope to required CI without a Mac build', () => {
  const r = fixture('tt-publish/2026-10-10');
  assert.equal(r.status, 0, r.output);
  assert.match(r.output, /26.*CI|CI.*26/);
  assert.doesNotMatch(r.output, /LOCAL_BUILD_STARTED|LOCAL_BROWSER_STARTED/);
});
test('ordinary development retains its local build and browser gate', () => {
  const r = fixture('feature/editorial');assert.notEqual(r.status, 0);assert.match(r.output, /build/);
});
test('publication preflight rejects a stale independent prose hash before any build', () => {
  const r = fixture('tt-publish/2026-10-10', { staleReview: true });
  assert.notEqual(r.status, 0);assert.match(r.output, /proseHash/);assert.doesNotMatch(r.output, /LOCAL_BUILD_STARTED|LOCAL_BROWSER_STARTED/);
});
test('publication preflight rejects an absent independent review', () => {
  const r = fixture('tt-publish/2026-10-10', { missingReview: true });assert.notEqual(r.status, 0);assert.match(r.output, /review|артефакт/);
});
test('publication preflight checks the committed article, not an unreviewed working draft', () => {
  const r = fixture('tt-publish/2026-10-10', { draft: true });assert.notEqual(r.status, 0);assert.match(r.output, /HEAD|коммит/);
});
