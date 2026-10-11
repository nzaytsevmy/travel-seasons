import { parse } from 'parse5';
import { classifyPage, classifyPartner } from '../src/data/monetization.js';
import { planningEligible } from '../src/data/trip-services.js';
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const walk=(node,predicate)=>[...(predicate(node)?[node]:[]),...(node.childNodes||[]).flatMap(n=>walk(n,predicate))];

export function auditTripServices(html,path) {
  const tree=parse(html);
  const blocks=walk(tree,n=>n.tagName==='section' && attr(n,'data-trip-planning')!==undefined);
  const errors=[];
  if(!planningEligible(path)) {
    if(blocks.length)errors.push('на служебной странице появился блок поездки');
    return {errors,eligible:false,blocks:blocks.length};
  }
  if(blocks.length!==1)errors.push(`блок подготовки поездки должен быть один, найдено ${blocks.length}`);
  const type=classifyPage(path).type;
  const replyClass=type==='blog_article' ? 'prose' : type==='news_article' ? 'nvp-body' : null;
  if(replyClass && blocks.length===1) {
    const order=walk(tree,()=>true);
    const replies=order.filter(n=>String(attr(n,'class') || '').split(/\s+/).includes(replyClass));
    if(replies.length!==1 || order.indexOf(blocks[0]) < order.indexOf(replies[0])+walk(replies[0],()=>true).length)errors.push('блок поездки должен стоять после основного ответа');
  }
  const links=blocks.flatMap(b=>walk(b,n=>n.tagName==='a'));
  for(const offer of ['stay','flight','insurance']) {
    const selected=links.filter(n=>classifyPartner(attr(n,'href'))?.offer===offer);
    if(selected.length!==1)errors.push(`${offer}: ожидается один проверяемый следующий шаг, найдено ${selected.length}`);
  }
  for(const link of links) {
    const id=attr(link,'data-cta-id') || '';
    if(!/^[a-z0-9_]{5,64}$/.test(id))errors.push('нет стабильного CTA id');
    const href=attr(link,'href');
    if(!classifyPartner(href))errors.push('неизвестная партнёрская ссылка');
    else if(new URL(href).searchParams.get('sub_id')!==id)errors.push('CTA id потерян в партнёрской метке');
    const rel=String(attr(link,'rel')).split(/\s+/);
    if(!rel.includes('sponsored'))errors.push('нет rel=sponsored');
    if(!rel.includes('noopener'))errors.push('нет rel=noopener');
    if(classifyPartner(href) && !new URL(href).searchParams.get('erid'))errors.push('нет действующей юридической маркировки erid');
  }
  return {errors,eligible:true,blocks:blocks.length,offers:links.map(n=>classifyPartner(attr(n,'href'))?.offer)};
}
