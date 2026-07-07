// Static JSON endpoint — выжимка данных по направлению для /my/ (клиентский
// дашборд «Моя поездка»). Всё из уже существующих источников, ничего нового
// не считаем: виза, бюджет (real-budgets или prices.js fallback), розетка,
// сезон по месяцам, праздники. Клиент сам выбирает нужный месяц из localStorage.
import { DIRECTIONS } from '../../../data/directions.js';
import { VISA_DETAILS } from '../../../data/visa-details.js';
import realBudgets from '../../../data/real-budgets-2026.json';
import { PLUG_TYPES } from '../../../data/country-plug-types.js';
import { getHolidays } from '../../../data/country-holidays.js';

export async function getStaticPaths() {
  return DIRECTIONS.map((d) => ({ params: { slug: d.slug } }));
}

export async function GET({ params }) {
  const d = DIRECTIONS.find((x) => x.slug === params.slug);
  if (!d) return new Response('Not found', { status: 404 });

  const budgetSrc = realBudgets[d.slug];
  const budget = budgetSrc
    ? { ...budgetSrc.median_daily_rub, currency: 'RUB', source: 'real' }
    : (d.price ? { budget: d.price.hotel[0] + d.price.food[0], midrange: d.price.hotel[1] + d.price.food[1], luxury: d.price.hotel[2] + d.price.food[2], currency: 'USD', source: 'estimate' } : null);

  const payload = {
    slug: d.slug,
    nom: d.cases.nom,
    vP: d.cases.vP,
    loc: d.cases.loc,
    visaFree: d.visa === 'free',
    visa: VISA_DETAILS[d.slug] || null,
    budget,
    flightFrom: d.price?.flight?.[0] ?? null,
    iata: d.iata ?? null,
    plug: PLUG_TYPES[d.slug] || null,
    r: d.r,
    t: d.t,
    holidays: getHolidays(d.slug),
  };

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
}
