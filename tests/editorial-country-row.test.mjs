import test from 'node:test';
import assert from 'node:assert/strict';
import rehypeCountryRow from '../tools/rehype-country-row.mjs';
import {countryLinks} from '../src/data/article-country.js';
import {blogGeography} from '../src/data/editorial-geography.js';
const capsule=()=>({type:'element',tagName:'blockquote',properties:{},children:[{type:'text',value:'Если коротко: практический ответ'}]});
function render(slug,data){const tree={type:'root',children:[capsule()]};rehypeCountryRow()(tree,{history:[`/repo/src/content/blog/${slug}.mdx`],data:{astro:{frontmatter:data}}});return tree.children.find(n=>n.tagName==='nav');}
test('early country links retain a reviewed region when its tags also name the country',()=>{
 for(const [slug,tags,id]of [['kamchatka-guide-2026',['Россия','Камчатка'],'kamchatka'],['hainan-guide-2026',['Китай','Хайнань'],'hainan']]){
  const row=render(slug,{tags});assert.ok(row,`${slug}: early navigation disappeared`);assert.deepEqual(row.children.filter(n=>n.tagName==='a').map(n=>n.properties.href),countryLinks(blogGeography({slug}).primaryDirection).map(l=>l.href));assert.ok(row.children.some(n=>n.properties?.href===`/${id}/`));
 }
});
test('early navigation uses the same explicit geography as the article footer',()=>{
 const row=render('new-seoul',{tags:['Россия','Камчатка'],destinations:['south-korea']});assert.ok(row);assert.equal(row.children.find(n=>n.tagName==='a').properties.href,'/south-korea/');
 for(const[slug,tags]of [['patagonia-2026',['Аргентина','Чили']],['travelata-2026',['Турция','Таиланд']],['schengen-visa-2026',['Швейцария']]])assert.equal(render(slug,{tags}),undefined,`${slug}: cannot manufacture a first country`);
});
