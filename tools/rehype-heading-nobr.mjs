import { splitCompounds } from '../src/utils/nobr.js';

/**
 * Составные слова с дефисом в заголовках статей (h1–h3) — в <span class="nobr">, строка по дефису не рвётся.
 * 11.09.2026 на телефоне в 27 статьях из 104 заголовок рвался посреди слова: «Шри-|Ланку», «Милфорд-|Саунд».
 *
 * ⛔ Правка ЭТОГО файла не сбрасывает кеш собранного текста статей (см. rehype-country-row.mjs):
 * проверяя её, сначала снести кеш .astro и node_modules/.astro.
 */
export default function rehypeHeadingNobr() {
  return (tree, file) => {
    const path = String(file.history?.[0] || file.path || '');
    if (!/src\/content\/blog\//.test(path)) return;
    const walk = (node, inHeading) => {
      if (!node.children) return;
      const heading = inHeading || (node.type === 'element' && /^h[1-3]$/.test(node.tagName));
      const next = [];
      for (const ch of node.children) {
        if (heading && ch.type === 'text') {
          for (const p of splitCompounds(ch.value)) {
            next.push(p.nobr
              ? { type: 'element', tagName: 'span', properties: { className: ['nobr'] }, children: [{ type: 'text', value: p.t }] }
              : { type: 'text', value: p.t });
          }
        } else {
          walk(ch, heading); next.push(ch);
        }
      }
      node.children = next;
    };
    walk(tree, false);
  };
}
