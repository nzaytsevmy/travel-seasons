import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { requiredChecks } from './auto-merge-policy.mjs';
import { ACTIONS_APP_ID, GATE_NAME } from './bot-update-policy.mjs';

const WORKFLOW_FILES = new Set([
  '.github/workflows/auto-merge.yml', '.github/workflows/update-prices.yml',
  '.github/workflows/seo-pulse.yml', '.github/workflows/source-watch.yml',
  'scripts/bot-update-policy.mjs', 'scripts/bot-publish.mjs',
  'scripts/checked-pr-controller.mjs', 'scripts/auto-merge-policy.mjs',
  'scripts/workflow-push-scope.mjs', 'scripts/pre-push.sh',
  'tests/bot-updates.test.mjs', 'tests/auto-merge-policy.test.mjs',
  'tests/trip-budget-consistency.spec.ts',
  'tests/workflow-push-scope.test.mjs', 'CLAUDE.md', 'AGENTS.md',
]);

export function workflowOnly(entries) {
  return entries.length > 0 && entries.some((entry) => entry.path !== 'CLAUDE.md' && entry.path !== 'AGENTS.md') &&
    entries.every((entry) => WORKFLOW_FILES.has(entry.path) && ['M', 'A'].includes(entry.status) &&
      ['100644', '100755'].includes(entry.mode) &&
      (entry.mode !== '100755' || entry.path === 'scripts/pre-push.sh'));
}

export function protectedCi(rules) {
  if (!Array.isArray(rules) || !rules.some((rule) => rule.type === 'pull_request')) return false;
  const required = rules.filter((rule) => rule.type === 'required_status_checks')
    .flatMap((rule) => rule.parameters.required_status_checks);
  const names = new Set(required.filter((check) => check.integration_id === ACTIONS_APP_ID).map((check) => check.context));
  // Первый выпуск защищён всеми 26 нативными статусами. После него общий статус
  // из доверенного main удостоверяет тот же полный набор либо шесть для текста.
  return requiredChecks(['scripts/checked-pr-controller.mjs']).every((name) => names.has(name)) ||
    (names.has(GATE_NAME) && requiredChecks(['note.md']).every((name) => names.has(name)));
}

export function verifyWorkflowPush(base, head, exec = execFileSync) {
  const run = (program, args) => exec(program, args, { encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }).trim();
  const raw = run('git', ['diff', '--raw', '--no-abbrev', '--no-renames', '-z', base, head]);
  const tokens = raw.split('\0'); const entries = [];
  for (let index = 0; index < tokens.length && tokens[index]; index += 2) {
    const [oldMode, mode, oldSha, sha, status] = tokens[index].replace(/^:/, '').split(' ');
    if (!oldMode || !oldSha || !sha || !tokens[index + 1]) throw new Error('Неполный git diff');
    entries.push({ path: tokens[index + 1], mode, status });
  }
  if (!workflowOnly(entries)) return false;
  if (run('git', ['diff', '--name-only', head, '--', 'scripts', 'tests', '.github/workflows', 'CLAUDE.md', 'AGENTS.md']) ||
    run('git', ['ls-files', '--others', '--exclude-standard', '--', 'scripts', 'tests', '.github/workflows'])) {
    throw new Error('Проверяемые скрипты отличаются от отправляемого HEAD');
  }
  const rules = JSON.parse(run('gh', ['api', 'repos/nzaytsevmy/travel-seasons/rules/branches/main']));
  if (!protectedCi(rules)) throw new Error('Нет действующей серверной защиты PR и полного обязательного CI');
  console.log('✔ изменён только процесс трёх ботов: полный CI обязателен в защищённом main; код сайта не затронут.');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const base = args[args.indexOf('--base') + 1], head = args[args.indexOf('--head') + 1];
    if (!args.includes('--base') || !args.includes('--head')) throw new Error('Нужны --base и --head');
    process.exitCode = verifyWorkflowPush(base, head) ? 0 : 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
