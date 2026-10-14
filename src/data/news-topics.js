import { feedEntries } from './news.js';

export const NEWS_TOPICS = [
  { topic: 'visa', slug: 'vizy-i-vezd', title: 'Новости виз и правил въезда',
    description: 'Изменения виз, документов и правил въезда: кого касается новое условие, с какой даты оно действует и что проверить перед поездкой.' },
  { topic: 'transport', slug: 'transport-i-dostup', title: 'Новости перелётов и доступа к местам',
    description: 'Рейсы, закрытия троп и парков, ограничения транспорта: что меняется в маршруте, на какие даты и где искать продолжение сюжета.' },
  { topic: 'nature', slug: 'priroda', title: 'Новости природы и путешествий',
    description: 'Открытия о животных, природные явления и события с датой: конкретный факт, его смысл и связь с местами, куда можно поехать.' },
];
export const NEWS_TOPIC_PAGE_SIZE = 30;
export const newsTopicUrl = (slug, page = 1) => `/novosti/tema/${slug}/${page > 1 ? `${page}/` : ''}`;
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
