// Помощники ленты /novosti/. Держим отдельно от страниц, чтобы одна и та же
// логика деления «свежее / архив» использовалась и лентой, и архивами, и RSS,
// и тестами — иначе разъедется и появятся заметки, не видимые нигде.

export const TOPIC_LABEL = {
  visa: 'Визы и въезд',
  nature: 'Природа',
  transport: 'Транспорт и доступ',
};

export const IMPACT_LABEL = {
  high: 'важно',
  medium: '',
};

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function formatDateRu(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getUTCDate()} ${MONTHS_GEN[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

export function monthKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthTitleRu(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_NOM[m - 1]} ${y}`;
}

// Месяц уезжает в архив, когда его ПОСЛЕДНИЙ день старше 30 дней. Условие
// намеренно завязано на конец месяца, а не на дату заметки: иначе на стыке
// возникает день, когда заметка уже выпала из ленты, а архива её месяца ещё
// нет — и она не видна нигде.
export function archivedMonths(entries, now = new Date()) {
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 30 * 864e5;
  const keys = new Set(entries.map((e) => monthKey(e.data.date)));
  return new Set([...keys].filter((k) => {
    const [y, m] = k.split('-').map(Number);
    const lastDay = Date.UTC(y, m, 0);          // день 0 следующего месяца = последний день этого
    return lastDay < cutoff;
  }));
}

/** Когда заметка попала в ленту. У старых заметок это `checked`. */
export const addedAt = (e) => (e.data.added ?? e.data.checked).valueOf();

// Сортировка ленты: СНАЧАЛА дата добавления, при равенстве — дата события.
//
// Раньше главным ключом была дата события, и это давало ленту, где свежее
// уезжает вниз: 03.08.2026 две только что добавленные заметки встали пятой и
// шестой, потому что их события случились 26 и 28 июля, а у соседей — 30 и 31.
// Читатель приходит за новым, значит сверху должно быть добавленное последним.
//
// Дата события при этом никуда не делась: она остаётся в тексте и решает, в
// какой месяц архива заметка попадёт.
const byDateDesc = (a, b) =>
  addedAt(b) - addedAt(a) ||
  b.data.date.valueOf() - a.data.date.valueOf();

/** Что показывает /novosti/: всё, чей месяц ещё не уехал в архив. */
export function freshEntries(entries, now = new Date()) {
  const archived = archivedMonths(entries, now);
  return entries.filter((e) => !archived.has(monthKey(e.data.date))).sort(byDateDesc);
}

/** Месяцы, под которые нужно построить страницы архива. */
export function archiveKeys(entries, now = new Date()) {
  return [...archivedMonths(entries, now)].sort().reverse();
}

export function entriesOfMonth(entries, key) {
  return entries.filter((e) => monthKey(e.data.date) === key).sort(byDateDesc);
}

// Сколько заметок лента показывает целиком. Дальше — компактный список: при
// 2–4 заметках в день лента иначе растёт до сотен килобайт, и читатель на
// телефоне листает её минутами. Замер 10.08.2026: 20 заметок = 179 КБ.
export const FULL_ON_FEED = 8;

/** Адрес заметки. У каждой он свой и не зависит от того, где заметка показана. */
export const newsUrl = (slugOrEntry) =>
  `/novosti/${typeof slugOrEntry === 'string' ? slugOrEntry : slugOrEntry.slug}/`;

/**
 * Свежие заметки про страну — для блока на странице направления.
 * Связь идёт по полю `countries` заметки: там слаг направления сайта.
 */
export function newsForCountry(entries, slug, limit = 3) {
  return entries
    .filter((e) => (e.data.countries ?? []).includes(slug))
    .sort(byDateDesc)
    .slice(0, limit);
}
