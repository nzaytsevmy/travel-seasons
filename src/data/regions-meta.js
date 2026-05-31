// Метаданные для каждого региона из regions.js
// Lookup по полю `sub` (уникально по строкам)
// slug — соответствует SLUG_OVERRIDES в src/data/directions.js (URL для /<slug>/, /visa/<slug>/, /trips/<m>/<slug>/)
// iata — для Aviasales deep-link и API цен (origin всегда MOW)
// blogSlug — связь с конкретным блог-постом, если есть

export const regionMeta = {
  // Австралия & Океания
  'Восток: Сидней, Мельбурн':            { slug: 'australia-east',      iata: 'SYD', blogSlug: null },
  'Север: Дарвин, Какаду':               { slug: 'australia-north',     iata: 'DRW', blogSlug: null },
  'Нуса Тенггара':                       { slug: 'bali',                iata: 'DPS', blogSlug: 'bali-guide-2026' },
  'Орангутаны, джунгли':                 { slug: 'sumatra-kalimantan',  iata: 'KNO', blogSlug: null },
  'Папуа Барат, дайвинг':                { slug: 'raja-ampat',          iata: 'SOQ', blogSlug: null },

  // Африка & Ближний Восток
  'Масаи Мара, Найроби, сафари':         { slug: 'kenya',               iata: 'NBO', blogSlug: null },
  'Кейптаун + Крюгер':                   { slug: 'south-africa',        iata: 'CPT', blogSlug: null },
  'Дубай, Абу-Даби':                     { slug: 'uae',                 iata: 'DXB', blogSlug: null },
  'Анталья, Стамбул, Каппадокия':        { slug: 'turkey',              iata: 'IST', blogSlug: null },
  'Хургада, Шарм-эль-Шейх, Каир':        { slug: 'egypt',               iata: 'HRG', blogSlug: null },
  'Маракеш, Касабланка, Атлас':          { slug: 'morocco',             iata: 'RAK', blogSlug: null },

  // Азия
  'Токио, Киото, Осака':                 { slug: 'japan',               iata: 'TYO', blogSlug: 'japan-guide-2026' },
  'Саппоро, Ниссеко, лыжи':              { slug: 'japan-hokkaido',      iata: 'CTS', blogSlug: null },
  'Сеул, Пусан, Чеджудо':                { slug: 'south-korea',         iata: 'ICN', blogSlug: null },
  'Пхукет, Самуи, Бангкок':              { slug: 'thailand',            iata: 'BKK', blogSlug: null },
  'Нячанг, Фукуок, Хошимин, Ханой':      { slug: 'vietnam',             iata: 'SGN', blogSlug: null },
  'Север: Калангут, Юг: Палолем':        { slug: 'india-goa',           iata: 'GOI', blogSlug: null },
  'Юг + Запад / Восток (муссоны)':       { slug: 'sri-lanka',           iata: 'CMB', blogSlug: null },
  'Атоллы, дайвинг':                     { slug: 'maldives',            iata: 'MLE', blogSlug: null },
  'Тбилиси, Батуми, Казбеги':            { slug: 'georgia',             iata: 'TBS', blogSlug: null },
  'Ереван, Севан, Дилижан':              { slug: 'armenia',             iata: 'EVN', blogSlug: null },
  'Юг: Ош, Сары-Таш, Алайская долина':   { slug: 'kyrgyzstan',          iata: 'OSS', blogSlug: null },
  'Самарканд, Бухара, Хива':             { slug: 'uzbekistan',          iata: 'TAS', blogSlug: null },
  'Памирский тракт, Душанбе':            { slug: 'tajikistan',          iata: 'DYU', blogSlug: null },
  'Алматы, Чарынский каньон, степи':     { slug: 'kazakhstan',          iata: 'ALA', blogSlug: null },

  // Европа
  'Альпы: Церматт, Интерлакен, Люцерн':         { slug: 'switzerland',  iata: 'ZRH', blogSlug: 'schengen-visa-2026' },
  'Озёра (Комо, Гарда), Доломиты, Венеция':     { slug: 'italy-north',  iata: 'MXP', blogSlug: 'schengen-visa-2026' },
  'Рим, Тоскана, Сицилия, Амальфи':             { slug: 'italy-south',  iata: 'ROM', blogSlug: 'schengen-visa-2026' },
  'Барселона, Мадрид, Канары':                  { slug: 'spain',        iata: 'BCN', blogSlug: 'schengen-visa-2026' },
  'Афины, Крит, Санторини, Корфу':              { slug: 'greece',       iata: 'ATH', blogSlug: 'schengen-visa-2026' },
  'Далмация: Дубровник, Сплит, острова':        { slug: 'croatia',      iata: 'DBV', blogSlug: 'schengen-visa-2026' },

  // Америка
  'Банф, Джаспер (горы)':                       { slug: 'canada-rockies',iata: 'YYC', blogSlug: null },
  'Квебек, Онтарио (восток)':                   { slug: 'canada-east',  iata: 'YUL', blogSlug: null },
  'Юкатан, Канкун, Мехико':                     { slug: 'mexico',       iata: 'CUN', blogSlug: null },
  'Варадеро, Гавана, Тринидад':                 { slug: 'cuba',         iata: 'HAV', blogSlug: null },
  'Пунта-Кана, Самана, Санто-Доминго':          { slug: 'dominican-republic', iata: 'PUJ', blogSlug: null },
  'Тикаль, Антигуа, Карибы':                    { slug: 'guatemala-belize',  iata: 'GUA', blogSlug: null },
  'Природа, пляжи обоих побережий':             { slug: 'costa-rica-panama', iata: 'SJO', blogSlug: null },
  'Торрес-дель-Пайне, Пуэрто-Наталес':          { slug: 'chile-patagonia',  iata: 'PUQ', blogSlug: null },
  'Каррера, Чилоэ, Айсен':                      { slug: 'chile-fjords', iata: 'PMC', blogSlug: null },

  // Latam расширение
  'Куско, Мачу-Пикчу, Лима':                    { slug: 'peru',         iata: 'LIM', blogSlug: null },
  'Уюни, Ла-Пас, Тити-кака':                    { slug: 'bolivia',      iata: 'LPB', blogSlug: null },
  'Атакама, Сантьяго':                          { slug: 'chile',        iata: 'SCL', blogSlug: null },
  'Буэнос-Айрес, Игуасу':                       { slug: 'argentina',    iata: 'EZE', blogSlug: null },
  'Галапагосы, Кито, Амазония':                 { slug: 'ecuador',      iata: 'UIO', blogSlug: 'galapagos-2026' },
  'Рио, Игуасу, Пантанал':                      { slug: 'brazil',       iata: 'GIG', blogSlug: null },

  // Polar / Premium
  'Антарктический полуостров':                  { slug: 'antarctica',   iata: 'USH', blogSlug: 'antarctica-cruise-2026' },
  'Рейкьявик, Голден круг, юг':                 { slug: 'iceland',      iata: 'KEF', blogSlug: null },
  'Лофотены, Тромсё, фьорды':                   { slug: 'norway',       iata: 'OSL', blogSlug: null },
  'Нью-Йорк, ЛА, нацпарки':                     { slug: 'usa',          iata: 'JFK', blogSlug: null },
  'Юг + Север, фьорды':                         { slug: 'new-zealand',  iata: 'AKL', blogSlug: 'aurora-new-zealand-2026' },

  // Новые направления 2026 (18 + Гонконг)
  'Тель-Авив, Иерусалим, Эйлат, Мёртвое море':  { slug: 'israel',       iata: 'TLV', blogSlug: null },
  'Тегеран, Исфахан, Шираз, Йезд':              { slug: 'iran',         iata: 'IKA', blogSlug: null },
  'Петра, Мёртвое море, Вади-Рам':              { slug: 'jordan',       iata: 'AMM', blogSlug: null },
  'Серенгети, Занзибар, Килиманджаро':          { slug: 'tanzania',     iata: 'JRO', blogSlug: null },
  'Антананариву, Нуси-Бе, Цинги':               { slug: 'madagascar',   iata: 'TNR', blogSlug: null },
  'Гранд Бэ, Иль-о-Серф':                       { slug: 'mauritius',    iata: 'MRU', blogSlug: null },
  'Маэ, Праслин, Ла-Диг':                       { slug: 'seychelles',   iata: 'SEZ', blogSlug: null },
  'Виктория-Пик, Коулун, Лантау':               { slug: 'hong-kong',    iata: 'HKG', blogSlug: null },
  'Гагра, Сухум, Рица':                         { slug: 'abkhazia',     iata: null,  blogSlug: null },
  'Пекин, Шанхай, Сиань, Гуанчжоу':             { slug: 'china',        iata: 'PEK', blogSlug: 'china-guide-2026' },
  'Санья, Хайкоу, тропики':                     { slug: 'hainan',       iata: 'SYX', blogSlug: 'hainan-guide-2026' },
  'Куала-Лумпур, Лангкави, Борнео':             { slug: 'malaysia',     iata: 'KUL', blogSlug: null },
  'Палаван, Бохол, Себу, Манила':               { slug: 'philippines',  iata: 'MNL', blogSlug: null },
  'Ангкор, Пном-Пень, Сиануквиль':              { slug: 'cambodia',     iata: 'REP', blogSlug: null },
  'Сити, Сентоса, Гарденс-бай-зе-Бэй':          { slug: 'singapore',    iata: 'SIN', blogSlug: null },
  'Катманду, Покхара, Эверест-трек':            { slug: 'nepal',        iata: 'KTM', blogSlug: null },
  'Белград, Нови-Сад, Златибор':                { slug: 'serbia',       iata: 'BEG', blogSlug: null },
  'Хельсинки, Лапландия, северное сияние':      { slug: 'finland',      iata: 'HEL', blogSlug: null },
  'Лимасол, Пафос, Айя-Напа':                   { slug: 'cyprus',       iata: 'LCA', blogSlug: null },
};
