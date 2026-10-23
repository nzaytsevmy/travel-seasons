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
  suites:projects.map(project=>({title:'fixture.spec.ts',specs:Array.from({length:4},(_,i)=>({file:'fixture.spec.ts',title:`required case ${i}`,tests:[{projectName:project,repeatEachIndex:0}]}))}))});
 const command=(_binary,args,options)=>{
  const project=args.find(a=>a.startsWith('--project='))?.slice('--project='.length);
  const value=report(project ? [project] : browserProjects);
  const shard=args.find(a=>a.startsWith('--shard='));
  const list=args.find(a=>a.startsWith('--test-list='));
  if(shard)for(const suite of value.suites)suite.specs=[suite.specs[Number(shard.split('=')[1].split('/')[0])-1]];
  if(list){const entries=new Set(fs.readFileSync(list.slice('--test-list='.length),'utf8').trim().split('\n'));
   for(const suite of value.suites)suite.specs=suite.specs.filter(spec=>entries.has(`[${project}] › ${spec.file} › ${spec.title}`));}
  if(args.includes('--list'))return {status:0,stdout:JSON.stringify(value),stderr:''};
  commands.push({project,timeout:Number(args.find(a=>a.startsWith('--global-timeout=')).split('=')[1])});
  const target=options.env.PLAYWRIGHT_JSON_OUTPUT_FILE;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value));
  clock += [36,12,12][commands.length-1]*60_000;
  return {status:0,signal:null};
 };
 try {
  const proof=run(1,{command,now:()=>clock,outputRoot:root});
  assert.equal(proof.passed,false);
  assert.equal(proof.parts.length,4);
  assert.equal(proof.parts.filter(part=>part.passed).length,3);
  assert.match(proof.parts[3].error,/budget exhausted.*coverage incomplete/);
  assert.deepEqual(commands.map(c=>c.timeout),[60,24,12].map(m=>m*60_000));
  assert.equal(proof.globalCaseKeys.length,16);
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

test('GitHub API retries are bounded and never retry access or input rejection', async()=>{
 const {parse}=await import('yaml');
 for(const filename of ['auto-merge.yml','required-checks.yml']) {
  const workflow=parse(fs.readFileSync(`.github/workflows/${filename}`,'utf8'));
  const steps=Object.values(workflow.jobs).flatMap(job=>job.steps||[]).filter(step=>step.uses==='actions/github-script@v7');
  assert.equal(steps.length,1);
  assert.equal(steps[0].with.retries,1);
  const excluded=String(steps[0].with['retry-exempt-status-codes']).split(',').map(Number);
  for(const code of [400,401,403,404,422])assert(excluded.includes(code));
  assert(!excluded.includes(503));
 }
});

test('hotel scenarios are interleaved while every native non-hotel quarter remains unchanged', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'browser-interleave-'));
 const hotelFiles=[['hotel-guides.spec.ts',147],['hotel-referral-browser.spec.ts',70],['hotel-retina.spec.ts',70]];
 const rows=browserProjects.flatMap(project=>[
  ...hotelFiles.flatMap(([file,count])=>Array.from({length:count},(_,i)=>({project,file,title:`${file} country ${String(i).padStart(3,'0')}`}))),
  ...Array.from({length:588},(_,i)=>({project,file:'other.spec.ts',title:`other ${String(i).padStart(3,'0')} [literal].* > <code>`})),
 ]);
 const key=row=>JSON.stringify([row.project,row.file,row.file,row.title,0]);
 const entry=row=>`[${row.project}] › ${row.file} › ${row.title}`;
 const stock=(project,quarter)=>{
  const all=rows.filter(row=>row.project===project),base=Math.floor(all.length/4),extra=all.length%4;
  const from=(quarter-1)*base+Math.min(quarter-1,extra);
  return all.slice(from,from+base+(quarter<=extra?1:0));
 };
 const report=selected=>({config:{rootDir:'/fixture',projects:browserProjects.map(name=>({name}))},stats:{unexpected:0,flaky:0},
  suites:selected.map(row=>({title:row.file,specs:[{file:row.file,title:row.title,tests:[{projectName:row.project,repeatEachIndex:0}]}]}))});
 const command=(_binary,args,options)=>{
  const project=args.find(a=>a.startsWith('--project='))?.slice('--project='.length);
  const shard=args.find(a=>a.startsWith('--shard='))?.slice('--shard='.length);
  const list=args.find(a=>a.startsWith('--test-list='))?.slice('--test-list='.length);
  let selected=project?rows.filter(row=>row.project===project):rows;
  if(shard)selected=stock(project,Number(shard.split('/')[0]));
  if(list){const requested=new Set(fs.readFileSync(list,'utf8').trim().split('\n'));selected=selected.filter(row=>requested.has(entry(row)));}
  const value=report(selected);
  if(args.includes('--list'))return {status:0,stdout:JSON.stringify(value),stderr:''};
  const file=options.env.PLAYWRIGHT_JSON_OUTPUT_FILE;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));
  return {status:0,signal:null};
 };
 try {
  const proofs=[1,2,3,4].map(index=>run(index,{command,now:()=>0,outputRoot:root}));
  assert(proofs.every(proof=>proof.passed));
  const all=[];
  for(const proof of proofs)for(const part of proof.parts){
   const quarter=Number(part.shard.split('/')[0]);
   const retina=part.expectedCaseKeys.filter(k=>JSON.parse(k)[1]==='hotel-retina.spec.ts');
   assert(retina.length>=17&&retina.length<=18,`Heavy Retina cases must be17–18 per part, got ${retina.length}`);
   const hotels=part.expectedCaseKeys.filter(k=>hotelFiles.some(([file])=>JSON.parse(k)[1]===file));
   assert(hotels.length>=71&&hotels.length<=72);
   const nonHotels=part.expectedCaseKeys.filter(k=>JSON.parse(k)[1]==='other.spec.ts');
   assert.deepEqual(nonHotels,stock(part.project,quarter).filter(row=>row.file==='other.spec.ts').map(key).sort());
   all.push(...part.expectedCaseKeys);
  }
  assert.equal(all.length,3500);assert.equal(new Set(all).size,3500);
  assert.deepEqual([...all].sort(),rows.map(key).sort());
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
