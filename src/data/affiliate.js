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
const cleanSubId = (value) => value
  ? String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  : '';
// Оборачивает целевой aviasales.ru-URL в tpk.mx-redirect (трекинг кликов + erid + .ru).
// subId — ПАРАМЕТРОМ ШОРТЛИНКА (до &u=): статистика TP пишет SubID с этапа редиректа;
// sub_id внутри &u= доезжает только до лендинга и в статистику TP не попадает
// (проверено 19.07.2026 statistics API: за 7 недель записался ровно один sub_id —
// тестовый ?sub_id= на шортлинке Островка; все продовые метки внутри &u= потерялись).
export const aviasalesUrl = (query, subId) =>
  AVIASALES_TPK + (subId ? `&sub_id=${cleanSubId(subId)}` : '') + '&u=' + encodeURIComponent('https://www.aviasales.ru/' + (query || ''));

// Партнёрские ссылки — единая точка. Все tpk.mx с erid (38-ФЗ); drimsim — direct RU
// (tpk.mx не пробрасывает lang=ru), erid у партнёра нет.
export const TP_LINKS = {
  aviasales:  aviasalesUrl(),
  ostrovok:   'https://ostrovok.tpk.mx/xtyTcUcY?erid=2VtzqvE1cv3',
  // ⚠ Шортлинк сменился: в кабинете партнёрки на 03.08.2026 значится fkM7suze,
  // а в проекте стоял GmVWjhCN. Старый ещё отвечает 200 и доносит erid, но
  // клики по снятому шортлинку — риск, который не виден до потери денег.
  // Проверено curl 03.08.2026: оба ведут на cherehapa.ru с erid, marker разный.
  cherehapa:  'https://cherehapa.tpk.mx/fkM7suze?erid=2VtzquZTwb5',
  // eSIM-провайдеры (оба ведут на RU-сайты).
  // Airalo: direct партнёрский URL + erid (38-ФЗ маркировка рекламы РФ)
  airalo:     'https://airalo.pxf.io/c/1209822/1310283/15608?erid=2VtzqxRWDfm&sharedID=546042_&u=https%3A%2F%2Fairalo.com%2Fru',
  // Drimsim: eSIM, принимает карты РФ/СБП. tpk.mx-шортлинк даёт постраничный sub_id
  // на шортлинке (атрибуция); редиректит на w1.drimsim.com, TP-маркер = erid по ОРД.
  drimsim:    'https://drimsim.tpk.mx/ELmQp51R',
  // PlatipoMiru: виртуальные карты USD/EUR для россиян (Visa/MC иностранного эмитента).
  // CPA-партнёрка. ⛔ Метки erid НЕТ и не будет: партнёр её не выдаёт (решение Никиты
  // 24.08.2026 — тему закрыть и в отчётах больше не поднимать). Ссылка идёт с
  // rel="sponsored"; за формулировки маркировки отвечает Никита сам.
  platipomiru: 'https://platipomiru.com/?utm_source=traveltribe&utm_medium=cpa',
  // Travelata: пакетные туры + отели. Вертикаль «готовый тур vs самостоятельно».
  // Cookie 180 дней (лучший), комиссия 3.8–8%. erid от партнёра (38-ФЗ).
  travelata:  'https://travelata.tpk.mx/Do2A3cgV?erid=2VtzqufPtiT',
  // EconomyBookings: аренда авто (car rental aggregator), erid встроен (38-ФЗ).
  // Интент «road-trip / самостоятельно за рулём» — добавлять в self-drive направления.
  economybookings: 'https://economybookings.tpk.mx/xlSFNA6p?erid=2VtzqxYvA5V',
  // YouTravel.me: АВТОРСКИЕ туры с экспертами (малые группы) — вертикаль «не планировать
  // самому, поехать с гидом». On-brand для DIY-аудитории. CPA g2afse (pid=1163).
  // ⛔ Метки erid НЕТ и не будет: партнёр её не выдаёт (решение Никиты 24.08.2026 —
  // тему закрыть и в отчётах больше не поднимать). Ссылка идёт с rel="sponsored";
  // за формулировки маркировки отвечает Никита сам.
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
  // Трипстер: экскурсии с местными жителями, авторские прогулки. Вертикаль
  // «что делать на месте» — её на сайте не было вовсе, хотя это ровно тот
  // интент, с которым читают гид по городу. Проверено curl 03.08.2026:
  // ведёт на experience.tripster.ru, erid доезжает.
  tripster:    'https://tripster.tpk.mx/cicJCuPT?erid=2VtzqxMZpjc',
  // Спутник8: экскурсии и активности, второй источник предложений к Трипстеру.
  // Проверено curl 03.08.2026: ведёт на sputnik8.com, erid доезжает.
  sputnik8:    'https://sputnik8.tpk.mx/nIkABzG2?erid=2Vtzqugsszo',
  // Tiqets: билеты в музеи/достопримечательности (загран + крупные РФ-города).
  tiqets:      'https://tiqets.tpk.mx/QYpcZlVN?erid=2VtzqvKwa3R',
};

// Aviasales deep-link под конкретный маршрут (origin/destination IATA) —
// поднимает конверсию: пользователь сразу видит свой перелёт, а не главную.
// subId — постраничная атрибуция; кладётся ПАРАМЕТРОМ ШОРТЛИНКА (см. aviasalesUrl).
// Пример: aviasalesRoute('MOW','DXB','hub_uae') для Москва→Дубай со страницы хаба.
// ⛔ Проверено живьём 29.08.2026: адрес вида `?origin_iata=MOW&destination_iata=TBS`
// партнёр ИГНОРИРУЕТ — человек попадает на главную и видит подборку отелей, а не
// билеты. Рабочий формат — путь поиска `/search/<MOW><ДД><ММ><DEST>1`: он
// открывает форму с уже подставленными городами и датой. Тот же формат много
// месяцев работает в таблице сезонов, на хабах и в статьях стоял нерабочий.
// День берём 15-м — середина месяца, как в таблице сезонов. Месячные шаблоны
// ОБЯЗАНЫ передавать monthIdx: иначе январь и декабрь поведут на один следующий
// месяц. Гейт по собранным ссылкам стоит в content-invariants.spec.ts.
// На страницах без заданного месяца по умолчанию открываем следующий.
export function aviasalesRoute(originIata, destIata, subId, monthIdx) {
  const сейчас = new Date();
  const м = typeof monthIdx === 'number' ? monthIdx : (сейчас.getMonth() + 1) % 12;
  const мм = String(м + 1).padStart(2, '0');
  return aviasalesUrl(`search/${originIata}15${мм}${destIata}1`, subId);
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
  const sub = subId ? `sub_id=${cleanSubId(subId)}&` : '';
  return base + (base.includes('?') ? '&' : '?') + sub + 'u=' + encodeURIComponent(targetUrl);
}

// Cherehapa: форма читает `countries[0]`, а НЕ рекламировавшийся раньше
// `?country=<slug>`. Старый параметр работал только для нескольких SEO-лендингов;
// Австралия, Индонезия, Новая Зеландия и большинство других стран открывались
// с пустым полем. Рабочий формат проверен в живой форме 30.08.2026, коды — из
// официального API /api/travel/countries?isPrivate=true. Массив поддерживает
// маршруты через две страны; Антарктида покрывается группой «Весь мир».
const CHEREHAPA_COUNTRY = {
  'australia-east': ['australia'],
  'australia-north': ['australia'],
  bali: ['indonesia'],
  'sumatra-kalimantan': ['indonesia'],
  'raja-ampat': ['indonesia'],
  'japan-hokkaido': ['japan'],
  'india-goa': ['india'],
  'italy-north': ['italy'],
  'italy-south': ['italy'],
  'canada-rockies': ['canada'],
  'canada-east': ['canada'],
  'guatemala-belize': ['guatemala', 'belize'],
  'costa-rica-panama': ['costa_rica', 'panama'],
  'chile-patagonia': ['chile'],
  'chile-fjords': ['chile'],
  hainan: ['china'],
  abkhazia: ['abhazia'],
  kamchatka: ['russia'],
  karelia: ['russia'],
  dagestan: ['russia'],
  altai: ['russia'],
};

export const cherehapaCountry = (countrySlug, subId) => {
  const params = new URLSearchParams();
  if (countrySlug === 'antarctica') {
    params.set('countryGroups[0]', 'all-world');
  } else {
    const codes = CHEREHAPA_COUNTRY[countrySlug] ?? [countrySlug.replaceAll('-', '_')];
    codes.forEach((code, index) => params.set(`countries[${index}]`, code));
  }
  return tpkDeep('cherehapa', `https://www.cherehapa.ru/?${params}`, subId);
};

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
  TP_LINKS.otello + (subId ? `&sub_id=${cleanSubId(subId)}` : '');

// Суточно: посуточная аренда у частников. Дип-линк по региону — поддомен партнёра
// (проверено curl 30.07.2026: abkhazia.sutochno.ru → 200, erid и TP-маркер доезжают).
// Абхазия — крупнейший кластер трафика сайта, а жильё там в основном частный сектор,
// поэтому Суточно уместнее отельных агрегаторов.
export const sutochnoRegion = (regionUrl, subId) => tpkDeep('sutochno', regionUrl, subId);

// Туту: поиск поездов (проверено curl 30.07.2026: tutu.ru/poezda/ → 200, erid и метка
// TP доезжают). URL под конкретный маршрут у Туту не открывается — /poezda/moskva/adler/
// и rasp.php отдают 404, поэтому ведём на общий поиск и подпись даём соответствующую.
export const tutuTrains = (subId) => tpkDeep('tutu', 'https://www.tutu.ru/poezda/', subId);

// Островок без города (общий поиск) + постраничная метка. Отдельно от ostrovokCity:
// там, где страна поездки заранее неизвестна (чек-листы, сборы), город подставить нечего.
export const ostrovokSearch = (subId) =>
  TP_LINKS.ostrovok + (subId ? `&sub_id=${cleanSubId(subId)}` : '');

// Airalo: постраничная метка живёт ВНУТРИ sharedID после подчёркивания
// (`sharedID=546042_<метка>`), а не отдельным параметром — формат партнёрской сети.
// Голый TP_LINKS.airalo несёт `546042_` с пустым хвостом: клик засчитывается, но
// страницу-источник не опознать. Аудит 03.08.2026: так стояли ВСЕ 31 ссылка на сайте.
// Проверено curl: `sharedID=546042_georgia_guide_2026` → 200, редирект на airalo.com/ru.
export const airaloSub = (subId) =>
  TP_LINKS.airalo.replace('sharedID=546042_&', `sharedID=546042_${cleanSubId(subId)}&`);

// Airalo: реальные страновые страницы из sitemap-v2-countries.xml, сверено
// 30.08.2026. Для неподдерживаемых направлений возвращаем null: холодная ссылка
// на общий каталог хуже отсутствия оффера. Комбинированным маршрутам — региональный
// пакет Латинской Америки, а субрегионам — пакет родительской страны.
const AIRALO_COUNTRY = {
  'australia-east': 'australia',
  'australia-north': 'australia',
  bali: 'indonesia',
  'sumatra-kalimantan': 'indonesia',
  'raja-ampat': 'indonesia',
  uae: 'united-arab-emirates',
  'japan-hokkaido': 'japan',
  'india-goa': 'india',
  'italy-north': 'italy',
  'italy-south': 'italy',
  'canada-rockies': 'canada',
  'canada-east': 'canada',
  usa: 'united-states',
  'guatemala-belize': 'latin-america',
  'costa-rica-panama': 'latin-america',
  'chile-patagonia': 'chile',
  'chile-fjords': 'chile',
  hainan: 'china',
};
const AIRALO_UNSUPPORTED = new Set([
  'iran', 'cuba', 'abkhazia', 'antarctica',
  'kamchatka', 'karelia', 'dagestan', 'altai',
]);

export const airaloCountry = (countrySlug, subId) => {
  if (AIRALO_UNSUPPORTED.has(countrySlug)) return null;
  const targetSlug = AIRALO_COUNTRY[countrySlug] ?? countrySlug;
  return airaloSub(subId).replace(
    encodeURIComponent('https://airalo.com/ru'),
    encodeURIComponent(`https://airalo.com/ru/${targetSlug}-esim`),
  );
};

// YouTravel: постраничная метка. Сеть Affise принимает sub1..sub5 на своей
// стороне и в адрес назначения их НЕ пробрасывает — проверено 20.08.2026 с
// хостинга: шесть вариантов имени параметра (sub1, sub2, sub_id, sub_id1,
// aff_sub, utm_content) дали один и тот же лендинг с пустым utm_content, но
// каждый раз со свежим click_id, то есть клик засчитывается и ссылка не
// ломается.
//
// ⚠ Записывает ли Affise sub1 в отчёт партнёра — по редиректу не видно, это
// проверяется ТОЛЬКО в кабинете партнёрки. Пока не проверено там, метку
// считать гипотезой: она безопасна (ссылка работает), но полагаться на неё
// в отчётах рано.
//
// ⛔ Проверять доступность этой ссылки с макбука бесполезно: с него
// travelme.g2afse.com рвёт TLS-рукопожатие, а с хостинга сайта та же ссылка
// отдаёт 302 на youtravel.me. «Ссылка мертва» с ноутбука — ложный вывод.
export const youtravelSub = (subId) =>
  TP_LINKS.youtravel + (subId ? `&sub1=${cleanSubId(subId)}` : '');

// YouTravel: SEO-каталоги стран и регионов из официальных sitemap, сверено
// 30.08.2026. Affise принимает `redirect` как deep-link назначения; живой клик
// проверен на Грузии. Значения здесь — не придуманные слаги: каждая страница
// есть у партнёра; Камчатка/Карелия/Дагестан/Алтай дополнительно проверены 200+H1.
const YOUTRAVEL_DESTINATION = {
  'australia-east': 'country/австралия',
  'australia-north': 'country/австралия',
  bali: 'region/bali',
  'sumatra-kalimantan': 'country/индонезия',
  'raja-ampat': 'country/индонезия',
  'new-zealand': 'country/новая_зеландия',
  kenya: 'country/кения',
  'south-africa': 'country/юар',
  uae: 'country/оаэ',
  'saudi-arabia': 'country/саудовская_аравия',
  oman: 'country/оман',
  qatar: 'country/катар',
  turkey: 'country/турция',
  egypt: 'country/египет',
  morocco: 'country/марокко',
  israel: 'country/израиль',
  iran: 'country/иран',
  jordan: 'country/иордания',
  tanzania: 'country/танзания',
  madagascar: 'country/мадагаскар',
  mauritius: 'country/маврикий',
  seychelles: 'country/сейшелы',
  japan: 'country/япония',
  'japan-hokkaido': 'country/япония',
  'hong-kong': 'country/гонконг',
  'south-korea': 'country/южная_корея',
  thailand: 'country/таиланд',
  vietnam: 'country/вьетнам',
  'india-goa': 'region/goa',
  'sri-lanka': 'country/шри-ланка',
  maldives: 'country/мальдивы',
  georgia: 'country/грузия',
  armenia: 'country/армения',
  kyrgyzstan: 'country/киргизия',
  uzbekistan: 'country/узбекистан',
  tajikistan: 'country/таджикистан',
  abkhazia: 'country/abhazia',
  kazakhstan: 'country/казахстан',
  china: 'country/китай',
  hainan: 'country/китай',
  malaysia: 'country/малайзия',
  philippines: 'country/филиппины',
  cambodia: 'country/камбоджа',
  singapore: 'country/сингапур',
  nepal: 'country/непал',
  serbia: 'country/сербия',
  finland: 'country/финляндия',
  cyprus: 'country/кипр',
  switzerland: 'country/швейцария',
  'italy-north': 'country/италия',
  'italy-south': 'country/италия',
  spain: 'country/испания',
  greece: 'country/греция',
  croatia: 'country/хорватия',
  iceland: 'country/исландия',
  norway: 'country/норвегия',
  usa: 'country/сша',
  'canada-rockies': 'country/канада',
  'canada-east': 'country/канада',
  mexico: 'country/мексика',
  cuba: 'country/куба',
  'dominican-republic': 'country/доминикана',
  'guatemala-belize': 'region/centralnaya-amerika',
  'costa-rica-panama': 'region/centralnaya-amerika',
  'chile-patagonia': 'region/patagoniya',
  'chile-fjords': 'country/чили',
  peru: 'country/перу',
  bolivia: 'country/боливия',
  chile: 'country/чили',
  argentina: 'country/аргентина',
  ecuador: 'country/эквадор',
  brazil: 'country/бразилия',
  antarctica: 'country/antarctica',
  kamchatka: 'region/kamchatka',
  karelia: 'region/karelia',
  dagestan: 'region/dagestan',
  altai: 'region/altai',
};

export const youtravelCountry = (countrySlug, subId) => {
  const destination = YOUTRAVEL_DESTINATION[countrySlug];
  if (!destination) return youtravelSub(subId);
  return youtravelSub(subId) + '&redirect=' + encodeURIComponent(`https://youtravel.me/tours/${destination}`);
};

// Drimsim: шортлинк без query, поэтому метка вешается через `?`, а не `&`.
export const drimsimSub = (subId) =>
  TP_LINKS.drimsim + (subId ? `?sub_id=${cleanSubId(subId)}` : '');

// ── Отели: страна вместо пустой формы ────────────────────────────────────────
//
// ⛔ Найдено 02.08.2026 при разборе «300 переходов, ноль продаж». На страницах
// направлений и поездок стояла подпись «Подобрать отель в Кении», а ссылка вела
// на ГЛАВНУЮ партнёра — без страны, без дат, пустая форма. Таких ссылок 953.
// Человек кликал за отелями в Кении и начинал поиск с нуля: это холодный клик,
// который по канону монетизации не конвертируется.
//
// Соответствия проверены запросом к самому партнёру (не догадка): 42 наших
// слага он принимает как есть, остальные 32 — по таблице ниже. У него подчёркивания
// (`new_zealand`, `united_arab_emirates`), а регионы сводятся к своей стране.
const OSTROVOK_COUNTRY = {
  'australia-east': 'australia', 'australia-north': 'australia',
  'bali': 'indonesia', 'sumatra-kalimantan': 'indonesia', 'raja-ampat': 'indonesia',
  'new-zealand': 'new_zealand', 'south-africa': 'south_africa',
  'uae': 'united_arab_emirates', 'japan-hokkaido': 'japan',
  // Гонконг отдельной страницы у партнёра нет — ведём в Китай, это ближайшее верное.
  'hong-kong': 'china', 'hainan': 'china',
  'south-korea': 'south_korea', 'india-goa': 'india', 'sri-lanka': 'sri_lanka',
  'italy-north': 'italy', 'italy-south': 'italy',
  'usa': 'united_states_of_america',
  'canada-rockies': 'canada', 'canada-east': 'canada',
  'dominican-republic': 'dominican_republic',
  'guatemala-belize': 'guatemala', 'costa-rica-panama': 'costa_rica',
  'chile-patagonia': 'chile', 'chile-fjords': 'chile',
  'kamchatka': 'russia', 'karelia': 'russia', 'dagestan': 'russia', 'altai': 'russia',
};

/**
 * Отели по стране направления. Если страна неизвестна — честно отдаём общий
 * поиск, а не выдуманный адрес: битая ссылка хуже холодной.
 */
export const ostrovokCountry = (dirSlug, subId) => {
  const c = OSTROVOK_COUNTRY[dirSlug] ?? dirSlug;
  return c ? tpkDeep('ostrovok', `https://ostrovok.ru/hotel/${c}/`, subId) : ostrovokSearch(subId);
};

// Единый переход от общего оффера к проверенному страновому. Нужен старым
// статьям: их вручную написанные ссылки остаются рабочим fallback без JS, а
// общий денежный слой уточняет назначение до первого клика.
export function destinationAffiliateUrl(partner, destination, subId) {
  if (!destination) return null;
  if (partner === 'cherehapa') return cherehapaCountry(destination, subId);
  if (partner === 'ostrovok') return ostrovokCountry(destination, subId);
  if (partner === 'airalo') return airaloCountry(destination, subId);
  if (partner === 'youtravel') return youtravelCountry(destination, subId);
  return null;
}
