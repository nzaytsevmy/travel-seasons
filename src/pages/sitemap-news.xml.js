import { getCollection } from 'astro:content';
import { recentNews, splitNews, renderNewsSitemap, renderNewsSitemapIndex } from '../data/news-discovery.js';
export async function GET() {
  const records = recentNews(await getCollection('news'));
  const pages = splitNews(records);
  const xml = pages.length > 1 ? renderNewsSitemapIndex(pages) : renderNewsSitemap(records);
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
