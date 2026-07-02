#!/usr/bin/env node
// Генератор public/llms.txt и public/llms-full.txt из src/content/blog
// + даты DATA_UPDATED. Запускается в pre-push (feedback_llms_txt_sync) —
// файлы всегда синхронны контенту и имеют актуальную дату.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { DATA_UPDATED } from '../src/data/meta.js';

const ROOT = new URL('../', import.meta.url);
const BLOG = new URL('src/content/blog/', ROOT);
const SITE = 'https://traveltribe.ru';

function unquote(s) {
  return (s || '').trim().replace(/^["']|["']$/g, '').trim();
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
- [Сезоны путешествий](${SITE}/seasons/): когда лететь в каждое направление — погода, цены, визовый режим по месяцам
- [Калькулятор бюджета поездки 2026](${SITE}/calculator/): 70+ направлений, сравнение до 3 стран, сезонный коэффициент по месяцам, виза в разбивке, курс в реальном времени
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

---
${p.fm}
---

${p.body}

---`).join('\n')}
`;

writeFileSync(new URL('public/llms.txt', ROOT), llms);
writeFileSync(new URL('public/llms-full.txt', ROOT), full);
console.log(`gen-llms: llms.txt (${posts.length} постов, обновлено ${DATA_UPDATED}) + llms-full.txt`);
