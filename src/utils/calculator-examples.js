import { createHash } from 'node:crypto';
import provenance from '../data/calculator-price-provenance.json' with { type: 'json' };
import { calculateTripBudget } from './trip-budget.js';
import { personalBudget } from './personal-budget.js';

// This is the last edit of a source row, not the date prices were verified.
// A changed row must not inherit the date of its previous values.
export function priceRecordDate(price) {
  const record = provenance.entries[price?.name];
  if (!record || !['flight', 'hotel', 'food'].every(key => Array.isArray(price[key]))) return null;
  const fingerprint = createHash('sha256').update(JSON.stringify([price.flight, price.hotel, price.food])).digest('hex');
  return fingerprint === record.fingerprint && /^\d{4}-\d{2}-\d{2}$/.test(record.lastLineEdit)
    ? record.lastLineEdit : null;
}

const EXAMPLES = [
  { slug: 'turkey', iata: 'AYT', name: 'Турция' },
  { slug: 'egypt', iata: 'HRG', name: 'Египет' },
  { slug: 'thailand', iata: 'HKT', name: 'Таиланд' },
];

export function buildCalculatorExamples({ prices, directions, visas, rates }) {
  return EXAMPLES.map(spec => {
    const direction = directions.find(item => item.slug === spec.slug);
    const index = prices.findIndex(item => item.name === direction?.price?.name && item.iata === spec.iata);
    const visa = visas[spec.slug];
    if (index < 0 || !direction || !visa) throw new Error(`Нет данных примера: ${spec.slug}`);
    const price = prices[index];
    const base = calculateTripBudget(price, {
      rates, visa, seasons: direction.r, days: 7, travelers: 1, level: 0, month: 0, currency: 'rub',
    });
    const budget = personalBudget(base, { nights: 7, rooms: 1, reserve: 0 });
    return { slug: spec.slug, name: spec.name, index, totalMinor: budget.knownMinor,
      rows: budget.rows, unknown: budget.unknown, recordedAt: priceRecordDate(price) };
  });
}
