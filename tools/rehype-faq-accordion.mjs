import { visit } from 'unist-util-visit';

/**
 * Transforms a markdown ## FAQ section into a premium accordion.
 *
 * Input markdown:
 *   ## FAQ
 *
 *   **Сколько стоит?**
 *   От 750 000 ₽ под ключ. Зависит от класса корабля и сезона.
 *
 *   **Когда лучше ехать?**
 *   Ноябрь — март. Подробнее в [таблице сезонов](/seasons/).
 *
 * Output HTML:
 *   <h2>FAQ</h2>
 *   <div class="faq-block">
 *     <details class="faq-item">
 *       <summary>Сколько стоит?</summary>
 *       <div class="faq-answer"><p>От 750 000 ₽ под ключ. ...</p></div>
 *     </details>
 *     ...
 *   </div>
 *
 * Detection: H2 whose text contains "FAQ" or "FAQs" (case-insensitive).
 * Picks up sibling <p> elements until the next H2 or HR.
 *
 * Question format supported:
 *   <p><strong>Вопрос?</strong>\nответ-текст-в-том-же-параграфе</p>
 *   <p><strong>Вопрос?</strong></p><p>Ответ-в-следующем-параграфе</p>
 */

function isHeading2(node) {
  return node && node.type === 'element' && node.tagName === 'h2';
}
function isHeading3(node) {
  return node && node.type === 'element' && node.tagName === 'h3';
}
function isHr(node) {
  return node && node.type === 'element' && node.tagName === 'hr';
}
function nodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
}
function startsWithBoldQuestion(p) {
  if (!p || p.type !== 'element' || p.tagName !== 'p') return false;
  const first = p.children?.[0];
  if (!(first && first.type === 'element' && first.tagName === 'strong')) return false;
  // Question must end with ? — иначе это эмфаз-bold в начале ответа
  // (e.g. «**Нет.** Безвизовый въезд...»)
  const text = nodeText(first).trim();
  return /\?\s*$/.test(text);
}

export default function rehypeFaqAccordion() {
  return (tree) => {
    if (!tree || !Array.isArray(tree.children)) return;

    // Iterate top-level children to find FAQ section
    const newChildren = [];
    let i = 0;
    while (i < tree.children.length) {
      const node = tree.children[i];
      const isFaqHeader = isHeading2(node) && /\bFAQ\b/i.test(nodeText(node));
      if (!isFaqHeader) {
        newChildren.push(node);
        i++;
        continue;
      }

      // Collect FAQ items until next H2 or HR
      newChildren.push(node);
      const items = [];
      let j = i + 1;
      while (j < tree.children.length) {
        const sib = tree.children[j];
        if (isHeading2(sib) || isHr(sib)) break;

        if (isHeading3(sib)) {
          // h3 question format: <h3>Вопрос?</h3><p>Ответ</p>
          items.push({
            question: nodeText(sib).trim(),
            answerNodes: [],
          });
        } else if (startsWithBoldQuestion(sib)) {
          // Bold question format: <p><strong>Вопрос?</strong>\nОтвет</p>
          const strong = sib.children[0];
          const questionText = nodeText(strong).trim();
          const answerInline = sib.children.slice(1);
          while (answerInline.length && answerInline[0].type === 'text' && /^\s+$/.test(answerInline[0].value)) {
            answerInline.shift();
          }
          if (answerInline.length && answerInline[0].type === 'text') {
            answerInline[0] = { ...answerInline[0], value: answerInline[0].value.replace(/^\s+/, '') };
          }
          items.push({
            question: questionText,
            answerNodes: answerInline.length
              ? [{ type: 'element', tagName: 'p', properties: {}, children: answerInline }]
              : [],
          });
        } else {
          // Continuation paragraph — append to last item
          if (items.length) {
            items[items.length - 1].answerNodes.push(sib);
          }
        }
        j++;
      }

      if (items.length) {
        const accordion = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['faq-block'] },
          children: items.map((it) => ({
            type: 'element',
            tagName: 'details',
            properties: { className: ['faq-item'] },
            children: [
              {
                type: 'element',
                tagName: 'summary',
                properties: { className: ['faq-q'] },
                children: [{ type: 'text', value: it.question }],
              },
              {
                type: 'element',
                tagName: 'div',
                properties: { className: ['faq-a'] },
                children: it.answerNodes,
              },
            ],
          })),
        };
        newChildren.push(accordion);
        i = j;
      } else {
        i++;
      }
    }
    tree.children = newChildren;
  };
}
