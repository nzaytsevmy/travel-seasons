// Очередь ревизий: когда какую статью пора сверять заново.
//
// Зачем отдельный инструмент. Сверка фактов по первоисточникам — единственное,
// что отличает наши статьи от пересказа, и единственное, что портится само по
// себе, без единой правки. 14.08.2026 проверка десяти последних статей нашла
// расхождения в девяти: курортного сбора не существует с 2025 года, виза США
// подорожала вдвое, вьетнамская карта прибытия нужна не везде. Ни одна из этих
// статей не выглядела устаревшей.
//
// ⛔ Главное правило: срок следующей сверки НЕ хранится и НЕ проставляется
// руками. Ровно эта ошибка уже была с датой «данные проверены»: её бампал
// человек, гейт пытался угадать, забыли — и подпись врёт. Здесь срок
// вычисляется: последняя сверка плюс интервал по типу темы. Забыть нечего.
//
// Интервалы — не круглые числа ради красоты, а цена ошибки:
//   90 дней  — визы, документы, сборы, цены: меняются без предупреждения,
//              и ошибка стоит читателю денег или поездки;
//   180 дней — сезонность и события: врут дважды в год, к началу сезона;
//   365 дней — маршруты, впечатления, списки мест: портятся медленно.
//
// Тип определяется по слагу и меткам, но статья может переопределить его
// полем `revisit` (число дней) — например, для темы с известной датой перемен.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ⛔ Путь берём от рабочего каталога, а не от адреса этого файла: при сборке
// модуль оказывается внутри dist, и адрес относительно него указывает в пустоту
// (`dist/src/content/blog` — сборка падала ровно на этом).
const DIR = join(process.cwd(), 'src/content/blog');

const FAST = /viza|visa|zagranpasport|documents|strahovka|insurance|cards|pay-|price|cena|nalog|sbor/i;
const SEASON = /season|sezon|pogoda|weather|month|mesyats|avgust|sentyabr|oktyabr|noyabr|dekabr|yanvar|fevral|mart|aprel|may|iyun|iyul|zatmenie|perseid/i;

/** Интервал в днях: сначала явное поле, потом слаг, потом метки. */
export function intervalFor(slug, tags = [], explicit) {
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const t = tags.join(' ').toLowerCase();
  if (FAST.test(slug) || /виза|документ|страховк|деньги|цены|налог/i.test(t)) return 90;
  if (SEASON.test(slug) || /сезон|погода|событ/i.test(t)) return 180;
  return 365;
}

const field = (fm, name) => fm.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim();

/** Дата последней сверки: журнал → поле проверки фактов → дата публикации. */
function lastChecked(fm) {
  const dates = [...fm.matchAll(/^\s+- date:\s*(\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]).sort();
  if (dates.length) return { date: dates.at(-1), source: 'журнал' };
  const reviewed = field(fm, 'reviewed');
  if (reviewed) return { date: reviewed.slice(0, 10), source: 'проверка фактов' };
  const pub = field(fm, 'pubDate');
  return { date: pub ? pub.slice(0, 10) : null, source: 'публикация' };
}

export function buildQueue(today = new Date().toISOString().slice(0, 10)) {
  const rows = [];
  for (const name of readdirSync(DIR).filter((n) => /\.mdx?$/.test(n))) {
    const src = readFileSync(join(DIR, name), 'utf8');
    const fm = src.split('---')[1] ?? '';
    const slug = name.replace(/\.mdx?$/, '');
    const tags = (fm.match(/^tags:\s*\[(.*?)\]/m)?.[1] ?? '')
      .split(',').map((x) => x.replace(/["']/g, '').trim()).filter(Boolean);
    const interval = intervalFor(slug, tags, Number(field(fm, 'revisit')));
    const { date, source } = lastChecked(fm);
    if (!date) continue;
    const due = new Date(Date.parse(date + 'T00:00:00Z') + interval * 864e5).toISOString().slice(0, 10);
    const overdue = Math.round((Date.parse(today) - Date.parse(due)) / 864e5);
    rows.push({ slug, title: field(fm, 'title') ?? slug, interval, checked: date, source, due, overdue });
  }
  // Сортировка по просрочке: чем дольше висит, тем выше. Внутри одинаковой
  // просрочки первыми идут быстро портящиеся темы — там цена ошибки выше.
  return rows.sort((a, b) => b.overdue - a.overdue || a.interval - b.interval);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rows = buildQueue();
  const late = rows.filter((r) => r.overdue >= 0);
  const soon = rows.filter((r) => r.overdue < 0 && r.overdue >= -14);
  console.log(`Статей: ${rows.length}. Просрочено: ${late.length}. Подходит срок (14 дней): ${soon.length}.\n`);
  for (const r of [...late, ...soon].slice(0, 40)) {
    const mark = r.overdue >= 0 ? `просрочка ${r.overdue} дн.` : `через ${-r.overdue} дн.`;
    console.log(`${String(r.interval).padStart(3)} дн. | сверено ${r.checked} (${r.source.padEnd(15)}) | ${mark.padEnd(20)} | ${r.slug}`);
  }
}
