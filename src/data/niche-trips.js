// Нишевые направления с ≈0 RU-трафика (сафари/дайвинг-углы, удалённые, визанедоступные).
// Их 12 trips-страниц [month]/[country] = scaled-content хвост без потенциала ранжирования.
// → noindex + исключение из sitemap. Хаб /[slug]/, виза и packing страны ОСТАЮТСЯ в индексе.
// При появлении реального спроса/данных — убрать слаг отсюда (вернётся в индекс).
export const NICHE_TRIPS = new Set([
  'australia-north',      // Дарвин, Какаду — ультра-ниша
  'sumatra-kalimantan',   // орангутаны, джунгли
  'raja-ampat',           // дайвинг Папуа
  'madagascar',           // эндемики
  'tajikistan',           // Памирский тракт
  'chile-fjords',         // фьорды
  'chile-patagonia',      // Патагония
  'guatemala-belize',     // Центр. Америка
  'costa-rica-panama',    // Центр. Америка
  'canada-rockies',       // виза для РФ практически закрыта
  'dagestan',             // новое направление: пиллар-first, trips вернуть после кликов на пилларе
  'altai',                // новое направление: пиллар-first, как dagestan
  'canada-east',          // виза для РФ практически закрыта
]);
