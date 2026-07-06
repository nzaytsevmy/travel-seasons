// Кураторские пары для /compare/<a>-vs-<b>/ — реальные decision-intent дилеммы
// («турция или египет», «таиланд или вьетнам»), НЕ перебор 70×70. Каждый slug
// должен существовать в DIRECTIONS (src/data/directions.js).
// angle — короткая человеческая рамка (не факт, не выдумка) для intro абзаца.
export const COMPARE_PAIRS = [
  { a: 'turkey', b: 'egypt', angle: 'бюджетное all-inclusive море зимой' },
  { a: 'thailand', b: 'vietnam', angle: 'долгое путешествие по Юго-Восточной Азии' },
  { a: 'georgia', b: 'armenia', angle: 'безвизовый Кавказ — вино, горы, доступные цены' },
  { a: 'bali', b: 'sri-lanka', angle: 'тропики надолго, не только пляж' },
  { a: 'uae', b: 'egypt', angle: 'зимнее море рядом с РФ, разный бюджет' },
  { a: 'maldives', b: 'sri-lanka', angle: 'Индийский океан — атолл-отель или остров с маршрутом' },
  { a: 'maldives', b: 'seychelles', angle: 'дорогой островной медовый месяц' },
  { a: 'abkhazia', b: 'turkey', angle: 'море без загранпаспорта или с ним' },
  { a: 'dagestan', b: 'abkhazia', angle: 'горы или море, оба — без визы, внутри страны' },
  { a: 'altai', b: 'karelia', angle: 'российская природа — юг Сибири или север' },
  { a: 'altai', b: 'kamchatka', angle: 'горы России — доступно по деньгам или дорого' },
  { a: 'kyrgyzstan', b: 'kazakhstan', angle: 'бюджетная Центральная Азия' },
  { a: 'italy-north', b: 'italy-south', angle: 'какая Италия — озёра и горы или юг и море' },
  { a: 'spain', b: 'greece', angle: 'европейское море, нужна шенгенская виза' },
  { a: 'greece', b: 'croatia', angle: 'острова Средиземноморья и Адриатики' },
  { a: 'dominican-republic', b: 'cuba', angle: 'Карибы — далеко и недёшево из России' },
  { a: 'peru', b: 'bolivia', angle: 'Анды — Мачу-Пикчу или Уюни' },
  { a: 'malaysia', b: 'singapore', angle: 'Юго-Восточная Азия — бюджетно или дорого' },
  { a: 'vietnam', b: 'philippines', angle: 'острова и пляжи ЮВА' },
  { a: 'morocco', b: 'uae', angle: 'экзотика — бюджетно или премиум' },
  { a: 'japan', b: 'south-korea', angle: 'Восточная Азия — культура, еда, города' },
  { a: 'serbia', b: 'georgia', angle: 'Европа и не только Европа рядом, без визы' },
  { a: 'cyprus', b: 'turkey', angle: 'средиземноморское море, разные визовые режимы' },
  { a: 'china', b: 'hainan', angle: 'Китай — мегаполисы или тропический остров' },
];
