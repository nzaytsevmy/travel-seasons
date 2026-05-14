// Per-country visa details for Russian passport holders, mid-2026.
// Keys: slug from directions.js. Values: { duration, cost, timing }.
// Используется на /visa/ hub для per-card facts.

const DEFAULT_BY_VISA = {
  free: { duration: 'до 90 дней', cost: 'бесплатно', timing: 'штамп на границе' },
  evisa: { duration: '30 дней', cost: '$30–50', timing: '1–3 дня' },
  required: { duration: '30 дней', cost: '$50–200', timing: '15–30 дней' },
};

const VISA_DETAILS = {
  // ─── Безвиз — близкое зарубежье и СНГ
  'turkey':              { duration: '60 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'georgia':             { duration: '365 дней',    cost: 'бесплатно',     timing: 'штамп на границе' },
  'armenia':             { duration: '180 дней',    cost: 'бесплатно',     timing: 'штамп на границе' },
  'kyrgyzstan':          { duration: '60 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'kazakhstan':          { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'uzbekistan':          { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'tajikistan':          { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'abkhazia':            { duration: 'без срока',   cost: 'бесплатно',     timing: 'паспорт РФ' },
  'serbia':              { duration: '30 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },

  // ─── Безвиз — Азия
  'china':               { duration: '30 дней',     cost: 'бесплатно',     timing: 'до 14.09.2026' },
  'hainan':              { duration: '30 дней',     cost: 'бесплатно',     timing: 'до 14.09.2026' },
  'hong-kong':           { duration: '14 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'thailand':            { duration: '60 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'malaysia':            { duration: '30 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'philippines':         { duration: '30 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'maldives':            { duration: '30 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'vietnam':             { duration: '45 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },

  // ─── Безвиз — Африка / БВ
  'uae':                 { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'south-africa':        { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'morocco':             { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'mauritius':           { duration: '60 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'seychelles':          { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'israel':              { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },

  // ─── Безвиз — Латам и Карибы
  'mexico':              { duration: '180 дней',    cost: 'бесплатно',     timing: 'FMM на границе' },
  'cuba':                { duration: '90 дней',     cost: 'tourist card $25', timing: 'на границе/туроператор' },
  'dominican-republic':  { duration: '30 дней',     cost: '$10 tourist card', timing: 'на границе' },
  'argentina':           { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'brazil':              { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'peru':                { duration: '183 дня',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'chile':               { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'chile-patagonia':     { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'chile-fjords':        { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'bolivia':             { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'ecuador':             { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },
  'guatemala-belize':    { duration: '90 дней',     cost: 'бесплатно',     timing: 'CA-4 на границе' },
  'costa-rica-panama':   { duration: '90 дней',     cost: 'бесплатно',     timing: 'штамп на границе' },

  // ─── Антарктида (через Чили/Аргентину)
  'antarctica':          { duration: 'круиз',       cost: 'виза Чили/Арг.',   timing: 'через тур-оператора' },

  // ─── eVisa
  'kenya':               { duration: '90 дней',     cost: '$51',           timing: '2–7 дней онлайн' },
  'tanzania':            { duration: '90 дней',     cost: '$50',           timing: '5–10 дней онлайн' },
  'madagascar':          { duration: '60 дней',     cost: '$45',           timing: '7 дней онлайн' },
  'egypt':               { duration: '30 дней',     cost: '$25',           timing: '7 дней онлайн' },
  'india-goa':           { duration: '60 дней',     cost: '$25',           timing: '3 дня онлайн' },
  'sri-lanka':           { duration: '30 дней',     cost: '$35',           timing: '24 часа онлайн' },
  'cambodia':            { duration: '30 дней',     cost: '$36',           timing: '24–72 ч онлайн' },
  'south-korea':         { duration: '60 дней',     cost: '$10 (K-ETA)',   timing: '72 ч онлайн' },
  'jordan':              { duration: '30 дней',     cost: 'JD 40',         timing: '3–5 дней онлайн' },
  'bali':                { duration: '30 + 30 дн.', cost: '$35 VOA',       timing: 'на границе' },
  'sumatra-kalimantan':  { duration: '30 дней',     cost: '$35 VOA',       timing: 'на границе' },
  'raja-ampat':          { duration: '30 дней',     cost: '$35 VOA',       timing: 'на границе' },
  'cyprus':              { duration: '90 дней',     cost: 'бесплатно',     timing: 'pro-visa онлайн 1 день' },
  'nepal':               { duration: '30 дней',     cost: '$30 VOA',       timing: 'на границе' },

  // ─── Required — Шенген (90/180)
  'switzerland':         { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'italy-north':         { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'italy-south':         { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'spain':               { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'greece':              { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'croatia':             { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },
  'finland':             { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '30–60 дней' },
  'iceland':             { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–30 дней' },
  'norway':              { duration: '90 дн./180',  cost: '€90 + сбор',    timing: '15–45 дней' },

  // ─── Required — Северная Америка
  'usa':                 { duration: 'до 180 дней', cost: '$185',          timing: '6–12 мес. (Варшава)' },
  'canada-rockies':      { duration: 'до 180 дней', cost: 'CA$100',        timing: '2–3 мес.' },
  'canada-east':         { duration: 'до 180 дней', cost: 'CA$100',        timing: '2–3 мес.' },

  // ─── Required — Океания
  'australia-east':      { duration: '90 дней',     cost: 'A$190',         timing: '2–6 недель' },
  'australia-north':     { duration: '90 дней',     cost: 'A$190',         timing: '2–6 недель' },
  'new-zealand':         { duration: '90 дней',     cost: 'NZ$246',        timing: '20+ дней' },

  // ─── Required — Азия (через турагентство)
  'japan':               { duration: '15 дней (TO)',cost: 'бесплатно',     timing: '5–10 дней через TO' },
  'japan-hokkaido':      { duration: '15 дней (TO)',cost: 'бесплатно',     timing: '5–10 дней через TO' },
  'singapore':           { duration: '30 дней',     cost: 'S$45',          timing: '3–7 дней' },

  // ─── Required — Иран
  'iran':                { duration: '30 дней',     cost: '$80',           timing: '5–7 дней онлайн' },
};

export function getVisaDetails(slug, visaType) {
  return VISA_DETAILS[slug] || DEFAULT_BY_VISA[visaType] || DEFAULT_BY_VISA.free;
}

export { VISA_DETAILS, DEFAULT_BY_VISA };
