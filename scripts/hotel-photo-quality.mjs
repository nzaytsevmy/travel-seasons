import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { readyHotelCollections, hotelGallery, hotelHubPicks, hotelGuideHubs } from '../src/data/hotels.js';

export const PHOTO_VIEWPORTS = [402, 768, 1024, 1280, 1440, 1920];
export function coverDensity(width, height, frameWidth, frameHeight) {
  return Math.min(width / frameWidth, height / frameHeight);
}
export function originalPhotoUrl(value) {
  const url = new URL(value);
  if (['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(url.hostname)) {
    // Documented fit-w size; unlike fit-w-min it does not request enlargement.
    url.pathname = url.pathname.replace(/^\/t\/[^/]+\//, '/t/2600x1240/');
  }
  return url.href;
}
export function galleryFrame(viewport, lead) {
  const padding = Math.min(41.6, Math.max(17.6, viewport * .03));
  const inner = Math.min(1280, viewport) - 2 * padding;
  const column = lead || viewport < 768 ? inner : (inner - 32) * 1.45 / 2.45;
  const width = column * .92;
  return { width, height: width * (lead && viewport >= 768 ? 9 / 16 : 3 / 4) };
}
export function photoManifest() {
  return readyHotelCollections().flatMap(([country, collection]) => collection.hotels.flatMap((hotel, index) =>
    hotelGallery(country, hotel).map(photo => ({ country, hotelId: hotel.id, hotelName: hotel.name,
      target: hotel.booking.target, lead: index === 0, ...photo }))));
}
export async function auditPhotos() {
  const rows = [];
  for (const photo of photoManifest()) {
    const file = `src/assets/hotels/${photo.image}`;
    const meta = await sharp(file).metadata();
    const frames = PHOTO_VIEWPORTS.map(viewport => ({ viewport, ...galleryFrame(viewport, photo.lead) }));
    // Country previews may use another hotel as the large 4:3 image.
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
    const density = Math.min(...frames.map(frame => coverDensity(meta.width, meta.height, frame.width, frame.height)));
    rows.push({ ...photo, width: meta.width, height: meta.height, density, passed: density >= 2 });
  }
  return { checkedAt: new Date().toISOString(), photos: rows.length,
    failed: rows.filter(row => !row.passed).length, rows };
}

async function refreshPhotos(output) {
  sharp.cache(false); sharp.concurrency(2);
  const credits = JSON.parse(await fs.readFile('src/data/hotel-photo-credits.json', 'utf8'));
  const baseline = await auditPhotos();
  const receipts = [];
  await fs.mkdir(output, { recursive: true });
  let previous = [];
  try { previous = JSON.parse(await fs.readFile(`${output}/receipts.json`, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const saved = new Map(previous.map(row => [row.image, row]));
  let checkpoint = Promise.resolve();
  async function refreshOne(photo) {
    const credit = credits[photo.creditKey];
    const existing = saved.get(photo.image);
    if (existing?.status === 'FETCHED_ORIGINAL' && existing.asset && existing.creditSource === credit?.source) {
      try {
        const buffer = await fs.readFile(`${output}/${existing.asset}`);
        if (createHash('sha256').update(buffer).digest('hex') === existing.originalSha256) {
          receipts.push(existing); return;
        }
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    let source = credit?.sourcePhoto;
    if (!source && credit?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
      const api = new URL('https://commons.wikimedia.org/w/api.php');
      api.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: '3000',
        titles: decodeURIComponent(new URL(credit.source).pathname.slice('/wiki/'.length)) });
      try {
        const response = await fetch(api, { signal: AbortSignal.timeout(30_000),
          headers: { 'User-Agent': 'TravelTribePhotoQA/1.0 (https://traveltribe.ru/)' } });
        if (!response.ok) throw new Error(`Commons HTTP ${response.status}`);
        const data = await response.json();
        const info = Object.values(data.query?.pages || {})[0]?.imageinfo?.[0];
        source = info?.thumburl || info?.url;
      } catch (error) { receipts.push({ image: photo.image, status: 'HOLD', error: error.message }); return; }
    }
    if (!source) { receipts.push({ image: photo.image, status: photo.passed ? 'ALREADY_DENSE' : 'MISSING_ORIGINAL_URL' }); return; }
    const url = originalPhotoUrl(source);
    const temporary = `${output}/${photo.image}.original`;
    try {
      await fs.mkdir(temporary.slice(0, temporary.lastIndexOf('/')), { recursive: true });
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const digest = createHash('sha256'); let bytes = 0;
      const handle = await fs.open(temporary, 'w');
      try {
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024) throw new Error('Image exceeds 32 MiB');
          digest.update(chunk);
          await handle.write(chunk);
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
      receipts.push({ image: photo.image, asset, sourcePhoto: url, creditSource: credit.source,
        width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height,
        orientation: metadata.orientation || 1, originalWidth: metadata.width,
        originalHeight: metadata.height, originalSha256: digest.digest('hex'),
        bytes, status: 'FETCHED_ORIGINAL' });
    } catch (error) {
      receipts.push({ image: photo.image, sourcePhoto: url, status: 'HOLD', error: error.message });
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
        const snapshot = JSON.stringify(receipts, null, 2);
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
    process.exitCode = result.failed ? 1 : 0;
  }
}
