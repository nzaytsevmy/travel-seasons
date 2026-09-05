// Снимает климатические нормы для всех направлений сайта из реанализа ERA5
// (Open-Meteo, суточные данные за 2015–2024) и пишет их в
// src/data/climate-normals.generated.json. Из этих норм выводится класс
// климата месяца (country-month-bucket.js) для страниц сборов и поездок.
//
// Зачем: до 05.09.2026 у 18 направлений класс климата не имел под собой
// ни одного числа — код молча подставлял «умеренный тёплый» на любой месяц,
// и Алтай в январе показывал +18–28 °C. Ручная таблица остальных 59 тоже
// была догадкой. Теперь у каждого направления есть город замера и нормы.
//
// Запуск: node scripts/fetch-climate-normals.mjs   (сеть, ключ не нужен, ~2 мин)
import { writeFileSync } from 'node:fs';
import { DIRECTIONS } from '../src/data/directions.js';

// Город замера — главный туристический город направления (тот же, что печатается
// на странице у стран с волной 1 погоды). Координаты не пишем руками: их отдаёт
// геокодер по имени, а код страны сверяется — опечатка в имени не пройдёт.
const PLACES = {
  'australia-east':     { city: 'Сидней', q: 'Sydney', cc: 'AU' },
  'australia-north':    { city: 'Дарвин', q: 'Darwin', cc: 'AU' },
  'bali':               { city: 'Денпасар', q: 'Denpasar', cc: 'ID' },
  'sumatra-kalimantan': { city: 'Медан', q: 'Medan', cc: 'ID' },
  'raja-ampat':         { city: 'Соронг', q: 'Sorong', cc: 'ID' },
  'new-zealand':        { city: 'Квинстаун (Южный остров)', q: 'Queenstown', cc: 'NZ' },
  'kenya':              { city: 'Найроби', q: 'Nairobi', cc: 'KE' },
  'south-africa':       { city: 'Кейптаун', q: 'Cape Town', cc: 'ZA' },
  'uae':                { city: 'Дубай', q: 'Dubai', cc: 'AE' },
  'saudi-arabia':       { city: 'Джидда', q: 'Jeddah', cc: 'SA' },
  'oman':               { city: 'Маскат', q: 'Muscat', cc: 'OM' },
  'qatar':              { city: 'Доха', q: 'Doha', cc: 'QA' },
  'turkey':             { city: 'Анталья', q: 'Antalya', cc: 'TR' },
  'egypt':              { city: 'Хургада', q: 'Hurghada', cc: 'EG' },
  'morocco':            { city: 'Марракеш', q: 'Marrakesh', cc: 'MA' },
  'israel':             { city: 'Тель-Авив', q: 'Tel Aviv', cc: 'IL' },
  'iran':               { city: 'Тегеран', q: 'Tehran', cc: 'IR' },
  'jordan':             { city: 'Амман', q: 'Amman', cc: 'JO' },
  'tanzania':           { city: 'Аруша', q: 'Arusha', cc: 'TZ' },
  'madagascar':         { city: 'Антананариву', q: 'Antananarivo', cc: 'MG' },
  'mauritius':          { city: 'Порт-Луи', q: 'Port Louis', cc: 'MU' },
  // Одноимённых Викторий много — точка задана явно (Маэ).
  'seychelles':         { city: 'Виктория (Маэ)', lat: -4.62, lon: 55.45, cc: 'SC' },
  'japan':              { city: 'Токио', q: 'Tokyo', cc: 'JP' },
  'japan-hokkaido':     { city: 'Саппоро', q: 'Sapporo', cc: 'JP' },
  'hong-kong':          { city: 'Гонконг', q: 'Hong Kong', cc: 'HK' },
  'south-korea':        { city: 'Сеул', q: 'Seoul', cc: 'KR' },
  'thailand':           { city: 'Бангкок', q: 'Bangkok', cc: 'TH' },
  'vietnam':            { city: 'Хошимин', q: 'Ho Chi Minh City', cc: 'VN' },
  'india-goa':          { city: 'Панаджи (Гоа)', q: 'Panaji', cc: 'IN' },
  'sri-lanka':          { city: 'Коломбо', q: 'Colombo', cc: 'LK' },
  'maldives':           { city: 'Мале', q: 'Male', cc: 'MV' },
  'georgia':            { city: 'Тбилиси', q: 'Tbilisi', cc: 'GE' },
  'armenia':            { city: 'Ереван', q: 'Yerevan', cc: 'AM' },
  'kyrgyzstan':         { city: 'Ош', q: 'Osh', cc: 'KG' },
  'uzbekistan':         { city: 'Самарканд', q: 'Samarkand', cc: 'UZ' },
  'tajikistan':         { city: 'Душанбе', q: 'Dushanbe', cc: 'TJ' },
  'abkhazia':           { city: 'Сухум', q: 'Sukhumi', cc: 'GE' },
  'kazakhstan':         { city: 'Алматы', q: 'Almaty', cc: 'KZ' },
  'china':              { city: 'Пекин', q: 'Beijing', cc: 'CN' },
  'hainan':             { city: 'Санья', q: 'Sanya', cc: 'CN' },
  'malaysia':           { city: 'Куала-Лумпур', q: 'Kuala Lumpur', cc: 'MY' },
  'philippines':        { city: 'Себу', q: 'Cebu City', cc: 'PH' },
  'cambodia':           { city: 'Сиемреап', q: 'Siem Reap', cc: 'KH' },
  'singapore':          { city: 'Сингапур', q: 'Singapore', cc: 'SG' },
  'nepal':              { city: 'Катманду', q: 'Kathmandu', cc: 'NP' },
  'serbia':             { city: 'Белград', q: 'Belgrade', cc: 'RS' },
  'finland':            { city: 'Хельсинки', q: 'Helsinki', cc: 'FI' },
  'cyprus':             { city: 'Лимасол', q: 'Limassol', cc: 'CY' },
  'switzerland':        { city: 'Интерлакен', q: 'Interlaken', cc: 'CH' },
  'italy-north':        { city: 'Милан', q: 'Milan', cc: 'IT' },
  'italy-south':        { city: 'Рим', q: 'Rome', cc: 'IT' },
  'spain':              { city: 'Мадрид', q: 'Madrid', cc: 'ES' },
  'greece':             { city: 'Афины', q: 'Athens', cc: 'GR' },
  'croatia':            { city: 'Сплит', q: 'Split', cc: 'HR' },
  'iceland':            { city: 'Рейкьявик', q: 'Reykjavik', cc: 'IS' },
  'norway':             { city: 'Тромсё', q: 'Tromsø', cc: 'NO' },
  'usa':                { city: 'Нью-Йорк', q: 'New York', cc: 'US' },
  'canada-rockies':     { city: 'Банф', q: 'Banff', cc: 'CA' },
  'canada-east':        { city: 'Монреаль', q: 'Montreal', cc: 'CA' },
  'mexico':             { city: 'Канкун', q: 'Cancun', cc: 'MX' },
  'cuba':               { city: 'Гавана', q: 'Havana', cc: 'CU' },
  'dominican-republic': { city: 'Пунта-Кана', q: 'Punta Cana', cc: 'DO' },
  'guatemala-belize':   { city: 'Антигуа-Гватемала', q: 'Antigua Guatemala', cc: 'GT' },
  'costa-rica-panama':  { city: 'Сан-Хосе', lat: 9.93, lon: -84.08, cc: 'CR' },
  'chile-patagonia':    { city: 'Пуэрто-Наталес', q: 'Puerto Natales', cc: 'CL' },
  'chile-fjords':       { city: 'Пуэрто-Монт', q: 'Puerto Montt', cc: 'CL' },
  'peru':               { city: 'Куско', q: 'Cusco', cc: 'PE' },
  'bolivia':            { city: 'Ла-Пас', q: 'La Paz', cc: 'BO' },
  'chile':              { city: 'Сантьяго', q: 'Santiago', cc: 'CL' },
  'argentina':          { city: 'Буэнос-Айрес', q: 'Buenos Aires', cc: 'AR' },
  'ecuador':            { city: 'Кито', q: 'Quito', cc: 'EC' },
  'brazil':             { city: 'Рио-де-Жанейро', q: 'Rio de Janeiro', cc: 'BR' },
  // Антарктический полуостров: геокодера нет, точка — залив Порт-Локрой,
  // куда заходят экспедиционные суда.
  'antarctica':         { city: 'Антарктический полуостров (Порт-Локрой)', lat: -64.83, lon: -63.5, cc: 'AQ' },
  'kamchatka':          { city: 'Петропавловск-Камчатский', q: 'Petropavlovsk-Kamchatsky', cc: 'RU' },
  'karelia':            { city: 'Петрозаводск', q: 'Petrozavodsk', cc: 'RU' },
  'dagestan':           { city: 'Махачкала', q: 'Makhachkala', cc: 'RU' },
  'altai':              { city: 'Горно-Алтайск', q: 'Gorno-Altaysk', cc: 'RU' },
};

const START = '2015-01-01', END = '2024-12-31', YEARS = 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Сеть рвётся (ECONNRESET), сервер отвечает лимитом — и то и другое лечится ожиданием.
async function getJSON(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const j = await (await fetch(url)).json();
      if (j?.error && /limit/i.test(j.reason || '')) {
        console.log(`   лимит запросов, жду 65 с (попытка ${attempt})`);
        await sleep(65_000);
        continue;
      }
      return j;
    } catch (e) {
      if (attempt >= 8) throw e;
      console.log(`   сеть: ${e.cause?.code || e.message}, повтор через 15 с (попытка ${attempt})`);
      await sleep(15_000);
    }
  }
}

async function geocode(p) {
  if (p.lat != null) return { lat: p.lat, lon: p.lon, found: p.city, cc: p.cc };
  const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.q)}&count=10&language=en`;
  const j = await getJSON(u);
  const hit = (j.results || []).find((r) => r.country_code === p.cc);
  if (!hit) throw new Error(`геокодер не нашёл ${p.q} в стране ${p.cc}`);
  return { lat: hit.latitude, lon: hit.longitude, found: hit.name, cc: hit.country_code };
}

async function normals(lat, lon) {
  const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${START}&end_date=${END}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  const j = await getJSON(u);
  if (!j.daily) throw new Error(`архив не ответил: ${JSON.stringify(j).slice(0, 120)}`);
  const acc = Array.from({ length: 12 }, () => ({ mx: [], mn: [], mm: 0, wet: 0 }));
  j.daily.time.forEach((day, i) => {
    const m = Number(day.slice(5, 7)) - 1;
    const mx = j.daily.temperature_2m_max[i], mn = j.daily.temperature_2m_min[i], p = j.daily.precipitation_sum[i];
    if (mx != null) acc[m].mx.push(mx);
    if (mn != null) acc[m].mn.push(mn);
    if (p != null) { acc[m].mm += p; if (p >= 1) acc[m].wet += 1; }
  });
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  return acc.map((a) => ({
    tmax: Math.round(avg(a.mx)), tmin: Math.round(avg(a.mn)),
    mm: Math.round(a.mm / YEARS), days: Math.round(a.wet / YEARS),
  }));
}

import { existsSync, readFileSync } from 'node:fs';
const OUT = new URL('../src/data/climate-normals.generated.json', import.meta.url);
// Докачка: уже снятые направления не запрашиваем заново.
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'Open-Meteo ERA5 (реанализ ECMWF), суточные данные, среднее за 2015–2024',
  period: '2015–2024',
  places: prev?.places || {},
};
const missing = DIRECTIONS.map((d) => d.slug).filter((s) => !PLACES[s]);
if (missing.length) throw new Error('нет города замера для: ' + missing.join(', '));

for (const d of DIRECTIONS) {
  if (out.places[d.slug]) continue;
  const p = PLACES[d.slug];
  const g = await geocode(p);
  const months = await normals(g.lat, g.lon);
  out.places[d.slug] = { city: p.city, lat: +g.lat.toFixed(2), lon: +g.lon.toFixed(2), cc: g.cc, months };
  console.log(d.slug.padEnd(20), p.city.padEnd(26), `янв ${months[0].tmax}/${months[0].tmin}`, `июл ${months[6].tmax}/${months[6].tmin}`);
  writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');   // после каждого — чтобы обрыв не терял снятое
  await sleep(12_000);   // бесплатный лимит — по минутам, десятилетний ряд весит несколько вызовов
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log('записано направлений:', Object.keys(out.places).length);
