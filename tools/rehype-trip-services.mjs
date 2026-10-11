import { readFileSync } from 'node:fs';
import { tripServices } from '../src/data/trip-services.js';
import { classifyPartner } from '../src/data/monetization.js';

const coverage = JSON.parse(readFileSync(new URL('../reviews/trip-service-coverage.json',import.meta.url),'utf8')).articles;
const text = node => node.type === 'text' ? node.value : (node.children || []).map(text).join('');
const normalized = value => value.replace(/\s+/gu,' ').trim();
const element = (tagName,properties,children) => ({type:'element',tagName,properties,children});
const value = v => ({type:'text',value:v});

const HELPER_OFFERS = {
  aviasalesRoute:'flight', aviasalesUrl:'flight', cherehapaCountry:'insurance', cherehapaTravel:'insurance',
  ostrovokCity:'stay', ostrovokCountry:'stay', ostrovokSearch:'stay', otelloStay:'stay',
  sutochnoRegion:'stay', yandexTravelSub:'stay', mirturbazRegion:'stay',
};
const LINK_OFFERS={aviasales:'flight',cherehapa:'insurance',ostrovok:'stay',sutochno:'stay',otello:'stay',yandexTravel:'stay',mirturbaz:'stay'};

// Read ESTree declarations only; never execute article JavaScript. Existing MDX
// often names its URLs (href={stay}) or aliases an imported affiliate helper.
function bindingResolver(tree) {
  const bindings=new Map(), imported=new Map();
  const collect=node=>{
    for(const statement of node.data?.estree?.body || []) {
      if(statement.type==='ImportDeclaration' && /\/affiliate(?:\.js)?$/.test(statement.source.value)) {
        for(const spec of statement.specifiers || [])if(spec.type==='ImportSpecifier')imported.set(spec.local.name,spec.imported.name);
      }
      const declaration=statement.type==='ExportNamedDeclaration' ? statement.declaration : statement;
      if(declaration?.type==='VariableDeclaration' && declaration.kind==='const') {
        for(const d of declaration.declarations)if(d.id.type==='Identifier')bindings.set(d.id.name,d.init);
      }
    }
    (node.children || []).forEach(collect);
  };
  collect(tree);
  const resolve=(expr,seen=new Set())=>{
    if(!expr || seen.size>20)return;
    if(expr.type==='Literal')return typeof expr.value==='string' ? classifyPartner(expr.value)?.offer : undefined;
    if(expr.type==='Identifier') {
      if(seen.has(expr.name))return;
      return resolve(bindings.get(expr.name),new Set([...seen,expr.name]));
    }
    if(expr.type==='CallExpression' && expr.callee?.type==='Identifier') {
      const name=imported.get(expr.callee.name) || expr.callee.name;
      return name==='tpkDeep' ? LINK_OFFERS[expr.arguments[0]?.value] : HELPER_OFFERS[name];
    }
    if(expr.type==='MemberExpression') {
      const key=expr.computed ? expr.property.value : expr.property.name;
      if(expr.object.type==='Identifier' && (imported.get(expr.object.name) || expr.object.name)==='TP_LINKS')return LINK_OFFERS[key];
      const object=expr.object.type==='Identifier' ? bindings.get(expr.object.name) : expr.object;
      if(object?.type==='ObjectExpression')return resolve(object.properties.find(p=>(p.key?.name || p.key?.value)===key)?.value,seen);
    }
    if(expr.type==='ConditionalExpression') {
      const first=resolve(expr.consequent,seen),second=resolve(expr.alternate,seen);
      return first===second ? first : undefined;
    }
  };
  return resolve;
}

function sectionHasOffer(nodes, offer, resolveBinding) {
  const helpers = {insurance:/cherehapaCountry|cherehapaTravel|TP_LINKS\.cherehapa|tpkDeep\(['"]cherehapa['"]/,stay:/ostrovokCity|ostrovokCountry|ostrovokSearch|otelloStay|sutochnoRegion|TP_LINKS\.(?:ostrovok|sutochno|otello|yandexTravel)|tpkDeep\(['"](?:ostrovok|sutochno|otello|yandexTravel)['"]/,flight:/aviasalesRoute|aviasalesUrl|TP_LINKS\.aviasales/};
  const walk = node => {
    if(node.type==='raw' && [...String(node.value || '').matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')/gi)].some(m=>classifyPartner(m[1] || m[2])?.offer===offer))return true;
    if(node.tagName === 'a' && classifyPartner(node.properties?.href)?.offer === offer) return true;
    if(node.name === 'a') {
      const href = node.attributes?.find(a=>a.name==='href')?.value;
      if(typeof href === 'string' && classifyPartner(href)?.offer === offer) return true;
      if(typeof href === 'object' && (resolveBinding(href?.data?.estree?.body?.[0]?.expression)===offer || helpers[offer]?.test(href?.value || ''))) return true;
    }
    return (node.children || []).some(walk);
  };
  return nodes.some(walk);
}

// Exact reviewed headings, not keyword-based production insertion. Source prose stays intact.
export default function rehypeTripServices(options={}) {
  const articles = options.articles || coverage;
  return (tree,file) => {
    const path=String(file.history?.[0] || file.path || '');
    if(!/src\/content\/blog\//.test(path)) return;
    const slug=path.split('/').pop().replace(/\.mdx?$/,'');
    const rule=articles[slug];
    if(!rule) throw new Error(`Missing trip-service coverage: ${slug}`);
    const children=tree.children || [];
    const resolveBinding=bindingResolver(tree);
    const insertions=[];
    for(const [index,section] of rule.sections.entries()) {
      const start=children.findIndex(n=>n.tagName==='h2' && normalized(text(n))===normalized(section.heading));
      if(start<0) throw new Error(`Trip-service section disappeared: ${slug}: ${section.heading}`);
      let end=start+1;
      while(end<children.length && children[end].tagName!=='h2') end++;
      const items=tripServices({pathname:`/blog/${slug}/`,destination:rule.destination,placement:`section_${index+1}`})
        .filter(item=>section.offers.includes(item.offer) && !sectionHasOffer(children.slice(start+1,end),item.offer,resolveBinding));
      if(!items.length) continue;
      const paragraphs=items.map(item=>element('p',{},[
        element('a',{href:item.href,rel:['sponsored','noopener'],target:'_blank',className:['aff-cta'],
          'data-cta-id':item.ctaId,'data-placement':item.placement,'data-destination':item.destination,
          ...(item.generic ? {'data-generic-fallback':'1'} : {})},[value(item.label)]),
        value(`. ${item.note}`),
      ]));
      insertions.push({at:end,node:element('aside',{className:['trip-context'],'aria-label':'Для этой поездки','data-trip-context':section.heading},paragraphs)});
    }
    for(const insertion of insertions.sort((a,b)=>b.at-a.at))children.splice(insertion.at,0,insertion.node);
  };
}
