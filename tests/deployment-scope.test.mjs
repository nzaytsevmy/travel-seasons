import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'yaml';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {deploymentScope} from '../scripts/deployment-scope.mjs';
import {gitEnvironment} from '../scripts/release-scope.mjs';

test('a native accounting-only merge has an explicit deploy scope before the multi-gigabyte producer',()=>{
 const w=parse(fs.readFileSync('.github/workflows/deploy.yml','utf8'));
 assert.equal(w.on.workflow_dispatch.inputs.base_sha.type,'string');
 assert.equal(w.jobs.prepare.needs,'scope');
 assert.match(w.jobs.prepare.if,/needs\.scope\.outputs\.mode.*accounting/);
 assert(w.jobs.deploy.needs.includes('scope'));assert(w.jobs.deploy.needs.includes('prepare'));
 assert.match(w.jobs.deploy.if,/needs\.scope\.outputs\.mode.*accounting/);
});

function fixture(change){
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'tt-deploy-scope-'));
 const git=(...a)=>execFileSync('git',a,{cwd,env:gitEnvironment(),encoding:'utf8',stdio:'pipe'}).trim();
 try{
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  fs.writeFileSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),'before\n');fs.writeFileSync(path.join(cwd,'article.md'),'same\n');
  git('add','.');git('commit','-qm','baseline');const baseSha=git('rev-parse','HEAD');
  change({cwd,git});git('add','-A');git('commit','-qm','candidate');const headSha=git('rev-parse','HEAD');
  assert.throws(()=>deploymentScope({eventName:'push',baseSha,headSha:baseSha,cwd}),/identity mismatch/);
  return {push:deploymentScope({eventName:'push',baseSha,headSha,cwd}),dispatch:deploymentScope({eventName:'workflow_dispatch',baseSha,headSha,cwd}),
    scheduled:deploymentScope({eventName:'schedule',baseSha,headSha,cwd}),manual:deploymentScope({eventName:'workflow_dispatch',headSha,cwd}),
    unknown:deploymentScope({eventName:'push',baseSha:'f'.repeat(40),headSha,cwd})};
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
}
test('only a regular queue edit skips deployment; schedule/manual/unknown history remain full',()=>{
 const r=fixture(({cwd})=>fs.appendFileSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),'accepted live\n'));
 assert.equal(r.push,'accounting');assert.equal(r.dispatch,'accounting');
 for(const key of ['scheduled','manual','unknown'])assert.equal(r[key],'full',key);
});
test('article changes, mixed edits, executable mode, removal, rename and symlink can never use the no-deploy path',()=>{
 for(const change of [
  ({cwd})=>fs.appendFileSync(path.join(cwd,'article.md'),'new content\n'),
  ({cwd})=>{fs.appendFileSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),'done\n');fs.appendFileSync(path.join(cwd,'article.md'),'new content\n');},
  ({cwd,git})=>{fs.appendFileSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),'done\n');git('update-index','--chmod=+x','DAILY-ARTICLE-QUEUE.md');fs.chmodSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),0o755);},
  ({cwd})=>fs.rmSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md')),
  ({cwd})=>fs.renameSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'),path.join(cwd,'renamed.md')),
  ({cwd})=>{fs.rmSync(path.join(cwd,'DAILY-ARTICLE-QUEUE.md'));fs.symlinkSync('article.md',path.join(cwd,'DAILY-ARTICLE-QUEUE.md'));},
 ]){const r=fixture(change);assert.equal(r.push,'full');assert.equal(r.dispatch,'full');}
});
