// Единая точка правды даты актуальности программных данных
// (цены, визовые правила, сезонность). Её читают visa/hub/seasons-шаблоны,
// sitemap lastmod, футер и llms.txt-генератор.
//
// ⛔ РУКАМИ НЕ ПРАВИТЬ. Дата считается из истории git: берётся последний коммит,
// тронувший файл с меткой «@freshness: DATA_UPDATED» (scripts/gen-freshness.mjs,
// запускается в prebuild). Раньше её бампал человек, а гейт в CI следил, чтобы
// он не забыл; гейт угадывал намерение по диффу, ломался на каждом новом файле
// и был удалён вместе с этой обязанностью. Теперь подпись «данные проверены на
// дату X» верна по построению.
import generated from './freshness.generated.json' with { type: 'json' };

export const DATA_UPDATED = generated.dataUpdated;

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
