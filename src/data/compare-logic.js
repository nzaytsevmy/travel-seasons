// Общая логика для /compare/ — считает сравнимые данные по направлению
// из уже существующих источников (никаких новых чисел, только агрегация).
// Используется и в статичных /compare/<pair>/ (Astro), и встраивается как
// JSON в /compare/ для клиентского пикера произвольной пары.
import { bySlug } from './directions.js';
import { VISA_DETAILS } from './visa-details.js';
import realBudgets from './real-budgets-2026.json';
import { PLUG_TYPES } from './country-plug-types.js';
import { VISITED } from './directions.js';

export const RANK = { P: 4, G: 3, O: 2, B: 1, X: 0 };
export const RANK_LABEL = { P: 'Пик сезона', G: 'Хорошо', O: 'Нормально', B: 'Не лучший месяц', X: 'Закрыто' };

// Строит плоский сериализуемый объект по slug — на нём и держится вся страница
// сравнения. Если каких-то данных нет в репо (RF-направления без real-budgets) —
// честный fallback на prices.js (тоже реальные данные, просто грубее), не выдумываем.
export function buildCompareEntry(slug, monthIdx) {
  const d = bySlug(slug);
  if (!d) return null;

  const visaInfo = VISA_DETAILS[slug] || null;
  const budgetSrc = realBudgets[slug];
  const budget = budgetSrc
    ? { budget: budgetSrc.median_daily_rub.budget, midrange: budgetSrc.median_daily_rub.midrange, luxury: budgetSrc.median_daily_rub.luxury, currency: 'RUB', source: 'real' }
    : (d.price ? { budget: d.price.hotel[0] + d.price.food[0], midrange: d.price.hotel[1] + d.price.food[1], luxury: d.price.hotel[2] + d.price.food[2], currency: 'USD', source: 'estimate' } : null);

  return {
    slug,
    nom: d.cases.nom,
    vP: d.cases.vP,
    loc: d.cases.loc,
    visited: VISITED.has(slug),
    visa: visaInfo,
    visaFree: d.visa === 'free',
    budget,
    flightFrom: d.price?.flight?.[0] ?? null,
    flightAvg: d.price?.flight?.[1] ?? null,
    iata: d.iata,
    plug: PLUG_TYPES[slug] || null,
    r: d.r,
    goodNow: (RANK[d.r[monthIdx]] || 0) >= 3,
    nowLabel: RANK_LABEL[d.r[monthIdx]] || RANK_LABEL.O,
    nowCode: d.r[monthIdx],
    emoji: d.visual?.emoji || '🌍',
  };
}

// Механическое, дата-driven сравнение двух готовых entry — никакой выдуманной
// прозы: только то, что реально следует из чисел (кто дешевле/на сколько,
// у кого сейчас лучше сезон, у кого проще виза). Используется и в верстке
// компаратора, и в авто-FAQ на статичных /compare/<pair>/ страницах.
export function compareEntries(a, b) {
  const out = { cheaper: null, cheaperPct: null, easierVisa: null, betterNow: null };

  if (a.budget && b.budget && a.budget.currency === b.budget.currency) {
    const am = a.budget.midrange, bm = b.budget.midrange;
    if (am !== bm) {
      out.cheaper = am < bm ? a.slug : b.slug;
      out.cheaperPct = Math.round((Math.abs(am - bm) / Math.max(am, bm)) * 100);
    }
  }

  const visaScore = (e) => (e.visaFree ? 0 : (e.visa ? 1 : 0.5));
  const sa = visaScore(a), sb = visaScore(b);
  if (sa !== sb) out.easierVisa = sa < sb ? a.slug : b.slug;

  if (a.goodNow !== b.goodNow) out.betterNow = a.goodNow ? a.slug : (b.goodNow ? b.slug : null);

  return out;
}
