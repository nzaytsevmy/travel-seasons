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

// Суммируем только распознаваемые обязательные сборы. Другие валюты,
// диапазоны и неполные тарифы требуют уточнения, а не нулевого сбора.
function entryFeeRub(visa, rates) {
  if (!visa) return 0;
  const cost = String(visa.cost ?? '').trim();
  if (cost.includes('/')) {
    const alternatives = cost.split('/').map(part => entryFeeRub({ cost: part }, rates));
    return alternatives.every(fee => fee !== null && fee === alternatives[0]) ? alternatives[0] : null;
  }
  if (/в билете/i.test(cost)) return 0;
  if (!cost || /[a-z]\$|\b(?:AUD|NZD|SGD|IDR|JPY|INR|ILS|CAD)\b|шекел|₩|(?:^|\s)до\s*\d|\d\s*[–−-]\s*\d|\+\s*$|\//i.test(cost)) return null;
  const amounts = [...cost.matchAll(/([$€])\s*(\d+(?:[.,]\d+)?)/g)]
    .map(([, currency, amount]) => Number(amount.replace(',', '.')) * rates[currency === '$' ? 'USD' : 'EUR']);
  for (const [, amount] of cost.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:₽|руб(?:\.|лей)?)/gi)) amounts.push(Number(amount.replace(',', '.')));
  if (amounts.length) return amounts.reduce((sum, amount) => sum + amount, 0);
  return /бесплатно|не нужна/i.test(cost) ? 0 : null;
}

export function calculateTripBudget(price, { rates, visa, seasons, ...options } = {}) {
  if (![rates?.USD, rates?.EUR].every(n => Number.isFinite(n) && n > 0)) throw new Error('Нужен общий курс бюджета');
  const trip = normalizeTrip(options);
  const { days, level, travelers, month, currency } = trip;
  const values = ['flight', 'hotel', 'food'].map(key => price?.[key]?.[level]);
  if (!values.every(n => Number.isFinite(n) && n >= 0)) throw new Error('Неполные расходы направления');
  const [flight, hotel, food] = values;
  const seasonMult = month ? SEASON_MULT[seasons?.[month - 1]] ?? 1 : 1;
  // Включённый в билет сбор второй раз к перелёту не прибавляется.
  const visaRub = entryFeeRub(visa, rates);
  const convert = currency === 'rub' ? rates.USD : 1;
  const flightTotal = Math.round(flight * seasonMult * travelers * convert);
  const hotelTotal = Math.round(hotel * days * convert);
  const foodTotal = Math.round(food * days * travelers * convert);
  const visaTotal = visaRub === null ? null : Math.round(visaRub * travelers / (currency === 'rub' ? 1 : rates.USD));
  const unknownCosts = visaTotal === null ? ['Сборы за въезд'] : [];
  let knownMandatory = 0;
  for (const expense of visa?.mandatoryCosts || []) {
    if (!Number.isFinite(expense.rub) || expense.rub < 0) unknownCosts.push(expense.label);
    else knownMandatory += Math.round(expense.rub * travelers / (currency === 'rub' ? 1 : rates.USD));
  }
  const mandatoryTotal = unknownCosts.some(cost => cost !== 'Сборы за въезд') ? null : knownMandatory;
  const knownTotal = flightTotal + hotelTotal + foodTotal + (visaTotal ?? 0) + knownMandatory;
  return {
    ...trip, p: price, visa, seasonMult, flightTotal, hotelTotal, foodTotal, visaTotal, mandatoryTotal, knownTotal, unknownCosts,
    grand: unknownCosts.length ? null : knownTotal,
  };
}

export function budgetExclusions(unknownCosts = []) {
  const terms = [];
  if (unknownCosts.includes('Сборы за въезд')) terms.push('сборов за въезд');
  if (unknownCosts.includes('Медицинская страховка')) terms.push('страховки');
  if (unknownCosts.some(cost => !['Сборы за въезд', 'Медицинская страховка'].includes(cost))) terms.push('обязательных расходов');
  return terms.join(' и ');
}

export function calculatorHref(index, options = {}) {
  if (!Number.isInteger(index) || index < 0) return '/calculator/';
  const t = normalizeTrip(options);
  const params = new URLSearchParams({ r: String(index), d: String(t.days), l: String(t.level), c: t.currency, t: String(t.travelers) });
  if (t.month) params.set('m', String(t.month));
  return `/calculator/?${params}`;
}
