import test from 'node:test';
import assert from 'node:assert/strict';
import { hotelCollection,hotelRouteCollections,HOTEL_COLLECTIONS,hotelGallery } from '../src/data/hotels.js';

test('Черновик не создаёт публичный маршрут, даже если все фотографии готовы',()=>{
  const c=HOTEL_COLLECTIONS.singapore,original=c.status;
  try{
    c.status='draft';assert.equal(hotelCollection('singapore'),null);
    assert.ok(!hotelRouteCollections().some(([country])=>country==='singapore'));
    assert.ok(hotelRouteCollections({development:true}).some(([country])=>country==='singapore'));
  }finally{c.status=original;}
});

test('Публичный выпуск содержит все 70 подборок и исключает неполные галереи',()=>{
  assert.equal(hotelRouteCollections().length,70);
  assert.equal(hotelRouteCollections({development:true}).length,70);
  const h=HOTEL_COLLECTIONS.singapore.hotels[0],original=h.photos;
  try{
    h.photos=hotelGallery('singapore',h).slice(0,2);
    for(const development of [true,false]){
      const routes=hotelRouteCollections({development});
      assert.equal(routes.length,69);
      assert.ok(!routes.some(([country])=>country==='singapore'));
    }
    assert.equal(hotelCollection('singapore'),null);
  }finally{if(original)h.photos=original;else delete h.photos;}
});
