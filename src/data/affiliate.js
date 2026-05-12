// Travelpayouts marker — единая точка для всех партнёрских компонентов.
// Полный marker (с sub-id) используется в существующем calculator.astro;
// для embed-виджетов нужен короткий marker (числовая часть).
export const TP_MARKER_FULL  = '546042.Zz66f13c16ff6b488883a4127-546042';
export const TP_MARKER_SHORT = '546042';

// Прямые партнёрские ссылки — переиспользуем по сайту.
// Где возможно — короткие tpk.mx, для drimsim используем direct URL чтобы
// принудительно вести на RU-сайт (через tpk.mx параметр lang не пробрасывается).
export const TP_LINKS = {
  aviasales:  `https://www.aviasales.ru/?marker=${TP_MARKER_FULL}&market=ru`,
  ostrovok:   'https://ostrovok.tpk.mx/w4cAS1wZ',
  cherehapa:  'https://cherehapa.tpk.mx/GmVWjhCN',
  tripster:   'https://tripster.tpk.mx/PJlXelJd',
  // Drimsim (eSIM): direct URL на drimsim.ru с tracking-id от Travelpayouts
  drimsim:    'https://drimsim.ru/?utm_travelpayouts_track_id=9681f36432214f3785fa2431a-546042',
};
