// RSS ленты новостей. Не «чтобы был»: через RSS Telegram-канал публикует
// заметки автоматически, а читатель подписывается без бота. Это и есть
// механизм возвратов, ради которого лента затевалась.
//
// Ссылка ведёт на якорь: у заметки нет своей страницы, она пункт ленты. Пока
// месяц свежий — якорь живёт на /novosti/, потом на архиве месяца, поэтому
// адрес считаем через ту же функцию, что и страницы.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { archivedMonths, monthKey, formatDateRu, TOPIC_LABEL } from '../../data/news.js';

export async function GET(context) {
  const all = await getCollection('news');
  const archived = archivedMonths(all);
  const sorted = [...all].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, 60);

  return rss({
    title: 'TravelTribe — новости путешествий',
    description: 'Что меняется во въездных правилах и доступе к местам, и что нового ' +
                 'о дикой природе. Каждая заметка с датой и первоисточником.',
    site: context.site,
    customData: '<language>ru-ru</language>',
    items: sorted.map((e) => {
      const key = monthKey(e.data.date);
      const base = archived.has(key) ? `/novosti/${key}/` : '/novosti/';
      const head = e.data.status ? `${e.data.status} · ` : '';
      return {
        title: e.data.title,
        // Дата события, а не публикации: читателю важно, когда это произошло.
        pubDate: e.data.date,
        description: `${TOPIC_LABEL[e.data.topic]} · ${head}${formatDateRu(e.data.date)}. ${e.body.trim().split('\n')[0]}`,
        // Абсолютный URL, а не путь: при trailingSlash:'always' @astrojs/rss
        // дописывает слэш В КОНЕЦ строки, то есть ПОСЛЕ якоря («#slug/»), и
        // ссылка ведёт на верх страницы вместо нужной заметки.
        link: new URL(base, context.site).href + `#${e.slug}`,
      };
    }),
  });
}
