// Слепок посещаемости статей: сколько людей читает каждую и сколько уходит
// к партнёру.
//
// Зачем отдельно от очереди ревизий. Очередь считается при сборке сайта, а
// счётчик посещаемости требует ключа, которого в сборке нет и быть не должно.
// Поэтому цифры снимаются отдельной задачей и кладутся в файл, а очередь
// просто читает его, если он есть. Нет файла — очередь работает как раньше,
// только без приоритета по трафику.
//
// ⛔ Считаем не «переходы по партнёрской ссылке» из кабинета партнёрки, а
// достижение цели в счётчике: клики в кабинете включают роботов. Замер
// 05.08.2026: 385 «переходов» у партнёрки против 83 живых у счётчика.
//
// Запуск: METRIKA_OAUTH_TOKEN=... node scripts/traffic-snapshot.mjs

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'seo-pulse/traffic.json');
const COUNTER = '95832375';
const GOAL_PARTNER = '566338531';   // переход к партнёру
const API = 'https://api-metrika.yandex.net/stat/v1/data';

const token = process.env.METRIKA_OAUTH_TOKEN;
if (!token) {
  console.error('нет ключа счётчика — слепок не снят');
  process.exit(0);   // не роняем задачу: очередь переживёт отсутствие файла
}

// ⛔ Считаем ДВА числа, и приоритет строится на втором. 17.08.2026 гайд по Чили
// показывал 502 визита и стоял первым в очереди ревизий — а внутри оказалось
// 487 прямых заходов по одной секунде из Chrome под Windows при том, что живая
// аудитория сайта сидит в Яндекс Браузере. Живых читателей там было 15.
// Роботный поток на одну страницу перевешивал в очереди всё остальное.
async function pull(extraFilter) {
  const url = `${API}?ids=${COUNTER}`
    + `&metrics=ym:s:visits,ym:s:goal${GOAL_PARTNER}reaches`
    + '&dimensions=ym:s:startURLPath&sort=-ym:s:visits&limit=500'
    + (extraFilter ? `&filters=${encodeURIComponent(extraFilter)}` : '')
    + '&date1=30daysAgo&date2=yesterday';
  const res = await fetch(url, { headers: { Authorization: `OAuth ${token}` } });
  if (!res.ok) {
    console.error(`счётчик ответил ${res.status} — слепок не снят`);
    process.exit(0);
  }
  return res.json();
}

const all = await pull(null);
const organic = await pull("ym:s:lastTrafficSource=='organic'");

// Гайды стран живут на верхнем уровне адреса, но там же живут и разделы
// (/visa/, /countries/ …). Отличаем по списку направлений — тому же, из
// которого собираются сами страницы гайдов.
import { DIRECTIONS } from '../src/data/directions.js';
const GUIDES = new Set([...DIRECTIONS.map((d) => d.slug), 'japan', 'antarctica']);

// ⛔ До 27.08.2026 слепок покрывал только статьи блога, а сборы и гайды —
// 600+ кликов из поиска за квартал — жили вообще без замера конверсии:
// правки там нельзя было ни принять, ни откатить. Теперь три класса страниц.
const классифицировать = (path) => {
  let m = path.match(/^\/blog\/([^/]+)\/$/);
  if (m) return ['posts', m[1]];
  m = path.match(/^\/packing\/([^/]+\/[^/]+)\/$/);
  if (m) return ['packing', m[1]];
  m = path.match(/^\/([^/]+)\/$/);
  if (m && GUIDES.has(m[1])) return ['guides', m[1]];
  return null;
};

const rows = { posts: {}, packing: {}, guides: {} };
const put = (data, key) => {
  for (const r of data.data ?? []) {
    const к = классифицировать(r.dimensions[0].name);
    if (!к) continue;
    const [тип, slug] = к;
    rows[тип][slug] ??= { visits: 0, live: 0, partner: 0 };
    rows[тип][slug][key] = Math.round(r.metrics[0]);
    if (key === 'live') rows[тип][slug].partner = Math.round(r.metrics[1]);
  }
};
put(all, 'visits');
put(organic, 'live');

writeFileSync(OUT, JSON.stringify({
  updated: new Date().toISOString().slice(0, 10),
  posts: rows.posts, packing: rows.packing, guides: rows.guides,
}, null, 2) + '\n');
const sum = (т, k) => Object.values(rows[т]).reduce((s, x) => s + (x[k] ?? 0), 0);
for (const т of ['posts', 'packing', 'guides']) {
  console.log(`${т}: страниц ${Object.keys(rows[т]).length}, визитов ${sum(т, 'visits')}, живых ${sum(т, 'live')}, к партнёру ${sum(т, 'partner')}`);
}
