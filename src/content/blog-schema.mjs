// Single factory: Astro supplies its real image validator; source preflight validates the remaining same metadata.
export const blogSchema = (z, img) => z.object({
    title: z.string(),
    description: z.string(),
    lead: z.string().min(40).max(800).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: img(),
    coverQuality: z.number().int().min(50).max(75).default(65),
    coverAlt: z.string().min(15).optional(),
    coverCaption: z.string().optional(),
    author: z.string().default('Никита Зайцев'),
    tags: z.array(z.string()).default([]),
    destinations: z.array(z.string()).optional(),
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
    // Независимая оценка (с 03.09.2026): кто писал и где лежит артефакт рецензента
    // reviews/blog/<slug>.json. Гейт: scripts/article-review-gate.mjs.
    authoredBy: z.string().optional(),
    reviewRef: z.string().optional(),

    // Формат страницы (решение Никиты 05.09.2026). Подборка направлений — это
    // меню: не меньше 15 карточек, у каждой свой кадр. 05.09.2026 запрос «куда
    // поехать на новый год» получил аналитику цен на шесть дешёвых сценариев.
    // Поле необязательное, потому что старые статьи его не несут; гейт требует
    // его только у тронутых статей с заголовком-выбором.
    format: z.enum(['answer', 'guide', 'choice']).optional(),

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
    // Даёт две вещи — видимую читателю дату сверки фактов («проверено») и
    // ссылки на первоисточники в теле страницы. Дату обновления журнал НЕ задаёт
    // (с 09.09.2026): её даёт updatedDate, которую ставит только переработка, а
    // гейт следит, чтобы её не подкручивали без правок — src/data/freshness.js.
    checks: z.array(z.object({
      date: z.coerce.date(),
      what: z.string(),                    // что сверяли
      changed: z.string(),                 // что изменилось; «без изменений» — нормальный ответ
      // Пометка «правка техническая»: ссылка, опечатка, разметка. На даты не
      // влияет — с 09.09.2026 дату не двигает ни одна запись журнала
      // (tests/freshness-minor.test.mjs); поле осталось в старых записях как
      // пояснение читателю истории правок.
      minor: z.boolean().optional(),
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
  });
