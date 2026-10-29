import {
  GATE_NAME, approvableRun, isBotCandidate, isInternalPr,
  trustedChecks, validateBotPr,
} from './bot-update-policy.mjs';
import { evaluateChecks, requiredChecks } from './auto-merge-policy.mjs';
import { retryGitHubRead } from './github-read-retry.mjs';

export async function handleCheckedPr({ github, owner, repo, number, eventHead,
  waitMs = 0, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now, log = console.log, retrySleep = sleep }) {
  const params = { owner, repo };
  const deadline = now() + waitMs;
  let head, names;
  const approved = new Set();
  const read = fn => retryGitHubRead(fn,{sleep:retrySleep});
  for (;;) {
    const { data: pr } = await read(()=>github.rest.pulls.get({ ...params, pull_number: number }));
    if (!isInternalPr(pr, owner, repo)) return { status: 'ineligible' };
    if ((eventHead && pr.head.sha !== eventHead) || (head && pr.head.sha !== head)) {
      return { status: 'head_changed' };
    }
    if (!head) {
      const files = await read(()=>github.paginate(github.rest.pulls.listFiles, { ...params, pull_number: number, per_page: 100 }));
      if (!files.length || files.length >= 3000) throw new Error(`PR #${number}: неполный список файлов`);
      const ownerPr = pr.user.login === owner;
      const botPr = !ownerPr && await read(()=>validateBotPr(github, owner, repo, pr, files));
      if (!ownerPr && !botPr) return { status: 'untrusted' };
      head = pr.head.sha;
      names = requiredChecks(files.map((file) => file.filename));
      log(`PR #${number}: HEAD ${head}; обязательных проверок ${names.length}`);
    }
    if (isBotCandidate(pr, owner, repo)) {
      const runs = await read(()=>github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
        ...params, event: 'pull_request', head_sha: head, per_page: 100,
      }));
      for (const run of runs.filter((run) => approvableRun(run, pr) && !approved.has(run.id))) {
        await github.rest.actions.approveWorkflowRun({ ...params, run_id: run.id });
        approved.add(run.id);
        log(`PR #${number}: доверенный CI ${run.id} разрешён`);
      }
    }
    const runs = await read(()=>github.paginate(github.rest.checks.listForRef, { ...params, ref: head, filter: 'latest', per_page: 100 }));
    // The aggregate must be a completed native job, never a status fabricated
    // by the actor that is about to merge. Its workflow checks the same policy.
    const result = evaluateChecks([...names, GATE_NAME], trustedChecks(runs, head));
    if (result.failed.length) {
      return { status: 'failed', ...result };
    }
    if (result.ready) {
      // A background data update must not invalidate an already running owner release.
      // Keep its green CI and open PR; the existing sweep can resume after the editorial PR closes.
      if(isBotCandidate(pr,owner,repo)){
        const open=await read(()=>github.paginate(github.rest.pulls.list,{...params,state:'open',base:'main',per_page:100}));
        const blockers=open.filter(p=>p.number!==number&&isInternalPr(p,owner,repo)&&p.user.login===owner&&/^tt-(?:news|publish)\//.test(p.head.ref)).map(p=>p.number);
        if(blockers.length)return {status:'deferred_for_editorial',blockers};
      }
      const { data: fresh } = await read(()=>github.rest.pulls.get({ ...params, pull_number: number }));
      if (fresh.head.sha !== head || !isInternalPr(fresh, owner, repo)) return { status: 'head_changed' };
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
          const latest = (await read(()=>github.rest.pulls.get({ ...params, pull_number: number }))).data;
          return { status: latest.state === 'closed' ? 'already_merged' : 'blocked' };
        }
        throw error;
      }
      if (!merged.merged) throw new Error(`PR #${number}: GitHub не подтвердил слияние`);
      // Слияние от GITHUB_TOKEN не запускает push workflow. Dispatch обязателен.
      const dispatch={ ...params, workflow_id: 'deploy.yml', ref: 'main' };
      // This exact native base lets deploy recognize queue-only accounting. Missing/unknown base stays a full rebuild.
      if(/^[a-f0-9]{40}$/.test(fresh.base.sha||''))dispatch.inputs={base_sha:fresh.base.sha};
      await github.rest.actions.createWorkflowDispatch(dispatch);
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
  let completion=context.eventName==='workflow_run'?context.payload.workflow_run:null;
  if(context.eventName==='workflow_run'&&(!completion||!Number.isSafeInteger(completion.id)||completion.id<1||completion.name!=='Required PR checks'||completion.event!=='pull_request'||completion.status!=='completed'||completion.conclusion!=='success'||completion.head_repository?.full_name!==`${owner}/${repo}`||!/^[a-f0-9]{40}$/.test(completion.head_sha||''))){
    core.info('Completion is not an eligible same-repository native gate; no merge.');return;
  }
  if(completion){
    // Webhook payloads need not contain path. Read the authoritative run before granting write behavior.
    const native=(await retryGitHubRead(()=>github.rest.actions.getWorkflowRun({owner,repo,run_id:completion.id}))).data;
    if(native.id!==completion.id||native.name!=='Required PR checks'||native.path!=='.github/workflows/required-checks.yml'||native.event!=='pull_request'||native.status!=='completed'||native.conclusion!=='success'||native.head_sha!==completion.head_sha||native.head_repository?.full_name!==`${owner}/${repo}`){
      core.info('Native gate identity differs from completion event; no merge.');return;
    }
    completion={...native,pull_requests:completion.pull_requests||native.pull_requests};
  }
  if (input && !/^[1-9]\d*$/.test(input)) throw new Error('Некорректный номер заявки');
  let numbers;
  if(completion&&completion.pull_requests?.length)numbers=[...new Set(completion.pull_requests.map(p=>p.number))];
  else if (eventPr) numbers = [eventPr.number];
  else if (input) numbers = [Number(input)];
  else {
    const open = await retryGitHubRead(()=>github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', base: 'main', per_page: 100 }));
    numbers = open.filter((pr) => isInternalPr(pr, owner, repo) &&
      (!completion||pr.head.sha===completion.head_sha)&&(pr.user.login === owner || isBotCandidate(pr, owner, repo))).map((pr) => pr.number);
  }
  if(numbers.some(n=>!Number.isSafeInteger(n)||n<1))throw new Error('Invalid completed-gate PR number');
  core.info(`Контроллер: заявок ${numbers.length}`);
  for (const number of numbers) {
    const result = await handleCheckedPr({ github, owner, repo, number, eventHead: completion?.head_sha||eventPr?.head.sha,
      waitMs: 0, log: (line) => core.info(line) });
    core.info(`PR #${number}: ${result.status}`);
    if (result.status === 'failed') core.setFailed(`PR #${number}: ${result.failed.join(', ')}`);
  }
}
