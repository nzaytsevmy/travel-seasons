import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOTS, GATE_NAME, allowedBotPath, approvableRun, isBotCandidate, validateBotPr } from '../scripts/bot-update-policy.mjs';
import { requiredChecks } from '../scripts/auto-merge-policy.mjs';
import { handleCheckedPr } from '../scripts/checked-pr-controller.mjs';
import { publishBot } from '../scripts/bot-publish.mjs';

const BASE = 'a'.repeat(40), HEAD = 'b'.repeat(40), NEW = 'c'.repeat(40);
const OWNER = 'owner', REPO = 'repo';
function fixture(bot = 'prices') {
  const config = BOTS[bot];
  const proof = { bot, source_sha: BASE, head_sha: HEAD, run_id: '123' };
  const pr = { number: 7, state: 'open', draft: false, user: { login: 'github-actions[bot]', type: 'Bot' },
    base: { ref: 'main' }, head: { sha: HEAD, ref: config.branch, repo: { full_name: `${OWNER}/${REPO}` } },
    body: `<!-- traveltribe-bot:${JSON.stringify(proof)} -->`, mergeable: true };
  const files = config.paths.map((filename) => ({ filename, status: 'modified' }));
  const calls = [];
  const state = {
    pr, files, checks: requiredChecks(files.map((f) => f.filename)).map((name, id) => ({
      id: id + 10, name, head_sha: HEAD, app: { id: 15368 }, status: 'completed', conclusion: 'success',
    })),
    source: { path: config.workflow, head_branch: 'main', head_sha: BASE, event: 'schedule', status: 'completed', conclusion: 'success' },
    commit: { parents: [{ sha: BASE }], tree: { sha: 'tree' } }, comparison: { status: 'ahead' },
    tree: { truncated: false, tree: files.map((file) => ({ path: file.filename, type: 'blob', mode: '100644' })) },
    runs: [], gets: 0,
  };
  const fn = (kind, body) => async (params) => { calls.push({ kind, ...params }); return { data: typeof body === 'function' ? body(params) : body }; };
  const rest = {
    pulls: {
      get: fn('getPr', () => { state.gets++; return state.gets >= 2 && state.newHead ? { ...state.pr, head: { ...state.pr.head, sha: NEW } } : state.pr; }),
      listFiles: fn('files', () => state.files), list: fn('listPr', () => [state.pr]),
      merge: fn('merge', () => ({ merged: true, sha: NEW })),
    },
    actions: {
      getWorkflowRun: fn('source', () => state.source),
      listWorkflowRunsForRepo: fn('runs', () => state.runs),
      approveWorkflowRun: fn('approve', {}), createWorkflowDispatch: fn('dispatch', {}),
    },
    git: { getCommit: fn('commit', () => state.commit), getTree: fn('tree', () => state.tree) },
    repos: { compareCommitsWithBasehead: fn('comparison', () => state.comparison) },
    checks: { listForRef: fn('checks', () => state.checks),
      create: fn('gateCreate', { id: 1000, name: GATE_NAME }), update: fn('gateUpdate', {}) },
  };
  const github = { rest, paginate: async (method, params) => (await method(params)).data };
  return { github, state, calls, pr, files };
}

test('each bot commits only its generated files; configs, source code and removals are excluded', async () => {
  assert.equal(allowedBotPath('seo-pulse', 'seo-pulse/2026-10-10.md'), true);
  assert.equal(allowedBotPath('seo-pulse', 'seo-pulse/config.json'), false);
  assert.equal(allowedBotPath('source-watch', 'seo-pulse/_state.json'), false);
  assert.equal(allowedBotPath('prices', 'src/pages/index.astro'), false);
  for (const change of [{ filename: 'src/pages/index.astro', status: 'modified' },
    { filename: 'src/data/prices-cache.json', status: 'removed' },
    { filename: 'src/data/prices-cache.json', status: 'renamed', previous_filename: 'src/data/countries.json' }]) {
    const f = fixture();
    assert.equal(await validateBotPr(f.github, OWNER, REPO, f.pr, [change]), false);
    assert.equal(f.calls.length, 0);
  }
});

test('a forged actor, fork, branch, head or draft cannot receive bot privileges', () => {
  for (const mutate of [
    (pr) => { pr.user.login = 'attacker'; }, (pr) => { pr.user.type = 'User'; },
    (pr) => { pr.head.repo.full_name = 'attacker/repo'; },
    (pr) => { pr.head.ref = 'arbitrary'; }, (pr) => { pr.head.sha = NEW; },
    (pr) => { pr.draft = true; }, (pr) => { pr.base.ref = 'other'; },
  ]) {
    const { pr } = fixture(); mutate(pr); assert.equal(isBotCandidate(pr, OWNER, REPO), false);
  }
});

test('proof requires the real trusted main run, one source parent and ordinary files', async () => {
  for (const mutate of [
    (s) => { s.source.head_branch = 'untrusted'; }, (s) => { s.source.path = '.github/workflows/other.yml'; },
    (s) => { s.source.head_sha = NEW; }, (s) => { s.source.conclusion = 'failure'; },
    (s) => { s.commit.parents = [{ sha: NEW }]; }, (s) => { s.commit.parents.push({ sha: NEW }); },
    (s) => { s.comparison.status = 'diverged'; }, (s) => { s.tree.truncated = true; },
    (s) => { s.tree.tree[0].mode = '120000'; },
  ]) {
    const f = fixture(); mutate(f.state);
    assert.equal(await validateBotPr(f.github, OWNER, REPO, f.pr, f.files), false);
  }
});

test('only the expected CI workflows on the exact PR head can be approved', () => {
  const { pr } = fixture();
  const run = { id: 10, event: 'pull_request', head_sha: HEAD, path: '.github/workflows/build.yml',
    status: 'waiting', conclusion: 'action_required', pull_requests: [{ number: 7 }] };
  assert.equal(approvableRun(run, pr), true);
  for (const patch of [{ head_sha: NEW }, { path: '.github/workflows/deploy.yml' },
    { event: 'workflow_dispatch' }, { pull_requests: [{ number: 8 }] }, { status: 'completed', conclusion: 'success' }]) {
    assert.equal(approvableRun({ ...run, ...patch }, pr), false);
  }
});

test('all three bots pass the full 26-check gate before squash and explicit deploy', async () => {
  for (const bot of Object.keys(BOTS)) {
    const f = fixture(bot);
    f.state.runs = [{ id: 99, event: 'pull_request', head_sha: HEAD, path: '.github/workflows/build.yml', conclusion: 'action_required' }];
    const result = await handleCheckedPr({ ...f, owner: OWNER, repo: REPO, number: 7, log: () => {} });
    assert.equal(result.status, 'merged'); assert.equal(result.required, 26);
    const merged = f.calls.find((call) => call.kind === 'merge');
    assert.equal(merged.sha, HEAD); assert.equal(merged.merge_method, 'squash');
    const success = f.calls.findIndex((call) => call.kind === 'gateUpdate' && call.conclusion === 'success');
    assert.ok(success < f.calls.findIndex((call) => call.kind === 'merge'));
    assert.equal(f.calls.filter((call) => call.kind === 'approve').length, 1);
    assert.equal(f.calls.filter((call) => call.kind === 'dispatch' && call.workflow_id === 'deploy.yml').length, 1);
  }
});

test('missing, red, skipped, foreign-app or wrong-head CI always blocks both merge and deploy', async () => {
  for (const mutate of [
    (s) => { s.checks.pop(); }, (s) => { s.checks[0].conclusion = 'failure'; },
    (s) => { s.checks[0].conclusion = 'skipped'; }, (s) => { s.checks[0].app.id = 999; },
    (s) => { s.checks[0].head_sha = NEW; }, (s) => { s.checks[0].status = 'in_progress'; },
  ]) {
    const f = fixture(); mutate(f.state);
    const result = await handleCheckedPr({ ...f, owner: OWNER, repo: REPO, number: 7, log: () => {} });
    assert.notEqual(result.status, 'merged');
    assert.equal(f.calls.some((call) => ['merge', 'dispatch'].includes(call.kind)), false);
    assert.equal(f.calls.some((call) => call.kind === 'gateUpdate' && call.conclusion === 'success'), false);
  }
});

test('a moved head after green CI cannot inherit the previous attestation or be merged', async () => {
  const f = fixture(); f.state.newHead = true;
  const result = await handleCheckedPr({ ...f, owner: OWNER, repo: REPO, number: 7, log: () => {} });
  assert.equal(result.status, 'head_changed');
  assert.equal(f.calls.some((call) => call.kind === 'merge' || call.conclusion === 'success'), false);
});

function publisherFixture({ changes = ['src/data/prices-cache.json'], open = [], remote = '', identical = false } = {}) {
  const calls = []; let staged = false, committed = false;
  const env = { GITHUB_REF: 'refs/heads/main', GITHUB_REPOSITORY: `${OWNER}/${REPO}`, GITHUB_SHA: BASE,
    GITHUB_RUN_ID: '123', GH_TOKEN: 'not-a-real-secret' };
  const exec = (program, args, options) => {
    calls.push({ program, args, input: options.input });
    if (program === 'python3') return 'safe';
    if (program === 'gh') {
      const endpoint = args[1];
      if (endpoint.includes('pulls?')) return JSON.stringify(open);
      if (endpoint.includes('git/commits/')) return JSON.stringify({ tree: { sha: identical ? 'tree' : 'different' }, parents: [{ sha: BASE }] });
      if (endpoint.includes('/pulls')) return JSON.stringify({ number: 7 });
      return '';
    }
    if (args[0] === 'rev-parse') return args[1] === 'HEAD^{tree}' ? 'tree' : committed ? HEAD : BASE;
    if (args[0] === 'diff' && args.includes('--cached')) return staged ? changes.join('\n') : '';
    if (args[0] === 'diff') return changes.join('\0');
    if (args[0] === 'ls-files') return '';
    if (args[0] === 'add') staged = true;
    if (args[0] === 'commit') committed = true;
    if (args[0] === 'ls-remote') return remote ? `${remote}\trefs/heads/automation/prices` : '';
    return '';
  };
  return { env, exec, calls };
}

test('no-change publishing creates no commit, PR, push or CI dispatch', () => {
  const f = publisherFixture({ changes: [] });
  assert.deepEqual(publishBot({ bot: 'prices', ...f }), { changed: 'false' });
  assert.equal(f.calls.some((call) => call.program === 'gh' || call.args.includes('push') || call.args.includes('commit')), false);
});

test('publishing writes only the reserved branch and dispatches the main controller', () => {
  const f = publisherFixture(); const result = publishBot({ bot: 'prices', ...f });
  assert.equal(result.pr_number, '7');
  const push = f.calls.find((call) => call.args.includes('push'));
  assert.equal(push.args.at(-1), 'HEAD:refs/heads/automation/prices');
  assert.ok(push.args.includes('--force-with-lease=refs/heads/automation/prices:'));
  const dispatch = f.calls.find((call) => call.args[1]?.endsWith('auto-merge.yml/dispatches'));
  assert.deepEqual(JSON.parse(dispatch.input), { ref: 'main', inputs: { pr_number: '7' } });
});

test('an unrelated output, untrusted ref, foreign PR or draft fails before any push', () => {
  for (const options of [{ changes: ['CLAUDE.md'] },
    { open: [{ number: 7, user: { login: 'attacker' } }] },
    { open: [{ number: 7, draft: true, user: { login: 'github-actions[bot]' } }] }]) {
    const f = publisherFixture(options);
    assert.throws(() => publishBot({ bot: 'prices', ...f }));
    assert.equal(f.calls.some((call) => call.args.includes('push')), false);
  }
  const f = publisherFixture(); f.env.GITHUB_REF = 'refs/heads/untrusted';
  assert.throws(() => publishBot({ bot: 'prices', ...f })); assert.equal(f.calls.length, 0);
});

test('rerunning identical data reuses the bot PR/head and avoids another push or full CI', () => {
  const f = publisherFixture({ remote: HEAD, identical: true,
    open: [{ number: 7, user: { login: 'github-actions[bot]' } }] });
  const result = publishBot({ bot: 'prices', ...f });
  assert.equal(result.head_sha, HEAD);
  assert.equal(f.calls.some((call) => call.args.includes('push')), false);
  assert.equal(f.calls.filter((call) => call.program === 'gh' && call.args[1].endsWith('/pulls') && call.args.includes('POST')).length, 0);
});

test('bot schedules stay intact and every active writer uses the guarded publisher', () => {
  const cron = { prices: '0 6 * * *', 'seo-pulse': '0 6 * * 1', 'source-watch': '0 5 * * 3' };
  for (const [bot, config] of Object.entries(BOTS)) {
    const text = readFileSync(config.workflow, 'utf8');
    assert.ok(text.includes(cron[bot]));
    assert.ok(text.includes(`node scripts/bot-publish.mjs ${bot}`));
    assert.ok(text.includes("if: github.ref == 'refs/heads/main'"));
    assert.ok(text.includes('persist-credentials: false'));
    assert.ok(text.includes('runs-on: ubuntu-latest'));
    assert.doesNotMatch(text, /git push|git pull|--autostash/);
  }
  const controller = readFileSync('.github/workflows/auto-merge.yml', 'utf8');
  assert.match(controller, /ref: main/); assert.match(controller, /checks: write/);
  assert.doesNotMatch(controller, /ref:.*head|secrets\.(?:PAT|GH_PAT)/);
  const report = readFileSync(BOTS['seo-pulse'].workflow, 'utf8');
  assert.match(report, /fetch-depth: 0/);
  assert.match(report, /filter: blob:none/);
});
