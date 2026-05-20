// Plug type per country (IEC 60083 standard). Используется в /packing для блока техники.
// Источник: IEC + worldstandards.eu (по состоянию данных в meta.js).
// Многие страны имеют несколько типов — указываем основные.

export const PLUG_TYPES = {
  // Австралия / Океания
  'australia-east':       { types: 'I',     voltage: '230 V', hz: '50 Hz' },
  'australia-north':      { types: 'I',     voltage: '230 V', hz: '50 Hz' },
  'new-zealand-north':    { types: 'I',     voltage: '230 V', hz: '50 Hz' },
  'new-zealand-south':    { types: 'I',     voltage: '230 V', hz: '50 Hz' },
  'fiji':                 { types: 'I',     voltage: '240 V', hz: '50 Hz' },

  // Юго-Восточная Азия
  'bali':                 { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'sumatra-kalimantan':   { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'raja-ampat':           { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'thailand':             { types: 'A/B/C', voltage: '230 V', hz: '50 Hz' },
  'vietnam':              { types: 'A/C/D', voltage: '220 V', hz: '50 Hz' },
  'cambodia':             { types: 'A/C/G', voltage: '230 V', hz: '50 Hz' },
  'laos':                 { types: 'A/B/C', voltage: '230 V', hz: '50 Hz' },
  'myanmar':              { types: 'C/D/F', voltage: '230 V', hz: '50 Hz' },
  'philippines':          { types: 'A/B/C', voltage: '220 V', hz: '60 Hz' },
  'malaysia':             { types: 'G',     voltage: '240 V', hz: '50 Hz' },
  'singapore':            { types: 'G',     voltage: '230 V', hz: '50 Hz' },
  'indonesia':            { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },

  // Восточная Азия
  'japan':                { types: 'A/B',   voltage: '100 V', hz: '50/60 Hz' },
  'japan-hokkaido':       { types: 'A/B',   voltage: '100 V', hz: '50 Hz' },
  'south-korea':          { types: 'C/F',   voltage: '220 V', hz: '60 Hz' },
  'china':                { types: 'A/C/I', voltage: '220 V', hz: '50 Hz' },
  'hainan':               { types: 'A/C/I', voltage: '220 V', hz: '50 Hz' },

  // Южная Азия
  'india-goa':            { types: 'C/D/M', voltage: '230 V', hz: '50 Hz' },
  'sri-lanka':            { types: 'D/G/M', voltage: '230 V', hz: '50 Hz' },
  'maldives':             { types: 'D/G',   voltage: '230 V', hz: '50 Hz' },

  // Центральная Азия / Кавказ / Россия-СНГ
  'georgia':              { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },
  'armenia':              { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },
  'azerbaijan':           { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },
  'kyrgyzstan':           { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },
  'uzbekistan':           { types: 'C/I',   voltage: '220 V', hz: '50 Hz' },
  'tajikistan':           { types: 'C/I',   voltage: '220 V', hz: '50 Hz' },
  'kazakhstan':           { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },

  // Ближний Восток
  'uae':                  { types: 'G',     voltage: '220 V', hz: '50 Hz' },
  'turkey':               { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'egypt':                { types: 'C/F',   voltage: '220 V', hz: '50 Hz' },
  'jordan':               { types: 'B/C/D/F/G/J', voltage: '230 V', hz: '50 Hz' },
  'israel':               { types: 'C/H/M', voltage: '230 V', hz: '50 Hz' },

  // Африка
  'kenya':                { types: 'G',     voltage: '240 V', hz: '50 Hz' },
  'south-africa':         { types: 'M/N',   voltage: '230 V', hz: '50 Hz' },
  'tanzania':             { types: 'D/G',   voltage: '230 V', hz: '50 Hz' },
  'uganda':               { types: 'G',     voltage: '240 V', hz: '50 Hz' },
  'morocco':              { types: 'C/E',   voltage: '220 V', hz: '50 Hz' },

  // Европа
  'switzerland':          { types: 'C/J',   voltage: '230 V', hz: '50 Hz' },
  'italy-north':          { types: 'C/F/L', voltage: '230 V', hz: '50 Hz' },
  'italy-south':          { types: 'C/F/L', voltage: '230 V', hz: '50 Hz' },
  'spain':                { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'greece':               { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'croatia':              { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'france':               { types: 'C/E',   voltage: '230 V', hz: '50 Hz' },
  'portugal':             { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'germany':              { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'austria':              { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'czech-republic':       { types: 'C/E',   voltage: '230 V', hz: '50 Hz' },
  'poland':               { types: 'C/E',   voltage: '230 V', hz: '50 Hz' },
  'norway':               { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'norway-arctic':        { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },
  'iceland':              { types: 'C/F',   voltage: '230 V', hz: '50 Hz' },

  // Северная Америка
  'canada-rockies':       { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'canada-east':          { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'usa-west':             { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'usa-east':             { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'mexico':               { types: 'A/B',   voltage: '127 V', hz: '60 Hz' },
  'cuba':                 { types: 'A/B/C/L', voltage: '110/220 V', hz: '60 Hz' },
  'dominican-republic':   { types: 'A/B',   voltage: '110 V', hz: '60 Hz' },
  'guatemala-belize':     { types: 'A/B/G', voltage: '120 V', hz: '60 Hz' },
  'costa-rica-panama':    { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },

  // Южная Америка
  'peru':                 { types: 'A/B/C', voltage: '220 V', hz: '60 Hz' },
  'bolivia':              { types: 'A/C',   voltage: '230 V', hz: '50 Hz' },
  'chile':                { types: 'C/L',   voltage: '220 V', hz: '50 Hz' },
  'chile-patagonia':      { types: 'C/L',   voltage: '220 V', hz: '50 Hz' },
  'argentina':            { types: 'C/I',   voltage: '220 V', hz: '50 Hz' },
  'brazil':               { types: 'C/N',   voltage: '127/220 V', hz: '60 Hz' },
  'colombia':             { types: 'A/B',   voltage: '110 V', hz: '60 Hz' },
  'ecuador':              { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'galapagos':            { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'venezuela':            { types: 'A/B',   voltage: '120 V', hz: '60 Hz' },
  'uruguay':              { types: 'C/F/I/L', voltage: '230 V', hz: '50 Hz' },
  'paraguay':             { types: 'C',     voltage: '220 V', hz: '50 Hz' },

  // Полярные
  'antarctica':           { types: 'A/F/I', voltage: '230 V', hz: '50 Hz', note: 'на круизных лайнерах варьируется' },
};

// Подсказка по типам plug — нужен ли универсальный переходник?
export function plugAdvice(plug) {
  if (!plug) return 'Уточнить тип розетки перед поездкой.';
  const types = plug.types.split('/');
  const hasRu = types.some(t => ['C','F'].includes(t.trim()));
  if (hasRu) return 'Российские вилки Type C/F подходят — переходник НЕ нужен.';
  return `Российская вилка C/F НЕ подходит — нужен переходник Type ${plug.types}. Купи универсальный (3–5 типов) — окупится за 1 поездку.`;
}
