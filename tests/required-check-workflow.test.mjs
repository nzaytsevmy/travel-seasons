import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {requiredChecks} from '../scripts/auto-merge-policy.mjs';
const yaml = readFileSync('.github/workflows/required-checks.yml', 'utf8');
const script = yaml.split('          script: |\n')[1].split('\n').map(line => line.slice(12)).join('\n');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const execute = new AsyncFunction('github', 'context', 'core', 'require', 'Date', 'setTimeout', 'process', script);
const head = 'b'.repeat(40), other = 'c'.repeat(40);
function fixture() {
  const pr = {state:'open',base:{ref:'main'},user:{login:'owner'},head:{sha:head,repo:{full_name:'owner/repo'}}};
  const checks = requiredChecks(['src/styles/global.css']).map((name,id)=>({id,name,head_sha:head,app:{id:15368},status:'completed',conclusion:'success'}));
  let gets = 0, ticks = 0;
  const state = {pr,checks,files:[{filename:'src/styles/global.css'}],changeAfter:Infinity};
  const github = {rest:{pulls:{get:async()=>({data:++gets>=state.changeAfter?{...pr,head:{...pr.head,sha:other}}:state.pr}),listFiles:()=>{}},checks:{listForRef:()=>{}}},paginate:async fn=>fn===github.rest.pulls.listFiles?state.files:state.checks};
  const context = {repo:{owner:'owner',repo:'repo'},payload:{pull_request:{number:759,head:{sha:head}}}};
  const summary = {addHeading(){return this;},addRaw(){return this;},addList(){return this;},async write(){state.summaryWritten=true;}};
  return {state,run:()=>execute(github,context,{info(){},summary},createRequire(import.meta.url),{now:()=>ticks++*60*60*1000},cb=>cb(),{env:{GITHUB_WORKSPACE:process.cwd()}})};
}
test('actual required workflow is an eligible, read-only job executing trusted main policy',()=>{
  assert.match(yaml,/on:\n  pull_request:/);assert.match(yaml,/name: Обязательные проверки/);
  assert.match(yaml,/permissions:\n  contents: read\n  pull-requests: read\n  checks: read/);
  assert.match(yaml,/ref: main\n          persist-credentials: false/);
  assert.doesNotMatch(yaml,/workflow_dispatch|secrets\.|checks: write|pulls\.merge|checks\.(create|update)/);
});
test('actual job succeeds only after all26 official checks and fresh matching HEAD',async()=>{
  const f=fixture();await f.run();assert.equal(f.state.checks.length,26);assert.equal(f.state.summaryWritten,true);
});
test('an owner draft can qualify before ready without publishing or resetting the native job',async()=>{
  const f=fixture();f.state.pr.draft=true;await f.run();assert.equal(f.state.summaryWritten,true);
  assert.doesNotMatch(yaml,/ready_for_review/);
});
for (const [label,mutate] of [
  ['missing',s=>s.checks.pop()],['skipped',s=>s.checks[0].conclusion='skipped'],
  ['failed',s=>s.checks[0].conclusion='failure'],['foreign app',s=>s.checks[0].app.id=999],
  ['other HEAD',s=>s.checks[0].head_sha=other],['still running',s=>s.checks[0].status='in_progress'],
  ['foreign repo',s=>s.pr.head.repo.full_name='attacker/repo'],['closed PR',s=>s.pr.state='closed'],
  ['HEAD changes after all checks turn green',s=>s.changeAfter=3],
  ['untrusted internal author',s=>s.pr.user.login='attacker'],
]) test(`actual job rejects ${label}`,async()=>{const f=fixture();mutate(f.state);await assert.rejects(f.run());assert.notEqual(f.state.summaryWritten,true);});
