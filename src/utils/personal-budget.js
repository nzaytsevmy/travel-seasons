// Personal estimates are layered over the shared trip model. All stored money
// is integer RUB kopecks; changing the display currency never rewrites it.
export const COSTS = Object.freeze([
  ['flight', 'Перелёт', 'на всех, туда и обратно'],
  ['hotel', 'Жильё', 'за номер за ночь'],
  ['food', 'Питание', 'на человека в день'],
  ['entry', 'Виза и обязательные сборы', 'на всю поездку, на всех'],
  ['transport', 'Транспорт на месте', 'на всю поездку, на всех'],
  ['activities', 'Экскурсии и развлечения', 'на всю поездку, на всех'],
  ['insurance', 'Страховка', 'на всю поездку, на всех'],
  ['other', 'Прочие расходы', 'на всю поездку, на всех'],
]);
const MAX = 100_000_000_000;
const amount = x => Number.isSafeInteger(x) && x >= 0 && x <= MAX ? x : null;
const integer = (x, min, max, fallback) => Number.isInteger(x) && x >= min && x <= max ? x : fallback;
export function normalizeDraft(raw = {}) {
  raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const costs = {};
  for (const [id] of COSTS) {
    const r = raw.costs && Object.hasOwn(raw.costs, id) ? raw.costs[id] : null;
    costs[id] = { amount: amount(r?.amount), paid: r?.paid === true, excluded: !['flight','hotel','food','entry'].includes(id) && r?.excluded === true };
  }
  return { nights: integer(raw.nights, 0, 90, null), rooms: integer(raw.rooms, 1, 4, 1), reserve: integer(raw.reserve, 0, 100, 10), costs };
}
export function moneyToMinor(text, currency, rates) {
  const s = String(text).replace(/[\s\u00a0\u202f]/g, '');
  if (!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(s)) return null;
  const [whole, fraction = ''] = s.replace(',', '.').split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  const rate = currency === 'rub' ? 1 : currency === 'usd' ? rates?.USD : null;
  if (!(Number.isFinite(rate) && rate > 0)) return null;
  return amount(Math.round(minor * rate));
}
export function personalBudget(base, raw) {
  const draft = normalizeDraft(raw);
  const nights = draft.nights ?? base.days;
  const insurance = base.visa?.mandatoryCosts?.filter(c => /страхов/i.test(c.label)) || [];
  const mandatory = base.visa?.mandatoryCosts?.filter(c => !/страхов/i.test(c.label)) || [];
  const knownMandatory = mandatory.reduce((s, c) => s + (Number.isFinite(c.rub) && c.rub >= 0 ? Math.round(c.rub * base.travelers * 100) : 0), 0);
  const knownInsurance = insurance.reduce((s, c) => s + (Number.isFinite(c.rub) && c.rub >= 0 ? Math.round(c.rub * base.travelers * 100) : 0), 0);
  const defaults = {
    flight: base.flightTotal * 100,
    hotel: Math.round(base.hotelTotal * 100 / base.days),
    food: Math.round(base.foodTotal * 100 / base.days / base.travelers),
    entry: (base.visaTotal ?? 0) * 100 + knownMandatory,
    insurance: insurance.length ? knownInsurance : null,
  };
  const rows = COSTS.map(([id, label, unit]) => {
    const custom = draft.costs[id];
    const required = id === 'entry' || (id === 'insurance' && insurance.length > 0);
    const baseUnknown = id === 'entry' ? base.visaTotal === null || mandatory.some(c => !Number.isFinite(c.rub) || c.rub < 0)
      : id === 'insurance' && insurance.some(c => !Number.isFinite(c.rub) || c.rub < 0);
    const inputMinor = custom.amount ?? defaults[id] ?? null;
    const excluded = custom.excluded && !required;
    const known = excluded || (inputMinor !== null && (custom.amount !== null || !baseUnknown));
    const multiplier = id === 'hotel' ? nights * draft.rooms : id === 'food' ? base.days * base.travelers : 1;
    // Preserve the shared model's exact rounding in the untouched default case.
    const untouched = custom.amount === null && !excluded;
    const minor = excluded ? 0 : untouched && id === 'hotel' && nights === base.days && draft.rooms === 1 ? base.hotelTotal * 100
      : untouched && id === 'food' ? base.foodTotal * 100 : Math.round((inputMinor ?? 0) * multiplier);
    return { id, label, unit, inputMinor, minor, known, excluded, paid: custom.paid, required, custom: custom.amount !== null, multiplier };
  });
  // Known portions of a mandatory cost remain in the subtotal while its missing
  // portion is explicitly flagged; null never becomes a claim of a free service.
  const knownMinor = rows.reduce((sum, r) => sum + r.minor, 0);
  const paidMinor = rows.reduce((sum, r) => sum + (r.paid && r.known ? r.minor : 0), 0);
  const reserveMinor = Math.round((knownMinor - paidMinor) * draft.reserve / 100);
  return { rows, draft, nights, knownMinor, paidMinor, reserveMinor, remainingMinor: knownMinor - paidMinor + reserveMinor,
    complete: rows.every(r => r.known), unknown: rows.filter(r => !r.known).map(r => r.label) };
}
export function encodeBudgets(drafts) {
  const scenarios = Object.entries(drafts).filter(([key]) => /^[a-z0-9-]{1,64}$/.test(key)).slice(0,3).map(([key,draft]) => [key,normalizeDraft(draft)]);
  return encodeURIComponent(JSON.stringify({ v: 1, scenarios }));
}
export function decodeBudgets(encoded) {
  try {
    if (typeof encoded !== 'string' || encoded.length > 24000) return {};
    const raw = JSON.parse(decodeURIComponent(encoded));
    if (raw.v !== 1 || !Array.isArray(raw.scenarios) || raw.scenarios.length > 3) return {};
    return Object.fromEntries(raw.scenarios.filter(r => Array.isArray(r) && typeof r[0] === 'string' && /^[a-z0-9-]{1,64}$/.test(r[0])).map(([key,draft]) => [key,normalizeDraft(draft)]));
  } catch { return {}; }
}
