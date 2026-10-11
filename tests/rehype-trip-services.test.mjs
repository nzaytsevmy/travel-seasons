import test from 'node:test';
import assert from 'node:assert/strict';
import rehypeTripServices from '../tools/rehype-trip-services.mjs';
import { compile } from '@mdx-js/mdx';
const node=(tagName,children,properties={})=>({type:'element',tagName,children,properties});
const text=value=>({type:'text',value});
const file={path:'/repo/src/content/blog/madrid-gde-ostanovitsya.mdx'};
const rule={articles:{'madrid-gde-ostanovitsya':{destination:'spain',sections:[{heading:'Где жить',offers:['stay']},{heading:'Как добраться',offers:['flight']}]}}};

test('contextual links are SSR nodes, after the decision, with separate stable attribution',()=>{
 const tree={children:[node('h2',[text('Где жить')]),node('p',[text('Сначала выбор района.')]),node('h2',[text('Как добраться')]),node('p',[text('Сначала путь из аэропорта.')])]};
 rehypeTripServices(rule)(tree,file);
 assert.equal(tree.children[2].tagName,'aside');
 const link=tree.children[2].children[0].children[0];
 assert.match(link.properties.href,/ostrovok/);assert.match(link.properties['data-cta-id'],/section_1/);
 assert.match(tree.children.at(-1).children[0].children[0].properties.href,/aviasales/);
});

test('existing same-service MDX and HTML links are not duplicated',()=>{
 const tree={children:[node('h2',[text('Где жить')]),{type:'mdxJsxFlowElement',name:'a',attributes:[{name:'href',value:{value:"tpkDeep('ostrovok', 'https://ostrovok.ru/hotel/spain/madrid/', 'old')"}}],children:[text('Отель')]},node('h2',[text('Как добраться')]),node('p',[node('a',[text('Билет')],{href:'https://aviasales.tpk.mx/JCSPlC17?erid=x'})])]};
 const length=tree.children.length;rehypeTripServices(rule)(tree,file);assert.equal(tree.children.length,length);
});

test('changed heading fails instead of silently losing a commercial decision',()=>{
 const tree={children:[node('h2',[text('Иное решение')])]};
 assert.throws(()=>rehypeTripServices(rule)(tree,file),/section disappeared/);
});

test('non-blog content is not changed by the contextual plugin',()=>{
 const tree={children:[node('p',[text('Новость')])]};rehypeTripServices(rule)(tree,{path:'/repo/news/story.md'});assert.equal(tree.children.length,1);
});

test('real MDX constant links, including aliased imports, are not duplicated',async()=>{
 const source=`import { ostrovokCity as hotel, aviasalesRoute } from '../data/affiliate.js';

export const stay = hotel('spain', 'madrid', 'old');

export const flight = aviasalesRoute('MOW', 'MAD', 'old');

export const ticket = flight;

## Где жить

<a href={stay} rel="sponsored noopener">Выбрать отель</a>

## Как добраться

<a href={ticket} rel="sponsored noopener">Выбрать билет</a>
`;
 let found;
 await compile({value:source,path:file.path},{rehypePlugins:[[rehypeTripServices,rule],()=>tree=>{found=tree;}]});
 assert.equal(found.children.filter(n=>n.tagName==='aside').length,0);
});

test('ordinary Markdown raw HTML anchors are not duplicated',()=>{
 const tree={children:[node('h2',[text('Где жить')]),{type:'raw',value:'<a href="https://ostrovok.tpk.mx/xtyTcUcY?erid=old&amp;sub_id=old">Отель</a>'},node('h2',[text('Как добраться')]),{type:'raw',value:'<a href="https://aviasales.tpk.mx/JCSPlC17?erid=old">Билет</a>'}]};
 rehypeTripServices(rule)(tree,file);
 assert.equal(tree.children.filter(n=>n.tagName==='aside').length,0);
});
