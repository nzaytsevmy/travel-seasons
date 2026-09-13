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
