import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'TravelTribe — Блог путешественника',
    description: 'Реальные поездки, живые цены, без воды. Япония, Африка, Бали, Новая Зеландия.',
    site: context.site,
    customData: '<language>ru-ru</language>',
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map(post => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
      })),
  });
}
