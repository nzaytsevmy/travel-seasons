// Подтягивает минимальные цены билетов из Москвы (MOW) для всех направлений таблиц сезонов и цен
// на 12 месяцев вперёд через Travelpayouts Data API (cheap endpoint).
// Запуск: node --env-file=.env scripts/fetch-prices.mjs
// Результат: src/data/prices-cache.json — { "<iata>": { "YYYY-MM": <price> | null }, ... }

import { regionMeta } from '../src/data/regions-meta.js';
import { PRICES } from '../src/data/prices.js';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { countFilled, refuseReason } from './prices-floor.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/prices-cache.json');

// Поддерживаем оба имени переменной для обратной совместимости со старым GHA secret TP_TOKEN
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN || process.env.TP_TOKEN;
if (!TOKEN) {
  console.error('TRAVELPAYOUTS_TOKEN (или TP_TOKEN) не найден. Запускай: node --env-file=.env scripts/fetch-prices.mjs');
  process.exit(1);
}

const ORIGIN = 'MOW';
const CURRENCY = 'rub';

// Уникальные IATA из таблицы сезонов и из таблицы цен. Страница страны берёт цену перелёта по коду из таблицы цен,
// и до 11.09.2026 четырнадцать её кодов в выгрузку не попадали (Карелия, Дагестан, Алтай, Камчатка, Абхазия, Пхукет,
// Сеул и другие): там вместо живой цены стояла прикидка — у Карелии «от $50» при прямых рейсах от 11 239 ₽.
const iatas = [...new Set([...Object.values(regionMeta).map(m => m.iata), ...PRICES.map(p => p.iata)])];

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

const prevFilled = existsSync(OUT) ? countFilled(JSON.parse(readFileSync(OUT, 'utf8')).prices) : 0;
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

const filled = countFilled(cache);
const refuse = refuseReason(prevFilled, filled);
if (refuse) {
  // Файл не трогаем: сайт покажет прошлые живые цены, а задача покраснеет и пришлёт сигнал.
  console.error(`✖ Файл цен не перезаписан: ${refuse}. Это отказ поставщика, а не рынок.`);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), origin: ORIGIN, currency: CURRENCY, prices: cache }, null, 2));
console.log(`✓ Готово: ${filled}/${total} цен записано в ${OUT}`);
