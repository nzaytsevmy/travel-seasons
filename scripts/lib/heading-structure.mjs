import { parse } from 'parse5';

// Fixed navigation, sidebar and dialog outlines are independent from article sections.
// A forward rank jump is an accessibility review failure, not a ranking penalty.
export function headingStructure(html) {
  const headings = [];
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  const has = (node, name) => node.attrs?.some(a => a.name === name);
  function text(node) {
    if (node.nodeName === '#text') return node.value;
    if (node.tagName === 'script' || node.tagName === 'style') return '';
    if (node.tagName === 'img') return attr(node, 'alt') || '';
    return (node.childNodes || []).map(text).join('');
  }
  function walk(node, state = { hidden: false, main: false, fixed: false }) {
    const tag = node.tagName;
    const hidden = state.hidden || has(node, 'hidden') || has(node, 'inert') || attr(node, 'aria-hidden') === 'true'
      || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr(node, 'style') || '')
      || (tag === 'dialog' && !has(node, 'open'));
    const main = state.main || tag === 'main';
    const fixed = state.fixed || ['nav', 'aside', 'footer'].includes(tag) || ['dialog', 'navigation', 'complementary'].includes(attr(node, 'role'));
    const level = /^h[1-6]$/.test(tag || '') ? Number(tag[1])
      : attr(node, 'role') === 'heading' ? Number(attr(node, 'aria-level') || 2) : 0;
    if (level && !hidden) headings.push({ level, text: (attr(node, 'aria-label') || text(node)).replace(/\s+/g, ' ').trim(), main, fixed, id: attr(node, 'id') || null });
    for (const child of node.childNodes || []) walk(child, { hidden, main, fixed });
  }
  walk(parse(html));
  const findings = [];
  let previous = 0;
  for (const h of headings) {
    if (!h.text) findings.push({ kind: 'heading.empty', level: h.level, id: h.id });
    if (!h.main || h.fixed) continue;
    if (h.level > previous + 1) findings.push({ kind: 'heading.rank_jump', from: previous, to: h.level, text: h.text });
    previous = h.level;
  }
  return { headings, findings };
}
