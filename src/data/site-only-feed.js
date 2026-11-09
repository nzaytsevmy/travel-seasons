// Эти материалы согласованы для сайта и обычного RSS, но не для синдикации.
export const siteOnlySlugs = Object.freeze(['novyy-god-tailand-2027', 'novyy-god-vietnam-2027']);

// В старых статьях ссылки размещены отдельными строками. Не передаём эти
// строки в стороннюю ленту вместе с остальным текстом старых материалов.
export function withoutSiteOnlyLinks(body) {
  return body.split('\n')
    .filter(line => {
      if (!siteOnlySlugs.some(slug => line.includes(`/blog/${slug}/`))) return true;
      // Удалять произвольный абзац опасно: при другом формате нужна правка вручную.
      if (!/^\[[^\]]+\]\(\/blog\/[a-z0-9-]+\/\):\s+.+$/.test(line)) {
        throw new Error('Ссылка только для сайта должна быть отдельной строкой');
      }
      return false;
    })
    .join('\n');
}
