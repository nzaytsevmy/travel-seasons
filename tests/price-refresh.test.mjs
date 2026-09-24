import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fetchAirportCityCodes, fetchCheap, refreshPrices} from '../scripts/price-refresh.mjs';
import {freshPrices} from '../src/data/price-freshness.js';

const response = (status, body) => new Response(JSON.stringify(body), {status});
const valid = price => response(200, {success:true, data:{AAA:{'0':{price}}}});
const opts = {token:'fixture', timeoutMs:5, sleep:async()=>{}, random:()=>0};
test('справочник: код аэропорта связан с городом; повреждение и таймаут останавливают обновление', async () => {
  const codes=await fetchAirportCityCodes({...opts,fetchImpl:async(url,options)=>{
    assert.equal(String(url),'https://api.travelpayouts.com/data/en/airports.json');
    assert.equal(options.headers['X-Access-Token'],'fixture');
    return response(200,[{code:'KNO',city_code:'MES'},{code:'ICN',city_code:'SEL'},{code:'SYD',city_code:'SYD'}]);
  }});
  assert.equal(codes.get('KNO'),'MES');
  assert.equal(codes.get('ICN'),'SEL');
  assert.equal(codes.get('SYD'),'SYD');
  for (const make of [()=>response(503,{}),()=>response(401,{}),()=>new Response('{'),
    ()=>response(200,{}),()=>response(200,[]),()=>response(200,[{code:'KNO'}]),
    ()=>response(200,[{code:'KNO',city_code:'MES'},{code:'KNO',city_code:'DOH'}])]) {
    await assert.rejects(fetchAirportCityCodes({...opts,fetchImpl:async()=>make()}),/Справочник аэропортов.*прежний файл сохранён/);
  }
  await assert.rejects(fetchAirportCityCodes({...opts,fetchImpl:(_url,{signal})=>new Promise((_,reject)=>
    signal.addEventListener('abort',()=>reject(signal.reason)))}),/Справочник аэропортов/);
});

test('ответ с кодом города принимается только для аэропорта из справочника', async () => {
  const airportCityCodes=new Map([['KNO','MES'],['ICN','SEL']]);
  for (const [destination, city, price] of [['KNO','MES',48500],['ICN','SEL',35000]]) {
    let request;
    const result=await fetchCheap(destination,'2026-09',{...opts,airportCityCodes,fetchImpl:async(url,options)=>{
      request={url:new URL(url),headers:options.headers};
      return response(200,{success:true,data:{[city]:{'1':{price},'2':{price:price+1000}}}});
    }});
    assert.deepEqual(result,{status:'found',price});
    assert.equal(request.url.searchParams.get('destination'),city);
    assert.equal(request.url.searchParams.has('token'),false);
    assert.equal(request.headers['X-Access-Token'],'fixture');
  }
  for (const data of [{DOH:{'0':{price:100}}},{MES:{'0':{price:100}},DOH:{'0':{price:1}}},
    {MES:{'0':{price:'bad'}}},{MES:[]}]) {
    assert.equal((await fetchCheap('KNO','2026-09',{...opts,airportCityCodes,
      fetchImpl:async()=>response(200,{success:true,data})})).status,'schema_error');
  }
  assert.equal((await fetchCheap('KNO','2026-09',{...opts,
    fetchImpl:async()=>response(200,{success:true,data:{MES:{'0':{price:100}}}})})).status,'schema_error');
});

test('запрос использует код города, когда поставщик отвергает прежний код аэропорта', async () => {
  const result=await fetchCheap('REP','2026-09',{...opts,airportCityCodes:new Map([['REP','SAI']]),
    fetchImpl:async url=>new URL(url).searchParams.get('destination')==='SAI'
      ? response(200,{success:true,data:{SAI:{'1':{price:80000}}}})
      : response(400,{success:false,data:null})});
  assert.deepEqual(result,{status:'found',price:80000});
});

test('цена под кодом города сохраняется под исходным аэропортом; чужой маршрут не перезаписывает файл', async () => {
  const dir=mkdtempSync(join(tmpdir(),'prices-city-')); const out=join(dir,'cache.json');
  const airportCityCodes=new Map([['KNO','MES']]);
  try {
    await refreshPrices({out,iatas:['KNO'],months:['2026-09'],now:new Date('2026-09-24T00:00:00Z'),sleep:async()=>{},
      request:(iata,month)=>fetchCheap(iata,month,{...opts,airportCityCodes,
        fetchImpl:async()=>response(200,{success:true,data:{MES:{'1':{price:48500}}}})})});
    const cache=JSON.parse(readFileSync(out,'utf8'));
    assert.equal(cache.prices.KNO['2026-09'],48500);
    assert.equal(cache.prices.MES,undefined);
    assert.equal(cache.observations.KNO['2026-09'].status,'found');
    const before=readFileSync(out,'utf8');
    await assert.rejects(refreshPrices({out,iatas:['KNO'],months:['2026-09'],sleep:async()=>{},
      request:(iata,month)=>fetchCheap(iata,month,{...opts,airportCityCodes,
        fetchImpl:async()=>response(200,{success:true,data:{DOH:{'1':{price:100}}}})})}),/schema_error: KNO 2026-09/);
    assert.equal(readFileSync(out,'utf8'),before);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('регион без аэропорта не отправляет destination=null; ошибочный код не пропускается молча', async () => {
  const dir=mkdtempSync(join(tmpdir(),'prices-destinations-')); const out=join(dir,'cache.json');
  const requested=[];
  try {
    const cache=await refreshPrices({out,iatas:[null,'AER',undefined,'AER'],months:['2026-09'],sleep:async()=>{},
      request:async iata=>{
        assert.equal(iata,'AER');
        requested.push(iata);
        return {status:'found',price:10000};
      }});
    assert.deepEqual(requested,['AER']);
    assert.deepEqual(Object.keys(cache.prices),['AER']);
    const before=readFileSync(out,'utf8');
    await assert.rejects(refreshPrices({out,iatas:['null'],months:['2026-09'],sleep:async()=>{},
      request:async()=>assert.fail('invalid IATA must fail before a request')}),/Некорректный код направления/);
    assert.equal(readFileSync(out,'utf8'),before);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

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
