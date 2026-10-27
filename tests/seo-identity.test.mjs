import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { duplicateMetadata, destinationIdCollisions, headMetadata } from '../scripts/lib/seo-identity.mjs';

test('different indexable pages cannot silently share metadata', () => {
  const rows = ['/visa/japan/', '/visa/japan-hokkaido/'].map(url => ({url, title:'Виза в Японию', description:'Документы'}));
  assert.deepEqual(duplicateMetadata(rows).map(x => x[0]), ['title.duplicate', 'description.duplicate']);
  assert.equal(duplicateMetadata(rows.map((x,i)=>({...x,noindex:i===1}))).length, 0);
});
test('Google pagination exception is restricted to one news sequence', () => {
  const page = url => ({url, title:'Новости',description:'Лента'});
  assert.deepEqual(duplicateMetadata([page('/novosti/tema/priroda/'),page('/novosti/tema/priroda/2/')]), []);
  assert.equal(duplicateMetadata([page('/novosti/tema/priroda/'),page('/novosti/tema/transport-i-dostup/2/')]).length, 2);
});
test('head title ignores SVG title and normalizes entities and typography', () => {
  assert.deepEqual(headMetadata('<head><title>Япония &amp; Киото</title><meta name="description" content="Поездка&#160;в Японию"></head><body><svg><title>Карта</title></svg>'), {title:'Япония & Киото',description:'Поездка в Японию'});
});
test('distinct destinations must not share an id; same-entity references are valid', () => {
  const place = name => ({'@type':'TouristDestination','@id':'https://traveltribe.ru/seasons/#',name});
  assert.equal(destinationIdCollisions({'@graph':[place('Камчатка'),place('Карелия')]}).length, 1);
  assert.deepEqual(destinationIdCollisions({'@graph':[place('Камчатка'),place('Камчатка'),{'@id':'https://traveltribe.ru/#author'},{'@type':'Person','@id':'https://traveltribe.ru/#author',name:'Никита'}]}), []);
});
test('Google can crawl noindex tag pages without opening system directories', () => {
  const robots=readFileSync(new URL('../public/robots.txt',import.meta.url),'utf8').split(/\n\s*\n/)[0];
  assert.doesNotMatch(robots,/Disallow: \/blog\/tag\//);
  for (const path of ['/go/','/pagefind/','/og/']) assert.ok(robots.includes(`Disallow: ${path}`));
});
