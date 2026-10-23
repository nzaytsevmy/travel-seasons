// Compatibility helpers for article country navigation. The shared editorial
// geography resolver owns the decision; tag order is never a country priority.

import { blogGeography } from './editorial-geography.js';

/** Compatibility helper: ambiguous tags never choose the first country. */
export function directionForTags(tags = []) {
  return blogGeography({slug:'',data:{tags}}).primaryDirection;
}

/**
 * До трёх ссылок «ещё по стране» для статьи.
 * Порядок — по пользе читателю: сначала страна целиком, потом сборы, потом виза.
 * `skip` — адреса, которые на странице уже есть (свои же ссылки в тексте):
 * дубль заставляет читателя перечитывать оба списка (NN/g), поэтому выкидываем.
 */
export function countryLinks(direction, { skip = new Set(), selfPath = '' } = {}) {
  if (!direction) return [];
  const out = [];
  const add = (href, label) => {
    if (out.length >= 3) return;
    if (href === selfPath || skip.has(href)) return;
    out.push({ href, label });
  };

  add(`/${direction.slug}/`, 'когда ехать');
  add(`/packing/${direction.slug}/`, 'что взять');
  if (direction.visa === 'required' || direction.visa === 'evisa') {
    add(`/visa/${direction.slug}/`, 'виза и документы');
  }
  for (const p of direction.relatedPosts || []) {
    const label = p.kind === 'visa' ? 'виза и документы'
      : p.kind === 'season' ? 'сезоны и события'
      : p.kind === 'insurance' ? 'страховка и полис'
      : p.kind === 'practical' ? 'места и маршруты' : 'гайд по стране';
    add(`/blog/${p.slug}/`, label);
  }
  return out;
}
