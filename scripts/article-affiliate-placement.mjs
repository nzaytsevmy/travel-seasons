// Размещение в теле статьи; финальный оффер и sticky сюда не попадают.
import { parse } from 'parse5';
import { classifyPartner } from '../src/data/monetization.js';
import { unshieldHtml } from './affiliate-shield.mjs';
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value || '';
const children = node => node.childNodes || [];
const visibleText = node => ['script', 'style', 'template'].includes(node.tagName) || node.attrs?.some(a => a.name === 'hidden') || attr(node, 'aria-hidden') === 'true' ? '' : node.nodeName === '#text' ? node.value : children(node).map(visibleText).join('');
const length = text => text.replace(/\s/gu, '').length;
function findProse(node) {
  if (attr(node, 'class').split(/\s+/).includes('prose')) return node;
  for (const child of children(node)) { const found = findProse(child); if (found) return found; }
  return null;
}
export function auditArticlePlacement(html) {
  const prose = findProse(parse(unshieldHtml(html)));
  if (!prose) return { bodyLinks: 0, firstLinkPercent: null, sections: [], missingProse: true };
  let offset = 0, first = null, bodyLinks = 0;
  const sections = [], active = [];
  function walk(node) {
    if (['script', 'style', 'template'].includes(node.tagName) || node.attrs?.some(a => a.name === 'hidden') || attr(node, 'aria-hidden') === 'true') return;
    if (node.nodeName === '#text') { offset += length(node.value); return; }
    if (/^h[23]$/.test(node.tagName || '')) {
      const level = Number(node.tagName[1]);
      while (active.length && active.at(-1).level >= level) active.pop();
      const section = { heading: visibleText(node).replace(/\s+/gu, ' ').trim(), level, affiliateLinks: 0 };
      active.push(section); sections.push(section);
    }
    if (node.tagName === 'a' && classifyPartner(attr(node, 'href'))) {
      bodyLinks++; first ??= offset;
      for (const section of active) section.affiliateLinks++;
    }
    children(node).forEach(walk);
  }
  walk(prose);
  return { bodyLinks, firstLinkPercent: first === null ? null : Math.round(10000 * first / Math.max(offset, 1)) / 100, sections, missingProse: false };
}

// 35% — редакционный сигнал для проверки, а не доказанный optimum конверсии.
// Поздний переход разрешён с конкретным объяснением в реестре покрытия.
export function placementProblems(placement, rule = {}) {
  rule = rule && typeof rule === 'object' ? rule : {};
  const problems = [];
  const explained = value => typeof value === 'string' && value.trim().length >= 20;
  if (placement.missingProse) return ['нет контейнера .prose для проверки статьи'];
  if (!placement.bodyLinks && !explained(rule.noOfferReason)) problems.push('нет партнёрского перехода в теле статьи и нет обоснованного исключения');
  if (placement.firstLinkPercent > 35 && !explained(rule.lateReason)) problems.push(`первый переход после ${placement.firstLinkPercent}% текста: перенести к раннему решению или обосновать место`);
  for (const heading of Array.isArray(rule.requiredSections) ? rule.requiredSections : []) {
    const section = placement.sections.find(s => s.heading === heading);
    if (!section) problems.push(`раздел покрытия не найден: ${heading}`);
    else if (!section.affiliateLinks) problems.push(`решение без контекстной ссылки: ${heading}`);
  }
  return problems;
}
