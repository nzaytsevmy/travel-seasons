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
const AVIASALES_TPK = 'https://aviasales.tpk.mx/JCSPlC17?erid=2Vtzqxkn4LF';
// Оборачивает целевой aviasales.ru-URL в tpk.mx-redirect (трекинг кликов + erid + .ru).
// subId — ПАРАМЕТРОМ ШОРТЛИНКА (до &u=): статистика TP пишет SubID с этапа редиректа;
// sub_id внутри &u= доезжает только до лендинга и в статистику TP не попадает
// (проверено 19.07.2026 statistics API: за 7 недель записался ровно один sub_id —
// тестовый ?sub_id= на шортлинке Островка; все продовые метки внутри &u= потерялись).
export const aviasalesUrl = (query, subId) =>
  AVIASALES_TPK + (subId ? `&sub_id=${subId}` : '') + '&u=' + encodeURIComponent('https://www.aviasales.ru/' + (query || ''));

// Партнёрские ссылки — единая точка. Все tpk.mx с erid (38-ФЗ); drimsim — direct RU
// (tpk.mx не пробрасывает lang=ru), erid у партнёра нет.
export const TP_LINKS = {
  aviasales:  aviasalesUrl(),
  ostrovok:   'https://ostrovok.tpk.mx/xtyTcUcY?erid=2VtzqvE1cv3',
  cherehapa:  'https://cherehapa.tpk.mx/GmVWjhCN?erid=2VtzquZTwb5',
  // eSIM-провайдеры (оба ведут на RU-сайты).
  // Airalo: direct партнёрский URL + erid (38-ФЗ маркировка рекламы РФ)
  airalo:     'https://airalo.pxf.io/c/1209822/1310283/15608?erid=2VtzqxRWDfm&sharedID=546042_&u=https%3A%2F%2Fairalo.com%2Fru',
  // Drimsim: eSIM, принимает карты РФ/СБП. tpk.mx-шортлинк даёт постраничный sub_id
  // на шортлинке (атрибуция); редиректит на w1.drimsim.com, TP-маркер = erid по ОРД.
  drimsim:    'https://drimsim.tpk.mx/ELmQp51R',
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
  // Суточно: посуточная аренда жилья в РФ (частный сектор, апартаменты).
  sutochno:    'https://sutochno.tpk.mx/9wjPjf99?erid=2VtzqusFnyD',
  // Туту: ж/д + авиа + туры по РФ (поезда — Карелия, Байкал; внутр. перелёты).
  tutu:        'https://tutu.tpk.mx/f99ezU4z?erid=2Vtzqunoq8B',
  // Яндекс Путешествия: отели РФ (альтернатива Островку, сильный РФ-инвентарь).
  yandexTravel:'https://yandex.tpk.mx/ubagzDqF?erid=2VtzqvB3eMM',
  // Отелло (2ГИС на инвентаре Островка, ТОЛЬКО РФ): 13% с брони — лучшая ставка на
  // РФ-отели (Островок 6%, Яндекс 9%). Первым на РФ-хабах (RU_STAY). erid встроен.
  otello:      'https://otello.tpk.mx/sVtfBPMj?erid=2VtzqvGybUj',
  // Level.Travel: пакетные туры (как Travelata, второй источник предложений).
  level:       'https://level.tpk.mx/CraFALLJ?erid=2VtzquiMsH9',
  // Tiqets: билеты в музеи/достопримечательности (загран + крупные РФ-города).
  tiqets:      'https://tiqets.tpk.mx/QYpcZlVN?erid=2VtzqvKwa3R',
};

// Aviasales deep-link под конкретный маршрут (origin/destination IATA) —
// поднимает конверсию: пользователь сразу видит свой перелёт, а не главную.
// subId — постраничная атрибуция; кладётся ПАРАМЕТРОМ ШОРТЛИНКА (см. aviasalesUrl).
// Пример: aviasalesRoute('MOW','DXB','hub_uae') для Москва→Дубай со страницы хаба.
export function aviasalesRoute(originIata, destIata, subId) {
  return aviasalesUrl(`?origin_iata=${originIata}&destination_iata=${destIata}`, subId);
}

// Дип-линк через tpk.mx: &u=<encoded target> пробрасывается у ВСЕХ партнёров
// (curl-трейс 2026-07-02: cherehapa/ostrovok/yandexTravel/sutochno —
// erid и партнёрские маркеры сохраняются).
// subId — ПАРАМЕТРОМ ШОРТЛИНКА (?sub_id=X&u=...), НЕ внутри target: статистика TP
// пишет SubID с этапа редиректа. Вывод v4 «Ostrovok перетирает sub_id» был
// инвертирован: «перетирание» на лендинге = запись в TP; «выживание» внутри &u= =
// мимо статистики TP (проверено 19.07.2026: единственный записавшийся sub_id за
// 7 недель — тестовый на шортлинке Островка, все метки внутри &u= потерялись).
export function tpkDeep(linkKey, targetUrl, subId) {
  const base = TP_LINKS[linkKey];
  const sub = subId ? `sub_id=${subId}&` : '';
  return base + (base.includes('?') ? '&' : '?') + sub + 'u=' + encodeURIComponent(targetUrl);
}

// Cherehapa: подбор с предвыбранной страной (проверено: /travel/?country=georgia —
// 200, SSR-title под страну) + постраничный sub_id (латиница/цифры/_).
export const cherehapaCountry = (countrySlug, subId) =>
  tpkDeep('cherehapa', `https://cherehapa.ru/travel/?country=${countrySlug}`, subId);

// Cherehapa: страница подбора без страны (для страниц, где страна не одна /
// слаг у партнёра не проверен) + постраничный sub_id.
export const cherehapaTravel = (subId) =>
  tpkDeep('cherehapa', 'https://cherehapa.ru/travel/', subId);

// Яндекс Путешествия с постраничным sub_id (тот же формат, что в altai-пилларе) —
// хабам нужна атрибуция клика; раньше висел голый TP_LINKS.yandexTravel без sub_id.
export const yandexTravelSub = (subId) =>
  tpkDeep('yandexTravel', 'https://travel.yandex.ru/', subId);

// Ostrovok: страница города (проверено: /hotel/georgia/tbilisi/ → 200 с маркерами).
// subId теперь пишется (метка на шортлинке; прежнее «перетирает» касалось лендинга).
export const ostrovokCity = (countrySlug, citySlug, subId) =>
  tpkDeep('ostrovok', `https://ostrovok.ru/hotel/${countrySlug}/${citySlug}/`, subId);

// Отелло: подбор РФ-жилья (2ГИС). Шортлинк уже ведёт на лендинг (deep-link &u= не
// нужен) — sub_id вешаем прямо на шортлинк (&sub_id=), как приняла статистика TP 19.07.
export const otelloStay = (subId) =>
  TP_LINKS.otello + (subId ? `&sub_id=${subId}` : '');
