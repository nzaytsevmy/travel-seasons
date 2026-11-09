import { feedEntries } from './news.js';

export const NEWS_TOPICS = [
  { topic: 'visa', slug: 'vizy-i-vezd', title: 'Новости виз и правил въезда',
    description: 'Изменения виз, документов и правил въезда: кого касается новое условие, с какой даты оно действует и что проверить перед поездкой.' },
  { topic: 'transport', slug: 'transport-i-dostup', title: 'Новости перелётов и доступа к местам',
    description: 'Рейсы, закрытия троп и парков, ограничения транспорта: что меняется в маршруте, на какие даты и где искать продолжение сюжета.' },
  { topic: 'nature', slug: 'priroda', title: 'Новости природы и путешествий',
    description: 'Открытия о животных, природные явления и события с датой: конкретный факт, его смысл и связь с местами, куда можно поехать.' },
  { topic: 'culture', slug: 'kultura-i-sobytiya', title: 'Новости культуры и событий',
    description: 'Выставки, фестивали и культурные события: где проходят, когда их увидеть и что проверить перед поездкой.' },
];
export const NEWS_TOPIC_PAGE_SIZE = 30;
export const newsTopicUrl = (slug, page = 1) => `/novosti/tema/${slug}/${page > 1 ? `${page}/` : ''}`;
export function activeNewsTopics(entries) {
  const topics = new Set(feedEntries(entries).map(entry => entry.data.topic));
  return NEWS_TOPICS.filter(topic => topics.has(topic.topic));
}
export function newsTopicPages(entries) {
  return NEWS_TOPICS.flatMap(topic => {
    const all = feedEntries(entries).filter(e => e.data.topic === topic.topic);
    const totalPages = Math.ceil(all.length / NEWS_TOPIC_PAGE_SIZE);
    return Array.from({ length: totalPages }, (_, i) => ({
      topic, page: i + 1, totalPages, totalItems: all.length,
      items: all.slice(i * NEWS_TOPIC_PAGE_SIZE, (i + 1) * NEWS_TOPIC_PAGE_SIZE),
    }));
  });
}

// Keep a previously published topic URL reachable if all its stories are
// archived, without resurfacing those stories in the current news feed.
export function newsTopicRoutes(entries) {
  const pages = newsTopicPages(entries);
  const active = new Set(pages.map(page => page.topic.topic));
  return [...pages, ...NEWS_TOPICS.filter(topic => !active.has(topic.topic))
    .map(topic => ({ topic, page: 1, totalPages: 1, totalItems: 0, items: [], retired: true }))];
}
export const inactiveNewsTopicPaths = entries => newsTopicRoutes(entries)
  .filter(page => page.retired).map(page => newsTopicUrl(page.topic.slug));
