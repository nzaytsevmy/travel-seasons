// Очередь ревизий: когда какую статью пора сверять заново.
//
// Зачем отдельный инструмент. Сверка фактов по первоисточникам — единственное,
// что отличает наши статьи от пересказа, и единственное, что портится само по
// себе, без единой правки. 14.08.2026 проверка десяти последних статей нашла
// расхождения в девяти: курортного сбора не существует с 2025 года, виза США
// подорожала вдвое, вьетнамская карта прибытия нужна не везде. Ни одна из этих
// статей не выглядела устаревшей.
//
// ⛔ Главное правило: общий срок следующей сверки НЕ хранится и НЕ проставляется
// руками. Ровно эта ошибка уже была с датой «данные проверены»: её бампал
// человек, гейт пытался угадать, забыли — и подпись врёт. Общий срок
// вычисляется: последняя сверка плюс интервал по типу темы. Исключение —
// точечный `reviewAfter` у быстро меняющегося факта: его дата подтверждена
// источником или редакционным решением и имеет безопасный fallback.
//
// Интервалы — не круглые числа ради красоты, а цена ошибки:
//   90 дней  — визы, документы, сборы, цены: меняются без предупреждения,
//              и ошибка стоит читателю денег или поездки;
//   180 дней — сезонность и события: врут дважды в год, к началу сезона;
//   365 дней — маршруты, впечатления, списки мест: портятся медленно.
//
// Тип определяется по слагу и меткам, но статья может переопределить его
// полем `revisit` (число дней). Ближайший `volatileFacts.reviewAfter`, если он
// раньше общего срока, поднимает статью в очередь точечно.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ⛔ Путь берём от рабочего каталога, а не от адреса этого файла: при сборке
// модуль оказывается внутри dist, и адрес относительно него указывает в пустоту
// (`dist/src/content/blog` — сборка падала ровно на этом).
const DIR = join(process.cwd(), 'src/content/blog');
const TRAFFIC = join(process.cwd(), 'seo-pulse/traffic.json');

// Посещаемость снимается отдельной задачей (ключа счётчика в сборке нет) и
// лежит рядом файлом. Нет файла — очередь работает как раньше, просто без
// приоритета: сортировка по одной просрочке ставит наверх статьи, которые
// никто не читает, и первым чинится не то. 17.08.2026 в её топе висели два
// японских гайда с 6 и 40 визитами, пока чилийский с 502 стоял ниже.
function loadTraffic() {
  try {
    return existsSync(TRAFFIC) ? JSON.parse(readFileSync(TRAFFIC, 'utf8')) : { posts: {} };
  } catch {
    return { posts: {} };
  }
}

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

/** Ближайший ручной срок у точечного изменчивого факта. */
export function volatileDeadline(fm) {
  const rows = [];
  let current = null;
  let inside = false;
  for (const line of fm.split('\n')) {
    if (/^volatileFacts:\s*$/.test(line)) {
      inside = true;
      continue;
    }
    if (inside && /^\S/.test(line)) break;
    if (!inside) continue;
    const id = line.match(/^\s{2}- id:\s*["']?([^"'\n]+)["']?\s*$/)?.[1]?.trim();
    if (id) {
      current = { id, due: null };
      rows.push(current);
      continue;
    }
    const due = line.match(/^\s{4}reviewAfter:\s*(\d{4}-\d{2}-\d{2})\s*$/)?.[1];
    if (current && due) current.due = due;
  }
  const dated = rows.filter((row) => row.due).sort((a, b) => a.due.localeCompare(b.due));
  return dated[0] ?? null;
}

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
  const traffic = loadTraffic();
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
    const periodicDue = new Date(Date.parse(date + 'T00:00:00Z') + interval * 864e5).toISOString().slice(0, 10);
    const volatile = volatileDeadline(fm);
    const due = volatile && volatile.due < periodicDue ? volatile.due : periodicDue;
    const overdue = Math.round((Date.parse(today) - Date.parse(due)) / 864e5);
    const t = traffic.posts?.[slug] ?? { visits: 0, live: 0, partner: 0 };
    // Считаем по живым читателям из поиска, а не по всем визитам: прямой поток
    // роботов на одну страницу иначе перевешивает весь сайт (гайд по Чили,
    // 17.08.2026 — 502 визита, из них 15 живых).
    const live = t.live ?? t.visits;
    // Цена простоя: сколько людей читает устаревшее и насколько давно оно
    // устарело. Доля просрочки ограничена двойным интервалом — иначе забытая
    // статья без читателей вечно перевешивает живую.
    const lateness = Math.min(Math.max(overdue, 0) / interval, 2);
    const cost = Math.round(live * lateness);
    rows.push({ slug, title: field(fm, 'title') ?? slug, interval, checked: date, source, due, overdue,
                deadline: volatile && volatile.due === due ? volatile.id : null,
                visits: t.visits, live, partner: t.partner, cost });
  }
  // Сортировка по цене простоя, а не по одной просрочке: первым чинится то,
  // что реально читают. При равной цене выше идёт просроченное дольше, потом
  // быстро портящиеся темы.
  return rows.sort((a, b) => b.cost - a.cost || b.overdue - a.overdue || a.interval - b.interval);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rows = buildQueue();
  const late = rows.filter((r) => r.overdue >= 0);
  const soon = rows.filter((r) => r.overdue < 0 && r.overdue >= -14);
  console.log(`Статей: ${rows.length}. Просрочено: ${late.length}. Подходит срок (14 дней): ${soon.length}.\n`);
  for (const r of [...late, ...soon].slice(0, 40)) {
    const mark = r.overdue >= 0 ? `просрочка ${r.overdue} дн.` : `через ${-r.overdue} дн.`;
    console.log(`${String(r.live).padStart(4)} живых (из ${String(r.visits).padStart(4)}) | ${String(r.partner).padStart(3)} к партнёру | ${mark.padEnd(18)} | ${r.slug}`);
  }
}
