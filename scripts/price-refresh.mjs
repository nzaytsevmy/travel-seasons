import {readFileSync, existsSync, mkdirSync, writeFileSync, renameSync} from 'node:fs';
import {dirname} from 'node:path';
import {countFilled, refuseReason} from './prices-floor.mjs';
import {PRICE_TTL_MS, freshPrices} from '../src/data/price-freshness.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export async function fetchAirportCityCodes({token, fetchImpl = fetch, timeoutMs = 10000} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Official airport -> city mapping; a different response key is not automatically the requested route.
    const res = await fetchImpl('https://api.travelpayouts.com/data/en/airports.json',
      {headers:{'X-Access-Token':token}, signal:controller.signal});
    if (!res.ok) throw new Error('HTTP');
    const airports = await res.json();
    if (!Array.isArray(airports) || !airports.length) throw new Error('schema');
    const codes = new Map();
    for (const airport of airports) {
      if (!object(airport) || typeof airport.code !== 'string' || !airport.code ||
          typeof airport.city_code !== 'string' || !airport.city_code ||
          codes.has(airport.code) && codes.get(airport.code) !== airport.city_code) throw new Error('schema');
      codes.set(airport.code, airport.city_code);
    }
    return codes;
  } catch {
    // Do not expose provider bodies, tokens or exception URLs in Actions/Telegram logs.
    throw new Error('Справочник аэропортов недоступен или имеет неверный формат; прежний файл сохранён');
  } finally {clearTimeout(timer);}
}

export async function fetchCheap(destination, month, {
  token, airportCityCodes = new Map(), fetchImpl = fetch, timeoutMs = 10000, retries = 2, sleep = wait, random = Math.random,
} = {}) {
  const url = new URL('https://api.travelpayouts.com/v1/prices/cheap');
  // This endpoint groups offers by city. Keep the original airport key only in our cache.
  const city = airportCityCodes.get(destination) ?? destination;
  url.search = new URLSearchParams({origin:'MOW', destination:city, depart_date:month, currency:'rub'});
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let result;
    try {
      // Token only in a header: exception URLs and request logs cannot contain it.
      const res = await fetchImpl(url, {headers:{'X-Access-Token':token}, signal:controller.signal});
      if ([401,403].includes(res.status)) result = {status:'auth_error'};
      else if (res.status === 429 || res.status >= 500) result = {status:'temporary_error'};
      else if (!res.ok) result = {status:'schema_error'};
      else {
        let data;
        try {data = await res.json();}
        catch {result = {status:controller.signal.aborted ? 'temporary_error' : 'schema_error'};}
        if (!result) {
          if (data?.success !== true || !object(data.data)) result = {status:'schema_error'};
          else {
            const keys = Object.keys(data.data);
            const allowed = new Set([destination, city]);
            if (keys.some(key => !allowed.has(key) || !object(data.data[key]))) result = {status:'schema_error'};
            else {
              const offers = keys.flatMap(key => Object.values(data.data[key]));
              result = offers.length === 0 ? {status:'empty'} :
                offers.every(o => Number.isFinite(o?.price) && o.price > 0)
                  ? {status:'found',price:Math.min(...offers.map(o=>o.price))} : {status:'schema_error'};
            }
          }
        }
      }
    } catch {result = {status:'temporary_error'};}
    finally {clearTimeout(timer);}
    if (result.status !== 'temporary_error' || attempt === retries) return result;
    await sleep(Math.min(8000, 500 * 2 ** attempt) * (0.5 + random()));
  }
}

export async function refreshPrices({out, iatas, months, request, now = new Date(), sleep = wait,
  maxDurationMs = 20 * 60 * 1000, consecutiveErrorLimit = 5}) {
  // A region may intentionally have no airport. Other invalid codes must fail visibly.
  const destinations = [...new Set(iatas.filter(iata => iata !== null && iata !== undefined))];
  if (destinations.some(iata => typeof iata !== 'string' || !/^[A-Z]{3}$/.test(iata))) {
    throw new Error('Некорректный код направления; прежний файл сохранён');
  }
  const previous = existsSync(out) ? JSON.parse(readFileSync(out,'utf8')) : {};
  const updatedAt = now.toISOString();
  const prices = {}, observations = {}, counts = {};
  const start = Date.now();
  let consecutiveErrors = 0;
  for (const iata of destinations) {
    prices[iata] = {}; observations[iata] = {};
    const previousFresh = freshPrices(previous, iata, now);
    for (const month of months) {
      if (Date.now() - start > maxDurationMs) throw new Error('Общий срок обновления истёк; прежний файл сохранён');
      const result = await request(iata, month);
      if (!['found','empty','temporary_error','auth_error','schema_error'].includes(result.status) ||
          result.status === 'found' && !(Number.isFinite(result.price) && result.price > 0)) {
        throw new Error('schema_error: неизвестный результат; прежний файл сохранён');
      }
      counts[result.status] = (counts[result.status] ?? 0) + 1;
      if (['auth_error','schema_error'].includes(result.status)) throw new Error(`${result.status}: ${iata} ${month}; прежний файл сохранён`);
      if (result.status === 'temporary_error') {
        if (++consecutiveErrors >= consecutiveErrorLimit) throw new Error('Поставщик недоступен; прежний файл сохранён');
        const observedAt = previous.observations?.[iata]?.[month]?.observedAt ?? previous.updatedAt ?? null;
        prices[iata][month] = previousFresh[month] ?? null;
        observations[iata][month] = {status:result.status, attemptedAt:updatedAt, observedAt,
          expiresAt:observedAt ? new Date(Date.parse(observedAt) + PRICE_TTL_MS).toISOString() : null};
      } else {
        consecutiveErrors = 0;
        prices[iata][month] = result.status === 'found' ? result.price : null;
        observations[iata][month] = {status:result.status, observedAt:updatedAt,
          expiresAt:new Date(Number(now) + PRICE_TTL_MS).toISOString()};
      }
      await sleep(250);
    }
  }
  // Compare the same destination/month cohort, not last month's expired inventory.
  const before = Object.fromEntries(destinations.map(iata => [iata,Object.fromEntries(months.map(month =>
    [month,freshPrices(previous,iata,now)[month] ?? null]))]));
  const reason = refuseReason(countFilled(before),countFilled(prices));
  if (reason) throw new Error(`Аномалия покрытия: ${reason}; прежний файл сохранён. Причина требует проверки.`);
  const cache = {updatedAt,origin:'MOW',currency:'rub',prices,observations,refreshCounts:counts};
  mkdirSync(dirname(out),{recursive:true});
  const temporary = `${out}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(cache,null,2) + '\n');
  renameSync(temporary,out);
  return cache;
}
