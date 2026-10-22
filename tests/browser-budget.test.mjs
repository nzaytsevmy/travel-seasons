import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, browserParts, browserProjects, BROWSER_SUITE_BUDGET_MS } from '../scripts/run-balanced-browser-shard.mjs';

test('a shared deadline retains diagnostics and fails incomplete browser coverage', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'browser-budget-'));
 let clock=0; const commands=[];
 const report=(projects)=>({config:{rootDir:'/fixture',projects:projects.map(name=>({name}))},stats:{unexpected:0,flaky:0},
  suites:projects.map(project=>({title:'fixture',specs:[{file:'fixture.spec.ts',title:'required case',tests:[{projectName:project,repeatEachIndex:0}]}]}))});
 const command=(_binary,args,options)=>{
  const project=args.find(a=>a.startsWith('--project='))?.slice('--project='.length);
  const value=report(project ? [project] : browserProjects);
  if(args.includes('--list'))return {status:0,stdout:JSON.stringify(value),stderr:''};
  commands.push({project,timeout:Number(args.find(a=>a.startsWith('--global-timeout=')).split('=')[1])});
  const target=options.env.PLAYWRIGHT_JSON_OUTPUT_FILE;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value));
  clock += [24,8,8][commands.length-1]*60_000;
  return {status:0,signal:null};
 };
 try {
  const proof=run(1,{command,now:()=>clock,outputRoot:root});
  assert.equal(proof.passed,false);
  assert.equal(proof.parts.length,4);
  assert.equal(proof.parts.filter(part=>part.passed).length,3);
  assert.match(proof.parts[3].error,/budget exhausted.*coverage incomplete/);
  assert.deepEqual(commands.map(c=>c.timeout),[40,16,8].map(m=>m*60_000));
  assert.equal(proof.globalCaseKeys.length,4);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'tests/.html-report/balanced-shard.json'))),proof);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('all sixteen browser/quarter combinations remain present exactly once',()=>{
 const pairs=[1,2,3,4].flatMap(index=>browserParts(index).map(part=>`${part.project}:${part.shard}`));
 assert.equal(pairs.length,16);assert.equal(new Set(pairs).size,16);
 for(const project of browserProjects)for(const quarter of [1,2,3,4])assert(pairs.includes(`${project}:${quarter}/4`));
});

test('outer CI deadlines cover setup, graceful test shutdown and report upload',()=>{
 const visual=fs.readFileSync('.github/workflows/visual-tests.yml','utf8');
 const outer=Number(visual.match(/  visual:[\s\S]*?timeout-minutes:\s*(\d+)/)[1]);
 assert(outer>=BROWSER_SUITE_BUDGET_MS/60_000+15,'Browser setup and reports need time outside Playwright global timeout');
 assert.match(visual,/Upload complete browser reports and failure artifacts\n\s+if: always\(\)/);
 const producer=Number(fs.readFileSync('.github/workflows/site-artifact.yml','utf8').match(/timeout-minutes:\s*(\d+)/)[1]);
 const aggregate=fs.readFileSync('.github/workflows/required-checks.yml','utf8');
 const wait=Number(aggregate.match(/deadline = Date.now\(\) \+ (\d+) \* 60/)[1]);
 const job=Number(aggregate.match(/timeout-minutes:\s*(\d+)/)[1]);
 assert(wait>=producer+outer+10,'Required aggregate must cover the producer+consumer critical path');
 assert(job>=wait+5,'Aggregate cleanup needs reserve');
});
