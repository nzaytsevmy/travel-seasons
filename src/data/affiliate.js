// Travelpayouts marker — единая точка для всех партнёрских компонентов.
// Полный marker (с sub-id) используется в существующем calculator.astro;
// для embed-виджетов нужен короткий marker (числовая часть).
export const TP_MARKER_FULL  = '546042.Zz66f13c16ff6b488883a4127-546042';
export const TP_MARKER_SHORT = '546042';

// Aviasales: ТОЛЬКО через tpk.mx-redirect — генерит свежий sub-id на клик, поэтому TP
// СЧИТАЕТ клики. Прямой aviasales.ru/?marker со СТАТИЧНЫМ sub-id давал 0 кликов в TP
// (проверено 2026-06-04). Параметр &u= переопределяет destination на aviasales.RU и
// пробрасывает deep-link origin/destination; трекинг + erid (2Vtzqxkn4LF) сохраняются.
// Гео/locale на .com НЕ работают — только &u= (подтверждено curl-трейсом редиректа).
const AVIASALES_TPK = 'https://aviasales.tpk.mx/JCSPlC17?erid=2Vtzqxkn4LF&u=';
// Оборачивает целевой aviasales.ru-URL в tpk.mx-redirect (трекинг кликов + erid + .ru).
// query — строка вида '?destination_iata=DPS&sub_id=hub-bali' или '' для главной.
export const aviasalesUrl = (query) => AVIASALES_TPK + encodeURIComponent('https://www.aviasales.ru/' + (query || ''));

// Партнёрские ссылки — единая точка. Все tpk.mx с erid (38-ФЗ); drimsim — direct RU
// (tpk.mx не пробрасывает lang=ru), erid у партнёра нет.
export const TP_LINKS = {
  aviasales:  aviasalesUrl(),
  ostrovok:   'https://ostrovok.tpk.mx/xtyTcUcY?erid=2VtzqvE1cv3',
  cherehapa:  'https://cherehapa.tpk.mx/GmVWjhCN?erid=2VtzquZTwb5',
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
  // ─── РФ-направления (внутренний туризм) — все tpk.mx с erid (38-ФЗ) ───
  // Tripster: экскурсии и авторские туры по РФ от местных гидов — ключевая
  // монетизация внутренних направлений (морские прогулки, вертолёты, треккинги).
  tripster:    'https://tripster.tpk.mx/UmtUx08Y?erid=2VtzqucRv9m',
  // Суточно: посуточная аренда жилья в РФ (частный сектор, апартаменты).
  sutochno:    'https://sutochno.tpk.mx/9wjPjf99?erid=2VtzqusFnyD',
  // Туту: ж/д + авиа + туры по РФ (поезда — Карелия, Байкал; внутр. перелёты).
  tutu:        'https://tutu.tpk.mx/f99ezU4z?erid=2Vtzqunoq8B',
  // Яндекс Путешествия: отели РФ (альтернатива Островку, сильный РФ-инвентарь).
  yandexTravel:'https://yandex.tpk.mx/ubagzDqF?erid=2VtzqvB3eMM',
  // Level.Travel: пакетные туры (как Travelata, второй источник предложений).
  level:       'https://level.tpk.mx/CraFALLJ?erid=2VtzquiMsH9',
  // Tiqets: билеты в музеи/достопримечательности (загран + крупные РФ-города).
  tiqets:      'https://tiqets.tpk.mx/QYpcZlVN?erid=2VtzqvKwa3R',
};

// Aviasales deep-link под конкретный маршрут (origin/destination IATA) —
// поднимает конверсию: пользователь сразу видит свой перелёт, а не главную.
// subId (опционально) — постраничная атрибуция в кабинете TP (выживает внутри &u=).
// Пример: aviasalesRoute('MOW','DXB','hub_uae') для Москва→Дубай со страницы хаба.
export function aviasalesRoute(originIata, destIata, subId) {
  const sub = subId ? `&sub_id=${subId}` : '';
  return aviasalesUrl(`?origin_iata=${originIata}&destination_iata=${destIata}${sub}`);
}

// Дип-линк через tpk.mx: &u=<encoded target> пробрасывается у ВСЕХ партнёров
// (curl-трейс 2026-07-02: cherehapa/ostrovok/yandexTravel/sutochno/tripster —
// erid и партнёрские маркеры сохраняются). sub_id ВНУТРИ target доезжает до
// Cherehapa и Aviasales; Ostrovok перетирает своим (там только дип, без метки).
export function tpkDeep(linkKey, targetUrl) {
  const base = TP_LINKS[linkKey];
  return base + (base.includes('?') ? '&' : '?') + 'u=' + encodeURIComponent(targetUrl);
}

// Cherehapa: подбор с предвыбранной страной (проверено: /travel/?country=georgia —
// 200, SSR-title под страну) + постраничный sub_id (латиница/цифры/_).
export const cherehapaCountry = (countrySlug, subId) =>
  tpkDeep('cherehapa', `https://cherehapa.ru/travel/?country=${countrySlug}${subId ? `&sub_id=${subId}` : ''}`);

// Cherehapa: страница подбора без страны (для страниц, где страна не одна /
// слаг у партнёра не проверен) + постраничный sub_id (доезжает — проверено).
export const cherehapaTravel = (subId) =>
  tpkDeep('cherehapa', `https://cherehapa.ru/travel/${subId ? `?sub_id=${subId}` : ''}`);

// Ostrovok: страница города (проверено: /hotel/georgia/tbilisi/ → 200 с маркерами).
export const ostrovokCity = (countrySlug, citySlug) =>
  tpkDeep('ostrovok', `https://ostrovok.ru/hotel/${countrySlug}/${citySlug}/`);

// Tripster: экскурсии направления (проверено: /experience/abkhazia/ → 200).
export const tripsterDest = (destSlug) =>
  tpkDeep('tripster', `https://experience.tripster.ru/experience/${destSlug}/`);
