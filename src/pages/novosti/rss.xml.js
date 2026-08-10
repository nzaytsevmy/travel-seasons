// RSS ленты новостей. Не «чтобы был»: через RSS Telegram-канал публикует
// заметки автоматически, а читатель подписывается без бота. Это и есть
// механизм возвратов, ради которого лента затевалась.
//
// Ссылка ведёт на страницу заметки. До 10.08.2026 своей страницы не было, и
// адрес приходилось собирать якорем к ленте или к архиву месяца — он менялся
// под заметкой, когда её месяц уезжал в архив, а у подписчика в ленте оставался
// старый. Теперь адрес у заметки один и навсегда.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { formatDateRu, TOPIC_LABEL, addedAt, newsUrl } from '../../data/news.js';

export async function GET(context) {
  const all = await getCollection('news');
  // Тот же порядок, что на странице: подписчик видит новое сверху.
  const sorted = [...all]
    .sort((a, b) => addedAt(b) - addedAt(a) || b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 60);

  return rss({
    title: 'TravelTribe — новости путешествий',
    description: 'Что меняется во въездных правилах и доступе к местам, и что нового ' +
                 'о дикой природе. Каждая заметка с датой и первоисточником.',
    site: context.site,
    customData: '<language>ru-ru</language>',
    items: sorted.map((e) => {
      const head = e.data.status ? `${e.data.status} · ` : '';
      return {
        title: e.data.title,
        // Дата события, а не публикации: читателю важно, когда это произошло.
        pubDate: e.data.date,
        description: `${TOPIC_LABEL[e.data.topic]} · ${head}${formatDateRu(e.data.date)}. ${e.body.trim().split('\n')[0]}`,
        link: new URL(newsUrl(e), context.site).href,
      };
    }),
  });
}
