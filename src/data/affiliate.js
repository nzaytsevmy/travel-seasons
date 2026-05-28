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
  // eSIM-провайдеры (оба ведут на RU-сайты).
  // Airalo: direct партнёрский URL + erid (38-ФЗ маркировка рекламы РФ)
  airalo:     'https://airalo.pxf.io/c/1209822/1310283/15608?erid=2VtzqxRWDfm&sharedID=546042_&u=https%3A%2F%2Fairalo.com%2Fru',
  // Drimsim: direct URL с tracking id (через tpk.mx lang=ru не пробрасывается)
  drimsim:    'https://drimsim.ru/?utm_travelpayouts_track_id=9681f36432214f3785fa2431a-546042',
  // PlatipoMiru: виртуальные карты USD/EUR для россиян (Visa/MC иностранного эмитента).
  // CPA-партнёрка. erid НЕОБХОДИМО получить от партнёра и подставить вместо TBD (38-ФЗ).
  platipomiru: 'https://platipomiru.com/?utm_source=traveltribe&utm_medium=cpa',
  // Travelata: пакетные туры + отели. Вертикаль «готовый тур vs самостоятельно».
  // Cookie 180 дней (лучший), комиссия 3.8–8%. erid от партнёра (38-ФЗ).
  travelata:  'https://travelata.tpk.mx/Do2A3cgV?erid=2VtzqufPtiT',
  // EconomyBookings: аренда авто (car rental aggregator), erid встроен (38-ФЗ).
  // Интент «road-trip / самостоятельно за рулём» — добавлять в self-drive направления.
  economybookings: 'https://economybookings.tpk.mx/xlSFNA6p?erid=2VtzqxYvA5V',
  // YouTravel.me: АВТОРСКИЕ туры с экспертами (малые группы) — вертикаль «не планировать
  // самому, поехать с гидом». On-brand для DIY-аудитории. CPA g2afse (pid=1163).
  // ⚠ erid НЕОБХОДИМО получить от YouTravel/ОРД и подставить (38-ФЗ) — пока его нет.
  youtravel:  'https://travelme.g2afse.com/click?pid=1163&offer_id=1',
};

// Aviasales deep-link под конкретный маршрут (origin/destination IATA) —
// поднимает конверсию: пользователь сразу видит свой перелёт, а не главную.
// Пример: aviasalesRoute('MOW','DXB') для Москва→Дубай.
export function aviasalesRoute(originIata, destIata) {
  return `https://www.aviasales.ru/?marker=${TP_MARKER_FULL}&market=ru`
    + `&origin_iata=${originIata}&destination_iata=${destIata}`;
}
