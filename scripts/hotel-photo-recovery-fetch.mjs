import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import sharp from 'sharp';
import { curlPhotoRequest } from './hotel-photo-request.mjs';
import { sourceDoesNotEnlarge, selectNativePhotoSources, photoSourceIdentity } from './hotel-native-source.mjs';
sharp.cache(false); sharp.concurrency(2);
const directory = process.env.HOTEL_RECOVERY_OUTPUT;
if(!directory||process.env.GITHUB_ACTIONS!=='true')throw Error('Use the existing hotel-materials CI entry point');
await fs.mkdir(directory, { recursive: true });
const plan = JSON.parse(await fs.readFile('work/hotel-native-replacement-plan.json', 'utf8'));
const argument = name => process.argv.includes(name) ? Number(process.argv[process.argv.indexOf(name) + 1]) : null;
const workers = argument('--workers') || 3;
const limit = argument('--limit') || plan.rows.length;
if (!Number.isInteger(workers) || workers < 1 || workers > 3 || !Number.isInteger(limit) || limit < 1)
  throw new Error('Invalid bounded replacement batch options');
const activeImages = new Set(plan.rows.map(row => row.image));
const slots = JSON.parse(await fs.readFile('work/hotel-native-selection-plan.json', 'utf8'));
const credits = JSON.parse(await fs.readFile('src/data/hotel-photo-credits.json', 'utf8'));
const identity = photoSourceIdentity;
async function optionalJson(path, fallback) {
  try { return JSON.parse(await fs.readFile(path, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; return fallback; }
}
const results = new Map((await optionalJson(`${directory}/receipts.json`, [])).map(row => [row.image, row]));
const networkErrors = new Map(Object.entries(await optionalJson(`${directory}/network-errors.json`, {})));
const observations = new Map(Object.entries(await optionalJson(`${directory}/image-observations.json`, {})));
for(const row of results.values())for(const attempt of row.attempts||[])
  if(['TOO_SMALL','REJECTED_PUBLISHER_PIXEL_ENLARGEMENT'].includes(attempt.result)&&attempt.sourcePhoto)
    observations.set(attempt.sourcePhoto,{result:attempt.result,width:attempt.width,height:attempt.height});
const visualRejections = new Set(Object.values(await optionalJson('work/hotel-native-visual-rejections.json', {}))
  .map(row => identity(row.sourcePhoto)));
const used = new Map(), hashes = new Map();
for (const slot of slots) {
  const key = `${slot.country}/${slot.hotelId}`;
  if (!used.has(key)) { used.set(key, new Set()); hashes.set(key, new Set()); }
  const source = credits[slot.creditKey]?.sourcePhoto;
  if (source) used.get(key).add(identity(source));
}
const originals = await optionalJson('work/hotel-native-originals/receipts.json', []);
const slotByImage = new Map(slots.map(slot => [slot.image, slot]));
for (const row of originals) {
  const slot = slotByImage.get(row.image);
  if (slot && row.originalSha256) hashes.get(`${slot.country}/${slot.hotelId}`).add(row.originalSha256);
}
const accepted=await optionalJson('work/hotel-native-final-selection.json',{selected:[]});
const reserved=new Map();
for(const row of accepted.selected){const slot=slotByImage.get(row.image);if(!slot)throw Error('Accepted photo outside manifest');const key=`${slot.country}/${slot.hotelId}`;used.get(key).add(identity(row.sourcePhoto));hashes.get(key).add(row.originalSha256);reserved.set(`${key}:${identity(row.sourcePhoto)}`,row.image);}
const controls=[];
for(const fixture of [
 {url:'https://cdn.ostrovok.ru/t/2048x2048/content/18/b1/18b15c224785d44399ebaa858f58dd91687c2f5c.png',width:650,height:450},
 {url:'https://cdn.ostrovok.ru/t/2048x2048/content/3a/86/3a8652717e83b4dd97215cb5a9036073c7f4816f.JPEG',width:2000,height:1333},
]){
 const bytes=await(await curlPhotoRequest(fixture.url)).arrayBuffer();
 const meta=await sharp(bytes).metadata();
 if(meta.width!==fixture.width||meta.height!==fixture.height)throw Error('No-upscale PNG/JPEG control failed');
 controls.push({fixture:fixture.url,width:meta.width,height:meta.height,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await fs.writeFile(`${directory}/source-policy.json`,JSON.stringify({sourcePolicy:'publisher-native-bounds-v2',controlPolicy:'native-safe2048-v1',checkedAt:new Date().toISOString(),...controls[0],controls}));
let persistence = Promise.resolve(), processed = 0;
async function save(row) {
  results.set(row.image, row);
  const snapshot = JSON.stringify([...results.values()], null, 2);
  const errors = JSON.stringify(Object.fromEntries(networkErrors));
  const imageObservations=JSON.stringify(Object.fromEntries(observations));
  persistence = persistence.then(async () => {
    await fs.writeFile(`${directory}/receipts.json.tmp`, snapshot);
    await fs.rename(`${directory}/receipts.json.tmp`, `${directory}/receipts.json`);
    await fs.writeFile(`${directory}/network-errors.json`, errors);
    await fs.writeFile(`${directory}/image-observations.json`,imageObservations);
  });
  await persistence;
  processed++;
  if (processed % 20 === 0) console.log(JSON.stringify({ replacementsProcessed: processed, planned: plan.rows.length }));
}
async function digestFile(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}
const groups = new Map();
for (const row of plan.rows.slice(0, limit)) {
  const key = `${row.country}/${row.hotelId}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
async function one(slot) {
  const key = `${slot.country}/${slot.hotelId}`, previous = results.get(slot.image);
  // Expand delivery alternatives only for the two active slots, rather than
  // retaining thousands of repeated image descriptors in the light-job heap.
  const candidates = slot.candidates.flatMap(candidate => ['OFFICIAL_PUBLISHED_IMAGE','PUBLIC_HOTEL_GALLERY_IMAGE','PUBLISHED_BOUNDED_FIT'].includes(candidate.sourceType)
    ? [candidate] : selectNativePhotoSources(candidate, slot.requiredWidth, slot.requiredHeight))
    .filter(candidate=>!reserved.has(`${key}:${identity(candidate.sourcePhoto)}`));
  const previousEvidence = previous?.sourcePhoto && candidates.find(candidate => identity(candidate.sourcePhoto) === identity(previous.sourcePhoto));
  if (previous?.status === 'CANDIDATE_READY' &&
    (!used.get(key).has(identity(previous.sourcePhoto)) || previous.isSamePhoto) &&
    (!hashes.get(key).has(previous.originalSha256) || previous.isSamePhoto) &&
    !visualRejections.has(identity(previous.sourcePhoto)) && previous.width >= slot.requiredWidth && previous.height >= slot.requiredHeight &&
    previousEvidence && sourceDoesNotEnlarge(previous) &&
    (['OFFICIAL_PUBLISHED_IMAGE','PUBLIC_HOTEL_GALLERY_IMAGE','PUBLISHED_BOUNDED_FIT'].includes(previousEvidence.sourceType) ||
      previous.width <= previousEvidence.publisherWidth && previous.height <= previousEvidence.publisherHeight)) {
    if (await digestFile(`${directory}/${previous.asset}`) !== previous.originalSha256) throw new Error('Candidate bytes changed');
    used.get(key).add(identity(previous.sourcePhoto)); hashes.get(key).add(previous.originalSha256);
    await save(previous); return;
  }
  const attempts = [];
  for (const candidate of candidates) {
    const url = candidate.sourcePhoto;
    if (visualRejections.has(identity(url))) continue;
    const seen=observations.get(url);
    if(seen&&(seen.result==='REJECTED_PUBLISHER_PIXEL_ENLARGEMENT'||seen.width<slot.requiredWidth||seen.height<slot.requiredHeight))continue;
    if (used.get(key).has(identity(url)) && !candidate.isSamePhoto || (networkErrors.get(url)?.attempts || 0) >= 2) continue;
    const temporary = `${directory}/${slot.image}.original.tmp`;
    await fs.mkdir(temporary.slice(0, temporary.lastIndexOf('/')), { recursive: true });
    try {
      const response = await curlPhotoRequest(url);
      const handle = await fs.open(temporary, 'w');
      let bytes = 0;
      try {
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024) throw new Error('Candidate exceeds 32 MiB');
          let offset = 0;
          while (offset < chunk.length) {
            const written = await handle.write(chunk, offset, chunk.length - offset);
            if (!written.bytesWritten) throw new Error('No progress writing original');
            offset += written.bytesWritten;
          }
        }
      } finally { await handle.close(); }
      const meta = await sharp(temporary, { limitInputPixels: 40_000_000 }).metadata();
      const rotated = [5, 6, 7, 8].includes(meta.orientation);
      const width = rotated ? meta.height : meta.width, height = rotated ? meta.width : meta.height;
      if (width < slot.requiredWidth || height < slot.requiredHeight) {
        observations.set(url,{result:'TOO_SMALL',width,height,checkedAt:new Date().toISOString()});
        attempts.push({ sourcePhoto: url, result: 'TOO_SMALL', width, height }); continue;
      }
      if (!sourceDoesNotEnlarge({ ...candidate, width, height })) {
        observations.set(url,{result:'REJECTED_PUBLISHER_PIXEL_ENLARGEMENT',width,height,checkedAt:new Date().toISOString()});
        attempts.push({ sourcePhoto: url, result: 'REJECTED_PUBLISHER_PIXEL_ENLARGEMENT', width, height }); continue;
      }
      const sha256 = await digestFile(temporary);
      if (hashes.get(key).has(sha256)) { attempts.push({ sourcePhoto: url, result: 'DUPLICATE_BYTES' }); continue; }
      const extension = { jpeg: 'jpg', png: 'png', webp: 'webp' }[meta.format];
      if (!extension) throw new Error('Unsupported original candidate format');
      const asset = slot.image.replace(/\.[^.]+$/, `.${extension}`);
      await fs.rename(temporary, `${directory}/${asset}`);
      used.get(key).add(identity(url)); hashes.get(key).add(sha256);
      await save({ image: slot.image, asset, creditKey: slot.creditKey, country: slot.country,
        hotelId: slot.hotelId, hotelName: slot.hotelName, propertyMid: slot.propertyMid,
        sourcePolicy: candidate.sourcePolicy || 'native-safe2048-v1', sourcePhoto: url,
        creditSource: candidate.sourcePage || slot.target, sourceType: candidate.sourceType || 'PROPERTY_IMAGE_METADATA',
        sourcePage: candidate.sourcePage, observedIn: candidate.observedIn,
        sourceVariant: candidate.sourceVariant, publisherWidth: candidate.publisherWidth, publisherHeight: candidate.publisherHeight,
        width, height, bytes, originalSha256: sha256, originalWidth: meta.width,
        originalHeight: meta.height, orientation: meta.orientation || 1,
        sourceCategory: candidate.category, isSamePhoto: Boolean(candidate.isSamePhoto), status: 'CANDIDATE_READY',
        visualReview: candidate.isSamePhoto ? 'UNCHANGED_SCENE' : 'PENDING',
        fetchedAt: new Date().toISOString(), attempts });
      return;
    } catch (error) {
      networkErrors.set(url, { attempts: (networkErrors.get(url)?.attempts || 0) + 1, error: error.message });
      attempts.push({ sourcePhoto: url, result: 'HOLD', error: error.message });
    } finally { await fs.rm(temporary, { force: true }); }
  }
  await save({ image: slot.image, country: slot.country, hotelId: slot.hotelId,
    status: 'HOLD_NO_QUALIFIED_CANDIDATE', reason: slot.status, attempts });
}
const queue = [...groups.values()]; let cursor = 0;
await Promise.all(Array.from({ length: workers }, async () => {
  while (cursor < queue.length) { const group = queue[cursor++]; for (const slot of group) await one(slot); }
}));
await persistence;
const current = [...results.values()].filter(row => activeImages.has(row.image));
console.log(JSON.stringify({ planned: plan.rows.length, processedThisPass: processed,
  candidatesReady: current.filter(row => row.status === 'CANDIDATE_READY').length,
  holds: current.filter(row => row.status !== 'CANDIDATE_READY').length,
  unprocessed: plan.rows.length - current.length }));
