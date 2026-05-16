// Единая точка правды даты актуальности программных данных
// (цены, визовые правила, сезонность). Бампать DATA_UPDATED при
// обновлении src/data/*.js — её читают visa/hub/seasons-шаблоны,
// sitemap lastmod, футер и llms.txt-генератор.
export const DATA_UPDATED = '2026-05-16';

const _M = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const _d = new Date(DATA_UPDATED + 'T00:00:00Z');
export const DATA_UPDATED_RU = `${_d.getUTCDate()} ${_M[_d.getUTCMonth()]} ${_d.getUTCFullYear()}`;
