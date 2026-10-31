import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {gitEnvironment} from '../scripts/release-scope.mjs';

const script=path.resolve('scripts/routine-preflight.mjs');
const day=offset=>new Date(Date.now()+offset*864e5).toISOString().slice(0,10);
function candidate({body='Путь начинается у станции.',url='https://example.org/source',expired=false}={}){
 return `---\ntitle: Проверочный маршрут\ndescription: Как выбрать путь от станции к входу\npubDate: ${day(-10)}\nreviewed: ${day(-1)}\ncoverImage: ./fixture.jpg\ntags: [Маршрут]\nvolatileFacts:\n  - id: access\n    checkedAt: ${day(-10)}\n    reviewAfter: ${day(expired?-2:20)}\n    fallback: "Перепроверьте доступ у официального оператора перед поездкой."\nchecks:\n  - date: ${day(-1)}\n    what: Проверен маршрут\n    changed: Без изменений\n    sources:\n      - name: Оператор\n        url: "${url}"\n---\n${body}\n`;
}
function preflight(after,{qualityBaseline}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tt-source-preflight-'));
 const env=gitEnvironment();
 const git=(...args)=>execFileSync('git',args,{cwd:dir,env,stdio:'pipe',encoding:'utf8'}).trim();
 try{
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  fs.mkdirSync(path.join(dir,'src/content/blog'),{recursive:true});
  fs.mkdirSync(path.join(dir,'tests'),{recursive:true});
  fs.writeFileSync(path.join(dir,'tests/quality-baseline.json'),JSON.stringify(qualityBaseline??JSON.parse(fs.readFileSync(path.resolve('tests/quality-baseline.json'),'utf8'))));
  const file=path.join(dir,'src/content/blog/fixture.mdx');
  fs.writeFileSync(file,candidate());git('add','.');git('commit','-qm','fixture baseline');const base=git('rev-parse','HEAD');
  fs.writeFileSync(file,after);git('add','.');git('commit','-qm','fixture minor change');
  const result=spawnSync(process.execPath,[script,'--base',base,'--head','HEAD'],{cwd:dir,env,encoding:'utf8',timeout:30000});
  assert.equal(result.error,undefined);return {status:result.status,text:result.stdout+result.stderr};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('local preflight rejects the relative source URL that otherwise fails Astro after CI build',()=>{
 const r=preflight(candidate({url:'/blog/fixture/'}));assert.notEqual(r.status,0,r.text);assert.match(r.text,/url|URL/i);
});
test('local preflight catches capitalized parasite and every language error before push',()=>{
 const r=preflight(candidate({body:'Очень удобный путь начинается у станции.'}));assert.notEqual(r.status,0,r.text);assert.match(r.text,/очень/i);
});
test('local preflight retains the two-occurrence limit of the owning language gate',()=>{
 const r=preflight(candidate({body:'Не только вход. Не только выход. Не только дорога.'}));assert.notEqual(r.status,0,r.text);assert.match(r.text,/не только.*3.*2/i);
});
test('minor link edits cannot hide an expired volatile fact from the source preflight',()=>{
 const r=preflight(candidate({body:'Путь начинается у станции. Далее — вход.',expired:true}));assert.notEqual(r.status,0,r.text);assert.match(r.text,/просроч/i);
});
test('a current small edit remains accepted without a fabricated full editorial review',()=>{
 const r=preflight(candidate({body:'Путь начинается у станции. Далее — вход.'}));assert.equal(r.status,0,r.text);
});
test('the real preflight rejects global ratchet growth even when the soft article limit allows it',()=>{
 const r=preflight(candidate({body:'Путешественник уже выехал.'}),{qualityBaseline:{withoutJournal:0,withStopWords:0,measuredAt:'2026-09-12'}});
 assert.notEqual(r.status,0,r.text);assert.match(r.text,/1 против 0/);
});
