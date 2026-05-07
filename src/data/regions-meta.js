// Метаданные для каждого региона из regions.js
// Lookup по полю `sub` (уникально для всех 39 строк)
// slug — для URL state и country-hub в будущем
// iata — для Aviasales deep-link и API цен (origin всегда MOW)
// blogSlug — связь с блог-постом, если есть

export const regionMeta = {
  // Австралия & Океания
  'Восток: Сидней, Мельбурн':            { slug: 'australia-east',  iata: 'SYD', blogSlug: null },
  'Север: Дарвин, Какаду':               { slug: 'australia-north', iata: 'DRW', blogSlug: null },
  'Нуса Тенггара':                       { slug: 'bali',            iata: 'DPS', blogSlug: 'bali-guide-2026' },
  'Орангутаны, джунгли':                 { slug: 'sumatra',         iata: 'KNO', blogSlug: null },
  'Папуа Барат, дайвинг':                { slug: 'raja-ampat',      iata: 'SOQ', blogSlug: null },

  // Африка & Ближний Восток
  'Масаи Мара, Найроби, сафари':         { slug: 'kenya',           iata: 'NBO', blogSlug: null },
  'Кейптаун + Крюгер':                   { slug: 'south-africa',    iata: 'CPT', blogSlug: null },
  'Дубай, Абу-Даби':                     { slug: 'uae',             iata: 'DXB', blogSlug: null },
  'Анталья, Стамбул, Каппадокия':        { slug: 'turkey',          iata: 'IST', blogSlug: null },
  'Хургада, Шарм-эль-Шейх, Каир':        { slug: 'egypt',           iata: 'HRG', blogSlug: null },
  'Маракеш, Касабланка, Атлас':          { slug: 'morocco',         iata: 'RAK', blogSlug: null },

  // Азия
  'Токио, Киото, Осака':                 { slug: 'japan',           iata: 'TYO', blogSlug: 'japan-guide-2026' },
  'Сеул, Пусан, Чеджудо':                { slug: 'south-korea',     iata: 'ICN', blogSlug: null },
  'Пхукет, Самуи, Бангкок':              { slug: 'thailand',        iata: 'BKK', blogSlug: null },
  'Нячанг, Фукуок, Хошимин, Ханой':      { slug: 'vietnam',         iata: 'SGN', blogSlug: null },
  'Север: Калангут, Юг: Палолем':        { slug: 'goa',             iata: 'GOI', blogSlug: null },
  'Юг + Запад / Восток (муссоны)':       { slug: 'sri-lanka',       iata: 'CMB', blogSlug: null },
  'Атоллы, дайвинг':                     { slug: 'maldives',        iata: 'MLE', blogSlug: null },
  'Тбилиси, Батуми, Казбеги':            { slug: 'georgia',         iata: 'TBS', blogSlug: null },
  'Ереван, Севан, Дилижан':              { slug: 'armenia',         iata: 'EVN', blogSlug: null },
  'Юг: Ош, Сары-Таш, Алайская долина':   { slug: 'kyrgyzstan',      iata: 'OSS', blogSlug: null },
  'Самарканд, Бухара, Хива':             { slug: 'uzbekistan',      iata: 'TAS', blogSlug: null },
  'Памирский тракт, Душанбе':            { slug: 'tajikistan',      iata: 'DYU', blogSlug: null },
  'Алматы, Чарынский каньон, степи':     { slug: 'kazakhstan',      iata: 'ALA', blogSlug: null },

  // Европа
  'Альпы: Церматт, Интерлакен, Люцерн':         { slug: 'switzerland',  iata: 'ZRH', blogSlug: 'schengen-visa-2026' },
  'Озёра (Комо, Гарда), Доломиты, Венеция':     { slug: 'italy-north',  iata: 'MXP', blogSlug: 'schengen-visa-2026' },
  'Рим, Тоскана, Сицилия, Амальфи':             { slug: 'italy-south',  iata: 'ROM', blogSlug: 'schengen-visa-2026' },
  'Барселона, Мадрид, Канары':                  { slug: 'spain',        iata: 'BCN', blogSlug: 'schengen-visa-2026' },
  'Афины, Крит, Санторини, Корфу':              { slug: 'greece',       iata: 'ATH', blogSlug: 'schengen-visa-2026' },
  'Далмация: Дубровник, Сплит, острова':        { slug: 'croatia',      iata: 'DBV', blogSlug: 'schengen-visa-2026' },

  // Америка
  'Банф, Джаспер (горы)':                       { slug: 'canada-west', iata: 'YYC', blogSlug: null },
  'Квебек, Онтарио (восток)':                   { slug: 'canada-east', iata: 'YUL', blogSlug: null },
  'Юкатан, Канкун, Мехико':                     { slug: 'mexico',      iata: 'CUN', blogSlug: null },
  'Варадеро, Гавана, Тринидад':                 { slug: 'cuba',        iata: 'HAV', blogSlug: null },
  'Пунта-Кана, Самана, Санто-Доминго':          { slug: 'dominican',   iata: 'PUJ', blogSlug: null },
  'Тикаль, Антигуа, Карибы':                    { slug: 'guatemala',   iata: 'GUA', blogSlug: null },
  'Природа, пляжи обоих побережий':             { slug: 'costa-rica',  iata: 'SJO', blogSlug: null },
  'Торрес-дель-Пайне, Пуэрто-Наталес':          { slug: 'patagonia',   iata: 'PUQ', blogSlug: null },
  'Каррера, Чилоэ, Айсен':                      { slug: 'chile-fjords',iata: 'SCL', blogSlug: null },
};
