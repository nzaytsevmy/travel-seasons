import { defineCollection, z, image } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image: img }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: img(),
    author: z.string().default('Никита Зайцев'),
    tags: z.array(z.string()).default([]),
    tripDate: z.string().optional(),
    tripPlace: z.string().optional(),
    sourceType: z.enum(['personal', 'compilation', 'hybrid']).default('hybrid'),
    // Паспорт статьи (решение Никиты 13.08.2026): без замера спроса и без
    // адверсарной проверки статья не выходит. Поля необязательные в схеме,
    // потому что 67 старых статей их не имеют, — обязательность проверяет
    // гейт и только на статьях, тронутых в заходе.
    demand: z.string().optional(),   // «8 005/мес, Вордстат 13.07–11.08.2026»
    reviewed: z.coerce.date().optional(),  // дата адверсарной проверки фактов

    coverPosition: z.string().default('center'),
    coverPositionCard: z.string().default('center'),
    howto: z.object({
      name: z.string(),
      description: z.string().optional(),
      totalTime: z.string().optional(),
      estimatedCost: z.object({ currency: z.string(), value: z.string() }).optional(),
      steps: z.array(z.object({ name: z.string(), text: z.string() })),
    }).optional(),
  }),
});

// Лента новостей /novosti/. Заметка — не отдельная страница, а пункт ленты:
// 2–4 заметки в день с личным URL дали бы ~1000 тонких страниц в год, а это
// прямой риск фильтра за малополезные страницы на весь домен.
//
// ПРАВИЛА ВЕДЕНИЯ (те же, что у ленты изменений в src/data/visa-changes.js —
// нарушение делает ленту бесполезной):
//  1. `sources` — только первоисточник: МИД, посольство, авиавласти, нацпарк,
//     перевозчик, научный институт. Медиа допустимо как наводка «где искать»,
//     но факт берётся у того, кто его объявил.
//  2. `date` — дата САМОГО события, `checked` — когда мы сверили факт руками.
//  3. Не писать волатильный статус, который протухнет за дни.
//  4. `status` обязателен для темы visa: путать «действует» и «принято, но не
//     вступило» опаснее всего — человек планирует поездку по правилу, которого
//     ещё нет.
const news = defineCollection({
  type: 'content',
  schema: ({ image: img }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    checked: z.coerce.date(),
    // Когда заметка появилась В ЛЕНТЕ. Именно по этому полю лента и
    // сортируется: читатель приходит за новым и должен видеть сверху то, что
    // добавлено последним, а не то, чьё СОБЫТИЕ случилось позже. 03.08.2026
    // две свежие заметки уехали вниз, потому что их события были 26 и 28 июля.
    // Если поля нет — берём `checked`, оно у старых заметок совпадает с датой
    // добавления. `checked` при этом остаётся про доверие: когда сверяли факты.
    added: z.coerce.date().optional(),
    topic: z.enum(['visa', 'nature', 'transport']),
    impact: z.enum(['high', 'medium']).default('medium'),
    // Оценка по news/RUBRIC.md, её ставит вторая модель. Ниже minScore не публикуем.
    score: z.number().min(0).max(5),
    status: z.enum(['действует', 'принято, не вступило', 'отменено']).optional(),
    countries: z.array(z.string()).default([]),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).min(1),
    // Капсула-ответ: 40–60 слов прямого ответа ДО контекста. Именно её извлекают
    // нейроответы, и именно её читает человек, решая, читать ли дальше.
    tldr: z.string().optional(),
    // Конкретный кадр, если он есть. Обычно пусто: картинку подбирает
    // src/data/news-images.js из уже отснятого, чужие фото не берём.
    image: img().optional(),
    imageAlt: z.string().optional(),
    // Атрибуция обязательна, если кадр не наш: свободная лицензия почти всегда
    // требует указать автора и лицензию. Без этих полей гейт заметку не пустит.
    imageCredit: z.string().optional(),
    imageLicense: z.string().optional(),
    imageLicenseUrl: z.string().optional(),
    imageSource: z.string().optional(),
    imageTitle: z.string().optional(),
    // Запрос для поиска фото — по-английски: сток ищет по английским тегам.
    photoQuery: z.string().optional(),
  }),
});

export const collections = { blog, news };
