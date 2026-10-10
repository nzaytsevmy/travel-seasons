export const GATE_NAME = 'Обязательные проверки';
export const ACTIONS_APP_ID = 15368;
export const BOT_LOGIN = 'github-actions[bot]';

export const BOTS = Object.freeze({
  prices: {
    branch: 'automation/prices', workflow: '.github/workflows/update-prices.yml',
    title: 'chore: update flight prices', author: 'flight-prices-bot',
    paths: ['src/data/prices-cache.json'],
  },
  'seo-pulse': {
    branch: 'automation/seo-pulse', workflow: '.github/workflows/seo-pulse.yml',
    title: 'chore: update SEO pulse report', author: 'seo-pulse-bot',
    paths: ['seo-pulse/_state.json', 'seo-pulse/history.jsonl'],
  },
  'source-watch': {
    branch: 'automation/source-watch', workflow: '.github/workflows/source-watch.yml',
    title: 'chore: update source and traffic snapshots', author: 'source-watch-bot',
    paths: ['seo-pulse/source-snapshots.json', 'seo-pulse/traffic.json'],
  },
});

export const CI_WORKFLOWS = new Set([
  '.github/workflows/build.yml', '.github/workflows/content-gate.yml',
  '.github/workflows/secret-scan.yml', '.github/workflows/visual-tests.yml',
  '.github/workflows/lighthouse.yml', 'dynamic/github-code-scanning/codeql',
]);

export function allowedBotPath(bot, path) {
  const config = BOTS[bot];
  return Boolean(config && (config.paths.includes(path) ||
    (bot === 'seo-pulse' && /^seo-pulse\/\d{4}-\d{2}-\d{2}\.md$/.test(path))));
}

export function botProof(pr) {
  const match = (pr.body || '').match(/<!-- traveltribe-bot:(\{[^\n]*\}) -->/);
  if (!match) return null;
  try {
    const proof = JSON.parse(match[1]);
    if (!BOTS[proof.bot] || !/^[0-9a-f]{40}$/.test(proof.source_sha) ||
      !/^[0-9a-f]{40}$/.test(proof.head_sha) || !/^[1-9]\d*$/.test(String(proof.run_id))) return null;
    return proof;
  } catch { return null; }
}

export function isInternalPr(pr, owner, repo) {
  return pr.state === 'open' && !pr.draft && pr.base.ref === 'main' &&
    pr.head.repo?.full_name === `${owner}/${repo}`;
}

export function isBotCandidate(pr, owner, repo) {
  const proof = botProof(pr);
  return isInternalPr(pr, owner, repo) && pr.user.login === BOT_LOGIN &&
    pr.user.type === 'Bot' && Boolean(proof) &&
    pr.head.ref === BOTS[proof.bot].branch && proof.head_sha === pr.head.sha;
}

// Контроллер читает только метаданные и доверенный main. Ни один файл PR не исполняется.
export async function validateBotPr(github, owner, repo, pr, files) {
  if (!isBotCandidate(pr, owner, repo)) return false;
  const proof = botProof(pr);
  if (!files.length || files.some((file) =>
    !allowedBotPath(proof.bot, file.filename) || file.previous_filename ||
    !['added', 'modified'].includes(file.status))) return false;
  const { data: run } = await github.rest.actions.getWorkflowRun({ owner, repo, run_id: proof.run_id });
  if (run.path !== BOTS[proof.bot].workflow || run.head_branch !== 'main' ||
    run.head_sha !== proof.source_sha || !['schedule', 'workflow_dispatch'].includes(run.event) ||
    !['in_progress', 'queued', 'completed'].includes(run.status) ||
    (run.status === 'completed' && run.conclusion !== 'success')) return false;
  const { data: commit } = await github.rest.git.getCommit({ owner, repo, commit_sha: pr.head.sha });
  if (commit.parents.length !== 1 || commit.parents[0].sha !== proof.source_sha) return false;
  const { data: comparison } = await github.rest.repos.compareCommitsWithBasehead({
    owner, repo, basehead: `${proof.source_sha}...main`,
  });
  if (!['ahead', 'identical'].includes(comparison.status)) return false;
  const { data: tree } = await github.rest.git.getTree({ owner, repo, tree_sha: commit.tree.sha, recursive: '1' });
  if (tree.truncated) return false;
  return files.every((file) => tree.tree.some((entry) =>
    entry.path === file.filename && entry.type === 'blob' && entry.mode === '100644'));
}

export function trustedChecks(runs, headSha) {
  return runs.filter((run) => run.app?.id === ACTIONS_APP_ID && run.head_sha === headSha);
}

export function approvableRun(run, pr) {
  return run.event === 'pull_request' && run.head_sha === pr.head.sha &&
    CI_WORKFLOWS.has(run.path) &&
    (run.conclusion === 'action_required' || run.status === 'action_required' || run.status === 'waiting') &&
    (!run.pull_requests?.length || run.pull_requests.some((entry) => entry.number === pr.number));
}
