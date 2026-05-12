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
        // 1) thousands separators: "1 200 000" → NBSP
        v = v.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`);
        // 2) currency follows number: "1000 ₽" / "10 $" / "5 €"
        v = v.replace(/(\d)\s+([₽$€¥£])/g, `$1${NBSP}$2`);
        // 3) currency precedes number: "$ 1000" / "€ 50"
        v = v.replace(/([₽$€¥£])\s+(\d)/g, `$1${NBSP}$2`);
        // 4) ranges: убираем пробелы вокруг тире — "+33 – 35" → "+33–35"
        v = v.replace(/(\d)\s*[–—-]\s*(\d)/g, `$1–$2`);
        // 5) percent: "30 %"
        v = v.replace(/(\d)\s+%/g, `$1${NBSP}%`);
        // 6) температура: "21 °C" / "−10 °F"
        v = v.replace(/(\d)\s+(°[CF])/g, `$1${NBSP}$2`);
        // 7) расстояния и время: "5200 м", "100 км", "1.5 ч"
        v = v.replace(/(\d)\s+(м|км|см|мм|ч|мин|сек|кг|г|т|л)\b/g, `$1${NBSP}$2`);
        // 8) длительности словами: "10 дней", "3 недели", "2 месяца"
        v = v.replace(/(\d)\s+(дн[ейяь]|нед(?:ел[еияь])?|месяц[аев]?|мес\.?|лет|год[ау]?|часов?|минут[ы]?)\b/gi, `$1${NBSP}$2`);
        // 9) валюта словами: "152 PEN", "200 лир", "1700 ¥"
        v = v.replace(/(\d)\s+(PEN|USD|EUR|RUB|GBP|JPY|CNY|TRY|лир[ыа]?|¥)\b/g, `$1${NBSP}$2`);
        // 10) множитель: "×3", "x2"
        v = v.replace(/(\d)\s*([×x])\s*(\d)/g, `$1$2$3`);
        node.value = v;
      });
    });
  };
}
