import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { photoFingerprint, photoFingerprintDistance } from '../scripts/hotel-photo-distinctness.mjs';

test('different JPEG sizes of the same photograph are not distinct gallery frames', async () => {
  const pixels=Buffer.alloc(64*48*3);
  for(let y=0;y<48;y++)for(let x=0;x<64;x++)for(let c=0;c<3;c++)
    pixels[(y*64+x)*3+c]=(x*3+y*5+c*53)%256;
  const encode=(width,quality)=>sharp(pixels,{raw:{width:64,height:48,channels:3}}).resize(width).jpeg({quality}).toBuffer();
  const small=await encode(640,80),large=await encode(1600,96);
  assert.notDeepEqual(small,large);
  assert.ok(photoFingerprintDistance(await photoFingerprint(small),await photoFingerprint(large))<2);
});

test('a different image does not pass the duplicate-photo threshold', async () => {
  const a=await sharp({create:{width:100,height:80,channels:3,background:'#995122'}}).jpeg().toBuffer();
  const b=await sharp({create:{width:100,height:80,channels:3,background:'#224499'}}).jpeg().toBuffer();
  assert.ok(photoFingerprintDistance(await photoFingerprint(a),await photoFingerprint(b))>2);
});
