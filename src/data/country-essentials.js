// Per-country essentials: чаевые, экстренные номера, вода из-под крана, такси-приложения.
// Используется в EssentialsCard.astro — отдельная карточка в /<slug>/.
//
// Источники (обязательно для YMYL):
// — Посольство РФ в стране (japan.mid.ru, ru.embassyrussia.com и аналоги)
// — Официальный иммиграционный/туристический сайт страны (JNTO, ТАТ, JIE)
// — IEC 60083 для plug type — см. country-plug-types.js
//
// Каденс ревизии: ≤180 дней; экстренные номера + посольство — критично проверять.
// При изменении факта: grep по репо, обновить llms.txt в той же сессии.
//
// Schema FAQPage — каждый пункт = Q&A для AEO (Яндекс.Нейро / Google AI Overviews
// забирают только структурированные блок-факты, не абзац прозы).

export const ESSENTIALS = {
  'bali': {
    tipping: {
      restaurants: '10% service-charge + 11% налог обычно включены; в кафе/варунгах — округление',
      taxi: 'округление; Grab/Gojek чаевые в приложении',
      hotel: '10-50k IDR носильщику',
      note: 'местные зарплаты низкие; чаевые делают разницу'
    },
    emergency: {
      police: '110',
      ambulance: '118',
      fire: '113',
      general: '112',
      embassy_ru_url: 'https://indonesia.mid.ru/',
      embassy_note: 'Главное посольство — Джакарта; в Денпасаре только Почётный консул (визы и паспорта НЕ оформляются)'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; местные тоже пьют бутилированную/фильтрованную'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее, по всей Юго-Восточной Азии' },
      { name: 'Gojek', note: 'местное, мото-такси GoRide дешевле всего' },
      { name: 'Bluebird', note: 'официальные синие такси Bali Taxi' }
    ],
    sources: [
      { name: 'Посольство РФ в Индонезии', url: 'https://indonesia.mid.ru/' },
      { name: 'Bali.com — Emergency Numbers', url: 'https://bali.com/bali/travel-guide/health-safety/emergency-numbers/' },
      { name: 'Bali.com — Tap Water', url: 'https://bali.com/bali/travel-guide/practical-tips-must-know/can-i-drink-tap-water-bali/' }
    ],
    updated: '2026-05-26'
  },

  'uae': {
    tipping: {
      restaurants: '10-15% если сервис-чардж не включён',
      taxi: 'округление до целого AED',
      hotel: '10-20 AED носильщику',
      note: 'нет строгих правил; чаевые ценятся, но не обязательны'
    },
    emergency: {
      police: '999',
      ambulance: '998',
      fire: '997',
      embassy_ru_phone: '+971-4-328-5347',
      embassy_ru_url: 'https://dubai.mid.ru/',
      embassy_note: 'Генконсульство в Дубае + Посольство в Абу-Даби'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — 99% воды из крупномасштабной опреснительной обработки (DEWA)'
    },
    taxi_apps: [
      { name: 'Careem', note: 'крупнейшее на Ближнем Востоке (принадлежит Uber с 2020)' },
      { name: 'Uber', note: 'работает как везде, через тот же флот' },
      { name: 'Hala', note: 'интегрировано с Careem, такси Dubai Taxi Corporation' }
    ],
    sources: [
      { name: 'Генконсульство РФ в Дубае', url: 'https://dubai.mid.ru/' },
      { name: 'UAE Government — Emergencies', url: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies' },
      { name: 'Visit Dubai — Tipping', url: 'https://www.visitdubai.com/en/articles/tipping-in-dubai' }
    ],
    updated: '2026-05-26'
  },

  'vietnam': {
    tipping: {
      restaurants: 'не обязательно; 5-10% в mid-range/luxury',
      taxi: 'округление до целого; в Grab — через приложение',
      hotel: '20-50k VND носильщику',
      note: 'не часть культуры; гидам/драйверам 10-15% от тура'
    },
    emergency: {
      police: '113',
      fire: '114',
      ambulance: '115',
      embassy_ru_phone: '+84-24-3833-6991',
      embassy_ru_url: 'https://vietnam.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; даже хлорированная в городах — старые трубы; бутилированная везде'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее; машины, мото, доставка' },
      { name: 'Be', note: 'вьетнамское, дешевле; ~28 городов' },
      { name: 'XanhSM', note: 'электротакси VinFast, новые машины' }
    ],
    sources: [
      { name: 'Посольство РФ во Вьетнаме (Ханой)', url: 'https://vietnam.mid.ru/' },
      { name: 'GOV.UK — Vietnam Emergency', url: 'https://www.gov.uk/foreign-travel-advice/vietnam/getting-help' },
      { name: 'Vietnam.vn — 2026 Entry Regulations', url: 'https://www.vietnam.vn/en/cap-nhat-quy-dinh-nhap-canh-viet-nam-2026' }
    ],
    updated: '2026-05-26'
  },

  'armenia': {
    tipping: {
      restaurants: '10% часто включено в сервис-чардж; иначе — по желанию',
      taxi: 'не принято; max 500 драм за хороший сервис',
      hotel: '500-1000 драм носильщику',
      note: 'не часть культуры; max 2000 драм в любой ситуации'
    },
    emergency: {
      police: '102',
      ambulance: '103',
      fire: '101',
      general: '911',
      gas: '104',
      embassy_ru_phone: '+374-10-567-427',
      embassy_ru_url: 'https://armenia.mid.ru/'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна и вкусная; Армения славится водой (Джермук, Бжни — газированные источники)'
    },
    taxi_apps: [
      { name: 'GG Taxi', note: 'местное, основное в Ереване' },
      { name: 'Yandex Go', note: 'дешевле, ночью лучшая доступность' },
      { name: 'Uklon', note: 'дополнительный вариант' }
    ],
    sources: [
      { name: 'Посольство РФ в Армении (Ереван)', url: 'https://armenia.mid.ru/' },
      { name: 'Visit Yerevan — Emergency', url: 'https://visityerevan.am/uinfo/details/8/en/' },
      { name: 'Advantour — Armenia Codes', url: 'https://www.advantour.com/armenia/phone-code.htm' }
    ],
    updated: '2026-05-26'
  },

  'sri-lanka': {
    tipping: {
      restaurants: '10% часто включён; иначе — 10% за хороший сервис',
      taxi: 'округление; PickMe — через приложение',
      hotel: '100-200 LKR носильщику',
      note: 'ценится больше чем в Индии; гидам сафари 500-1000 LKR в день'
    },
    emergency: {
      police: '119',
      fire: '110',
      ambulance: '1990',
      tourist_police: '011-2421052',
      embassy_ru_phone: '+94-11-2697036',
      embassy_ru_emergency: '+94-77-7287988',
      embassy_ru_url: 'https://sri-lanka.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; рестораны часто имеют "government water line" — безопасная альтернатива'
    },
    taxi_apps: [
      { name: 'PickMe', note: 'местное, по всей стране' },
      { name: 'Uber', note: 'только Коломбо и крупные города' }
    ],
    sources: [
      { name: 'Посольство РФ в Шри-Ланке (Коломбо)', url: 'https://sri-lanka.mid.ru/' },
      { name: 'Sri Lanka Police — Emergency 119', url: 'https://www.police.lk/?p=18161' },
      { name: 'DigiBiz — Sri Lanka Emergency', url: 'https://www.digibiz.lk/blog/emergency-services-telephone-numbers-sri-lanka' }
    ],
    updated: '2026-05-26'
  },

  'maldives': {
    tipping: {
      restaurants: 'на курортах сервис-чардж 10% обычно включён',
      taxi: 'на островах такси редко; в Мале — округление',
      hotel: '$5-10 за услугу на курорте',
      note: 'на курортах ценится; стандарт $1-3 в день горничной + $5-10 за сафари-гида'
    },
    emergency: {
      police: '119',
      police_hotline: '332-2111',
      fire: '118',
      ambulance: '102',
      embassy_ru_url: 'https://sri-lanka.mid.ru/',
      embassy_note: 'Отдельного посольства РФ на Мальдивах нет — обращения через Посольство РФ в Шри-Ланке'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; на курортах фильтрованная подаётся бесплатно'
    },
    taxi_apps: [
      { name: 'Avas Ride', note: 'местное, в Мале' }
    ],
    sources: [
      { name: 'Maldives Police — Emergency', url: 'https://x.com/PoliceMv/status/407360773342523392' },
      { name: 'NDMA Maldives', url: 'https://ndma.gov.mv/en' }
    ],
    updated: '2026-05-26'
  },

  'kenya': {
    tipping: {
      restaurants: '10% если сервис-чардж не включён',
      taxi: 'округление; в Bolt/Uber через приложение',
      hotel: '100-200 KES носильщику',
      note: 'сафари-гидам обязательно: $10-15/день драйверу, $5-10/день кемп-стаффу'
    },
    emergency: {
      police: '999',
      general: '112',
      ambulance_red_cross: '1199',
      ambulance_e_plus: '+254-700-395-395',
      amref_flying_doctors: '+254-20-6992299',
      embassy_ru_phone: '+254-20-2722462',
      embassy_ru_url: 'https://russembkenya.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить без кипячения/фильтрации; в отелях — бутилированная'
    },
    taxi_apps: [
      { name: 'Bolt', note: 'крупнейшее в Кении, дешевле Uber на 10-15%' },
      { name: 'Uber', note: 'работает в Найроби, Момбасе, недавно — сафари-туры' },
      { name: 'Little Cab', note: 'кенийское, безопаснее ночью' }
    ],
    sources: [
      { name: 'Посольство РФ в Кении', url: 'https://russembkenya.mid.ru/' },
      { name: 'Nairobi Info — Useful Numbers', url: 'https://www.nairobi-info.com/town/travel_info/useful-numbers' },
      { name: 'Tapestry of Africa — Tipping', url: 'https://tapestryofafrica.com/what-is-the-tipping-etiquette-in-kenya/' }
    ],
    updated: '2026-05-26'
  },

  'mexico': {
    tipping: {
      restaurants: '10-15% — это обязательно; даже если есть сервис-чардж, +10%',
      taxi: 'округление',
      hotel: '20-50 MXN носильщику, ~20 MXN/день горничной',
      note: 'часть культуры, не оставлять считается грубо в ресторанах'
    },
    emergency: {
      general: '911',
      green_angels: '078',
      embassy_ru_url: 'https://mexico.mid.ru/',
      embassy_note: '«Зелёные ангелы» 078 — англоязычная служба для туристов на трассах'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; местные тоже пьют бутилированную (garrafones — большие 20л)'
    },
    taxi_apps: [
      { name: 'Uber', note: 'крупнейшее в стране' },
      { name: 'DiDi', note: 'дешевле Uber на 10-20%' },
      { name: 'Cabify', note: 'премиум-сегмент' }
    ],
    sources: [
      { name: 'Посольство РФ в Мексике', url: 'https://mexico.mid.ru/' },
      { name: 'Pacific Prime — Mexico Emergency', url: 'https://www.pacificprime.com/blog/emergency-response-systems-in-mexico-for-foreigners.html' }
    ],
    updated: '2026-05-26'
  },

  'turkey': {
    tipping: {
      restaurants: '5-10% если сервис-чардж не включён; для high-end 10-15%',
      taxi: 'округление до целой лиры или 10% за хороший сервис',
      hotel: '20-50 TRY портье/уборка по желанию',
      note: 'чаевые не обязательны, но приветствуются'
    },
    emergency: {
      police: '155',
      ambulance: '112',
      fire: '110',
      embassy_ru_phone: '+90-312-439-21-22',
      embassy_ru_url: 'https://turkey.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'технически чистая в Стамбуле/Анкаре/Измире, но старые трубы — местные пьют бутилированную'
    },
    taxi_apps: [
      { name: 'BiTaksi', note: 'крупнейшее, по всей Турции' },
      { name: 'iTaksi', note: 'официальные жёлтые такси' },
      { name: 'Uber', note: 'только Стамбул' }
    ],
    sources: [
      { name: 'Посольство РФ в Турции (turkey.mid.ru)', url: 'https://turkey.mid.ru/' },
      { name: 'КонсДеп МИД РФ — Турция', url: 'https://www.kdmid.ru/docs/turkey/russian-consular-offices/' },
      { name: 'Memphis Tours — Turkey Emergency Numbers', url: 'https://www.memphistours.com/turkey/turkey-travel-guide/things-to-know/wiki/emergency-numbers' }
    ],
    updated: '2026-05-26'
  },

  'thailand': {
    tipping: {
      restaurants: 'не обязательно; 10% если сервис-чардж не включён (high-end)',
      taxi: 'округлять до целого, ~20-50 THB',
      hotel: '20-50 THB носильщику',
      note: 'не часть культуры, но приветствуется в туристических зонах'
    },
    emergency: {
      police: '191',
      ambulance: '1669',
      fire: '199',
      tourist_police: '1155',
      embassy_ru_phone: '+66-2-234-98-24',
      embassy_ru_url: 'https://thailand.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить — только бутилированная; 1.5л в 7-Eleven 15-20 THB'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее, по всей стране' },
      { name: 'Bolt', note: 'дешевле, основные города' },
      { name: 'InDriver', note: 'торг с водителем' }
    ],
    sources: [
      { name: 'Посольство РФ в Таиланде (thailand.mid.ru)', url: 'https://thailand.mid.ru/' },
      { name: 'BackpackThailand — Emergency Guide 2026', url: 'https://backpackthailand.com/guides/thailand-emergency-guide' },
      { name: 'Tourist Police Thailand (1155)', url: 'https://www.amazing-thailand.com/thai-tourist-police.html' }
    ],
    updated: '2026-05-26'
  },

  'georgia': {
    tipping: {
      restaurants: '10% если сервис-чардж не включён',
      taxi: 'округление до 1-2 GEL, не обязательно',
      hotel: '1-3 GEL за услугу',
      note: 'не часть культуры, но за отличный сервис приветствуется'
    },
    emergency: {
      police: '112',
      ambulance_fire: '112',
      embassy_ru_phone: '+995-32-291-24-53',
      embassy_ru_url: 'https://georgia.mid.ru/',
      embassy_note: 'Секция интересов РФ при посольстве Швейцарии — дипотношений нет с 2008'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна по WHO + национальные стандарты; в старых зданиях рекомендуется фильтр из-за труб'
    },
    taxi_apps: [
      { name: 'Bolt', note: 'надёжный в центре, новые машины' },
      { name: 'Yandex Go', note: 'дешевле на 10-20%, лучшая доступность ночью' },
      { name: 'Maxim', note: 'самый дешёвый, особенно за городом' }
    ],
    sources: [
      { name: '112.gov.ge — Emergency FAQ', url: 'https://112.gov.ge/?page_id=1715&lang=en' },
      { name: 'Секция интересов РФ в Грузии', url: 'https://georgia.mid.ru/' },
      { name: 'Georgian Water and Power — Water Quality', url: 'https://www.gwp.ge/en/waterquality' }
    ],
    updated: '2026-05-26'
  },

  'japan': {
    tipping: {
      restaurants: 'нет — обычно включено в счёт; попытка оставить = неловкость',
      taxi: 'нет',
      hotel: 'нет; за рёкан традиционно можно 1,000 ¥ в конверте при заселении',
      note: 'Япония — азиатская страна без культуры чаевых'
    },
    emergency: {
      police: '110',
      ambulance_fire: '119',
      embassy_ru_phone: '+81-3-3583-4445',
      embassy_ru_url: 'https://japan.mid.ru/'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасно по всей стране, включая горные регионы'
    },
    taxi_apps: [
      { name: 'GO', note: 'крупнейший, по всей Японии' },
      { name: 'DiDi', note: 'дешевле в крупных городах' },
      { name: 'Uber', note: 'только Токио, ограниченно' }
    ],
    sources: [
      { name: 'Посольство РФ в Японии', url: 'https://japan.mid.ru/' },
      { name: 'JNTO — Japan National Tourism Organization', url: 'https://www.jnto.go.jp/' }
    ],
    updated: '2026-05-26'
  }
};

// Helper — есть ли essentials для slug
export function hasEssentials(slug) {
  return Boolean(ESSENTIALS[slug]);
}

export function getEssentials(slug) {
  return ESSENTIALS[slug] || null;
}
