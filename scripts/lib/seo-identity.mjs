// Hard identity invariants; pagination duplicates are explicitly allowed by Google.
const clean = text => text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_,n) => String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n)))
  .replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,n)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[n])
  .replace(/[\u2060\u00ad]/g,'').replace(/\s+/g,' ').trim();
export function headMetadata(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] || '';
  let description='';
  for (const tag of head.match(/<meta\b[^>]*>/gi)||[]) {
    const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]??m[4]]));
    if (attrs.name?.toLowerCase()==='description') description=attrs.content||'';
  }
  return {title:clean(head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]||''),description:clean(description)};
}
function newsSequence(url) {
  const path=new URL(url,'https://traveltribe.ru').pathname;
  return path.match(/^(\/novosti\/(?:tema\/[^/]+\/)?)(?:\d+\/)?$/)?.[1] || null;
}
export function duplicateMetadata(rows) {
  const result=[];
  for (const key of ['title','description']) {
    const groups=new Map();
    for (const row of rows) {
      if (row.noindex || row.stub || !row[key]) continue;
      const value=clean(row[key]);
      if (!groups.has(value)) groups.set(value,[]);
      groups.get(value).push(row.url);
    }
    for (const urls of groups.values()) {
      if(urls.length<2) continue;
      const sequence=newsSequence(urls[0]);
      if(sequence && urls.every(url=>newsSequence(url)===sequence)) continue;
      result.push([`${key}.duplicate`,urls[0],urls.join(' | ')]);
    }
  }
  return result;
}
export function destinationIdCollisions(value) {
  const names=new Map();
  function visit(node) {
    if(!node || typeof node!=='object') return;
    if([].concat(node['@type']||[]).includes('TouristDestination') && node['@id'] && node.name) {
      if(!names.has(node['@id'])) names.set(node['@id'],new Set());
      names.get(node['@id']).add(clean(node.name));
    }
    for(const child of Object.values(node)) if(typeof child==='object') {
      if(Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(value);
  return [...names].filter(([,n])=>n.size>1).map(([id,n])=>`${id}: ${[...n].join(' | ')}`);
}
