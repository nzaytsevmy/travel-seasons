import { visit } from 'unist-util-visit';

/**
 * Wraps every <table> in <div class="table-wrap"> so it can scroll
 * horizontally on narrow screens without breaking the page layout.
 */
export default function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index === undefined) return;
      // Avoid double-wrapping
      if (parent.tagName === 'div' && parent.properties?.className?.includes('table-wrap')) return;

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
