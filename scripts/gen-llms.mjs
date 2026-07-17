#!/usr/bin/env node
// Генератор public/llms.txt и public/llms-full.txt из src/content/blog
// + даты DATA_UPDATED. Запускается в pre-push (feedback_llms_txt_sync) —
// файлы всегда синхронны контенту и имеют актуальную дату.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { DATA_UPDATED } from '../src/data/meta.js';
import { HOLIDAYS } from '../src/data/country-holidays.js';

const ROOT = new URL('../', import.meta.url);
const BLOG = new URL('src/content/blog/', ROOT);
const SITE = 'https://traveltribe.ru';

function unquote(s) {
  return (s || '').trim().replace(/^["']|["']$/g, '').trim();
}

// llms-full.txt публичный, его читают ИИ-боты и его содержимое уходит в ответы
// ассистентов. Значит, туда идёт ТЕКСТ статьи, а не потроха сборки: инвариант
// CLAUDE.md запрещает светить читателю имена исходников, компонентов, переменных
// и пути репо. Тело .mdx всё это содержит — вычищаем.
// Гейт: tests/content-invariants.spec.ts, тест «llms-full.txt: нет внутренних
// идентификаторов» (до 17.07.2026 в файл сваливался сырой frontmatter + импорты).
// Предохранитель: регекспы выше — не парсер. Если в посте появится непарный
// JSX-тег или `/>` внутри пропса, нежадный матч может уползти и срезать абзацы
// молча. Замер 17.07.2026 по всем 51 посту: медиана срезки 9%, максимум 21%
// (china-guide — там больше всего блоков). Порог 40% никогда не сработает на
// здоровом контенте, но поймает разбежавшийся регексп до того, как обрезанный
// текст уедет в публичный файл.
const MAX_LOSS = 0.4;

function cleanBody(body, slug = '') {
  const out = stripMdx(body);
  if (body.length > 500 && out.length < body.length * (1 - MAX_LOSS)) {
    const lost = Math.round((1 - out.length / body.length) * 100);
    throw new Error(
      `gen-llms: очистка съела ${lost}% текста в «${slug}» (${body.length} → ${out.length}). ` +
      `Похоже, регексп уполз: проверь непарные JSX-теги и "/>" внутри пропсов.`
    );
  }
  return out;
}

function stripMdx(body) {
  return body
    // импорты компонентов и export const с хелперами партнёрки и sub_id
    // (все однострочные — проверено по всем постам 17.07.2026)
    .replace(/^import\s+[^\n]*\n?/gm, '')
    .replace(/^export\s+const\s+[^\n]*\n?/gm, '')
    // JSX-блоки: это вёрстка, а не текст, и в них светятся имена компонентов
    // и переменных. Все компоненты самозакрывающиеся — до первого `/>`.
    .replace(/<[A-Z][A-Za-z0-9]*\b[\s\S]*?\/>/g, '')
    // инлайновые ссылки (в т.ч. партнёрские с href={переменная}) — оставить текст
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    // markdown-картинки: путь к исходнику боту не нужен и светит структуру репо,
    // а alt описывает кадр — его оставляем текстом
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => (alt.trim() ? `[фото: ${alt.trim()}]` : ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const posts = readdirSync(BLOG)
  .filter(f => /\.mdx?$/.test(f))
  .map(f => {
    const slug = f.replace(/\.mdx?$/, '');
    const raw = readFileSync(new URL(f, BLOG), 'utf8');
    const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    const fm = m ? m[1] : '';
    const body = m ? m[2].trim() : raw.trim();
    const get = re => unquote(fm.match(re)?.[1]);
    const tags = (fm.match(/^tags:\s*\[(.*)\]/m)?.[1] || '')
      .split(',').map(t => unquote(t)).filter(Boolean);
    return {
      slug,
      title: get(/^title:\s*(.+)$/m),
      description: get(/^description:\s*(.+)$/m),
      pubDate: get(/^pubDate:\s*(.+)$/m),
      updatedDate: get(/^updatedDate:\s*(.+)$/m),
      sourceType: get(/^sourceType:\s*(.+)$/m) || 'hybrid',
      tags,
      fm,
      body,
    };
  })
  .sort((a, b) => (b.pubDate || '').localeCompare(a.pubDate || ''));

// Бакеты под структуру llms.txt
const MONEY = new Set(['esim-zagranicey-2026', 'pay-abroad-2026']);
const VISA = new Set(['schengen-visa-2026', 'ees-shengen-2026']);
const bucket = p => MONEY.has(p.slug) ? 'money' : VISA.has(p.slug) ? 'visa' : 'guide';
const line = p => `- [${p.title}](${SITE}/blog/${p.slug}/): ${p.description}`;

const guides = posts.filter(p => bucket(p) === 'guide');
const money = posts.filter(p => bucket(p) === 'money');
const visa = posts.filter(p => bucket(p) === 'visa');

// ── public/llms.txt ────────────────────────────────────────────────
const llms = `# TravelTribe

> Авторский тревел-блог о путешествиях из России в 2026 году. Личный опыт, реальные бюджеты, актуальные визовые правила и сезонность для 70+ направлений. Автор — Никита Зайцев, Telegram @traveltriberu.

Обновлено: ${DATA_UPDATED} · ${posts.length} статей

Сайт построен как практический справочник для россиян: что работает прямо сейчас, без воды и устаревших советов. Каждый гайд содержит конкретные цифры (визовые сборы, цены, перелёты), пошаговые инструкции и FAQ-блок с прямыми ответами. YMYL-темы (визы, безопасность, деньги) обновляются при изменении правил.

## Гайды по странам и направлениям

${guides.map(line).join('\n')}

## Деньги и связь для россиян за границей

${money.map(line).join('\n')}

## Визы и пограничные правила

${visa.map(line).join('\n')}

## Программные разделы

- [Страны: все 70+ направлений](${SITE}/countries/): краткие хабы по каждой стране — виза, сезоны, бюджет, гайды
- [Визы для россиян 2026](${SITE}/visa/): требования, документы, сборы и сроки по каждому направлению
- [Куда без визы россиянам 2026](${SITE}/bezviz/): безвизовые направления со сроками и условиями, где хватит внутреннего паспорта РФ, куда сейчас сезон
- [Сезоны путешествий](${SITE}/seasons/): когда лететь в каждое направление — погода, цены, визовый режим по месяцам
- [Калькулятор бюджета поездки 2026](${SITE}/calculator/): 70+ направлений, сравнение до 3 стран, сезонный коэффициент по месяцам, виза в разбивке, курс в реальном времени
- [Сравнить направления](${SITE}/compare/): виза, бюджет в сутки, перелёт и сезон по месяцам бок о бок для любых двух из 70+ направлений, плюс готовые разборы кураторских пар
- [Праздники и фестивали по месяцам](${SITE}/events/): что закрыто, какие фестивали стоит успеть — календарь по ${Object.keys(HOLIDAYS).length} странам, с датами
- [Карточки направлений](${SITE}/cards/): быстрый обзор всех направлений с фильтрами
- [Поездки по месяцам](${SITE}/trips/): куда ехать в каждый месяц года
- [Чек-листы поездок](${SITE}/packing/): что взять в каждую страну в каждый месяц — одежда по погоде, документы, аптечка, техника. 70+ стран × 12 месяцев = ~820 страниц с конкретными списками.

## О проекте

- [Об авторе и проекте](${SITE}/about/): кто пишет, методология, источники, контакты
- [Главная](${SITE}/): подбор направления по сезону, бюджету, визовому режиму

## Optional

- [RSS-лента](${SITE}/rss.xml): автообновление новых постов
- [Sitemap](${SITE}/sitemap-index.xml): полный индекс страниц
- [Полный контент в одном файле](${SITE}/llms-full.txt): все статьи markdown'ом для офлайн-обработки LLM
`;

// ── public/llms-full.txt ───────────────────────────────────────────
const full = `# TravelTribe — полный контент сайта

> Авторский тревел-блог о путешествиях из России в 2026 году. Автор: Никита Зайцев, Telegram @traveltriberu.

Источник: ${SITE}/llms-full.txt | Обновлено: ${DATA_UPDATED} | Статей: ${posts.length}

---

${posts.map(p => `

## ${SITE}/blog/${p.slug}/

**${p.title}**

${p.description}

${[
  `Опубликовано: ${p.pubDate}`,
  p.updatedDate ? `обновлено: ${p.updatedDate}` : null,
  p.tags.length ? `теги: ${p.tags.join(', ')}` : null,
].filter(Boolean).join(' · ')}

---

${cleanBody(p.body, p.slug)}

---`).join('\n')}
`;

writeFileSync(new URL('public/llms.txt', ROOT), llms);
writeFileSync(new URL('public/llms-full.txt', ROOT), full);
console.log(`gen-llms: llms.txt (${posts.length} постов, обновлено ${DATA_UPDATED}) + llms-full.txt`);
