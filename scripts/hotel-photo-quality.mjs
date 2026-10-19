import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { parse } from 'parse5';
import { curlPhotoRequest } from './hotel-photo-request.mjs';
import { readyHotelCollections, hotelGallery, hotelHubPicks, hotelGuideHubs } from '../src/data/hotels.js';

export const PHOTO_VIEWPORTS = [402, 768, 1024, 1280, 1440, 1920];
export function coverDensity(width, height, frameWidth, frameHeight) {
  return Math.min(width / frameWidth, height / frameHeight);
}
export function originalPhotoUrl(value) {
  const url = new URL(value);
  if (['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(url.hostname)) {
    // The 2600x1240, 1920x and x1920 presets force dimensions and can upscale.
    // 2048x2048 was checked against a native 650x450 publisher photograph.
    url.pathname = url.pathname.replace(/^\/t\/[^/]+\//, '/t/2048x2048/');
  }
  return url.href;
}
export function galleryFrame(viewport, lead) {
  const padding = Math.min(41.6, Math.max(17.6, viewport * .03));
  const inner = Math.min(1280, viewport) - 2 * padding;
  const column = lead || viewport < 768 ? inner : (inner - 32) * 1.45 / 2.45;
  const width = lead ? Math.min(1024, column * .92) : column * .92;
  return { width, height: width * (lead && viewport >= 768 ? 9 / 16 : 3 / 4) };
}
export function photoManifest() {
  return readyHotelCollections().flatMap(([country, collection]) => collection.hotels.flatMap((hotel, index) =>
    hotelGallery(country, hotel).map(photo => ({ country, hotelId: hotel.id, hotelName: hotel.name,
      target: hotel.booking.target, lead: index === 0, ...photo }))));
}
export function photoFrames(photo) {
  const frames = PHOTO_VIEWPORTS.map(viewport => ({ viewport, ...galleryFrame(viewport, photo.lead) }));
  for (const hub of hotelGuideHubs(photo.country)) {
    const collection = readyHotelCollections().find(([country]) => country === photo.country)[1];
    const picks = hotelHubPicks(hub.slug, collection);
    const pickIndex = picks.findIndex(hotel => hotel.id === photo.hotelId && hotel.image === photo.image);
    if (pickIndex < 0) continue;
    for (const viewport of PHOTO_VIEWPORTS) {
      const padding = Math.min(41.6, Math.max(17.6, viewport * .03));
      const inner = Math.min(1280, viewport) - 2 * padding;
      const width = viewport < 768 ? inner : (inner - 32) * (pickIndex === 0 ? 1.8 : 1) / 2.8;
      frames.push({ viewport, width, height: width * (pickIndex === 0 || viewport < 768 ? .75 : 9 / 16) });
    }
  }
  return frames;
}
export function photoRequirements(photo) {
  const frames = photoFrames(photo);
  return {
    requiredWidth: Math.ceil(Math.max(...frames.map(frame => frame.width)) * 2),
    requiredHeight: Math.ceil(Math.max(...frames.map(frame => frame.height)) * 2),
  };
}
export async function auditPhotos() {
  sharp.cache(false);
  sharp.concurrency(2);
  const rows = [];
  for (const photo of photoManifest()) {
    const file = `src/assets/hotels/${photo.image}`;
    const meta = await sharp(file).metadata();
    const rotated = [5, 6, 7, 8].includes(meta.orientation);
    const nativeWidth = rotated ? meta.height : meta.width;
    const nativeHeight = rotated ? meta.width : meta.height;
    const frames = photoFrames(photo);
    const density = Math.min(...frames.map(frame => coverDensity(nativeWidth, nativeHeight, frame.width, frame.height)));
    rows.push({ ...photo, width: nativeWidth, height: nativeHeight,
      ...photoRequirements(photo), density, passed: density >= 2 });
  }
  return { checkedAt: new Date().toISOString(), photos: rows.length,
    failed: rows.filter(row => !row.passed).length, rows };
}

async function refreshPhotos(output) {
  const request = process.argv.includes('--curl') ? curlPhotoRequest : fetch;
  sharp.cache(false); sharp.concurrency(2);
  const credits = JSON.parse(await fs.readFile('src/data/hotel-photo-credits.json', 'utf8'));
  // Downloading originals does not require decoding or re-auditing old thumbnails.
  const manifest = photoManifest();
  const baseline = { photos: manifest.length, rows: manifest };
  const receipts = [];
  await fs.mkdir(output, { recursive: true });
  const fixture = 'https://cdn.ostrovok.ru/t/2048x2048/content/18/b1/18b15c224785d44399ebaa858f58dd91687c2f5c.png';
  const fixtureResponse = await request(fixture, { signal: AbortSignal.timeout(30_000) });
  if (!fixtureResponse.ok) throw new Error(`No-upscale source contract unavailable: HTTP ${fixtureResponse.status}`);
  const fixtureBytes = Buffer.from(await fixtureResponse.arrayBuffer());
  const fixtureMeta = await sharp(fixtureBytes).metadata();
  if (fixtureMeta.width !== 650 || fixtureMeta.height !== 450) throw new Error('Publisher preset enlarged the known native photograph');
  const sourcePolicy = 'native-safe2048-v1';
  await fs.writeFile(`${output}/source-policy.json`, JSON.stringify({ sourcePolicy, fixture,
    checkedAt: new Date().toISOString(), width: fixtureMeta.width, height: fixtureMeta.height,
    sha256: createHash('sha256').update(fixtureBytes).digest('hex') }, null, 2));
  let previous = [];
  try { previous = JSON.parse(await fs.readFile(`${output}/receipts.json`, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const saved = new Map(previous.map(row => [row.image, row]));
  if (previous.length) await fs.copyFile(`${output}/receipts.json`, `${output}/receipts.before-resume.json`);
  let checkpoint = Promise.resolve();
  async function refreshOne(photo) {
    const credit = credits[photo.creditKey];
    const existing = saved.get(photo.image);
    const requestKey = JSON.stringify([sourcePolicy, credit?.source, credit?.sourcePhoto]);
    const sameRequest = existing?.requestKey === requestKey;
    if (sameRequest && existing.status === 'HOLD' && existing.attempts >= 2) {
      receipts.push(existing); return;
    }
    const attempts = sameRequest ? existing.attempts + 1 :
      existing?.status === 'HOLD' && !existing.requestKey ? 2 : 1;
    const hold = fields => receipts.push({ image: photo.image, requestKey, attempts,
      status: 'HOLD', ...fields });
    if (existing?.status === 'FETCHED_ORIGINAL' && existing.sourcePolicy === sourcePolicy && existing.asset && existing.creditSource === credit?.source &&
      (!credit?.sourcePhoto || existing.sourcePhoto === originalPhotoUrl(credit.sourcePhoto))) {
      try {
        const hash = createHash('sha256');
        for await (const chunk of createReadStream(`${output}/${existing.asset}`)) hash.update(chunk);
        if (hash.digest('hex') === existing.originalSha256) {
          receipts.push(existing); return;
        }
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    let source = credit?.sourcePhoto;
    if (!source && new URL(credit?.source || 'https://invalid.example').hostname === 'www.flickr.com') {
      try {
        const response = await request(credit.source, { signal: AbortSignal.timeout(30_000),
          headers: { 'User-Agent': 'TravelTribePhotoQA/1.0 (https://traveltribe.ru/)' } });
        if (!response.ok) throw new Error(`Flickr HTTP ${response.status}`);
        const decoder = new TextDecoder(); let html = ''; let length = 0;
        for await (const chunk of response.body) {
          length += chunk.length;
          if (length > 256 * 1024) throw new Error('Flickr public image metadata exceeds 256 KiB');
          html += decoder.decode(chunk, { stream: true });
          if (/<\/head\s*>/i.test(html)) break;
        }
        html += decoder.decode();
        function find(node) {
          if (node.tagName === 'meta' && node.attrs?.some(a => a.name === 'property' && a.value === 'og:image'))
            return node.attrs.find(a => a.name === 'content')?.value;
          for (const child of node.childNodes || []) { const found = find(child); if (found) return found; }
        }
        source = find(parse(html));
        if (!source || new URL(source).hostname !== 'live.staticflickr.com') throw new Error('No public publisher image');
      } catch (error) { hold({ error: error.message }); return; }
    }
    if (!source && credit?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
      const api = new URL('https://commons.wikimedia.org/w/api.php');
      api.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: '3000',
        titles: decodeURIComponent(new URL(credit.source).pathname.slice('/wiki/'.length)) });
      try {
        const response = await request(api, { signal: AbortSignal.timeout(30_000),
          headers: { 'User-Agent': 'TravelTribePhotoQA/1.0 (https://traveltribe.ru/)' } });
        if (!response.ok) throw new Error(`Commons HTTP ${response.status}`);
        const data = await response.json();
        const info = Object.values(data.query?.pages || {})[0]?.imageinfo?.[0];
        source = info?.thumburl || info?.url;
      } catch (error) { hold({ error: error.message }); return; }
    }
    if (!source) { receipts.push({ image: photo.image, status: 'MISSING_ORIGINAL_URL' }); return; }
    const url = originalPhotoUrl(source);
    const temporary = `${output}/${photo.image}.original`;
    try {
      await fs.mkdir(temporary.slice(0, temporary.lastIndexOf('/')), { recursive: true });
      const response = await request(url, { signal: AbortSignal.timeout(30_000),
        headers: { 'User-Agent': 'TravelTribePhotoQA/1.0 (https://traveltribe.ru/)' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const digest = createHash('sha256'); let bytes = 0;
      const handle = await fs.open(temporary, 'w');
      try {
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024) throw new Error('Image exceeds 32 MiB');
          digest.update(chunk);
          let offset = 0;
          while (offset < chunk.length) {
            const written = await handle.write(chunk, offset, chunk.length - offset);
            if (!written.bytesWritten) throw new Error('Original image write made no progress');
            offset += written.bytesWritten;
          }
        }
      } finally { await handle.close(); }
      const metadata = await sharp(temporary, { limitInputPixels: 40_000_000 }).metadata();
      const extension = { jpeg: 'jpg', png: 'png', webp: 'webp' }[metadata.format];
      if (!extension) throw new Error(`Unsupported original format: ${metadata.format}`);
      const asset = photo.image.replace(/\.[^.]+$/, `.${extension}`);
      // Preserve received bytes. The only local lossy encoding is the final
      // responsive WebP at quality 88 in Astro, never an intermediate master.
      await fs.rename(temporary, `${output}/${asset}`);
      const rotated = [5, 6, 7, 8].includes(metadata.orientation);
      receipts.push({ image: photo.image, asset, creditKey: photo.creditKey, sourcePolicy, requestKey, attempts, sourcePhoto: url, creditSource: credit.source,
        width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height,
        orientation: metadata.orientation || 1, originalWidth: metadata.width,
        originalHeight: metadata.height, originalSha256: digest.digest('hex'),
        bytes, fetchedAt: new Date().toISOString(), status: 'FETCHED_ORIGINAL' });
    } catch (error) {
      hold({ sourcePhoto: url, error: error.message });
    } finally {
      await fs.rm(temporary, { force: true });
      }
    if (receipts.length % 25 === 0) console.log(JSON.stringify({ processed: receipts.length, total: baseline.photos }));
  }
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < baseline.rows.length) {
      await refreshOne(baseline.rows[cursor++]);
      if (receipts.length % 25 === 0) {
        // A resumed prefix must not erase receipts for files not yet revisited.
        for (const row of receipts) saved.set(row.image, row);
        const snapshot = JSON.stringify([...saved.values()], null, 2);
        checkpoint = checkpoint.then(async () => {
          await fs.writeFile(`${output}/receipts.json.tmp`, snapshot);
          await fs.rename(`${output}/receipts.json.tmp`, `${output}/receipts.json`);
        });
        await checkpoint;
      }
    }
  }));
  await checkpoint;
  await fs.writeFile(`${output}/receipts.json`, JSON.stringify(receipts, null, 2));
  console.log(JSON.stringify({ total: receipts.length, fetched: receipts.filter(r => r.status === 'FETCHED_ORIGINAL').length }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--refresh')) await refreshPhotos(process.argv[process.argv.indexOf('--refresh') + 1]);
  else {
    const result = await auditPhotos();
    const output = process.argv[2];
    if (output) await fs.writeFile(output, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ photos: result.photos, failed: result.failed }));
    process.exitCode = result.failed && !process.argv.includes('--baseline') ? 1 : 0;
  }
}
