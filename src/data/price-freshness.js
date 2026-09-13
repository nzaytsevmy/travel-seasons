// Daily refresh: tolerate two missed runs, then stop treating the quote as current.
// This is an operational limit, not a claim about the supplier's price guarantee.
export const PRICE_TTL_MS = 72 * 60 * 60 * 1000;

export function freshPrices(cache, iata, now = new Date()) {
  return Object.fromEntries(Object.entries(cache.prices?.[iata] ?? {}).map(([month, price]) => {
    const observed = cache.observations?.[iata]?.[month]?.observedAt ?? cache.updatedAt;
    const age = Number(now) - Date.parse(observed);
    const valid = Number.isFinite(price) && price > 0 && age >= 0 && age <= PRICE_TTL_MS;
    return [month, valid ? price : null];
  }));
}
