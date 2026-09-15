// Общая модель главной, каталога и калькулятора. Исходные расходы PRICES —
// оценки проекта в USD; это не котировки бронирования на конкретные даты.
export const DEFAULT_TRIP = Object.freeze({ days: 7, level: 0, travelers: 1, month: 0, currency: 'rub' });
export const SEASON_MULT = Object.freeze({ P: 1.30, G: 1, O: .85, B: .70 });

export function tripInteger(value, min, max, fallback) {
  const n = Number(value);
  const numeric = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  return numeric && Number.isInteger(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function normalizeTrip(options = {}) {
  return {
    days: tripInteger(options.days, 1, 90, DEFAULT_TRIP.days),
    level: tripInteger(options.level, 0, 2, DEFAULT_TRIP.level),
    travelers: tripInteger(options.travelers, 1, 4, DEFAULT_TRIP.travelers),
    month: tripInteger(options.month, 0, 12, DEFAULT_TRIP.month),
    currency: options.currency === 'usd' ? 'usd' : 'rub',
  };
}

export function calculateTripBudget(price, { rates, visa, seasons, ...options } = {}) {
  if (![rates?.USD, rates?.EUR].every(n => Number.isFinite(n) && n > 0)) throw new Error('Нужен общий курс бюджета');
  const trip = normalizeTrip(options);
  const { days, level, travelers, month, currency } = trip;
  const values = ['flight', 'hotel', 'food'].map(key => price?.[key]?.[level]);
  if (!values.every(n => Number.isFinite(n) && n >= 0)) throw new Error('Неполные расходы направления');
  const [flight, hotel, food] = values;
  const seasonMult = month ? SEASON_MULT[seasons?.[month - 1]] ?? 1 : 1;
  // Сохраняем существующий состав расчёта: виза в USD/EUR, если она платная.
  // Включённый в билет сбор второй раз к перелёту не прибавляется.
  const cost = visa?.cost || '';
  const usd = cost.match(/\$\s*(\d+(?:[.,]\d+)?)/);
  const eur = cost.match(/€\s*(\d+(?:[.,]\d+)?)/);
  const visaRub = /бесплатно|в билете/i.test(cost) ? 0
    : usd ? Number(usd[1].replace(',', '.')) * rates.USD
    : eur ? Number(eur[1].replace(',', '.')) * rates.EUR : 0;
  const convert = currency === 'rub' ? rates.USD : 1;
  const flightTotal = Math.round(flight * seasonMult * travelers * convert);
  const hotelTotal = Math.round(hotel * days * convert);
  const foodTotal = Math.round(food * days * travelers * convert);
  const visaTotal = Math.round(visaRub * travelers / (currency === 'rub' ? 1 : rates.USD));
  return {
    ...trip, p: price, visa, seasonMult, flightTotal, hotelTotal, foodTotal, visaTotal,
    grand: flightTotal + hotelTotal + foodTotal + visaTotal,
  };
}

export function calculatorHref(index, options = {}) {
  if (!Number.isInteger(index) || index < 0) return '/calculator/';
  const t = normalizeTrip(options);
  const params = new URLSearchParams({ r: String(index), d: String(t.days), l: String(t.level), c: t.currency, t: String(t.travelers) });
  if (t.month) params.set('m', String(t.month));
  return `/calculator/?${params}`;
}
