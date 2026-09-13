import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fetchCheap, refreshPrices} from '../scripts/price-refresh.mjs';
import {freshPrices} from '../src/data/price-freshness.js';

const response = (status, body) => new Response(JSON.stringify(body), {status});
const valid = price => response(200, {success:true, data:{AAA:{'0':{price}}}});
const opts = {token:'fixture', timeoutMs:5, sleep:async()=>{}, random:()=>0};
test('HTTP: доступ, лимит, таймаут, JSON, пустой ответ и восстановление различимы', async () => {
  for (const [make, status, calls] of [
    [()=>response(401, {}), 'auth_error', 1],
    [()=>response(429, {}), 'temporary_error', 3],
    [()=>response(200, {success:true,data:{}}), 'empty', 1],
    [()=>new Response('{'), 'schema_error', 1],
    [()=>response(200,{success:true,data:{AAA:{'0':{price:'bad'}}}}), 'schema_error', 1],
  ]) {
    let count=0;
    const result=await fetchCheap('AAA','2026-09',{...opts,fetchImpl:async()=>{count++;return make();}});
    assert.equal(result.status,status); assert.equal(count,calls);
  }
  const timeout=await fetchCheap('AAA','2026-09',{...opts,fetchImpl:(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))});
  assert.equal(timeout.status,'temporary_error');
  const bodyTimeout=await fetchCheap('AAA','2026-09',{...opts,fetchImpl:async(_url,{signal})=>({ok:true,status:200,
    json:()=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))})});
  assert.equal(bodyTimeout.status,'temporary_error');
  let attempt=0;
  const recovered=await fetchCheap('AAA','2026-09',{...opts,fetchImpl:async()=>++attempt===1?response(503,{}):valid(100)});
  assert.equal(recovered.price,100); assert.equal(attempt,2);
});

test('реальный файл: сбой не обновляет дату старой цены; пустой ответ очищает ячейку; TTL действует без обновлятора', async () => {
  const dir=mkdtempSync(join(tmpdir(),'prices-')); const out=join(dir,'cache.json');
  const previous={updatedAt:'2026-09-12T00:00:00.000Z',prices:{AAA:{'2026-09':100,'2026-10':200,'2026-11':300}}};
  try {
    writeFileSync(out,JSON.stringify(previous));
    await refreshPrices({out,iatas:['AAA'],months:['2026-09','2026-10','2026-11'],now:new Date('2026-09-13T00:00:00Z'),
      sleep:async()=>{}, request:async(_iata,month)=>month==='2026-09'?{status:'temporary_error'}:month==='2026-10'?{status:'empty'}:{status:'found',price:330}});
    const cache=JSON.parse(readFileSync(out,'utf8'));
    assert.equal(cache.prices.AAA['2026-09'],100);
    assert.equal(cache.observations.AAA['2026-09'].observedAt,previous.updatedAt);
    assert.equal(cache.prices.AAA['2026-10'],null);
    assert.equal(cache.prices.AAA['2026-11'],330);
    const later=freshPrices(cache,'AAA',new Date('2026-09-15T01:00:00Z'));
    assert.equal(later['2026-09'],null); assert.equal(later['2026-11'],330);
    const before=readFileSync(out,'utf8');
    await assert.rejects(refreshPrices({out,iatas:['AAA'],months:['2026-09'],request:async()=>({status:'auth_error'}),sleep:async()=>{}}),/auth_error/);
    assert.equal(readFileSync(out,'utf8'),before);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
