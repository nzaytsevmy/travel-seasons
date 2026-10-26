import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {sealObservation,openObservation} from '../scripts/private-observation.mjs';

test('public report envelope decrypts only with the owner key and rejects tampering',()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const report={humanClicks:123,confirmedCommissionRub:456,status:'observing'};
  const envelope=sealObservation(report,publicKey);
  assert.deepEqual(openObservation(envelope,privateKey),report);
  assert.ok(!JSON.stringify(envelope).includes('humanClicks'));
  const data=Buffer.from(envelope.data,'base64');data[0]^=1;
  assert.throws(()=>openObservation({...envelope,data:data.toString('base64')},privateKey));
  const other=generateKeyPairSync('rsa',{modulusLength:2048});
  assert.throws(()=>openObservation(envelope,other.privateKey));
});
