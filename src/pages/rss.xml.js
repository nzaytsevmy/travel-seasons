import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { byPubDate } from '../data/freshness.js';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'TravelTribe — Блог путешественника',
    description: 'Реальные поездки, живые цены, без воды. Япония, Африка, Бали, Новая Зеландия.',
    site: context.site,
    customData: '<language>ru-ru</language>',
    items: posts
      .sort(byPubDate)
      .map(post => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
      })),
  });
}
