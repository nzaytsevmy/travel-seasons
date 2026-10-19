import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedPhotoOriginalUrl} from '../scripts/hotel-native-source.mjs';
test('removes only known shrinking delivery transforms from the same published CDN object',()=>{
 assert.equal(publishedPhotoOriginalUrl('https://webbox.imgix.net/images/property/room.jpg?auto=format,compress&fit=crop&crop=entropy&w=1600&h=600'),'https://webbox.imgix.net/images/property/room.jpg');
 assert.equal(publishedPhotoOriginalUrl('https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/25/a2/a0/the-jetty.jpg?w=300&h=-1&s=1'),'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/25/a2/a0/the-jetty.jpg');
 assert.equal(publishedPhotoOriginalUrl('https://dam.melia.com/melia/file/example.jpg?im=RegionOfInterestCrop%3D%28360%2C360%29'),'https://dam.melia.com/melia/file/example.jpg');
 assert.equal(publishedPhotoOriginalUrl('https://cdn-datahub.visitfinland.com/images/example.jpeg?s=1200'),'https://cdn-datahub.visitfinland.com/images/example.jpeg');
 assert.equal(publishedPhotoOriginalUrl('https://images.squarespace-cdn.com/content/v1/example.jpg?format=1200w'),'https://images.squarespace-cdn.com/content/v1/example.jpg');
});
test('never invents image paths or removes authentication and unrelated parameters',()=>{
 for(const value of ['https://example.com/a.jpg?w=300','https://dam.melia.com/a.jpg?token=private&im=crop','https://dam.melia.com/a.jpg','http://dam.melia.com/a.jpg?im=crop','https://:0','https://webbox.imgix.net/images/room.jpg?w=800&s=signature'])assert.equal(publishedPhotoOriginalUrl(value),null);
});
