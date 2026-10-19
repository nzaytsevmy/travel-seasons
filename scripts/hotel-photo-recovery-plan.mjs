import fs from'node:fs/promises';import{createHash}from'node:crypto';
import{selectNativePhotoSources,photoSourceIdentity,publishedPhotoOriginalUrl}from'./hotel-native-source.mjs';
const selection=JSON.parse(await fs.readFile('scripts/fixtures/hotel-photo-recovery/hotel-native-final-selection.json'));
const slots=JSON.parse(await fs.readFile('scripts/fixtures/hotel-photo-recovery/hotel-native-selection-plan.json'));
const credits=JSON.parse(await fs.readFile('src/data/hotel-photo-credits.json'));
const rejections=JSON.parse(await fs.readFile('scripts/fixtures/hotel-photo-recovery/hotel-native-visual-rejections.json'));
const rejected=new Set(Object.values(rejections).map(r=>photoSourceIdentity(r.sourcePhoto)));
const reserved=new Set(selection.selected.map(r=>`${r.country}/${r.hotelId}:${photoSourceIdentity(r.sourcePhoto)}`));
const needed=new Set(selection.holds.filter(r=>r.reason!=='AWAITING_MANUAL_SCENE_REVIEW').map(r=>r.image));
async function optional(path,fallback){try{return JSON.parse(await fs.readFile(path));}catch(e){if(e.code!=='ENOENT')throw e;return fallback;}}
const rows=[];
for(const slot of slots.filter(s=>needed.has(s.image))){
 const key=`${slot.country}/${slot.hotelId}`,mid=slot.target.match(/\/mid(\d+)\//)?.[1];
 const metadata=await optional(`scripts/fixtures/hotel-photo-recovery/hotel-property-native/${key}.json`,{});
 const official=await optional(`scripts/fixtures/hotel-photo-recovery/hotel-official-native/${key.replace('/','--')}.json`,{});
 const candidates=[];
 if(metadata.status==='VERIFIED_PROPERTY_METADATA'&&metadata.mid===mid)for(const photo of metadata.photos){
  if(rejected.has(photoSourceIdentity(photo.sourcePhoto))||reserved.has(`${key}:${photoSourceIdentity(photo.sourcePhoto)}`))continue;
  const same=photoSourceIdentity(credits[slot.creditKey]?.sourcePhoto||slot.target)===photoSourceIdentity(photo.sourcePhoto);
  const variants=selectNativePhotoSources(photo,slot.requiredWidth,slot.requiredHeight);
  // This bounded fit profile is independently controlled with a 650x450 source.
  // It never asks for enlargement, even when a property's display metadata is small.
  const url=new URL(photo.sourcePhoto);url.pathname=url.pathname.replace(/^\/t\/[^/]+\//,'/t/2048x2048/');
  for(const variant of variants)candidates.push({...variant,isSamePhoto:same});
  candidates.push({...photo,sourcePhoto:url.href,sourceVariant:'2048x2048',sourcePolicy:'native-safe2048-v1',sourceType:'PUBLISHED_BOUNDED_FIT',isSamePhoto:same});
 }
 if(official.status==='EXTRACTED')for(const photo of official.candidates||[]){
  const native=publishedPhotoOriginalUrl(photo.sourcePhoto);
  for(const sourcePhoto of [...new Set([native,photo.sourcePhoto].filter(Boolean))]){
   if(!URL.canParse(sourcePhoto)||!sourcePhoto.startsWith('https:')||rejected.has(photoSourceIdentity(sourcePhoto))||reserved.has(`${key}:${photoSourceIdentity(sourcePhoto)}`))continue;
   candidates.push({...photo,sourcePhoto,publishedDeliveryUrl:sourcePhoto!==photo.sourcePhoto?photo.sourcePhoto:undefined,sourcePolicy:'native-safe2048-v1',sourceType:photo.sourceType||'OFFICIAL_PUBLISHED_IMAGE',isSamePhoto:false});
  }
 }
 const seen=new Set();rows.push({...slot,propertyMid:mid,status:'NEW_CI_NETWORK_ENVIRONMENT_REQUIRES_NATIVE_BYTES_AND_SCENE_REVIEW',candidates:candidates.sort((a,b)=>Number(b.isSamePhoto)-Number(a.isSamePhoto)).filter(c=>{if(seen.has(c.sourcePhoto))return false;seen.add(c.sourcePhoto);return true;}).slice(0,160)});
}
const sourceCatalogs={};for(const p of ['src/data/hotel-galleries.json','src/data/hotel-photo-credits.json'])sourceCatalogs[p]=createHash('sha256').update(await fs.readFile(p)).digest('hex');
const manifest={version:1,generatedAt:new Date().toISOString(),sourceCatalogs,slots,plan:{rows},accepted:{selected:selection.selected.map(r=>({image:r.image,country:r.country,hotelId:r.hotelId,sourcePhoto:r.sourcePhoto,originalSha256:r.originalSha256}))},rejections};
await fs.writeFile('scripts/fixtures/hotel-photo-recovery.json',JSON.stringify(manifest)+'\n');console.log(JSON.stringify({recoverySlots:rows.length,withCandidates:rows.filter(r=>r.candidates.length).length,bytes:JSON.stringify(manifest).length}));
