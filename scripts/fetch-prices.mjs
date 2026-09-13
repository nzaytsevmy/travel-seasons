// Подтягивает минимальные цены билетов из Москвы (MOW) для всех направлений таблиц сезонов и цен
// на 12 месяцев вперёд через Travelpayouts Data API (cheap endpoint).
// Запуск: node --env-file=.env scripts/fetch-prices.mjs
// Результат: src/data/prices-cache.json — { "<iata>": { "YYYY-MM": <price> | null }, ... }

import { regionMeta } from '../src/data/regions-meta.js';
import { PRICES } from '../src/data/prices.js';
import { fetchCheap, refreshPrices } from './price-refresh.mjs';
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

try {
  const result = await refreshPrices({out: OUT, iatas, months,
    request: (iata, month) => fetchCheap(iata, month, {token: TOKEN})});
  console.log(`Цены обновлены: ${JSON.stringify(result.refreshCounts)}`);
  if (result.refreshCounts.temporary_error) console.warn('::warning::Часть запросов не удалась; даты сохранённых цен не обновлены.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
