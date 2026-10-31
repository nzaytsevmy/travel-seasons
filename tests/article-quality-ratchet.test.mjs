import test from 'node:test';
import assert from 'node:assert/strict';
import { articleQualityRatchet } from '../scripts/article-quality-ratchet.mjs';
import { articleLanguageProblems } from '../scripts/article-source-rules.mjs';
const post=(file,body,journal=true)=>({file,raw:`---\ntitle: Уже в пути\n${journal?'checks: []\n':''}---\n${body}`});
const baseline={withoutJournal:0,withStopWords:1,measuredAt:'2026-09-12'};
test('a soft word allowed per article still cannot grow the existing site budget',()=>{
  assert.deepEqual(articleLanguageProblems({rel:'new.mdx',prose:'Путешественник уже выехал.'}),[]);
  const result=articleQualityRatchet({posts:[post('legacy.mdx','Поезд уже отправился.'),post('new.mdx','Путешественник уже выехал.')],baseline});
  assert.equal(result.problems.length,1);assert.match(result.problems[0],/2 против 1/);
});
test('legacy allowance and a net improvement keep the existing ratchet semantics',()=>{
  assert.deepEqual(articleQualityRatchet({posts:[post('legacy.mdx','Поезд уже отправился.')],baseline}).problems,[]);
  assert.deepEqual(articleQualityRatchet({posts:[post('legacy.mdx','Поезд отправился.'),post('new.mdx','Путешественник уже выехал.')],baseline}).problems,[]);
});
test('metadata is excluded; absent journals and all five existing terms are counted',()=>{
  assert.deepEqual(articleQualityRatchet({posts:[post('clean.mdx','Маршрут через Гизу.')],baseline}).stopWords,[]);
  const result=articleQualityRatchet({posts:[post('new.mdx','Просто очень достаточно уже ведь',false)],baseline});
  assert.deepEqual(result.noJournal,['new.mdx']);assert.deepEqual(result.stopWords,['new.mdx']);assert.equal(result.problems.length,1);
});
