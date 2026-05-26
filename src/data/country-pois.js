// POI (Points of Interest) для CountryMap.astro.
// Координаты в WGS84. center/zoom — для bbox карты OSM.
//
// Для стран где Никита был лично — POI из реальных пинов Я.Диск.
// Для непосещённых — обзорные must-see из открытых источников (OSM, Wikidata).
// В UI компонент помечает «обзорная карта» vs «мой маршрут».

export const POIS = {
  'turkey': {
    visited: false,
    center: { lat: 39.0, lng: 35.0, zoom: 6 },
    pois: [
      { name: 'Стамбул',    lat: 41.0082, lng: 28.9784, type: 'city',    note: 'Айя-София, Топкапы, Босфор' },
      { name: 'Анталья',    lat: 36.8969, lng: 30.7133, type: 'beach',   note: 'основной курорт; пляжи + старый город' },
      { name: 'Каппадокия', lat: 38.6431, lng: 34.8289, type: 'nature',  note: 'воздушные шары на рассвете' },
      { name: 'Памуккале',  lat: 37.9137, lng: 29.1187, type: 'nature',  note: 'белые травертины + Иераполис' },
      { name: 'Эфес',       lat: 37.9412, lng: 27.3416, type: 'culture', note: 'античный город, библиотека Цельса' },
      { name: 'Бодрум',     lat: 37.0344, lng: 27.4305, type: 'beach',   note: 'премиум-курорт Эгейского моря' },
      { name: 'Анкара',     lat: 39.9334, lng: 32.8597, type: 'city',    note: 'столица; мавзолей Ататюрка' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'GoTürkiye — официальный туризм', url: 'https://goturkiye.com/' }
    ]
  },

  'thailand': {
    visited: false,
    center: { lat: 13.0, lng: 101.0, zoom: 5 },
    pois: [
      { name: 'Бангкок',    lat: 13.7563, lng: 100.5018, type: 'city',    note: 'Гранд-Палас, плавучие рынки' },
      { name: 'Пхукет',     lat: 7.8804,  lng: 98.3923,  type: 'beach',   note: 'крупнейший остров, пляжи + ночная жизнь' },
      { name: 'Чиангмай',   lat: 18.7883, lng: 98.9853,  type: 'nature',  note: 'горы, храмы, слоновьи парки' },
      { name: 'Краби',      lat: 8.0863,  lng: 98.9063,  type: 'beach',   note: 'известняковые скалы, Райли' },
      { name: 'Ко Самуи',   lat: 9.5018,  lng: 100.0136, type: 'beach',   note: 'пляжи + ангтонг национальный парк' },
      { name: 'Аютайя',     lat: 14.3692, lng: 100.5877, type: 'culture', note: 'древняя столица, руины храмов' },
      { name: 'Паттайя',    lat: 12.9236, lng: 100.8825, type: 'beach',   note: 'ближайший пляж от Бангкока' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'TAT — Tourism Authority of Thailand', url: 'https://www.tourismthailand.org/' }
    ]
  },

  'georgia': {
    visited: false,
    center: { lat: 42.0, lng: 43.5, zoom: 7 },
    pois: [
      { name: 'Тбилиси',    lat: 41.7151, lng: 44.8271, type: 'city',    note: 'старый город, серные бани, Нарикала' },
      { name: 'Батуми',     lat: 41.6168, lng: 41.6367, type: 'beach',   note: 'морской курорт + современная архитектура' },
      { name: 'Казбеги',    lat: 42.6587, lng: 44.6470, type: 'nature',  note: 'церковь Гергети + гора Казбек 5047м' },
      { name: 'Сванетия',   lat: 43.0028, lng: 42.7167, type: 'nature',  note: 'Местия, башни Чажаши, треккинг' },
      { name: 'Мцхета',     lat: 41.8458, lng: 44.7203, type: 'culture', note: 'древняя столица, Светицховели' },
      { name: 'Кахетия',    lat: 41.6500, lng: 45.6900, type: 'food',    note: 'винный регион; Сигнахи, Телави' },
      { name: 'Боржоми',    lat: 41.8404, lng: 43.3782, type: 'nature',  note: 'минеральные воды + национальный парк' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'GeorgianTravelGuide', url: 'https://georgiantravelguide.com/' }
    ]
  },

  'japan': {
    visited: true,            // Никита был — реальный маршрут ноябрь 2023
    center: { lat: 36.2, lng: 138.2, zoom: 5 },
    pois: [
      { name: 'Токио',     lat: 35.6762, lng: 139.6503, type: 'city',    note: 'стартовая точка Golden Route' },
      { name: 'Хаконе',    lat: 35.2324, lng: 139.1069, type: 'nature',  note: 'онсэн + вид на Фудзи' },
      { name: 'Киото',     lat: 35.0116, lng: 135.7681, type: 'city',    note: 'храмы, гэйши, момидзи' },
      { name: 'Осака',     lat: 34.6937, lng: 135.5023, type: 'city',    note: 'еда, такояки' },
      { name: 'Нара',      lat: 34.6851, lng: 135.8048, type: 'culture', note: 'олени, древняя столица' },
      { name: 'Фудзи',     lat: 35.3606, lng: 138.7274, type: 'nature',  note: 'восхождение 1 июля - 10 сент' },
      { name: 'Хиросима',  lat: 34.3853, lng: 132.4553, type: 'culture', note: 'мемориал, остров Миядзима' },
      { name: 'Никко',     lat: 36.7197, lng: 139.6982, type: 'nature',  note: 'храмы, водопад Кэгон' }
    ],
    sources: [
      { name: 'Реальный маршрут автора, ноябрь 2023', url: '/blog/japan-guide-2026/' },
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' }
    ]
  }
};

export function hasPois(slug) {
  return Boolean(POIS[slug]?.pois?.length);
}

export function getPois(slug) {
  return POIS[slug] || null;
}

// bbox для OSM embed iframe: [minLng, minLat, maxLng, maxLat]
export function getBbox(slug, padding = 0.5) {
  const data = POIS[slug];
  if (!data?.pois?.length) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of data.pois) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return {
    minLng: minLng - padding,
    minLat: minLat - padding,
    maxLng: maxLng + padding,
    maxLat: maxLat + padding
  };
}
