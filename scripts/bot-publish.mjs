import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { BOTS, allowedBotPath } from './bot-update-policy.mjs';

export function publishBot({ bot, env = process.env, exec = execFileSync } = {}) {
  const config = BOTS[bot];
  if (!config || env.GITHUB_REF !== 'refs/heads/main' || !env.GH_TOKEN ||
    !/^[^/]+\/[^/]+$/.test(env.GITHUB_REPOSITORY || '') ||
    !/^[0-9a-f]{40}$/.test(env.GITHUB_SHA || '') || !/^[1-9]\d*$/.test(env.GITHUB_RUN_ID || '')) {
    throw new Error('Издатель требует известного бота, доверенный main и контекст GitHub Actions');
  }
  const run = (program, args) => exec(program, args, {
    env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 40_000, maxBuffer: 4 * 1024 * 1024,
  }).trim();
  const git = (...args) => run('git', args);
  const api = (endpoint) => JSON.parse(run('gh', ['api', endpoint]));
  // JSON поступает через stdin, а не shell; секреты не попадают в URL, тело или вывод.
  const writeApi = (method, endpoint, body) => {
    const result = exec('gh', ['api', endpoint, '--method', method, '--input', '-'], {
      env, input: JSON.stringify(body), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 40_000, maxBuffer: 4 * 1024 * 1024,
    }).trim();
    return result ? JSON.parse(result) : null;
  };
  const output = (values) => {
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT,
      Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
    return values;
  };
  if (git('rev-parse', 'HEAD') !== env.GITHUB_SHA) throw new Error('Checkout не совпадает с исходником запуска');
  if (git('diff', '--cached', '--name-only')) throw new Error('Индекс уже содержит чужие изменения');
  const changed = [...new Set([
    ...git('diff', '--name-only', '-z', '--').split('\0'),
    ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0'),
  ].filter(Boolean))];
  if (!changed.length) return output({ changed: 'false' });
  if (changed.some((path) => !allowedBotPath(bot, path))) throw new Error('Генератор изменил файлы вне своей области');
  const repository = env.GITHUB_REPOSITORY;
  const owner = repository.split('/')[0];
  const endpoint = `repos/${repository}`;
  const findPr = () => api(`${endpoint}/pulls?state=open&base=main&head=${encodeURIComponent(`${owner}:${config.branch}`)}&per_page=100`);
  const open = findPr();
  if (open.length > 1) throw new Error('У бота несколько открытых заявок на одной ветке');
  if (open.length && (open[0].user.login !== 'github-actions[bot]' || open[0].draft)) {
    throw new Error('Ветка занята чужой заявкой или приостановленным черновиком');
  }
  git('config', 'user.name', config.author);
  git('config', 'user.email', `${config.author}@users.noreply.github.com`);
  git('add', '--', ...changed);
  if (!git('diff', '--cached', '--name-only')) return output({ changed: 'false' });
  git('commit', '-m', config.title);
  let headSha = git('rev-parse', 'HEAD');
  run('python3', ['scripts/secret-scan.py', '--tree', 'HEAD']);
  const remote = git('ls-remote', '--heads', 'origin', `refs/heads/${config.branch}`).split(/\s+/)[0];
  const oldCommit = remote && open.length ? api(`${endpoint}/git/commits/${remote}`) : null;
  if (oldCommit?.tree.sha === git('rev-parse', 'HEAD^{tree}') &&
    oldCommit.parents.length === 1 && oldCommit.parents[0].sha === env.GITHUB_SHA) {
    headSha = remote;
  } else {
    const lease = `--force-with-lease=refs/heads/${config.branch}:${remote}`;
    git('-c', 'credential.helper=!gh auth git-credential', 'push', lease, 'origin', `HEAD:refs/heads/${config.branch}`);
  }
  const proof = { bot, source_sha: env.GITHUB_SHA, head_sha: headSha, run_id: env.GITHUB_RUN_ID };
  const body = `Автоматическое обновление ${bot}. Изменён только разрешённый набор данных.\n\n` +
    `Перед слиянием обязательны все применимые проверки на этом коммите.\n\n` +
    `Источник: https://github.com/${repository}/actions/runs/${env.GITHUB_RUN_ID}\n\n` +
    `<!-- traveltribe-bot:${JSON.stringify(proof)} -->`;
  let pr;
  if (open.length) {
    if (open[0].user.login !== 'github-actions[bot]') throw new Error('Ветка занята чужой заявкой');
    pr = writeApi('PATCH', `${endpoint}/pulls/${open[0].number}`, { title: config.title, body });
  } else {
    try { pr = writeApi('POST', `${endpoint}/pulls`, { base: 'main', head: config.branch, title: config.title, body }); }
    catch (error) {
      // POST мог успешно сохраниться до сетевого обрыва. Восстанавливаем результат, не создаём дубль.
      const recovered = findPr();
      if (recovered.length !== 1 || recovered[0].user.login !== 'github-actions[bot]') throw error;
      pr = writeApi('PATCH', `${endpoint}/pulls/${recovered[0].number}`, { title: config.title, body });
    }
  }
  writeApi('POST', `${endpoint}/actions/workflows/auto-merge.yml/dispatches`, {
    ref: 'main', inputs: { pr_number: String(pr.number) },
  });
  console.log(`PR #${pr.number}: проверки и контроллер запущены; main не изменён`);
  return output({ changed: 'true', pr_number: String(pr.number), head_sha: headSha });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { publishBot({ bot: process.argv[2] }); }
  catch (error) { console.error(error.message.replace(/ghp_[\w]+|github_pat_[\w]+/g, '[redacted]')); process.exitCode = 1; }
}
