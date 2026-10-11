import { calculateTripBudget, calculatorHref, budgetExclusions } from './trip-budget.js';

export const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
export const MONTHS_PREP = ['', 'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
export const VISA_LABELS = { free: 'Без визы', evisa: 'Электронная виза', required: 'Нужна виза' };
export const VIBES = { beach: 'Море', mountains: 'Горы', city: 'Города', nature: 'Природа' };
const VIBE_MAP = { beach: 'beach', mountain: 'mountains', altitude: 'mountains', ski: 'mountains', city: 'city', culture: 'city', food: 'city', jungle: 'nature', safari: 'nature', dive: 'nature', desert: 'nature', photo: 'nature' };
const VISA_FILTERS = new Set(['any', 'free', 'free_evisa', 'evisa', 'required']);

const recommendationForms = { one: 'рекомендация', few: 'рекомендации', many: 'рекомендаций', other: 'рекомендаций' };
const recommendationPlural = new Intl.PluralRules('ru');
export function formatRecommendationCount(count) {
  return `${count} ${recommendationForms[recommendationPlural.select(count)]}`;
}
export function destinationCountWord(count) {
  return ({ one: 'направление', few: 'направления', many: 'направлений', other: 'направлений' })[recommendationPlural.select(count)];
}

export function moscowMonth(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Moscow', month: 'numeric' }).format(now));
}

export function normalizeSelection(input = {}, defaultMonth = 0) {
  const m = Number(input.m);
  const maxBudget = Number(input.max_budget);
  return {
    m: input.m !== '' && input.m != null && Number.isInteger(m) && m >= 0 && m <= 12 ? m : defaultMonth,
    max_budget: [0, 100000, 200000].includes(maxBudget) ? maxBudget : 0,
    visa: VISA_FILTERS.has(input.visa) ? input.visa : 'any',
    vibe: Object.hasOwn(VIBES, input.vibe) ? input.vibe : '',
    q: String(input.q ?? '').trim().slice(0, 160),
    sort: ['asc', 'desc'].includes(input.sort) ? input.sort : 'rel',
  };
}

export function readSelection(search, defaultMonth = 0) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const input = Object.fromEntries(params);
  // Старые ссылки на дешёвую подборку остаются понятными.
  if (!params.has('max_budget') && params.get('b') === 'low') input.max_budget = 100000;
  return normalizeSelection(input, defaultMonth);
}

export function selectionParams(input) {
  const s = normalizeSelection(input);
  const params = new URLSearchParams();
  if (s.m) params.set('m', String(s.m));
  if (s.max_budget) params.set('max_budget', String(s.max_budget));
  if (s.visa !== 'any') params.set('visa', s.visa);
  if (s.vibe) params.set('vibe', s.vibe);
  if (s.q) params.set('q', s.q);
  if (s.sort !== 'rel') params.set('sort', s.sort);
  return params;
}

export function catalogHref(input = {}, overrides = {}) {
  const query = selectionParams({ ...input, ...overrides }).toString();
  return '/countries/' + (query ? `?${query}` : '');
}

export function createDestinationRows(directions, prices, visas, rates, activityTags) {
  return directions.map((d, order) => {
    const priceIndex = prices.findIndex(p => p.name === d.price?.name);
    const totals = Array.from({ length: 13 }, (_, month) => {
      if (!d.price) return { grand: null, knownTotal: null };
      const result = calculateTripBudget(d.price, { rates, visa: visas[d.slug], seasons: d.r, month });
      return { grand: result.grand, knownTotal: result.knownTotal, exclusions: budgetExclusions(result.unknownCosts) };
    });
    return {
      slug: d.slug, nom: d.cases.nom, sub: d.sub || '', group: d.group, order,
      visa: d.visa, r: d.r || [], seasonReasons: d.t || [], priceIndex,
      budgets: totals.map(t => t.grand), knownBudgets: totals.map(t => t.knownTotal),
      budgetExclusions: totals[0].exclusions || '',
      vibe: [...new Set((activityTags[d.slug] || []).map(t => VIBE_MAP[t]).filter(Boolean))],
    };
  });
}

export function directionForMonth(row, month = 0) {
  const m = normalizeSelection({ m: month }).m;
  return {
    ...row, budget: row.budgets[m] ?? null, knownBudget: row.knownBudgets[m] ?? null,
    seasonReason: m ? row.seasonReasons?.[m - 1] || '' : '',
    code: m ? row.r[m - 1] : '', calcUrl: calculatorHref(row.priceIndex, { month: m }),
  };
}

const searchable = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е');
export function selectDestinations(rows, input = {}, limit = Infinity) {
  const s = normalizeSelection(input);
  const q = searchable(s.q);
  return rows.map(row => directionForMonth(row, s.m)).filter(row => {
    if (s.m && !['P', 'G'].includes(row.code)) return false;
    if (q && !searchable(row.nom).includes(q)) return false;
    if (s.visa === 'free_evisa' && !['free', 'evisa'].includes(row.visa)) return false;
    if (!['any', 'free_evisa'].includes(s.visa) && row.visa !== s.visa) return false;
    if (s.max_budget && (row.budget === null || row.budget > s.max_budget)) return false;
    if (s.vibe && !row.vibe.includes(s.vibe)) return false;
    return true;
  }).sort((a, b) => {
    if (s.sort === 'asc') return (a.budget ?? Infinity) - (b.budget ?? Infinity) || a.order - b.order;
    if (s.sort === 'desc') return (b.budget ?? -Infinity) - (a.budget ?? -Infinity) || a.order - b.order;
    if (s.m && a.code !== b.code) return a.code === 'P' ? -1 : 1;
    return a.order - b.order;
  }).slice(0, limit);
}

export function homeCollections(rows, input) {
  const s = normalizeSelection(input);
  return {
    recommendations: selectDestinations(rows, s, 6),
    free: selectDestinations(rows, { m: s.m, visa: 'free' }, 4),
    cheap: selectDestinations(rows.filter(row => row.budgets[s.m] !== null), { m: s.m, sort: 'asc' }, 6),
  };
}
