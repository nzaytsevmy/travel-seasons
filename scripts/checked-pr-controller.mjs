import {
  ACTIONS_APP_ID, GATE_NAME, approvableRun, isBotCandidate, isInternalPr,
  trustedChecks, validateBotPr,
} from './bot-update-policy.mjs';
import { evaluateChecks, requiredChecks } from './auto-merge-policy.mjs';

export async function handleCheckedPr({ github, owner, repo, number, eventHead,
  waitMs = 0, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now, log = console.log }) {
  const params = { owner, repo };
  const deadline = now() + waitMs;
  let head, gate, names;
  const approved = new Set();
  for (;;) {
    const { data: pr } = await github.rest.pulls.get({ ...params, pull_number: number });
    if (!isInternalPr(pr, owner, repo)) return { status: 'ineligible' };
    if ((eventHead && pr.head.sha !== eventHead) || (head && pr.head.sha !== head)) {
      if (gate) await github.rest.checks.update({ ...params, check_run_id: gate.id,
        status: 'completed', conclusion: 'cancelled',
        output: { title: 'В заявке новый коммит', summary: 'Новый HEAD требует собственного полного гейта.' } });
      return { status: 'head_changed' };
    }
    if (!head) {
      const files = await github.paginate(github.rest.pulls.listFiles, { ...params, pull_number: number, per_page: 100 });
      if (!files.length || files.length >= 3000) throw new Error(`PR #${number}: неполный список файлов`);
      const ownerPr = pr.user.login === owner;
      const botPr = !ownerPr && await validateBotPr(github, owner, repo, pr, files);
      if (!ownerPr && !botPr) return { status: 'untrusted' };
      head = pr.head.sha;
      names = requiredChecks(files.map((file) => file.filename));
      const previous = await github.paginate(github.rest.checks.listForRef, { ...params, ref: head, filter: 'latest', per_page: 100 });
      gate = trustedChecks(previous, head).filter((run) => run.name === GATE_NAME)
        .sort((a, b) => b.id - a.id)[0];
      const pending = { status: 'in_progress',
        output: { title: `${names.length} обязательных проверок`, summary: `PR #${number}; HEAD ${head}. Красный, отсутствующий или пропущенный гейт блокирует слияние.` } };
      if (gate) await github.rest.checks.update({ ...params, check_run_id: gate.id, ...pending });
      else gate = (await github.rest.checks.create({ ...params, name: GATE_NAME, head_sha: head, ...pending })).data;
      log(`PR #${number}: HEAD ${head}; обязательных проверок ${names.length}`);
    }
    if (isBotCandidate(pr, owner, repo)) {
      const runs = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
        ...params, event: 'pull_request', head_sha: head, per_page: 100,
      });
      for (const run of runs.filter((run) => approvableRun(run, pr) && !approved.has(run.id))) {
        await github.rest.actions.approveWorkflowRun({ ...params, run_id: run.id });
        approved.add(run.id);
        log(`PR #${number}: доверенный CI ${run.id} разрешён`);
      }
    }
    const runs = await github.paginate(github.rest.checks.listForRef, { ...params, ref: head, filter: 'latest', per_page: 100 });
    const result = evaluateChecks(names, trustedChecks(runs, head));
    if (result.failed.length) {
      await github.rest.checks.update({ ...params, check_run_id: gate.id, status: 'completed', conclusion: 'failure',
        output: { title: 'Слияние заблокировано', summary: `Не прошли: ${result.failed.join(', ')}. HEAD ${head}.` } });
      return { status: 'failed', ...result };
    }
    if (result.ready) {
      const { data: fresh } = await github.rest.pulls.get({ ...params, pull_number: number });
      if (fresh.head.sha !== head || !isInternalPr(fresh, owner, repo)) return { status: 'head_changed' };
      await github.rest.checks.update({ ...params, check_run_id: gate.id, status: 'completed', conclusion: 'success',
        output: { title: `Все ${names.length} проверок зелёные`,
          summary: `HEAD ${head}; GitHub Actions app ${ACTIONS_APP_ID}.\n\n${names.map((name) => `- ${name}`).join('\n')}` } });
      if (fresh.mergeable === false) return { status: 'conflict' };
      if (fresh.mergeable === null || fresh.mergeable === undefined) {
        if (now() >= deadline) return { status: 'mergeability_pending' };
        await sleep(10_000);
        continue;
      }
      let merged;
      try { merged = (await github.rest.pulls.merge({ ...params, pull_number: number, merge_method: 'squash', sha: head })).data; }
      catch (error) {
        if (error.status === 409) return { status: 'head_changed' };
        if (error.status === 405) {
          const latest = (await github.rest.pulls.get({ ...params, pull_number: number })).data;
          return { status: latest.state === 'closed' ? 'already_merged' : 'blocked' };
        }
        throw error;
      }
      if (!merged.merged) throw new Error(`PR #${number}: GitHub не подтвердил слияние`);
      // Слияние от GITHUB_TOKEN не запускает push workflow. Dispatch обязателен.
      await github.rest.actions.createWorkflowDispatch({ ...params, workflow_id: 'deploy.yml', ref: 'main' });
      log(`PR #${number}: слит ${merged.sha}; production deploy запущен`);
      return { status: 'merged', head, merge_sha: merged.sha, required: names.length };
    }
    if (now() >= deadline) return { status: 'pending', ...result };
    await sleep(20_000);
  }
}

export async function runCheckedController({ github, context, core }) {
  const { owner, repo } = context.repo;
  const eventPr = context.payload.pull_request;
  const input = context.payload.inputs?.pr_number || '';
  if (input && !/^[1-9]\d*$/.test(input)) throw new Error('Некорректный номер заявки');
  let numbers;
  if (eventPr) numbers = [eventPr.number];
  else if (input) numbers = [Number(input)];
  else {
    const open = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', base: 'main', per_page: 100 });
    numbers = open.filter((pr) => isInternalPr(pr, owner, repo) &&
      (pr.user.login === owner || isBotCandidate(pr, owner, repo))).map((pr) => pr.number);
  }
  core.info(`Контроллер: заявок ${numbers.length}`);
  for (const number of numbers) {
    const result = await handleCheckedPr({ github, owner, repo, number, eventHead: eventPr?.head.sha,
      waitMs: eventPr || input ? 42 * 60 * 1000 : 0, log: (line) => core.info(line) });
    core.info(`PR #${number}: ${result.status}`);
    if (result.status === 'failed') core.setFailed(`PR #${number}: ${result.failed.join(', ')}`);
  }
}
