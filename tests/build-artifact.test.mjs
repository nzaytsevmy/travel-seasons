import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,statSync,mkdirSync,utimesSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {packArtifact,unpackArtifact} from '../scripts/build-artifact.mjs';

test('артефакт сохраняет mtime; чужой коммит, запуск и изменённые байты не проходят',()=>{
 const root=mkdtempSync(join(tmpdir(),'artifact-')); const source=join(root,'source'); const archive=join(root,'artifact');
 const version={sha:'a'.repeat(40),run:'123',attempt:'1'};
 try {
  mkdirSync(source); writeFileSync(join(source,'index.html'),'hello');
  utimesSync(join(source,'index.html'),1700000000,1700000000);
  const digest=packArtifact(source,archive,version);
  assert.throws(()=>unpackArtifact(archive,join(root,'wrong'),{...version,sha:'b'.repeat(40)},digest),/version/);
  assert.throws(()=>unpackArtifact(archive,join(root,'wrong'),{...version,run:'122'},digest),/version/);
  unpackArtifact(archive,join(root,'unpacked'),version,digest);
  assert.equal(statSync(join(root,'unpacked','index.html')).mtimeMs,1700000000000);
  const data=readFileSync(join(archive,'site.tar')); data[600]^=1; writeFileSync(join(archive,'site.tar'),data);
  assert.throws(()=>unpackArtifact(archive,join(root,'bad'),version,digest),/checksum/);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('чистый получатель получает данные Astro preview из того же проверенного архива',()=>{
 const root=mkdtempSync(join(tmpdir(),'artifact-preview-')), source=join(root,'dist'), archive=join(root,'artifact');
 const producer=join(root,'producer'), consumer=join(root,'consumer');
 const version={sha:'a'.repeat(40),run:'124',attempt:'1'};
 try {
  mkdirSync(source); writeFileSync(join(source,'index.html'),'hello');
  mkdirSync(join(producer,'src/data'),{recursive:true});
  const files=['freshness.generated.json','page-lastmod.generated.json'];
  for(const name of files) writeFileSync(join(producer,'src/data',name),JSON.stringify({fixture:name}));
  const digest=packArtifact(source,archive,version,producer);
  unpackArtifact(archive,join(consumer,'dist'),version,digest,consumer);
  for(const name of files) assert.equal(readFileSync(join(consumer,'src/data',name),'utf8'),readFileSync(join(producer,'src/data',name),'utf8'));
  assert.equal(existsSync(join(consumer,'dist','preview-runtime.json')),false);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('consumer retry reuses only the exact successful producer identity', async () => {
 const api = await import('../scripts/build-artifact.mjs');
 const root=mkdtempSync(join(tmpdir(),'artifact-retry-')), source=join(root,'source'), archive=join(root,'artifact');
 const version={sha:'a'.repeat(40),run:'125',attempt:'1'};
 const env={GITHUB_SHA:version.sha,GITHUB_RUN_ID:version.run,GITHUB_RUN_ATTEMPT:'2',ARTIFACT_PRODUCER_ATTEMPT:'1'};
 try {
  mkdirSync(source);writeFileSync(join(source,'index.html'),'same qualified source');
  const digest=packArtifact(source,archive,version);
  // The fallback reproduces the old CLI: consumer attempt2 incorrectly expects a newly produced archive.
  const expected=api.unpackVersion ? api.unpackVersion(env) : {...version,attempt:env.GITHUB_RUN_ATTEMPT};
  unpackArtifact(archive,join(root,'unpacked'),expected,digest);
  assert.deepEqual(JSON.parse(readFileSync(join(root,'unpacked/build-version.json'),'utf8')),{commit:version.sha,run:version.run,attempt:'1'});
  assert.throws(()=>unpackArtifact(archive,join(root,'wrong-attempt'),{...expected,attempt:'2'},digest),/version mismatch: attempt/);
  assert.throws(()=>api.unpackVersion({...env,ARTIFACT_PRODUCER_ATTEMPT:'3'}),/producer artifact attempt/);
  assert.throws(()=>api.unpackVersion({...env,ARTIFACT_PRODUCER_ATTEMPT:''}),/producer artifact attempt/);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('every build consumer uses producer name/attempt while retaining the digest gate', async () => {
 const {parse}=await import('yaml');
 const producer=parse(readFileSync('.github/workflows/site-artifact.yml','utf8'));
 for(const key of ['artifact_name','producer_attempt']) {
  assert.equal(producer.on.workflow_call.outputs[key].value,`\u0024{{ jobs.artifact.outputs.${key} }}`);
  assert.equal(producer.jobs.artifact.outputs[key],`\u0024{{ steps.pack.outputs.${key} }}`);
 }
 let consumers=0;
 for(const filename of ['visual-tests.yml','lighthouse.yml','deploy.yml']) {
  const workflow=parse(readFileSync(`.github/workflows/${filename}`,'utf8'));
  for(const job of Object.values(workflow.jobs))for(const step of job.steps||[]) {
   if(step.uses?.startsWith('actions/download-artifact@') && step.with?.path==='.build-artifact/') {
    consumers++;assert.equal(step.with.name,'${{ needs.prepare.outputs.artifact_name }}');
   }
   if(step.run==='node scripts/build-artifact.mjs unpack') {
    assert.equal(step.env.ARTIFACT_DIGEST,'${{ needs.prepare.outputs.digest }}');
    assert.equal(step.env.ARTIFACT_PRODUCER_ATTEMPT,'${{ needs.prepare.outputs.producer_attempt }}');
   }
  }
 }
 assert.equal(consumers,4);
});
