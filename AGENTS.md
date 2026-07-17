# AGENTS.md

Основной операционный контракт для этого репозитория — [`CLAUDE.md`](./CLAUDE.md)
(SEO-гейт, дизайн-канон, правила контента). Читай его перед правками страниц/контента.

## Cursor Cloud specific instructions

Назначение раздела: долгоживущие, неочевидные нюансы запуска/тестов для будущих облачных агентов.
Установка зависимостей выполняется update-скриптом при старте VM — здесь её дублировать не нужно.

### Что это за проект
- Статический сайт на **Astro 5** (SSG, `output: static`), собирается в `dist/`. **Бэкенда/БД нет.**
- Для dev/build/test **не нужны секреты и внешние сервисы**: цены рейсов закоммичены
  (`src/data/prices-cache.json`), сайт собирается офлайн. `TRAVELPAYOUTS_TOKEN` нужен только
  для обновления цен (`scripts/fetch-prices.mjs`), не для разработки.
- ⚠️ `README.md` и `CONTRIBUTING.md` **устарели** (описывают старую vanilla-HTML версию).
  Источник истины — `package.json` и `astro.config.mjs`, не README.

### Тулчейн
- Пакетный менеджер — **npm** (`package-lock.json`). `npm ci`/`npm install` запускают `postinstall`
  → `patch-package` (патч `patches/astro-broken-links-checker+1.1.0.patch`); запускать из корня репо.
- Node: CI использует **20**; VM работает на Node 22 — Astro 5 совместим, сборка/тесты проходят.

### Запуск / сборка / линт / тест (команды — в `package.json` scripts)
- **Dev-сервер:** `npm run dev` → http://localhost:4321 (для разработки).
- **Build:** `npm run build` — долгий (~4 мин, ~2326 страниц). `prebuild` генерит `llms.txt`.
  Пре-existing хвост: ~14 старых HTML не сжимаются astro-compress — это не регресс (см. `CLAUDE.md`).
- **Lint (CSS):** `npm run check:css` — **неблокирующий** (`|| true`). stylelint спотыкается о
  frontmatter `.astro` (сотни pre-existing CssSyntaxError) — это НЕ реальный гейт, игнорировать.
- **SEO-аудит:** `npm run check:seo` — сканирует `dist/`, поэтому **сначала `npm run build`**.
- **Visual/functional тесты:** `npm run check:visual` (Playwright). Неочевидное:
  - baseURL тестов = **http://localhost:4322** (built preview), а НЕ dev-сервер 4321.
  - Playwright config **НЕ поднимает webServer сам**. Перед тестами подними preview на 4322:
    `npm run preview:test` (делает build+preview), либо после уже готового `dist/`
    просто `npx astro preview --port 4322` в фоне.
  - Нужны браузеры Playwright (chromium + webkit) — ставятся update-скриптом.
  - Часть webkit-mobile снапшотов может быть `skipped` — это норма, не падение.
- Git-гейт `scripts/pre-push.sh` (build → check:seo → preview → check:visual) существует, но
  `lefthook.yml` сейчас закомментирован — хук не активен по умолчанию.
