import { blogSchema } from './blog-schema.mjs';
import { defineCollection, z, image } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image: img }) => blogSchema(z, img),
});

// Лента новостей /novosti/. Заметка — не отдельная страница, а пункт ленты:
// до 4 заметок в день с личным URL дали бы ~1460 тонких страниц в год, а это
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
    // A phrase to compare with actual search-surge observations, not a claim of popularity.
    attentionQuery: z.string().min(2).max(160).optional(),
    impact: z.enum(['high', 'medium']).default('medium'),
    // Оценка по news/RUBRIC.md, её ставит вторая модель. Ниже minScore не публикуем.
    score: z.number().min(0).max(5),
    archived: z.boolean().default(false),
    authoredBy: z.string().optional(),
    reviewRef: z.string().optional(),
    status: z.enum(['действует', 'принято, не вступило', 'отменено']).optional(),
    effectiveDate: z.coerce.date().optional(),
    reviewOn: z.coerce.date().optional(),
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
    imageChanges: z.string().optional(),
    imageTitle: z.string().optional(),
    // Запрос для поиска фото — по-английски: сток ищет по английским тегам.
    photoQuery: z.string().optional(),
  }),
});

export const collections = { blog, news };
