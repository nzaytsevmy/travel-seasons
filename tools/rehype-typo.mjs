import { visit, SKIP } from 'unist-util-visit';
import { typo } from '../src/utils/typo.js';

/**
 * Типограф для статей и заметок: те же неразрывности, что у шаблонов (src/utils/typo.js),
 * но для текста из markdown — предлог не висит в конце строки, число не отрывается от
 * единицы, короткая скобка не рвётся, диапазон «27–30» не делится по тире.
 *
 * Правило Никиты 10.09.2026: «чтобы такого никогда нигде не было». Шаблоны прогоняют
 * через typo() свои строки сами, а текст статей до этого шёл как есть.
 *
 * Код, преформатированный текст и формулы не трогаются — там пробел значим.
 */
const SKIP_TAGS = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'math', 'svg', 'textarea']);

export default function rehypeTypo() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'element' && SKIP_TAGS.has(node.tagName)) return SKIP;
      if (node.type === 'text' && typeof node.value === 'string') node.value = typo(node.value);
    });
  };
}
