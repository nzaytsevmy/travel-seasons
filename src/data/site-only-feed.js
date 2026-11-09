// Эти материалы согласованы для сайта и обычного RSS, но не для синдикации.
export const siteOnlySlugs = Object.freeze(['novyy-god-tailand-2027', 'novyy-god-vietnam-2027', 'hram-uluvatu-bali']);

// В старых статьях ссылки размещены отдельными строками. Не передаём эти
// строки в стороннюю ленту вместе с остальным текстом старых материалов.
export function withoutSiteOnlyLinks(body) {
  return body.split('\n')
    .map(line => {
      if (!siteOnlySlugs.some(slug => line.includes(`/blog/${slug}/`))) return line;
      // Ссылка в путеводителе Бали встроена в пункт списка: сохраняем все слова,
      // удаляя только ссылку на статью, которая не согласована для синдикации.
      const inlineUluwatu = '[Храм Улувату (Pura Luhur Uluwatu)](/blog/hram-uluvatu-bali/)';
      if (line.startsWith(`1. **${inlineUluwatu}.**`)) {
        const unlinked = line.replace(inlineUluwatu, 'Храм Улувату (Pura Luhur Uluwatu)');
        if (siteOnlySlugs.some(slug => unlinked.includes(`/blog/${slug}/`))) {
          throw new Error('Неизвестный формат ссылки только для сайта');
        }
        return unlinked;
      }
      // Удалять произвольный абзац опасно: при другом формате нужна правка вручную.
      const standalone = line.match(/^\[[^\]]+\]\(\/blog\/([a-z0-9-]+)\/\):\s+(.+)$/);
      if (!standalone || !siteOnlySlugs.includes(standalone[1]) || /\[[^\]]+\]\([^)]+\)/.test(standalone[2]) || siteOnlySlugs.some(slug => standalone[2].includes(`/blog/${slug}/`))) {
        throw new Error('Ссылка только для сайта должна быть отдельной строкой');
      }
      return null;
    })
    .filter(line => line !== null)
    .join('\n');
}
