// Mapping: country slug + monthIdx → weather-bucket key
// Используется в /packing/[c]/[m] для подбора нужного чек-листа.
//
// Стратегия:
// 1. Если есть точный override (regionBuckets) — берём его.
// 2. Иначе — определяем по группе (d.group) + сезону (monthIdx) — generic mapping.
// 3. Fallback — 'temperate-warm'.

const regionBuckets = {
  // Тропики Юго-Восточной Азии: год делится на сухой и дождливый
  'bali':               { rainy: [0,1,2,11], default: 'tropical-dry' },  // dec-feb wet
  'sumatra-kalimantan': { rainy: [9,10,11,0,1], default: 'tropical-dry' },
  'raja-ampat':         { rainy: [5,6,7], default: 'tropical-dry' },
  'thailand':           { rainy: [4,5,6,7,8,9], default: 'tropical-dry' }, // may-oct
  'vietnam':            { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'cambodia':           { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'laos':               { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'myanmar':            { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'philippines':        { rainy: [5,6,7,8,9,10], default: 'tropical-dry' },
  'sri-lanka':          { rainy: [4,5,6,7,8,9,10], default: 'tropical-dry' },
  'maldives':           { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'india-goa':          { rainy: [5,6,7,8], default: 'tropical-dry' },
  'hainan':             { rainy: [5,6,7,8,9], default: 'tropical-dry' },

  // Карибы / Латам тропики
  'cuba':               { rainy: [5,6,7,8,9,10], default: 'tropical-dry' },
  'dominican-republic': { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },
  'mexico':             { rainy: [5,6,7,8,9], default: 'tropical-dry' },
  'guatemala-belize':   { rainy: [5,6,7,8,9], default: 'tropical-dry' },
  'costa-rica-panama':  { rainy: [4,5,6,7,8,9,10], default: 'tropical-dry' },
  'colombia':           { rainy: [3,4,9,10], default: 'tropical-dry' },
  'venezuela':          { rainy: [4,5,6,7,8,9], default: 'tropical-dry' },

  // Джунгли / сафари (особый тип — независимо от сухого/влажного)
  'kenya':              { jungle: 'all', default: 'tropical-jungle' },
  'south-africa':       { jungle: [9,10,11,0,1,2,3], default: 'temperate-warm' },
  'tanzania':           { jungle: 'all', default: 'tropical-jungle' },
  'uganda':             { jungle: 'all', default: 'tropical-jungle' },
  'brazil':             { jungle: 'all', default: 'tropical-jungle' }, // Амазония + побережье
  'galapagos':          { default: 'tropical-dry' },

  // Высокогорье
  'peru':               { default: 'mountain-altitude' },
  'bolivia':            { default: 'mountain-altitude' },
  'ecuador':            { default: 'mountain-altitude' },
  'kyrgyzstan':         { winter: [10,11,0,1,2], default: 'mountain-altitude' },
  'tajikistan':         { winter: [10,11,0,1,2], default: 'mountain-altitude' },

  // Пустыни / Ближний Восток
  'uae':                { hot: [4,5,6,7,8,9], default: 'desert-cool' }, // may-oct hot
  'egypt':              { hot: [5,6,7,8,9], default: 'desert-cool' },
  'jordan':             { hot: [5,6,7,8,9], default: 'desert-cool' },
  'morocco':            { hot: [5,6,7,8], default: 'desert-cool' },
  'israel':             { hot: [5,6,7,8,9], default: 'desert-cool' },

  // Восточная Азия (Япония-classic, Корея, Китай)
  'japan':              { cold: [11,0,1,2], default: 'temperate-warm' },
  'south-korea':        { cold: [10,11,0,1,2], default: 'temperate-warm' },
  'china':              { cold: [10,11,0,1,2], default: 'temperate-warm' },
  // Гонконг: субтропический, лето с тайфунами/ливнями (май-сентябрь),
  // мягкая зима (декабрь-февраль +15..20)
  'hong-kong':          { rainy: [4,5,6,7,8], default: 'temperate-warm' },

  // Япония Хоккайдо / Альпы / Канада Скалы — ski-альпы зимой, mountain летом
  'japan-hokkaido':     { cold: [10,11,0,1,2,3], default: 'mountain-altitude' },
  'switzerland':        { cold: [10,11,0,1,2,3], default: 'mountain-altitude' },
  'italy-north':        { cold: [10,11,0,1,2,3], default: 'temperate-warm' },
  'austria':            { cold: [10,11,0,1,2,3], default: 'temperate-warm' },
  'canada-rockies':     { cold: [9,10,11,0,1,2,3], default: 'mountain-altitude' },

  // Кавказ / Средняя Азия — горные летом, холодные зимой
  'georgia':            { cold: [11,0,1,2], default: 'temperate-warm' },
  'armenia':            { cold: [11,0,1,2], default: 'temperate-warm' },
  'azerbaijan':         { cold: [11,0,1,2], default: 'temperate-warm' },
  'uzbekistan':         { hot: [5,6,7,8], cold: [11,0,1], default: 'temperate-warm' },
  'kazakhstan':         { cold: [10,11,0,1,2,3], default: 'temperate-warm' },

  // Турция / Балканы — лето пляжное, зима умеренная
  'turkey':             { default: 'temperate-warm' },
  'greece':             { default: 'temperate-warm' },
  'croatia':            { default: 'temperate-warm' },

  // Европа: умеренная летом, холодная зимой
  'spain':              { cold: [11,0,1], default: 'temperate-warm' },
  'italy-south':        { default: 'temperate-warm' },
  'france':             { cold: [11,0,1,2], default: 'temperate-warm' },
  'portugal':           { default: 'temperate-warm' },
  'germany':            { cold: [10,11,0,1,2,3], default: 'temperate-warm' },
  'czech-republic':     { cold: [10,11,0,1,2,3], default: 'temperate-warm' },
  'poland':             { cold: [10,11,0,1,2,3], default: 'temperate-warm' },

  // Полярные — экстремальный холод весь сезон активности
  'norway':             { cold: [9,10,11,0,1,2,3], default: 'temperate-warm' },
  'norway-arctic':      { default: 'cold-extreme' },
  'iceland':            { cold: [9,10,11,0,1,2,3], default: 'temperate-warm' },
  'antarctica':         { default: 'cold-extreme' },
  'chile-patagonia':    { default: 'cold-extreme' },

  // Австралия / NZ — сезоны перевёрнуты
  'australia-east':     { winter: [5,6,7], default: 'temperate-warm' },
  'australia-north':    { wet: [11,0,1,2,3], default: 'tropical-dry' },
  'new-zealand-north':  { winter: [5,6,7], default: 'temperate-warm' },
  'new-zealand-south':  { winter: [5,6,7], default: 'temperate-warm' },
  'fiji':               { rainy: [11,0,1,2,3], default: 'tropical-dry' },

  // Северная Америка
  'usa-west':           { cold: [11,0,1,2], default: 'temperate-warm' },
  'usa-east':           { cold: [11,0,1,2], default: 'temperate-warm' },
  'canada-east':        { cold: [10,11,0,1,2,3], default: 'temperate-warm' },

  // Южная Америка
  'chile':              { cold: [5,6,7,8], default: 'temperate-warm' },
  'argentina':          { cold: [5,6,7,8], default: 'temperate-warm' },
  'uruguay':            { cold: [5,6,7], default: 'temperate-warm' },
  'paraguay':           { default: 'tropical-dry' },
};

/**
 * Получить bucket для пары (countrySlug, monthIdx).
 * monthIdx — 0 (январь) … 11 (декабрь).
 */
export function getWeatherBucket(slug, monthIdx) {
  const cfg = regionBuckets[slug];
  if (!cfg) return 'temperate-warm';

  // Точные overrides по типу сезона:
  if (cfg.rainy === 'all' || (Array.isArray(cfg.rainy) && cfg.rainy.includes(monthIdx))) return 'tropical-rainy';
  if (cfg.jungle === 'all' || (Array.isArray(cfg.jungle) && cfg.jungle.includes(monthIdx))) return 'tropical-jungle';
  if (cfg.hot === 'all' || (Array.isArray(cfg.hot) && cfg.hot.includes(monthIdx))) return 'desert-hot';
  if (cfg.cold === 'all' || (Array.isArray(cfg.cold) && cfg.cold.includes(monthIdx))) return 'temperate-cold';
  if (cfg.winter === 'all' || (Array.isArray(cfg.winter) && cfg.winter.includes(monthIdx))) return 'temperate-cold';
  if (cfg.wet === 'all' || (Array.isArray(cfg.wet) && cfg.wet.includes(monthIdx))) return 'tropical-rainy';

  return cfg.default || 'temperate-warm';
}
