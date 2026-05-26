// Праздники и события по странам и месяцам.
// Используется в MonthlyEvents.astro — добавляется к существующему помесячному блоку.
//
// Tag-семантика:
//   'closed' — государственный праздник, многое закрыто, цены ×2-3
//   'fest'   — фестиваль, бронировать заранее, но открыто
//   'culture' — сезонное явление (ханами, момидзи), нюанс
//
// Источники: официальный туристический офис страны (JNTO, ТАТ),
// гос. праздники — calendarific.com / прямой источник правительства.

export const HOLIDAYS = {
  'turkey': [
    { month: 1, name: 'Новый год', dates: '1 января', tag: 'closed' },
    { month: 4, name: 'Ураза-Байрам (Eid al-Fitr)', dates: 'плавающая дата (~март-апрель)', tag: 'closed',
      note: 'дата по лунному календарю; в 2026 — около 20-23 марта' },
    { month: 4, name: 'День национального суверенитета', dates: '23 апреля', tag: 'closed' },
    { month: 5, name: 'День труда', dates: '1 мая', tag: 'closed' },
    { month: 5, name: 'День Ататюрка', dates: '19 мая', tag: 'closed' },
    { month: 6, name: 'Курбан-Байрам (Eid al-Adha)', dates: 'плавающая дата (~май-июнь)', tag: 'closed',
      note: 'в 2026 — около 27-30 мая' },
    { month: 7, name: 'День демократии', dates: '15 июля', tag: 'closed',
      note: 'возможны мероприятия в Анкаре/Стамбуле' },
    { month: 8, name: 'День Победы', dates: '30 августа', tag: 'closed' },
    { month: 10, name: 'День Республики', dates: '29 октября', tag: 'closed',
      note: 'главный национальный праздник; парады, концерты' }
  ],

  'thailand': [
    { month: 1, name: 'Новый год', dates: '1 января', tag: 'closed' },
    { month: 2, name: 'Макха Буча', dates: 'полнолуние февраля', tag: 'culture',
      note: 'буддийский праздник; продажа алкоголя запрещена в этот день' },
    { month: 4, name: 'Сонгкран — тайский Новый год', dates: '13-15 апреля', tag: 'fest',
      note: 'водные битвы по всей стране; пик туризма; цены ×1.5' },
    { month: 5, name: 'День коронации', dates: '4 мая', tag: 'closed' },
    { month: 5, name: 'Висакха Буча', dates: 'полнолуние мая', tag: 'culture',
      note: 'буддийский праздник; продажа алкоголя запрещена' },
    { month: 7, name: 'День рождения Королевы (День матери)', dates: '12 августа', tag: 'closed' },
    { month: 10, name: 'День памяти короля Рамы IX', dates: '13 октября', tag: 'closed' },
    { month: 11, name: 'Лой Кратонг', dates: 'полнолуние ноября', tag: 'fest',
      note: 'фестиваль плавающих свечей; в Чиангмае — фестиваль фонариков Yi Peng' },
    { month: 12, name: 'День рождения короля Рамы X', dates: '5 декабря', tag: 'closed' }
  ],

  'georgia': [
    { month: 1, name: 'Православное Рождество', dates: '7 января', tag: 'closed' },
    { month: 1, name: 'День матери', dates: '3 марта', tag: 'culture' },
    { month: 3, name: 'Международный женский день', dates: '8 марта', tag: 'closed' },
    { month: 4, name: 'Православная Пасха', dates: 'плавающая дата (~апрель)', tag: 'closed',
      note: 'в 2026 — около 12 апреля' },
    { month: 4, name: 'День национального единства', dates: '9 апреля', tag: 'closed' },
    { month: 5, name: 'День независимости', dates: '26 мая', tag: 'closed',
      note: 'парады в Тбилиси, фестивали' },
    { month: 7, name: 'Тбилисоба', dates: '4 неделя мая или октябрь', tag: 'fest',
      note: 'городской фестиваль Тбилиси, вино и музыка' },
    { month: 8, name: 'Успение Богородицы (Мариамоба)', dates: '28 августа', tag: 'closed' },
    { month: 10, name: 'Светицховлоба', dates: '14 октября', tag: 'culture',
      note: 'праздник в Мцхете; массовое паломничество' },
    { month: 11, name: 'Святой Георгий (Гиоргоба)', dates: '23 ноября', tag: 'closed' }
  ],

  'japan': [
    { month: 1, name: 'Сёгацу (Новый год)', dates: '1-3 января', tag: 'closed',
      note: 'почти всё закрыто, поезда работают; рестораны открываются с 4-го' },
    { month: 2, name: 'Сэцубун', dates: '3 февраля', tag: 'culture',
      note: 'праздник изгнания демонов, бросают соевые бобы' },
    { month: 3, name: 'Хинамацури', dates: '3 марта', tag: 'culture',
      note: 'день девочек, выставки кукол хина' },
    { month: 4, name: 'Ханами (цветение сакуры)', dates: 'конец марта - середина апреля', tag: 'culture',
      note: 'пик туризма; цены ×1.5; цветение 1-2 недели по широте' },
    { month: 5, name: 'Золотая неделя', dates: '29 апреля - 6 мая 2026', tag: 'closed',
      note: 'Super Golden Week (8 дней); цены ×2.5-3, синкансены забиты' },
    { month: 5, name: 'Аои Мацури (Киото)', dates: '15 мая', tag: 'fest',
      note: 'процессия в костюмах эпохи Хэйан' },
    { month: 7, name: 'Танабата', dates: '7 июля', tag: 'culture',
      note: 'праздник звёзд, повсюду цветные ленты на бамбуке' },
    { month: 7, name: 'Гион Мацури (Киото)', dates: 'весь июль, пик 17 июля', tag: 'fest',
      note: 'один из 3 крупнейших фестивалей Японии; отели за полгода' },
    { month: 8, name: 'Обон', dates: '13-16 августа', tag: 'closed',
      note: 'возвращение душ предков; второй национальный отпуск, толпы' },
    { month: 11, name: 'Момидзи (красные клёны)', dates: 'начало - конец ноября', tag: 'culture',
      note: 'пик в Киото — 3-я неделя ноября; лучший сезон для первой поездки' }
  ]
};

export function hasHolidays(slug) {
  return Boolean(HOLIDAYS[slug]?.length);
}

export function getHolidays(slug) {
  return HOLIDAYS[slug] || [];
}

// Сгруппировано по месяцам — для рендера в таблице/списке.
export function getHolidaysByMonth(slug) {
  const list = HOLIDAYS[slug] || [];
  const byMonth = {};
  for (const ev of list) {
    if (!byMonth[ev.month]) byMonth[ev.month] = [];
    byMonth[ev.month].push(ev);
  }
  return byMonth;
}
