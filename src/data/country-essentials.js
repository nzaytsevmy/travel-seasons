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
