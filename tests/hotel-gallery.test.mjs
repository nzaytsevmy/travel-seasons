import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { photoSourceIdentity } from '../scripts/hotel-native-source.mjs';
import { photoFingerprint, photoFingerprintDistance } from '../scripts/hotel-photo-distinctness.mjs';
import { hotelGallery, collectionHasCompleteGalleries, HOTEL_COLLECTIONS, hotelCollection, readyHotelCollections } from '../src/data/hotels.js';
const credits = JSON.parse(readFileSync(new URL('../src/data/hotel-photo-credits.json',import.meta.url)));

test('Выпуск требует от 3 до 5 разных кадров у каждого отеля', () => {
  const photo = n => ({ image: `test/${n}.webp`, creditKey: `test/${n}`, alt: `Кадр ${n}` });
  const hotel = { id: 'sample', photos: [photo(1), photo(2), photo(3)] };
  const collection = { hotels: Array.from({length: 10}, (_, i) => ({...hotel, id: `sample-${i}`})) };
  assert.equal(collectionHasCompleteGalleries('test', collection), true);
  for (const photos of [[], [photo(1)], [photo(1), photo(2)], [photo(1), photo(1), photo(2)], Array.from({length:6}, (_,i)=>photo(i))]) {
    assert.equal(collectionHasCompleteGalleries('test', {...collection, hotels: [ {...hotel, photos}, ...collection.hotels.slice(1) ]}), false);
  }
  assert.equal(hotelGallery('test', {id:'legacy',image:'test/legacy.webp'}).length, 1);
});

test('Флаг ready не выпускает подборку с неполными галереями', () => {
  const c=HOTEL_COLLECTIONS.singapore, previous=c.status, first=c.hotels[0], previousPhotos=first.photos;
  try {
    c.status='ready';
    first.photos=hotelGallery('singapore',first).slice(0,2);
    assert.equal(hotelCollection('singapore'),null);
    assert.ok(!readyHotelCollections().some(([country])=>country==='singapore'));
  } finally { c.status=previous; if(previousPhotos)first.photos=previousPhotos;else delete first.photos; }
});

test('У всех десяти отелей Сингапура есть полная галерея', () => {
  assert.equal(collectionHasCompleteGalleries('singapore',HOTEL_COLLECTIONS.singapore),true);
});

test('Каждый сохранённый кадр существует, имеет источник и не подменяет фотографии другого отеля', async () => {
  const hotelByDigest=new Map();
  for(const [country,collection] of Object.entries(HOTEL_COLLECTIONS)) for(const hotel of collection.hotels) {
    const hashes=new Set(), sources=new Set(), fingerprints=[];
    for(const photo of hotelGallery(country,hotel)) {
      const file=new URL(`../src/assets/hotels/${photo.image}`,import.meta.url);
      assert.ok(existsSync(file),photo.image);
      const credit=credits[photo.creditKey];assert.ok(credit,photo.creditKey);
      if(credit.license){assert.ok(credit.creator,photo.creditKey);if(!/^(Public domain|CC0)$/i.test(credit.license))assert.ok(credit.licenseUrl,photo.creditKey);}
      else {assert.equal(credit.rightsStatus,'NOT_STATED_IN_SOURCE');assert.ok(credit.sourcePhoto?.startsWith('https://'));}
      const source=credits[photo.creditKey]?.source;
      assert.equal(new URL(source).protocol,'https:',photo.creditKey);
      const sourceUrl=new URL(source);
      const identity=sourceUrl.hostname==='www.flickr.com' ? `flickr:${sourceUrl.pathname.match(/\/photos\/[^/]+\/(\d+)/)?.[1]}` : sourceUrl.hostname==='commons.wikimedia.org' ? `commons:${decodeURIComponent(sourceUrl.pathname).replaceAll('_',' ').normalize('NFC')}` : photoSourceIdentity(credit.sourcePhoto);
      assert.ok(!identity.endsWith('undefined'),source);
      assert.ok(!sources.has(identity),`Повтор исходника: ${country}/${hotel.id}`);sources.add(identity);
      const hash=createHash('sha256'); for await(const chunk of createReadStream(file)) hash.update(chunk);
      const digest=hash.digest('hex');assert.ok(!hashes.has(digest),`Повтор файла: ${photo.image}`);hashes.add(digest);
      const fingerprint=await photoFingerprint(file);
      for(const previous of fingerprints)assert.ok(photoFingerprintDistance(previous.fingerprint,fingerprint)>=2,
        `Один визуальный кадр в разных файлах: ${previous.image} и ${photo.image}`);
      fingerprints.push({image:photo.image,fingerprint});
      assert.ok(!hotelByDigest.has(digest),`Одинаковое фото у ${hotelByDigest.get(digest)} и ${country}/${hotel.id}`);hotelByDigest.set(digest,`${country}/${hotel.id}`);
    }
  }
});

test('У всех десяти отелей Гонконга есть полная галерея', () => {
  assert.equal(collectionHasCompleteGalleries('hong-kong',HOTEL_COLLECTIONS['hong-kong']),true);
});

test('У всех десяти отелей Японии есть полная галерея', () => {
  assert.equal(collectionHasCompleteGalleries('japan',HOTEL_COLLECTIONS.japan),true);
});

test('У всех десяти отелей Эмиратов есть полная галерея', () => {
  assert.equal(collectionHasCompleteGalleries('uae',HOTEL_COLLECTIONS.uae),true);
});
