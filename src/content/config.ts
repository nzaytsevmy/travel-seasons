import { defineCollection, z, image } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image: img }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: img(),
    coverAlt: z.string().min(15).optional(),
    author: z.string().default('Никита Зайцев'),
    tags: z.array(z.string()).default([]),
    tripDate: z.string().optional(),
    tripPlace: z.string().optional(),
    sourceType: z.enum(['personal', 'compilation', 'hybrid']).default('hybrid'),
    sourceNote: z.string().optional(),
    showSourceDisclaimer: z.boolean().default(true),
    // Паспорт статьи (решение Никиты 13.08.2026): без замера спроса и без
    // адверсарной проверки статья не выходит. Поля необязательные в схеме,
    // потому что 67 старых статей их не имеют, — обязательность проверяет
    // гейт и только на статьях, тронутых в заходе.
    demand: z.string().optional(),   // «8 005/мес, Вордстат 13.07–11.08.2026»
    reviewed: z.coerce.date().optional(),  // дата адверсарной проверки фактов

    // Честный потолок качества. Старым статьям поле не навязываем, но гейт
    // требует его при следующей смысловой ревизии и проверяет все шесть осей.
    qualityScore: z.object({
      topic: z.number().min(0).max(10),
      facts: z.number().min(0).max(10),
      visuals: z.number().min(0).max(10),
      experience: z.number().min(0).max(10),
      internalLinks: z.number().min(0).max(10),
      legal: z.number().min(0).max(10),
      overall: z.number().min(0).max(10),
      ceiling: z.string().min(20),
    }).optional(),

    // Точечные сроки для фактов, которые портятся быстрее всей статьи.
    // reviewAfter попадает в общую очередь ревизий; fallback не даёт роботу
    // сохранять просроченную цифру только ради заполненного блока.
    volatileFacts: z.array(z.object({
      id: z.string(),
      checkedAt: z.coerce.date(),
      reviewAfter: z.coerce.date(),
      fallback: z.string().min(20),
    })).optional(),

    // Журнал проверок (решение Никиты 14.08.2026). Запись появляется ТОЛЬКО
    // после настоящей сверки: утверждение о проверке обязано быть проверкой.
    // Даёт три вещи сразу — видимую читателю свежесть с датой, ссылки на
    // первоисточники в теле страницы и честную дату обновления: она считается
    // из последней записи, а не хранится отдельным полем, которое нечем сверить.
    checks: z.array(z.object({
      date: z.coerce.date(),
      what: z.string(),                    // что сверяли
      changed: z.string(),                 // что изменилось; «без изменений» — нормальный ответ
      sources: z.array(z.object({          // первоисточники, по которым сверяли
        name: z.string(),
        url: z.string().url(),
      })).min(1),
    })).optional(),

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
    impact: z.enum(['high', 'medium']).default('medium'),
    // Оценка по news/RUBRIC.md, её ставит вторая модель. Ниже minScore не публикуем.
    score: z.number().min(0).max(5),
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
    imageTitle: z.string().optional(),
    // Запрос для поиска фото — по-английски: сток ищет по английским тегам.
    photoQuery: z.string().optional(),
  }),
});

export const collections = { blog, news };
