import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('Hotel recovery runs in the existing CI, with original artifacts');
await import('./hotel-photo-recovery-plan.mjs');
const input=await fs.readFile('scripts/fixtures/hotel-photo-recovery.json');
const manifest=JSON.parse(input);
if(manifest.version!==1||!Array.isArray(manifest.plan?.rows)||!Array.isArray(manifest.slots)||!Array.isArray(manifest.accepted?.selected))throw Error('Incomplete native-photo recovery manifest');
for(const[path,expected]of Object.entries(manifest.sourceCatalogs)){
 if(!['src/data/hotel-galleries.json','src/data/hotel-photo-credits.json'].includes(path))throw Error('Unexpected source catalog');
 if(createHash('sha256').update(await fs.readFile(path)).digest('hex')!==expected)throw Error(`Recovery source catalog changed: ${path}`);
}
const slots=new Map(manifest.slots.map(r=>[r.image,r]));
for(const row of manifest.plan.rows){
 const slot=slots.get(row.image);
 if(!slot||slot.country!==row.country||slot.hotelId!==row.hotelId||slot.target!==row.target||row.propertyMid!==row.target.match(/\/mid(\d+)\//)?.[1])throw Error('Recovery property mismatch');
 if(!/^[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(row.image)||!Number.isInteger(row.requiredWidth)||!Number.isInteger(row.requiredHeight)||row.requiredWidth<1||row.requiredHeight<1)throw Error('Invalid recovery slot');
 for(const candidate of row.candidates){
  const u=new URL(candidate.sourcePhoto);
  if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.hostname==='localhost'||/^\d+(?:\.\d+){3}$/.test(u.hostname))throw Error('Only public HTTPS photo origins are allowed');
 }
}
await fs.mkdir('work',{recursive:true});
for(const[name,value]of Object.entries({'hotel-native-selection-plan.json':manifest.slots,'hotel-native-replacement-plan.json':manifest.plan,'hotel-native-final-selection.json':manifest.accepted,'hotel-native-visual-rejections.json':manifest.rejections}))await fs.writeFile(`work/${name}`,JSON.stringify(value));
const out='artifacts/hotel-materials/photos';await fs.mkdir(out,{recursive:true});
await fs.writeFile('artifacts/hotel-materials/recovery-input.json',JSON.stringify({sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputSha256:createHash('sha256').update(input).digest('hex'),generatedAt:manifest.generatedAt,slots:manifest.plan.rows.length,sourceCatalogs:manifest.sourceCatalogs,status:'FETCH_ONLY_SCENE_REVIEW_AND_COMPLETE_RELEASE_GATES_STILL_REQUIRED'},null,2));
process.env.HOTEL_RECOVERY_OUTPUT=out;
await import('./hotel-photo-recovery-fetch.mjs');
