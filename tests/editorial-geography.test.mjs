import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'yaml';
import {BLOG_GEOGRAPHY, NEWS_GEOGRAPHY, blogGeography, newsGeography, newsCountryIds, countryIds, geographyMatches} from '../src/data/editorial-geography.js';
import {tripServices} from '../src/data/trip-services.js';
import {newsForCountry, relatedNews} from '../src/data/news.js';

function catalogue(type) {
  return fs.readdirSync(`src/content/${type}`).filter(f=>/\.mdx?$/.test(f)).map(file=>{
    const raw=fs.readFileSync(`src/content/${type}/${file}`,'utf8');
    const front=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    assert.ok(front,file);return {slug:file.replace(/\.mdx?$/,''),data:parse(front)};
  });
}

test('every blog article has an explicit reviewed geography, including intentional general subjects',()=>{
  const posts=catalogue('blog');
  for(const post of posts) {
    assert.ok(Object.hasOwn(BLOG_GEOGRAPHY,post.slug)||Array.isArray(post.data.destinations),`${post.slug}: add explicit destinations, [] for a general subject`);
    const context=blogGeography(post);
    assert.notEqual(context.source,'unclassified',post.slug);
    for(const place of context.places) if(place.href?.startsWith('/blog/tag/')) {
      const tag=decodeURIComponent(place.href.split('/')[3]);
      assert.ok(posts.some(p=>p.data.tags?.includes(tag)),`${post.slug}: missing tag route ${tag}`);
    }
    const services=tripServices({pathname:`/blog/${post.slug}/`,destination:context.monetizationDestination});
    assert.ok(services.every(s=>s.destination===context.monetizationDestination),`${post.slug}: services disagree with navigation`);
  }
  for(const slug of Object.keys(BLOG_GEOGRAPHY)) assert.ok(posts.some(p=>p.slug===slug),`stale mapping: ${slug}`);
});

test('comparisons and cross-border routes never select a first country for the whole article',()=>{
  for(const [slug,ids]of Object.entries({
    'fukuok-ili-haynan':['vietnam','hainan'],
    'patagonia-2026':['argentina','chile'],
    'skolko-stoit-nedelya-v-rossii-2026':['russia','abkhazia'],
    'kuba-tury-2027':['cuba','dominican-republic','mexico'],
  })) {
    const context=blogGeography({slug});assert.deepEqual(context.ids,ids);
    assert.equal(context.primaryDirection,null);assert.equal(context.monetizationDestination,'');
    // Even an old caller passing the former wrong destination cannot restore it.
    assert.ok(tripServices({pathname:`/blog/${slug}/`,destination:ids[0]}).every(s=>s.generic));
  }
  for(const slug of['safari-afrika-2026','solnechnoe-zatmenie-2027'])assert.equal(blogGeography({slug}).primaryDirection,null);
});

test('Schengen and general product reviews cannot become Switzerland, Japan or Turkey',()=>{
  for(const slug of['schengen-visa-2026','ees-2026','schengen-insurance-2026']) {
    const context=blogGeography({slug});assert.deepEqual(context.ids,['schengen']);assert.equal(context.primaryDirection,null);
  }
  for(const slug of['travelata-2026','luchshie-goroda-dlya-molodyh-2026','intourist-2026']) {
    assert.deepEqual(blogGeography({slug}).ids,[]);
    assert.ok(tripServices({pathname:`/blog/${slug}/`,destination:'turkey'}).every(s=>s.generic));
  }
});

test('Hainan retains its own destination while an Australia-wide guide avoids selecting the east',()=>{
  assert.equal(blogGeography({slug:'hainan-guide-2026'}).primaryDirection.slug,'hainan');
  assert.equal(blogGeography({slug:'australia-guide-2026'}).primaryDirection,null);
  assert.deepEqual(blogGeography({slug:'australia-guide-2026'}).ids,['australia']);
});

test('countries outside the priced hub catalogue have real country labels and only existing links',()=>{
  for(const[slug,label]of Object.entries({'tonga-whales':'Тонга','fiji-shark-diving':'Фиджи','azerbaijan-guide-2026':'Азербайджан','uganda-safari-2026':'Уганда','dzhakarta-chto-posmotret':'Индонезия'})) {
    const context=blogGeography({slug});assert.equal(context.places[0].label,label);
    assert.equal(context.primaryDirection,null);
    assert.equal(context.places[0].href,`/blog/tag/${label}/`);
  }
  assert.deepEqual(countryIds(['hainan','china']),['china']);
});

test('explicit new article geography wins over tag order and recommendations',()=>{
  assert.deepEqual(blogGeography({slug:'new',data:{destinations:['vietnam','hainan'],tags:['Китай','Вьетнам']}}).ids,['vietnam','hainan']);
  for(const tags of[['Китай','Вьетнам'],['Вьетнам','Китай']])assert.equal(blogGeography({slug:'new',data:{tags}}).primaryDirection,null);
  assert.throws(()=>blogGeography({slug:'new',data:{destinations:['imaginary-country']}}),/Unknown editorial geography/);
  const updated=blogGeography({slug:'hainan-guide-2026',data:{destinations:['vietnam','hainan']}});
  assert.ok(tripServices({pathname:'/blog/hainan-guide-2026/',geography:updated}).every(s=>s.generic));
});

test('every news geography resolves; all overrides refer to real stories',()=>{
  const stories=catalogue('news');
  for(const story of stories) assert.doesNotThrow(()=>newsGeography(story),story.slug);
  for(const slug of Object.keys(NEWS_GEOGRAPHY))assert.ok(stories.some(e=>e.slug===slug),`stale story: ${slug}`);
  const java=newsGeography({slug:'2026-09-11-java-ijen-bromo-fire-closures',data:{countries:['bali']}});
  assert.deepEqual(java.ids,['indonesia']);assert.equal(java.primaryDirection,null);
  const empty={slug:'2026-10-13-fiji-bee-genetic-bottleneck',data:{countries:[]}};
  assert.deepEqual(newsCountryIds(empty),['fiji']);
  assert.equal(newsGeography(empty).places[0].label,'Фиджи');
});

test('countrywide scope never invents a specific region or adjoining country',()=>{
  assert.equal(geographyMatches(['australia'],'australia-east'),false);
  assert.equal(geographyMatches(['australia-east'],'australia-north'),false);
  assert.equal(geographyMatches(['china'],'hainan'),false);
  assert.equal(geographyMatches(['hainan'],'china'),true);
  assert.equal(geographyMatches(['costa-rica'],'costa-rica-panama'),true);
  assert.equal(geographyMatches(['costa-rica'],'panama'),false);
  assert.equal(geographyMatches(['russia'],'dagestan'),false);
  assert.equal(geographyMatches(['indonesia'],'bali'),false);
  assert.equal(geographyMatches(['russia'],'abkhazia'),false);
});

test('country feeds and related stories use the corrected shared geography',()=>{
  const entry=(slug,countries)=>({slug,data:{countries,added:new Date('2026-10-13'),checked:new Date('2026-10-13'),topic:'nature'}});
  const fiji=entry('2026-10-13-fiji-bee-genetic-bottleneck',[]),other=entry('fiji-other',['fiji']),thailand=entry('thai-other',['thailand']);
  assert.deepEqual(relatedNews([fiji,other,thailand],fiji,3,new Date('2026-10-23')).map(e=>e.slug),['fiji-other']);
  assert.deepEqual(newsForCountry([entry('australia',['australia']),entry('east',['australia-east']),entry('north',['australia-north'])],'australia-east').map(e=>e.slug),['east']);
});
