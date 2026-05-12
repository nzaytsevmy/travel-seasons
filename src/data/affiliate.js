// Travelpayouts marker — единая точка для всех партнёрских компонентов.
// Полный marker (с sub-id) используется в существующем calculator.astro;
// для embed-виджетов нужен короткий marker (числовая часть).
export const TP_MARKER_FULL  = '546042.Zz66f13c16ff6b488883a4127-546042';
export const TP_MARKER_SHORT = '546042';

// Прямые партнёрские ссылки (короткие tpk.mx) — переиспользуем по сайту
export const TP_LINKS = {
  aviasales:  `https://www.aviasales.ru/?marker=${TP_MARKER_FULL}&market=ru`,
  ostrovok:   'https://ostrovok.tpk.mx/w4cAS1wZ',
  cherehapa:  'https://cherehapa.tpk.mx/GmVWjhCN',
  tripster:   'https://tripster.tpk.mx/PJlXelJd',
};
