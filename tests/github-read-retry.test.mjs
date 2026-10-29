import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retryGitHubRead} from '../scripts/github-read-retry.mjs';
test('repeated service errors stop after four reads and bounded backoff',async()=>{
 let calls=0;const delays=[];const error=Object.assign(new Error('503'),{status:503});
 await assert.rejects(retryGitHubRead(async()=>{calls++;throw error;},{sleep:async ms=>delays.push(ms)}),e=>e===error);
 assert.equal(calls,4);assert.deepEqual(delays,[2000,4000,8000]);
});
test('authentication, permission, quota, input and unknown errors fail immediately',async()=>{
 for(const status of [400,401,403,404,422,429,undefined]){
  let calls=0;await assert.rejects(retryGitHubRead(async()=>{calls++;throw Object.assign(new Error('terminal'),{status});},{sleep:async()=>assert.fail('terminal error retried')}));assert.equal(calls,1);
 }
});
test('a connection reset retries only the read and returns its successful value',async()=>{
 let calls=0;const result=await retryGitHubRead(async()=>{if(++calls===1)throw Object.assign(new Error('reset'),{code:'ECONNRESET'});return {complete:true};},{sleep:async()=>{}});
 assert.equal(calls,2);assert.deepEqual(result,{complete:true});
});
