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

// Сортировка ленты: сначала дата события, при равенстве — дата проверки.
// Без второго ключа порядок среди заметок одного дня решало имя файла, и
// 03.08.2026 свежеопубликованная заметка встала второй за той, что вышла
// двумя днями раньше с той же датой события. Читатель приходит за новым и
// должен видеть новое сверху.
const byDateDesc = (a, b) =>
  b.data.date.valueOf() - a.data.date.valueOf() ||
  b.data.checked.valueOf() - a.data.checked.valueOf();

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
