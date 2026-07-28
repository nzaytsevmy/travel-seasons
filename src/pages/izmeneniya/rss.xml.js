// RSS ленты изменений визовых правил.
// Нужен не «чтобы был»: через RSS Telegram-канал может публиковать изменения
// автоматически, а читатель — подписаться без всякого бота. Это и есть механизм
// возвратов, ради которого лента затевалась.
import rss from '@astrojs/rss';
import { CHANGES_SORTED, formatDateRu } from '../../data/visa-changes.js';

export async function GET(context) {
  return rss({
    title: 'TravelTribe — изменения визовых правил',
    description: 'Что меняется во въездных правилах для россиян: сроки безвиза, сборы, ' +
                 'страховка, порядок подачи. Каждый пункт с датой и первоисточником.',
    site: context.site,
    customData: '<language>ru-ru</language>',
    items: CHANGES_SORTED.map((c) => ({
      title: c.title,
      // Дата события, а не публикации: читателю важно, когда изменилось правило.
      pubDate: new Date(`${c.date}T09:00:00Z`),
      description: `${c.status.charAt(0).toUpperCase()}${c.status.slice(1)} · ${formatDateRu(c.date)}. ${c.what}`,
      link: `/izmeneniya/#${c.id}`,
    })),
  });
}
