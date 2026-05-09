import { visit } from 'unist-util-visit';

/**
 * Two-in-one transform applied to every <table> from markdown:
 *
 * 1. Wraps the table in <div class="table-wrap"> for horizontal scroll
 *    fallback on very narrow viewports (or unusually wide tables).
 * 2. Copies each <th> text into a `data-label` attribute on the matching
 *    <td> in every body row, so CSS can stack cells as cards on mobile
 *    (Chris Coyier's classic pattern, no JS, no markdown changes).
 *
 * Resulting HTML for a markdown table like
 *
 *   | Класс | Цена |
 *   |-------|------|
 *   | Эконом | 800k |
 *
 * becomes:
 *
 *   <div class="table-wrap">
 *     <table>
 *       <thead><tr><th>Класс</th><th>Цена</th></tr></thead>
 *       <tbody>
 *         <tr>
 *           <td data-label="Класс">Эконом</td>
 *           <td data-label="Цена">800k</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 */

function nodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) {
    return node.children.map(nodeText).join('');
  }
  return '';
}

function findFirst(node, tagName) {
  if (!node || !Array.isArray(node.children)) return null;
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === tagName) return child;
  }
  return null;
}

function findAll(node, tagName) {
  const out = [];
  if (!node || !Array.isArray(node.children)) return out;
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === tagName) out.push(child);
  }
  return out;
}

export default function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index === undefined) return;
      // Avoid double-wrapping if rerun
      if (parent.tagName === 'div' && parent.properties?.className?.includes('table-wrap')) return;

      // 1) Extract column labels from <thead><tr><th>...
      const thead = findFirst(node, 'thead');
      const labels = [];
      if (thead) {
        const headerRow = findFirst(thead, 'tr');
        if (headerRow) {
          for (const th of findAll(headerRow, 'th')) {
            labels.push(nodeText(th).trim());
          }
        }
      }

      // 2) Stamp data-label onto every <td> in every body row
      const tbody = findFirst(node, 'tbody');
      if (tbody && labels.length > 0) {
        for (const tr of findAll(tbody, 'tr')) {
          const cells = findAll(tr, 'td');
          cells.forEach((td, i) => {
            const label = labels[i];
            if (!label) return;
            td.properties = td.properties || {};
            if (!('dataLabel' in td.properties || 'data-label' in td.properties)) {
              td.properties['data-label'] = label;
            }
          });
        }
      }

      // 3) Wrap in .table-wrap for the rare overflow case
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}
