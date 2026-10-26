#!/usr/bin/env node
// Public Actions logs may contain only the encrypted envelope. The owner's key
// is kept outside this public repository and is never passed to GitHub Actions.
import { createCipheriv,createDecipheriv,publicEncrypt,privateDecrypt,randomBytes,constants } from 'node:crypto';
import { readFileSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const aad=Buffer.from('traveltribe-sputnik-observation-v1');
const options=key=>({key,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING});

export function sealObservation(value,publicKey){
  const key=randomBytes(32),iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return {version:1,algorithm:'RSA-OAEP-SHA256+A256GCM',
    key:publicEncrypt(options(publicKey),key).toString('base64'),
    iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')};
}

export function openObservation(envelope,privateKey){
  if(envelope.version!==1 || envelope.algorithm!=='RSA-OAEP-SHA256+A256GCM')throw new Error('Unknown observation envelope');
  const key=privateDecrypt(options(privateKey),Buffer.from(envelope.key,'base64'));
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
  decipher.setAAD(aad);decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8'));
}

if(process.argv[1] && resolve(process.argv[1])===new URL(import.meta.url).pathname){
  const [mode,inputFile,keyFile,outputFile]=process.argv.slice(2);
  if(!['seal','open'].includes(mode)||!inputFile||!keyFile||!outputFile)throw new Error('Usage: private-observation.mjs seal|open input.json key.pem output.json');
  const input=JSON.parse(readFileSync(inputFile,'utf8')),key=readFileSync(keyFile,'utf8');
  const output=mode==='seal'?sealObservation(input,key):openObservation(input,key);
  writeFileSync(outputFile,JSON.stringify(output)+'\n',{mode:0o600});
  if(mode==='seal')console.log('SPUTNIK_ENCRYPTED_REPORT='+Buffer.from(JSON.stringify(output)).toString('base64'));
}
