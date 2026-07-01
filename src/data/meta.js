// Единая точка правды даты актуальности программных данных
// (цены, визовые правила, сезонность). Бампать DATA_UPDATED при
// обновлении src/data/*.js — её читают visa/hub/seasons-шаблоны,
// sitemap lastmod, футер и llms.txt-генератор.
export const DATA_UPDATED = '2026-06-29';

const _M = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const _d = new Date(DATA_UPDATED + 'T00:00:00Z');
export const DATA_UPDATED_RU = `${_d.getUTCDate()} ${_M[_d.getUTCMonth()]} ${_d.getUTCFullYear()}`;

// Год ближайшего наступления месяца (1..12): текущий, если месяц ещё не прошёл, иначе +1.
// Для подписей «{месяц} {год}» на программных страницах — чтобы прошедший месяц
// показывал следующий год (напр. в июне 2026 январь → 2027). Считается при сборке.
export function yearForMonth(monthNum) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  return monthNum >= m ? y : y + 1;
}
