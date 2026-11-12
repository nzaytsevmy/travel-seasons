import { parse } from 'parse5';

const descendants = node => [node, ...(node.childNodes ?? []).flatMap(descendants)];
const attribute = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const textContent = node => ['script', 'style', 'template', 'noscript'].includes(node.tagName)
  ? '' : node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textContent).join('');

// Check the material's author, not the global founder/Person graph node.
export function newsAuthorshipProblems(html) {
  const problems = [];
  const elements = descendants(parse(html));
  const nodes = elements.filter(node => node.tagName === 'script' && attribute(node, 'type') === 'application/ld+json')
    .flatMap(node => {
      const data = JSON.parse((node.childNodes ?? []).map(child => child.value ?? '').join(''));
      return data['@graph'] ?? [data];
    });
  const materials = nodes.filter(node => ['NewsArticle', 'CollectionPage'].includes(node['@type']));
  if (materials.length !== 1) problems.push('Expected exactly one news material schema');
  for (const material of materials) {
    if (material.author?.['@id'] !== 'https://traveltribe.ru/#org') problems.push('News material author must be editorial organization');
  }
  const bylines = elements.filter(node => node.tagName === 'p' && (attribute(node, 'class') ?? '').split(/\s+/)
    .some(cls => ['nvp-byline', 'nv-byline', 'nvt-byline'].includes(cls)));
  if (bylines.length !== 1) problems.push('Expected exactly one visible editorial byline');
  for (const byline of bylines) {
    const text = textContent(byline).replace(/\s+/g, ' ');
    const links = descendants(byline).filter(node => node.tagName === 'a').map(node => attribute(node, 'href'));
    if (!text.includes('\u0420\u0435\u0434\u0430\u043a\u0446\u0438\u044f TravelTribe')) problems.push('Editorial byline missing');
    if (links.some(href => href === '/about/') || text.includes('\u041d\u0438\u043a\u0438\u0442\u0430 \u0417\u0430\u0439\u0446\u0435\u0432')) problems.push('Personal attribution in editorial byline');
    if (!links.some(href => href === '/')) problems.push('Editorial byline must link to site');
    if (!links.some(href => href === 'https://t.me/traveltriberu') || !text.includes('@traveltriberu')) problems.push('Editorial byline must include the channel link');
  }
  return problems;
}
