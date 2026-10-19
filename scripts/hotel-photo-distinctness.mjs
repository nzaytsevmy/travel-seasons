import { fileURLToPath } from 'node:url';

// A tiny colour fingerprint detects another encoding of the same frame even
// when its URL, dimensions and byte hash changed. Original files stay untouched.
export async function photoFingerprint(input) {
  const {default:sharp}=await import('sharp');
  return sharp(input instanceof URL?fileURLToPath(input):input,{limitInputPixels:40_000_000,sequentialRead:true}).rotate()
    .resize(32,32,{fit:'fill'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
}

export function photoFingerprintDistance(a,b) {
  if(a.length!==32*32*3||b.length!==a.length)throw new Error('Invalid photo fingerprint');
  let direct=0,mirrored=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)for(let c=0;c<3;c++){
    const i=(y*32+x)*3+c;
    direct+=Math.abs(a[i]-b[i]);
    mirrored+=Math.abs(a[i]-b[(y*32+31-x)*3+c]);
  }
  return Math.min(direct,mirrored)/a.length;
}
