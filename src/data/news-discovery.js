// Discovery data uses publication/check dates, never an invented date of the event.
export const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
export const NEWS_SITEMAP_SIZE = 1000;
export const NEWS_SITE = 'https://traveltribe.ru';
function validDate(value) {
  if (!(value instanceof Date) && (typeof value !== 'string' || !value.trim())) return null;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date : null;
}
export function latestFeedCheck(entries) {
  const dates = entries.map(e => validDate(e?.data?.checked)).filter(Boolean);
  return dates.length ? new Date(Math.max(...dates.map(d => d.valueOf()))) : null;
}
export function recentNews(entries, now = new Date()) {
  const time = validDate(now);
  if (!time) throw new TypeError('A valid build date is required.');
  const seen = new Set();
  return entries.flatMap(entry => {
    const d = entry.data ?? {};
    // checked is mutable and cannot establish first publication.
    const published = validDate(d.added);
    if (d.archived || !published || published > time || time - published >= NEWS_WINDOW_MS) return [];
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.slug) || !String(d.title ?? '').trim()) throw new Error('Invalid news slug or title.');
    if (seen.has(entry.slug)) throw new Error(`Duplicate news URL: ${entry.slug}`);
    seen.add(entry.slug);
    return [{ slug: entry.slug, title: d.title, published: published.toISOString() }];
  }).sort((a, b) => b.published.localeCompare(a.published) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}
export function splitNews(records) {
  const pages = [];
  for (let i = 0; i < records.length; i += NEWS_SITEMAP_SIZE) pages.push(records.slice(i, i + NEWS_SITEMAP_SIZE));
  return pages;
}
export function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}
export function renderNewsSitemap(records) {
  if (records.length > NEWS_SITEMAP_SIZE) throw new Error('Split news sitemaps into at most 1000 entries.');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
    records.map(n => `  <url><loc>${NEWS_SITE}/novosti/${escapeXml(n.slug)}/</loc><news:news>` +
      '<news:publication><news:name>TravelTribe</news:name><news:language>ru</news:language></news:publication>' +
      `<news:publication_date>${escapeXml(n.published)}</news:publication_date>` +
      `<news:title>${escapeXml(n.title)}</news:title></news:news></url>`).join('\n') + '\n</urlset>\n';
}
export function renderNewsSitemapIndex(pages) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map((_, i) => `  <sitemap><loc>${NEWS_SITE}/sitemap-news/${i + 1}.xml</loc></sitemap>`).join('\n') + '\n</sitemapindex>\n';
}
