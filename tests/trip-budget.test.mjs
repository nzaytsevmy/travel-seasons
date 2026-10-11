import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTripBudget, calculatorHref, normalizeTrip, DEFAULT_TRIP } from '../src/utils/trip-budget.js';
import { loadBudgetRates, parseBudgetRates } from '../src/utils/budget-rates.js';
import { DIRECTIONS } from '../src/data/directions.js';
import { PRICES } from '../src/data/prices.js';
import { VISA_DETAILS } from '../src/data/visa-details.js';

const rates = { USD: 84.3363, EUR: 97.7626 };
const dagestan = { flight: [40, 90, 220], hotel: [22, 55, 160], food: [10, 30, 80] };
const xml = '<ValCurs Date="15.09.2026"><Valute><CharCode>USD</CharCode><Nominal>1</Nominal><Value>84,3363</Value></Valute><Valute><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>97,7626</Value></Valute></ValCurs>';

for (const slug of ['finland', 'switzerland', 'spain', 'greece', 'croatia', 'iceland', 'norway']) {
  test(`${slug}: неизвестная страховка для шенгенской визы оставляет бюджет неполным`, () => {
    const result = calculateTripBudget(dagestan, { rates, visa: VISA_DETAILS[slug] });
    assert.ok(result.unknownCosts.some(cost => /страховк/i.test(cost)));
    assert.equal(result.grand, null);
    assert.ok(result.knownTotal > 0);
  });
}

test('эконом-неделя на одного: сумма равна показанным частям, без округления до тысяч', () => {
  const result = calculateTripBudget(dagestan, { rates });
  assert.deepEqual(
    [result.flightTotal, result.hotelTotal, result.foodTotal, result.visaTotal, result.grand],
    [3373, 12988, 5904, 0, 22265],
  );
  assert.equal(calculateTripBudget(dagestan, { rates, currency: 'usd' }).grand, 264);
});

test('сезон меняет перелёт; второй путешественник делит номер и оплачивает свой перелёт и еду', () => {
  const result = calculateTripBudget(dagestan, { rates, currency: 'usd', travelers: 2, month: 1, seasons: ['P'] });
  assert.deepEqual([result.flightTotal, result.hotelTotal, result.foodTotal, result.grand], [104, 154, 140, 398]);
});

test('сбор в евро переводится по курсу евро; включённый в билет сбор не дублируется', () => {
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '€90' } }).visaTotal, 8799);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '$25.50' }, travelers: 2, currency: 'usd' }).visaTotal, 51);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '$20 (в билете)' } }).visaTotal, 0);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: 'бесплатно' } }).visaTotal, 0);
});

test('нулевые расходы допустимы, пропущенные или бесконечные значения отвергаются', () => {
  assert.equal(calculateTripBudget({ flight: [100], hotel: [0], food: [0] }, { rates, currency: 'usd' }).grand, 100);
  assert.throws(() => calculateTripBudget({ flight: [100], hotel: [], food: [10] }, { rates }));
  assert.throws(() => calculateTripBudget(dagestan, { rates: { USD: Infinity, EUR: 97 } }));
  assert.throws(() => calculateTripBudget(dagestan, { rates: { USD: 84, EUR: 0 } }));
});

test('неизвестный обязательный сбор не превращается в бесплатный въезд или полный бюджет', () => {
  for (const cost of ['по тарифу консульства', 'AUD 250', 'CA$100 + биом. CA$85', '€90 + до 23€ VFS', '$6 000–25 000', '$30 eVisa / $60 VOA', '']) {
    const result = calculateTripBudget(dagestan, { rates, visa: { cost } });
    assert.equal(result.visaTotal, null, cost);
    assert.equal(result.grand, null, cost);
    assert.equal(result.knownTotal, 22265, cost);
  }
});

test('отдельные обязательные сборы суммируются; нижняя граница диапазона не выдаётся за точную сумму', () => {
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '$30 eVisa / $30 VOA' } }).visaTotal, 2530);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '€90 + €30' } }).visaTotal, 11732);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: 'бесплатно + JVAC 970₽' } }).visaTotal, 970);
  assert.equal(calculateTripBudget(dagestan, { rates, visa: { cost: '$30+' } }).grand, null);
});

test('обязательная страховка без известной цены не становится нулём в полном бюджете', () => {
  const result = calculateTripBudget(dagestan, { rates, visa: {
    cost: '$25', mandatoryCosts: [{ label: 'Медицинская страховка', rub: null }],
  } });
  assert.equal(result.grand, null);
  assert.equal(result.mandatoryTotal, null);
  assert.deepEqual(result.unknownCosts, ['Медицинская страховка']);
  assert.equal(result.knownTotal, result.flightTotal + result.hotelTotal + result.foodTotal + result.visaTotal);
  const complete = calculateTripBudget(dagestan, { rates, travelers: 2, visa: {
    cost: 'бесплатно', mandatoryCosts: [{ label: 'Обязательный расход', rub: 500 }],
  } });
  assert.equal(complete.mandatoryTotal, 1000);
  assert.equal(complete.grand, complete.flightTotal + complete.hotelTotal + complete.foodTotal + 1000);
});

test('Грузия: бесплатный штамп не означает поездку без обязательной страховки', () => {
  const d = DIRECTIONS.find(d => d.slug === 'georgia');
  const result = calculateTripBudget(d.price, { rates, visa: VISA_DETAILS.georgia });
  assert.equal(result.grand, null);
  assert.deepEqual(result.unknownCosts, ['Медицинская страховка']);
});

test('неверные параметры ссылки не создают дробных людей или NaN; допустимые значения ограничены', () => {
  assert.deepEqual(normalizeTrip({ days: 'foo', level: '0.5', travelers: '2.5', month: '1.1', currency: 'eur' }), DEFAULT_TRIP);
  assert.deepEqual(normalizeTrip({ days: 999, level: 5, travelers: 8, month: 15 }), { days: 90, level: 2, travelers: 4, month: 12, currency: 'rub' });
  assert.equal(normalizeTrip({ days: '  ' }).days, 7);
  assert.equal(calculatorHref(-1), '/calculator/');
});

test('каждое направление имеет однозначную цену и ссылку на ту же эконом-неделю', () => {
  for (const d of DIRECTIONS) {
    const matches = PRICES.map((p, i) => ({ p, i })).filter(({ p }) => p.name === d.price?.name);
    assert.equal(matches.length, 1, d.slug);
    const { i } = matches[0];
    const params = new URL(calculatorHref(i), 'https://traveltribe.ru').searchParams;
    assert.deepEqual(Object.fromEntries(params), { r: String(i), d: '7', l: '0', c: 'rub', t: '1' });
    for (const level of [0, 1, 2]) {
      const result = calculateTripBudget(d.price, { rates, level, visa: VISA_DETAILS[d.slug], seasons: d.r });
      assert.ok(Number.isFinite(result.knownTotal) && result.knownTotal > 0, d.slug);
      assert.equal(result.knownTotal, result.flightTotal + result.hotelTotal + result.foodTotal + (result.visaTotal ?? 0) + (result.mandatoryTotal ?? 0));
      if (result.visaTotal === null) assert.equal(result.grand, null, d.slug);
      else if (result.mandatoryTotal === null) assert.equal(result.grand, null, d.slug);
      else assert.equal(result.grand, result.knownTotal);
    }
  }
});

test('ЦБ: дата действия и номинал валюты читаются из ответа, будущая/несуществующая дата отвергается', () => {
  assert.deepEqual(parseBudgetRates(xml, '2026-09-15'), { date: '2026-09-15', RUB: 1, ...rates });
  assert.ok(Math.abs(parseBudgetRates(xml.replace('<Nominal>1</Nominal>', '<Nominal>10</Nominal>'), '2026-09-15').USD - 8.43363) < 1e-10);
  assert.throws(() => parseBudgetRates(xml.replace('15.09.2026', '16.09.2026'), '2026-09-15'));
  assert.throws(() => parseBudgetRates(xml.replace('15.09.2026', '30.02.2026'), '2026-09-15'));
  assert.throws(() => parseBudgetRates(xml.replace('<Value>97,7626</Value>', ''), '2026-09-15'));
});

test('курс запрашивается на текущую московскую дату; офлайн доступен подтверждённый резерв', async () => {
  let requested;
  const result = await loadBudgetRates({
    now: new Date('2026-09-14T21:30:00Z'),
    fetchImpl: async url => { requested = url; return { ok: true, text: async () => xml }; },
  });
  assert.equal(requested, 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=15/09/2026');
  assert.equal(result.USD, rates.USD);
  const backup = { date: '2026-09-15', RUB: 1, ...rates };
  const offline = await loadBudgetRates({ backup, fetchImpl: async () => { throw new Error('offline'); } });
  assert.deepEqual(offline, backup);
});
