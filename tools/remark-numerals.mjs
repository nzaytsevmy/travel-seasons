import { visit } from 'unist-util-visit';

const NBSP = ' ';

/**
 * Replace ASCII spaces around numbers with NBSP inside table cells so that
 * "1 200 000 ₽" or "10–11 дней" never wraps mid-value across lines.
 *
 * Operates only on `tableCell` text nodes — keeps prose paragraphs untouched.
 */
export default function remarkNumerals() {
  return (tree) => {
    visit(tree, 'tableCell', (cell) => {
      visit(cell, 'text', (node) => {
        let v = node.value;
        // 1) thousands separators: "1 200 000" → "1 200 000" with NBSPs
        v = v.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`);
        // 2) currency follows number: "1000 ₽" / "10 $" / "5 €"
        v = v.replace(/(\d)\s+([₽$€¥£])/g, `$1${NBSP}$2`);
        // 3) currency precedes number: "$ 1000" / "€ 50"
        v = v.replace(/([₽$€¥£])\s+(\d)/g, `$1${NBSP}$2`);
        // 4) ranges with dashes: "10–11", "750 000–950 000"
        v = v.replace(/(\d)\s*([–—–—-])\s*(\d)/g, `$1${NBSP}$2${NBSP}$3`);
        // 5) percent: "30 %"
        v = v.replace(/(\d)\s+%/g, `$1${NBSP}%`);
        node.value = v;
      });
    });
  };
}
