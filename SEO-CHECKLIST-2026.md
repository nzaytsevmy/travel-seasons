# SEO Checklist 2026 — traveltribe.ru (гейт 10/10)

Собрано из первоисточников и ведущих специалистов, не из общих блогов:
- **Google** — [Google Search Essentials / Search Central](https://developers.google.com/search/docs/essentials) (канон Google), Core Web Vitals — подтверждённый фактор.
- **Яндекс** — требования Яндекс.Вебмастера + [разбор факторов ранжирования Яндекс 2026](https://alekseichernysh.ru/blog/factory-ranzhirovaniya-2026) (поведенческие + коммерческие веса).
- **AI-поиск (AEO/GEO)** — [AEO-чеклист 2026, 48 факторов](https://www.airops.com/blog/aeo-audit-checklist) в духе фреймворков Aleyda Solis (Orainti), Lily Ray (Amsive), Mike King (iPullRank).

Сайт = Astro SSG, аудитория RU + глобал → **значимы оба: Яндекс и Google**. Visa-страницы = lite-YMYL (нужен повышенный EEAT). Монетизация = affiliate (нужен erid/маркировка — см. [[feedback_erid_required]]).

---

## A. Технический фундамент (Google + Яндекс)
- [ ] HTTPS на всех URL, без mixed content
- [ ] Canonical на каждой странице, self-referential, абсолютный URL
- [ ] robots: `index, follow, max-image-preview:large, max-snippet:-1`; noindex только где надо
- [ ] sitemap: только canonical-URL со статусом 200, **реальный lastmod** (не дата сборки), сегментация по типам
- [ ] AI-боты НЕ заблокированы в robots.txt: GPTBot, ClaudeBot, PerplexityBot, Google-Extended (решение осознанное)
- [ ] Краулабельные ссылки (`<a href>`, не JS-onclick), нет orphan-страниц
- [ ] Чистые короткие URL, без параметров мусора
- [ ] Нет 4xx/5xx на внутренних ссылках; битые ссылки = 0

## B. On-page / контент (Google helpful content + Яндекс)
- [ ] Уникальный people-first контент, покрытие интента, а не «под ключевик»
- [ ] Ключевая фраза в `<title>` (≤60 симв.), H1, первом абзаце, alt, анкорах внутр. ссылок
- [ ] Один H1, корректная иерархия H2/H3 (каждый H2 = ответ на под-вопрос)
- [ ] meta description ≤155 симв., уникальный, с интентом
- [ ] Все изображения: descriptive alt, lazy кроме hero, webp (НЕ avif — [[feedback_safari_avif_bug]])
- [ ] Внутренняя перелинковка: 3+ контекстных ссылки на смежные страницы (триангуляция hub↔visa↔seasons↔blog)

## C. E-E-A-T / авторство (Google EEAT + Яндекс YMYL)
- [ ] Видимый автор + дата: byline «Никита Зайцев · @traveltriberu · данные актуальны на DD MMM YYYY»
- [ ] Author/Person schema со ссылкой на профиль/About
- [ ] About-страница: кто, опыт, почему доверять (личный travel-опыт = Experience)
- [ ] YMYL (visa/деньги): ссылка на первоисточник (МИД РФ / посольство), дисклеймер актуальности
- [ ] Цифры конкретны и датированы (цена/срок/% отказов с датой проверки)

## D. Schema / структурированные данные
- [ ] Organization + WebSite + SearchAction (на главной)
- [ ] BreadcrumbList на всех вложенных страницах (3 уровня)
- [ ] Article/BlogPosting (блог) с datePublished + dateModified
- [ ] FAQPage там где есть FAQ-блок (visa, hub, seasons, calculator)
- [ ] Без ошибок в Rich Results Test и Яндекс-валидаторе

## E. AEO / GEO — цитируемость в AI-выдаче (новый слой 2026)
- [ ] Answer-first: прямой ответ ДО контекста, без длинных вступлений
- [ ] Каждый H2 семантически = вопрос, ответ сразу под ним (×2.8 цитируемость)
- [ ] Абзацы 2–4 предложения, простой синтаксис
- [ ] Скан-формат: списки, таблицы, **жирные** термины
- [ ] Свежесть: original + last-updated дата (70% цитируемых AI страниц обновлены <12 мес)
- [ ] Сущности консистентны (бренд TravelTribe, автор) на всех страницах

## F. Яндекс-специфика (часто игнорируют Google-чеклисты)
- [ ] Поведенческие: CTR сниппета (сильный title+description), dwell time (контент держит), низкий возврат к выдаче
- [ ] Брендовые/прямые визиты (Telegram-канал → сайт = сигнал)
- [ ] Коммерческие сигналы: контакты, прозрачность (для affiliate — честная маркировка «Реклама» + erid)
- [ ] Без агрессивной рекламы/попапов, перекрывающих контент
- [ ] Ссылочный спам = 0 (Яндекс 2026 усилил фильтр; биржевые ссылки = риск санкций, не покупать)
- [ ] Подключены Яндекс.Вебмастер + Google Search Console, ошибки 0

## G. Performance / Core Web Vitals (подтверждённый фактор обоих)
- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1 (mobile в приоритете)
- [ ] hero — eager + fetchpriority=high; остальное lazy
- [ ] Шрифты subset + font-display swap
- [ ] Mobile-friendly: реальная проверка @402 (контент = десктоп, не урезан)

## H. Минимумы 10/10 по типам страниц traveltribe
| Тип | Обязательно сверх baseline (A–G) |
|---|---|
| `visa/[slug]` (70) | FAQ≥5, byline+EEAT, YMYL-дисклеймер, ссылка МИД, answer-first ✅ готово |
| `[slug]` hub (68) | FAQ≥3, помесячная сетка, price-блок, CTA с erid, перелинковка ✅ готово |
| `seasons/[country]/[month]` | FAQ, breadcrumb, byline, answer-first по «когда ехать» |
| `blog/[...slug]` | BlogPosting+datesModified, автор, 3+ внутр. ссылки, FAQ если уместно |
| `index` | WebSite+SearchAction+Organization schema, не тонкий |
| `seasons` / `trips/*` / `countries` / `cards` (листинги) | breadcrumb, FAQ-блок про «как выбрать», EEAT-строка |
| `calculator` (high-intent) | FAQ-schema, описание методики, EEAT |
| `about` | глубокий EEAT (есть ✅), Person schema |
| `japan` / `antarctica` (кастом) | **подтянуть до hub-стандарта** — сейчас FAQ=1, byline=0 (нестыковка) |
| `404` | noindex, полезные ссылки назад |

---

**Гейт «не сломав»:** build green + Playwright-регресс зелёный (8 стр.) + точечный visual @402/@1280 каждого изменённого типа. Сьют покрывает только 8 страниц — новые типы проверять скриншотами вручную ([[feedback_visual_regression]] [[feedback_build_ne_visual]]).
