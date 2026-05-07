// Подтягивает минимальные цены билетов из Москвы (MOW) для всех 39 направлений
// на 12 месяцев вперёд через Travelpayouts Data API (cheap endpoint).
// Запуск: node --env-file=.env scripts/fetch-prices.mjs
// Результат: src/data/prices-cache.json — { "<iata>": { "YYYY-MM": <price> | null }, ... }

import { regionMeta } from '../src/data/regions-meta.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/prices-cache.json');

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
if (!TOKEN) {
  console.error('TRAVELPAYOUTS_TOKEN не найден. Запускай: node --env-file=.env scripts/fetch-prices.mjs');
  process.exit(1);
}

const ORIGIN = 'MOW';
const CURRENCY = 'rub';

// Уникальные IATA из meta (без дублей по направлениям)
const iatas = [...new Set(Object.values(regionMeta).map(m => m.iata))];

// 12 месяцев вперёд от текущего, формат YYYY-MM
function next12Months() {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

const months = next12Months();

async function fetchCheap(destination, month) {
  const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${ORIGIN}&destination=${destination}&depart_date=${month}&currency=${CURRENCY}&token=${TOKEN}`;
  try {
    const res = await fetch(url, { headers: { 'X-Access-Token': TOKEN } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data || !json.data[destination]) return null;
    const offers = Object.values(json.data[destination]);
    if (!offers.length) return null;
    const minPrice = Math.min(...offers.map(o => o.price).filter(p => typeof p === 'number'));
    return Number.isFinite(minPrice) ? minPrice : null;
  } catch (e) {
    return null;
  }
}

const cache = {};
let done = 0;
const total = iatas.length * months.length;

console.log(`Подтягиваю ${total} цен (${iatas.length} направлений × ${months.length} мес)...`);

for (const iata of iatas) {
  cache[iata] = {};
  for (const month of months) {
    const price = await fetchCheap(iata, month);
    cache[iata][month] = price;
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${total} (${iata} ${month}: ${price ?? 'нет'} ₽)`);
    await new Promise(r => setTimeout(r, 250));  // 4 req/sec, безопасно для лимита
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), origin: ORIGIN, currency: CURRENCY, prices: cache }, null, 2));

const filled = Object.values(cache).flatMap(m => Object.values(m)).filter(v => v !== null).length;
console.log(`✓ Готово: ${filled}/${total} цен записано в ${OUT}`);
