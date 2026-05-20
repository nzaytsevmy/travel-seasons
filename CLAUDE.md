# CLAUDE.md — traveltribe.ru (Astro SSG)

Авторский travel-блог, аудитория RU + глобал → **значимы оба поисковика: Яндекс и Google**.
Планка качества — **10/10 SEO 2026** на КАЖДОЙ странице. Полный стандарт с источниками:
[`SEO-CHECKLIST-2026.md`](./SEO-CHECKLIST-2026.md). Этот файл — операционный контракт:
правила в императиве + обязательный гейт. Расхождение CLAUDE.md vs CHECKLIST → прав CHECKLIST,
синхронизируй.

Источники правил (лучшие специалисты, не блог-компиляции): Google Search Essentials /
Search Central (канон Google) · разбор факторов Яндекса 2026 (поведенческие + коммерческие
веса) · AEO-фреймворк Aleyda Solis (Orainti) / Lily Ray (Amsive) / Mike King (iPullRank).

---

## 🚦 ОБЯЗАТЕЛЬНЫЙ гейт перед коммитом (любая правка страницы/контента)

Коммит без всех 5 пунктов запрещён. Доказано рабочим в сессии 2026-05-16.

1. **build** — `npm run build`, exit 0, 0 ошибок кроме известных 14 `Cannot compress` (pre-existing).
2. **Visual @402 + @1280** — Playwright-скрин КАЖДОГО изменённого типа, оба вьюпорта.
   `build green ≠ feature works`. Длинные страницы — прицельный вьюпорт нужного блока, не только fullPage.
3. **CWV (Lighthouse mobile)** на изменённых типах: **CLS < 0.1** (цель 0.000), LCP < 2.5s, TBT≈0.
   Любой новый блок (FAQ/byline/карточки) обязан давать CLS 0 — статичный in-flow, без сдвига.
4. **Schema-валидация по `dist/`** — JSON-LD парсится; FAQPage(name+acceptedAnswer.text),
   Article/BlogPosting(headline+datePublished+author), Org/WebSite/Person; нет дублей @id;
   все `author/founder/publisher` `@id` резолвятся в графе страницы.
5. **Playwright-регресс** зелёный. Эталоны устаревают — если фейлы на нетронутых страницах,
   сначала A/B на чистом HEAD (доказать pre-existing), `--update-snapshots` только после
   ручной визуальной верификации текущего рендера. Молча не двигать threshold (маскирует регресс).

После правки числа/факта/имени — grep по всему репо, обновить везде в той же сессии
(вкл. `public/llms.txt` + `llms-full.txt`).

---

## Правила SEO 2026 (императив)

### Технический фундамент
- HTTPS везде; canonical self-referential абсолютный на каждой стр.
- robots: `index, follow, max-image-preview:large, max-snippet:-1`; noindex точечно (404).
- sitemap: только canonical+200, **реальный lastmod** (не дата сборки).
- AI-боты НЕ блокировать в robots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
- Ссылки краулабельны (`<a href>`); 0 битых; нет orphan-страниц.

### On-page (Google Helpful Content + утечка 2024)
- **Ключ В НАЧАЛЕ `<title>`** (≤60) — `titlematchScore` из утечки явно меряет. Один H1, H2/H3 = под-вопросы. meta description ≤155.
- **Критичный контент — в начало страницы** (Mustang усекает по токен-лимиту).
- Тематическая узость: не уводить от темы сайта (`siteRadius` штрафует off-topic дрейф).
- Оригинальный опыт/анализ > пересказа. ❌ запрещено: контент «под трафик», масс-AI без ценности, **искусственная смена даты без правок контента**.
- Изображения: descriptive alt, lazy кроме hero, **`formats={['webp']}`** — НИКОГДА avif
  (Safari + astro-compress = broken-image, hard-rule).
- Внутренняя триангуляция: 3+ контекстных ссылки hub↔visa↔seasons↔blog, descriptive-анкор.
- Анти-каннибализация: hub и пост не конкурируют за один интент.

### E-E-A-T (QRG ред. 09.2025; lite-YMYL: visa/деньги — повышенный)
- **Trust — приоритет №1 из E-E-A-T** (QRG); Experience (личный travel-опыт) — сильнейший сигнал.
- Видимый byline на КАЖДОЙ содержательной странице: автор-ссылка на `/about/` +
  `@traveltriberu` + дата актуальности (`DATA_UPDATED_RU`). Паттерн классов `*-byline`
  с `.byline-author`/`.byline-fresh`.
- Author/Person `@id https://traveltribe.ru/about/#person` (глобально в Layout) —
  **консистентная entity автора** во всех материалах (утечка: Google меряет `isAuthor`).
- Контент отвечает на **Кто / Как / Почему** создан (QRG-линза); раскрывать AI-использование.
- **YMYL расширен** (QRG 09.2025): деньги/здоровье + общество/госуслуги/выборы. Ссылка на
  первоисточник (МИД РФ/посольство/банк) + дисклеймер актуальности.
- Цифры конкретны, датированы, дата консистентна в title/URL/Schema (утечка: конфликт = сигнал).
- **Не фабриковать YMYL-факты** (визы/деньги) в FAQ — только методология/отсылка к таблице с источниками.

### Schema
- Organization + WebSite + SearchAction + Person — **глобально в `Layout.astro`**
  (базовый граф, дедуп по @id). НЕ дублировать на страницах. Страница добавляет только
  свой тип (Article/CollectionPage/WebPage) + FAQPage + BreadcrumbList.
- BreadcrumbList на всех вложенных (3 уровня). FAQPage только если FAQ виден на странице
  (schema без видимого контента = спам-флаг Google).

### AEO / GEO (цитируемость в AI-выдаче — слой 2026)
- Answer-first: прямой ответ ДО контекста; H2 = вопрос, ответ сразу под ним (×2.8 цитируемость).
- Абзацы 2–4 предложения; списки, таблицы, **жирные** термины.
- Свежесть: original + last-updated дата (70% цитируемых AI стр. обновлены <12 мес).
- speakable на ключевых типах (h1 + tldr-селектор).

### Яндекс-специфика (Google-чеклисты это игнорируют)
- Поведенческие — **главный вес** (с 2011). Алгоритм **«Тайфун» 2025** встроил антифрод ПФ
  в формулу: накрутка = подъём фильтра. Сильный title+description под CTR, контент держит (dwell).
- **ИКС/Проксима** растить только органикой (полезность, доверие, бренд, прямой трафик Telegram→сайт).
- Фильтры: **Баден-Баден** (текстовая переоптимизация — естественный язык, не спамить ключами),
  **Минусинск** (ссылочный спам — 0 биржевых ссылок), **АГС** (малополезные страницы).
- Без агрессивных попапов, перекрывающих контент.

### Performance / CWV (фактор обоих)
- LCP<2.5s, INP<200ms, CLS<0.1. hero eager+fetchpriority=high, остальное lazy.
- Шрифты subset + `font-display:optional` (CLS). Реальная mobile-проверка @402.

### Affiliate / 38-ФЗ (ru-сайт)
- Все CPA/партнёрские ссылки: `erid` в URL + видимая маркировка «Реклама»/`rel="sponsored"`.

### Стратегия при создании новых страниц (топикальная авторитетность, канон 2026)
- Не одиночная страница, а кластер: seed-тема → 3–5 кластеров → 6–12 связанных страниц
  (pillar-хаб → cluster → support). Google Core Update 03.2026: 20 связанных статей > 1 мегагайд.
- Покрыть 4 интента темы (инфо/коммерч/транзакц/нишевый); вопросы из People Also Ask/форумов.
- Каденс важнее всплеска; pillar освежать каждые 60–90 дней реальными данными (не косметика даты).
- Единый Site Knowledge Graph: сущности (страны/визы/автор/бренд) консистентны во всём графе schema.

### Измерение (после деплоя в прод)
- Schema → [Rich Results Test](https://search.google.com/test/rich-results) + Яндекс-валидатор, 0 ошибок.
- CWV поле (решает в ранжировании, не lab): GSC Core Web Vitals / [CrUX PageSpeed](https://pagespeed.web.dev/).
- GSC (Indexing/Manual Actions/Links) + Яндекс.Вебмастер (ИКС/Качество/фильтры) после крупных правок.

---

## Инварианты репо (выученные грабли — не повторять)
- Глобальная schema живёт ТОЛЬКО в `Layout.astro`; страница, дублирующая #org/#website/#person
  → дубль @id. Если странице нужен свой Person (`/about/`) — Layout его подавляет (`_pageHasPerson`).
- `japan.astro`/`antarctica.astro` — кастомные хабы, держать на уровне generated `[slug].astro`
  (FAQ/byline/Author schema), но НЕ прогонять через generic шаблон (потеряется контент).
- `blog/index` — листинг, Blog+Person schema достаточно; FAQ не навязывать
  («контент ради ранжирования» — прямой запрет чеклиста).
- llms.txt — curated индексные хабы (`/visa/`, `/countries/`, `/seasons/`), НЕ дамп 140 deep-URL.
- Playwright visual baseline исторически устаревал — не принимать фейлы нетронутых страниц
  за свой регресс без A/B на чистом HEAD. blog-japan fullPage флейкует под параллелью (pre-existing).
- Известный pre-existing хвост: 14 старых HTML не сжимаются astro-compress; calculator LCP ~2.7s
  (JS-heavy) — не блокеры, не выдавать за свежий регресс.

## Стиль (см. также глобальный ~/.claude/CLAUDE.md)
Русский, тезисами, без воды и резюме в конце. Минимум кода, менять только нужное.
Сложная задача → озвучить подход фразой, получить ОК. Неоднозначность → назвать + свой вариант.
Не подгонять оценку «10/10» — честный потолок таблицей.

---

## Design canon (кодифицирован 2026-05-20 после провалов с pillowy-FAQ и emoji-tips)

Программные шаблоны (`/packing/`, `/trips/[m]/[c]/`, `/[slug]/`, новые фичи) идут через **editorial-канон**, а не реюз blog-accordion стилей.

### Использовать
- **Hairline-grid** для tips/советов/чек-листов → класс `.editorial-grid` или локальный analog (`pack-list`, `tc-tips-list`).
- **Gold accent-left CTA** для cross-links → `.editorial-cta` (background rgba(gold, 0.05), border-left 3px gold).
- **Hairline FAQ** (НЕ реюз blog `.faq-item`) → `.editorial-faq` или локальный `pack-faq-*`/`tc-faq-*`.
- **Gradient+emoji hero** → `.editorial-hero` (LCP <1 с, CLS 0, использует `d.visual.g1/g2`).
- **scroll-margin-top: 80px** на ВСЕХ H2 в программных секциях (фикс перекрытия sticky-nav).
- **Локальные классы** (`pack-*`, `tc-*`, `qh-*` префикс по странице) вместо реюза global классов — изолирует от наследования.

### НЕ использовать (anti-patterns, проверены в кровь)
- ❌ `.faq-item` / `.faq-block` global на программных страницах (pillowy bg+border-radius для blog).
- ❌ `border-radius > 12px` на текстовых секциях (FAQ, tips, lists) — UI-kit-look, не editorial.
- ❌ Mixed emoji-icons (📅🛡📱👨‍👩‍👧📊🛂💳) как декор-набор — разностилевые, шум. Либо все lucide-line, либо без декор-иконок.
- ❌ Generic background-filled cards-grid 4×2 / 3×3 с shadow на hover — bootstrap-look.
- ❌ Картинки в hero программных страниц — LCP риск. Gradient+emoji = LCP <1 с.
- ❌ Hard-coded ширина >1920w для hero-cover — bandwidth waste на mobile.
- ❌ `formats={['avif']}` в Picture — Safari+astro-compress = broken image (`feedback_safari_avif_bug`).

### Quality gate
Перед коммитом нового программного шаблона:
1. Все H2 имеют `scroll-margin-top` (через editorial-* класс или локальный override).
2. Нет global-классов `.faq-item`, `.faq-block` в JSX программной страницы.
3. CTA-блоки используют `.editorial-cta` pattern (gold-left, не card-shadow).
4. Visual @402 + @1280 Playwright прогон на представителе типа.
