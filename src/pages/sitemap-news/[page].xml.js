import { getCollection } from 'astro:content';
import { recentNews, splitNews, renderNewsSitemap } from '../../data/news-discovery.js';
export async function getStaticPaths() {
  const pages = splitNews(recentNews(await getCollection('news')));
  return pages.length > 1 ? pages.map((records, i) => ({ params: { page: String(i + 1) }, props: { records } })) : [];
}
export function GET({ props }) {
  return new Response(renderNewsSitemap(props.records), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
