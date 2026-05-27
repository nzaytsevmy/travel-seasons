// Месячные климатологические данные для топ-15 направлений.
// Используется в /packing/[country]/[month].astro для unique month-specific блока.
//
// Формат: months[0..11] = { temp: '<min>-<max>°C', rain: '<mm> / <дн>' }
// Источники указаны в `source` — climatestotravel.com / climate-data.org / weatherspark / WMO.
// Все цифры — многолетние средние, проверяемые в открытых источниках.

export const MONTHLY_WEATHER = {
  'bali': {
    city: 'Денпасар',
    months: [
      { temp: '24-31°C', rain: '281 мм / 19 дн' }, // январь — сезон дождей пик
      { temp: '24-31°C', rain: '253 мм / 17 дн' },
      { temp: '24-31°C', rain: '231 мм / 14 дн' },
      { temp: '25-32°C', rain: '111 мм / 8 дн' },  // апрель — переход на сухой
      { temp: '24-32°C', rain: '76 мм / 4 дн' },
      { temp: '23-31°C', rain: '53 мм / 3 дн' },
      { temp: '23-31°C', rain: '40 мм / 2 дн' },
      { temp: '23-31°C', rain: '41 мм / 1 дн' },   // август — самый сухой
      { temp: '23-31°C', rain: '52 мм / 2 дн' },
      { temp: '24-32°C', rain: '105 мм / 6 дн' },
      { temp: '24-32°C', rain: '178 мм / 11 дн' }, // ноябрь — начало дождей
      { temp: '24-31°C', rain: '263 мм / 18 дн' },
    ],
    source: 'climatestotravel.com / climate-data.org — Denpasar',
  },

  'thailand': {
    city: 'Бангкок и юг (Пхукет)',
    months: [
      { temp: '21-32°C', rain: '15 мм / 1 дн' },   // январь — сухой сезон
      { temp: '23-33°C', rain: '20 мм / 1 дн' },
      { temp: '25-34°C', rain: '40 мм / 3 дн' },
      { temp: '26-35°C', rain: '85 мм / 5 дн' },   // апрель — самый жаркий
      { temp: '25-34°C', rain: '230 мм / 14 дн' }, // май — начало муссона
      { temp: '25-33°C', rain: '180 мм / 13 дн' },
      { temp: '25-33°C', rain: '180 мм / 13 дн' },
      { temp: '25-33°C', rain: '215 мм / 15 дн' },
      { temp: '24-32°C', rain: '333 мм / 20 дн' }, // сентябрь — пик дождей
      { temp: '24-32°C', rain: '290 мм / 17 дн' },
      { temp: '23-31°C', rain: '50 мм / 4 дн' },   // ноябрь — конец сезона дождей
      { temp: '21-31°C', rain: '11 мм / 1 дн' },   // декабрь — пик high-сезона
    ],
    source: 'climatestotravel.com / climate-data.org — Bangkok',
  },

  'turkey': {
    city: 'Анталья (южное побережье)',
    months: [
      { temp: '6-15°C', rain: '263 мм / 13 дн' },  // январь — пик дождей
      { temp: '6-16°C', rain: '170 мм / 10 дн' },
      { temp: '8-19°C', rain: '105 мм / 8 дн' },
      { temp: '11-22°C', rain: '50 мм / 6 дн' },   // апрель — начало сезона
      { temp: '15-27°C', rain: '30 мм / 4 дн' },
      { temp: '20-32°C', rain: '10 мм / 2 дн' },
      { temp: '23-34°C', rain: '3 мм / 0 дн' },    // июль — пик пляжного
      { temp: '23-34°C', rain: '4 мм / 0 дн' },
      { temp: '20-32°C', rain: '20 мм / 2 дн' },
      { temp: '16-27°C', rain: '85 мм / 6 дн' },
      { temp: '11-22°C', rain: '180 мм / 9 дн' },
      { temp: '8-17°C', rain: '270 мм / 12 дн' },
    ],
    source: 'climatestotravel.com / weatherspark — Antalya',
  },

  'japan': {
    city: 'Токио',
    months: [
      { temp: '1-10°C', rain: '52 мм / 5 дн' },    // январь — холодно, сухо
      { temp: '2-11°C', rain: '56 мм / 6 дн' },
      { temp: '5-14°C', rain: '118 мм / 11 дн' },
      { temp: '10-19°C', rain: '125 мм / 11 дн' }, // апрель — сакура
      { temp: '15-23°C', rain: '138 мм / 11 дн' },
      { temp: '19-26°C', rain: '168 мм / 13 дн' }, // июнь — цую (сезон дождей)
      { temp: '23-29°C', rain: '154 мм / 11 дн' },
      { temp: '24-31°C', rain: '168 мм / 9 дн' },  // август — жара + влажность
      { temp: '20-27°C', rain: '210 мм / 12 дн' }, // сентябрь — тайфуны
      { temp: '15-22°C', rain: '198 мм / 10 дн' },
      { temp: '8-17°C', rain: '93 мм / 7 дн' },    // ноябрь — момидзи
      { temp: '3-12°C', rain: '51 мм / 4 дн' },
    ],
    source: 'climatestotravel.com / JMA — Tokyo',
  },

  'uae': {
    city: 'Дубай',
    months: [
      { temp: '15-24°C', rain: '18 мм / 3 дн' },   // январь — самый прохладный
      { temp: '16-25°C', rain: '25 мм / 2 дн' },
      { temp: '18-29°C', rain: '22 мм / 2 дн' },
      { temp: '22-33°C', rain: '7 мм / 1 дн' },
      { temp: '26-38°C', rain: '0.4 мм / 0 дн' },
      { temp: '28-40°C', rain: '0 мм / 0 дн' },
      { temp: '30-41°C', rain: '0.5 мм / 0 дн' },  // июль — пик жары
      { temp: '30-41°C', rain: '0 мм / 0 дн' },
      { temp: '27-39°C', rain: '0 мм / 0 дн' },
      { temp: '24-35°C', rain: '1 мм / 0 дн' },
      { temp: '20-30°C', rain: '3 мм / 1 дн' },
      { temp: '16-26°C', rain: '15 мм / 2 дн' },
    ],
    source: 'climatestotravel.com / WMO — Dubai',
  },

  'vietnam': {
    city: 'Хошимин (юг) / Ханой (север — холоднее)',
    months: [
      { temp: '21-32°C', rain: '14 мм / 1 дн' },   // январь — сухо на юге
      { temp: '22-33°C', rain: '4 мм / 1 дн' },
      { temp: '24-34°C', rain: '12 мм / 2 дн' },
      { temp: '26-35°C', rain: '42 мм / 4 дн' },
      { temp: '25-34°C', rain: '220 мм / 17 дн' }, // май — начало муссона
      { temp: '24-32°C', rain: '300 мм / 21 дн' },
      { temp: '24-32°C', rain: '290 мм / 22 дн' },
      { temp: '24-32°C', rain: '270 мм / 22 дн' },
      { temp: '24-31°C', rain: '335 мм / 23 дн' }, // сентябрь — пик дождей
      { temp: '23-31°C', rain: '270 мм / 21 дн' },
      { temp: '23-31°C', rain: '115 мм / 12 дн' },
      { temp: '22-31°C', rain: '50 мм / 6 дн' },
    ],
    source: 'climatestotravel.com — Ho Chi Minh',
  },

  'armenia': {
    city: 'Ереван',
    months: [
      { temp: '-7--1°C', rain: '22 мм / 4 дн' },   // январь — холодно
      { temp: '-5-2°C', rain: '26 мм / 4 дн' },
      { temp: '0-9°C', rain: '36 мм / 5 дн' },
      { temp: '6-17°C', rain: '47 мм / 7 дн' },    // апрель — весна
      { temp: '10-22°C', rain: '53 мм / 8 дн' },
      { temp: '15-28°C', rain: '23 мм / 5 дн' },
      { temp: '18-33°C', rain: '11 мм / 3 дн' },   // июль — жарко и сухо
      { temp: '18-33°C', rain: '8 мм / 2 дн' },
      { temp: '13-28°C', rain: '14 мм / 3 дн' },
      { temp: '8-19°C', rain: '34 мм / 5 дн' },
      { temp: '2-10°C', rain: '32 мм / 5 дн' },
      { temp: '-4-3°C', rain: '20 мм / 3 дн' },
    ],
    source: 'climate-data.org — Yerevan',
  },

  'sri-lanka': {
    city: 'Коломбо (юг и запад)',
    months: [
      { temp: '22-32°C', rain: '70 мм / 5 дн' },   // январь — сухой сезон ЮЗ
      { temp: '22-32°C', rain: '70 мм / 4 дн' },
      { temp: '23-33°C', rain: '115 мм / 7 дн' },
      { temp: '24-32°C', rain: '230 мм / 12 дн' }, // апрель — переход
      { temp: '25-31°C', rain: '380 мм / 18 дн' }, // май — пик ЮЗ муссона
      { temp: '25-30°C', rain: '180 мм / 13 дн' },
      { temp: '25-30°C', rain: '125 мм / 10 дн' },
      { temp: '25-30°C', rain: '110 мм / 9 дн' },
      { temp: '25-31°C', rain: '160 мм / 12 дн' },
      { temp: '24-31°C', rain: '350 мм / 16 дн' }, // окт — 2-й муссон СВ
      { temp: '23-31°C', rain: '315 мм / 14 дн' },
      { temp: '22-31°C', rain: '147 мм / 8 дн' },
    ],
    source: 'climatestotravel.com — Colombo',
  },

  'maldives': {
    city: 'Мале',
    months: [
      { temp: '25-30°C', rain: '90 мм / 7 дн' },   // янв — сухой сезон
      { temp: '25-30°C', rain: '50 мм / 4 дн' },
      { temp: '26-31°C', rain: '75 мм / 5 дн' },
      { temp: '27-31°C', rain: '125 мм / 9 дн' },
      { temp: '27-31°C', rain: '215 мм / 13 дн' }, // май — начало муссона
      { temp: '26-30°C', rain: '170 мм / 12 дн' },
      { temp: '26-30°C', rain: '155 мм / 11 дн' },
      { temp: '26-30°C', rain: '180 мм / 12 дн' },
      { temp: '26-30°C', rain: '220 мм / 13 дн' },
      { temp: '25-30°C', rain: '215 мм / 13 дн' },
      { temp: '25-30°C', rain: '210 мм / 12 дн' },
      { temp: '25-30°C', rain: '195 мм / 10 дн' },
    ],
    source: 'climatestotravel.com — Malé',
  },

  'kenya': {
    city: 'Найроби (1795м) / Масаи Мара',
    months: [
      { temp: '12-25°C', rain: '63 мм / 5 дн' },   // январь — сухой
      { temp: '13-26°C', rain: '52 мм / 4 дн' },
      { temp: '14-26°C', rain: '105 мм / 9 дн' },
      { temp: '14-24°C', rain: '210 мм / 16 дн' }, // апрель — long rains
      { temp: '13-23°C', rain: '160 мм / 14 дн' },
      { temp: '12-22°C', rain: '30 мм / 5 дн' },
      { temp: '11-21°C', rain: '15 мм / 4 дн' },   // июль — прохладно, сухо
      { temp: '11-22°C', rain: '20 мм / 5 дн' },
      { temp: '12-25°C', rain: '30 мм / 4 дн' },   // сентябрь — миграция
      { temp: '14-26°C', rain: '60 мм / 7 дн' },
      { temp: '14-23°C', rain: '150 мм / 14 дн' },
      { temp: '13-23°C', rain: '90 мм / 10 дн' },
    ],
    source: 'climatestotravel.com — Nairobi',
  },

  'mexico': {
    city: 'Мехико / Канкун (Юкатан — теплее)',
    months: [
      { temp: '6-21°C', rain: '7 мм / 1 дн' },     // янв — сухой сезон
      { temp: '7-23°C', rain: '5 мм / 1 дн' },
      { temp: '10-26°C', rain: '10 мм / 2 дн' },
      { temp: '12-27°C', rain: '20 мм / 3 дн' },
      { temp: '13-26°C', rain: '55 мм / 8 дн' },
      { temp: '13-24°C', rain: '120 мм / 16 дн' }, // июнь — пик дождей
      { temp: '13-23°C', rain: '155 мм / 21 дн' },
      { temp: '13-23°C', rain: '150 мм / 20 дн' },
      { temp: '12-22°C', rain: '130 мм / 18 дн' },
      { temp: '10-22°C', rain: '52 мм / 9 дн' },
      { temp: '8-22°C', rain: '12 мм / 3 дн' },
      { temp: '6-21°C', rain: '8 мм / 2 дн' },
    ],
    source: 'climatestotravel.com — Mexico City',
  },

  'cuba': {
    city: 'Гавана',
    months: [
      { temp: '19-26°C', rain: '63 мм / 6 дн' },   // янв — сухой сезон
      { temp: '19-26°C', rain: '53 мм / 5 дн' },
      { temp: '20-28°C', rain: '50 мм / 4 дн' },
      { temp: '22-29°C', rain: '60 мм / 5 дн' },
      { temp: '23-30°C', rain: '125 мм / 9 дн' },
      { temp: '24-31°C', rain: '170 мм / 12 дн' }, // июнь — пик дождей
      { temp: '25-32°C', rain: '125 мм / 11 дн' },
      { temp: '25-32°C', rain: '135 мм / 11 дн' },
      { temp: '24-31°C', rain: '155 мм / 12 дн' }, // сезон ураганов авг-окт
      { temp: '23-29°C', rain: '180 мм / 11 дн' },
      { temp: '21-27°C', rain: '85 мм / 7 дн' },
      { temp: '20-26°C', rain: '60 мм / 6 дн' },
    ],
    source: 'climatestotravel.com — Havana',
  },

  'italy-north': {
    city: 'Милан / Венеция',
    months: [
      { temp: '0-7°C', rain: '65 мм / 7 дн' },     // январь — холодно
      { temp: '1-9°C', rain: '55 мм / 7 дн' },
      { temp: '4-14°C', rain: '70 мм / 8 дн' },
      { temp: '8-18°C', rain: '78 мм / 9 дн' },
      { temp: '13-23°C', rain: '95 мм / 10 дн' },
      { temp: '17-27°C', rain: '70 мм / 9 дн' },   // июнь — старт лета
      { temp: '20-30°C', rain: '65 мм / 7 дн' },   // июль — жарко
      { temp: '20-29°C', rain: '90 мм / 8 дн' },
      { temp: '15-25°C', rain: '70 мм / 7 дн' },
      { temp: '11-18°C', rain: '95 мм / 9 дн' },
      { temp: '5-12°C', rain: '95 мм / 10 дн' },
      { temp: '1-8°C', rain: '60 мм / 7 дн' },
    ],
    source: 'climate-data.org — Milan',
  },

  'italy-south': {
    city: 'Рим / Сицилия (теплее)',
    months: [
      { temp: '4-13°C', rain: '80 мм / 7 дн' },    // январь
      { temp: '4-14°C', rain: '75 мм / 7 дн' },
      { temp: '6-16°C', rain: '70 мм / 8 дн' },
      { temp: '8-19°C', rain: '60 мм / 7 дн' },
      { temp: '13-24°C', rain: '40 мм / 5 дн' },
      { temp: '16-28°C', rain: '20 мм / 3 дн' },
      { temp: '19-31°C', rain: '15 мм / 2 дн' },   // июль — жарко
      { temp: '19-31°C', rain: '25 мм / 3 дн' },
      { temp: '16-27°C', rain: '70 мм / 5 дн' },
      { temp: '12-22°C', rain: '105 мм / 7 дн' },
      { temp: '8-17°C', rain: '110 мм / 8 дн' },
      { temp: '5-14°C', rain: '95 мм / 8 дн' },
    ],
    source: 'climate-data.org — Rome',
  },

  'spain': {
    city: 'Мадрид (центр) / Барселона (теплее)',
    months: [
      { temp: '0-10°C', rain: '37 мм / 6 дн' },    // январь
      { temp: '2-13°C', rain: '33 мм / 5 дн' },
      { temp: '4-17°C', rain: '27 мм / 5 дн' },
      { temp: '7-19°C', rain: '50 мм / 8 дн' },
      { temp: '11-24°C', rain: '47 мм / 8 дн' },
      { temp: '16-30°C', rain: '23 мм / 4 дн' },
      { temp: '19-34°C', rain: '10 мм / 2 дн' },   // июль — пик жары
      { temp: '19-33°C', rain: '15 мм / 2 дн' },
      { temp: '15-28°C', rain: '23 мм / 4 дн' },
      { temp: '10-21°C', rain: '54 мм / 7 дн' },
      { temp: '5-14°C', rain: '53 мм / 7 дн' },
      { temp: '2-10°C', rain: '52 мм / 7 дн' },
    ],
    source: 'climate-data.org — Madrid',
  },

  'georgia': {
    city: 'Тбилиси / Батуми (влажнее)',
    months: [
      { temp: '0-8°C', rain: '20 мм / 5 дн' },     // январь
      { temp: '0-10°C', rain: '30 мм / 5 дн' },
      { temp: '4-14°C', rain: '40 мм / 7 дн' },
      { temp: '8-19°C', rain: '60 мм / 9 дн' },
      { temp: '13-24°C', rain: '85 мм / 11 дн' },  // май — пик дождей
      { temp: '17-29°C', rain: '80 мм / 10 дн' },
      { temp: '20-32°C', rain: '47 мм / 7 дн' },   // июль — жарко
      { temp: '20-32°C', rain: '47 мм / 6 дн' },
      { temp: '15-27°C', rain: '37 мм / 6 дн' },
      { temp: '10-20°C', rain: '50 мм / 7 дн' },
      { temp: '5-12°C', rain: '35 мм / 5 дн' },
      { temp: '1-8°C', rain: '25 мм / 5 дн' },
    ],
    source: 'climate-data.org — Tbilisi',
  },
};

export function hasMonthlyWeather(slug) {
  return Boolean(MONTHLY_WEATHER[slug]?.months);
}

export function getMonthlyWeather(slug, monthIdx) {
  const data = MONTHLY_WEATHER[slug];
  if (!data?.months?.[monthIdx]) return null;
  return {
    ...data.months[monthIdx],
    city: data.city,
    source: data.source,
  };
}
