// Класс климата месяца для пары (slug направления, monthIdx 0–11).
// Читают: /packing/[c]/[m], /packing/[c], /packing/, /trips/[m]/[c].
//
// Откуда берётся класс (порядок, решение Никиты 05.09.2026):
// 1. Свойство места (PLACE_BOUND): высокогорье, джунгли и сафари, полярная
//    экспедиция. Температура месяца их не отменяет — кислород, москиты и
//    снаряжение зависят от места, а не от календаря.
// 2. Опубликованные помесячные нормы country-monthly-weather.js — волна 1 погоды
//    (29.08.2026, 20 стран): страница печатает их числа и город замера.
// 3. Нормы ERA5 для всех направлений — climate-normals.generated.json,
//    снятые scripts/fetch-climate-normals.mjs (реанализ, среднее 2015–2024,
//    город замера у каждого направления).
// 4. Запасного класса НЕТ. До 05.09.2026 направление без строки в ручной таблице
//    молча получало «умеренный тёплый» на любой месяц: Алтай, Камчатка, Карелия,
//    Финляндия показывали +18–28 °C в январе — 18 направлений, 216 страниц.
//    Теперь направление без норм роняет сборку с понятной ошибкой.
//
// Пороги классов сверены с полосами температур в summary каждого класса
// (packing-weather-buckets.js); согласованность держит tests/climate-buckets.test.mjs.
import { MONTHLY_WEATHER } from './country-monthly-weather.js';
import normals from './climate-normals.generated.json' with { type: 'json' };

export const PLACE_BOUND = {
  // Высокогорье (>2500 м): кислород и UV не зависят от месяца. Город замера у
  // Киргизии и Таджикистана стоит в долине, а едут на Памир и Алай — поэтому
  // класс задан местом; в холодные месяцы там обычная зима.
  'peru':           { all: 'mountain-altitude' },
  'bolivia':        { all: 'mountain-altitude' },
  'ecuador':        { all: 'mountain-altitude' },
  'kyrgyzstan':     { cold: [10, 11, 0, 1, 2], all: 'mountain-altitude' },
  'tajikistan':     { cold: [10, 11, 0, 1, 2], all: 'mountain-altitude' },
  // Джунгли и сафари: малярийная зона, москиты, перметрин — круглый год.
  'kenya':          { all: 'tropical-jungle' },
  'tanzania':       { all: 'tropical-jungle' },
  'brazil':         { all: 'tropical-jungle' },
  // Снято 05.09.2026 из ручной таблицы: Швейцария, Скалистые горы и Хоккайдо
  // были «высокогорьем >2500 м» с «кислородом на 30% меньше» (Интерлакен — 570 м),
  // Антарктида — «−10…−25 °C» в туристический сезон (на полуострове летом около
  // нуля), Кейптаун — «джунгли с малярией». Теперь они идут по нормам; вещи для
  // сафари в ЮАР даёт тег safari.
};

/**
 * Класс месяца по нормам: tmax/tmin — средние дневной максимум и ночной минимум,
 * mm — осадки за месяц, days — дней с осадками ≥1 мм.
 * Пороги идут сверху вниз по дневной температуре; каждый порог попадает в полосу
 * температур соответствующего класса с запасом ±4 °C.
 */
export function classifyMonth({ tmax, tmin, mm, days }) {
  const rainy = mm >= 150 || days >= 12;                            // муссон: много мм ИЛИ дождь через день
  // Сезон дождей узнаётся по осадкам, а не по жаре. Тропический — с тёплыми
  // ночами (Бангкок, Сеул в августе); дождливое лето умеренных широт и тропических
  // нагорий (Алтай, Швейцария, Сан-Хосе: днём +25, ночью +15) — отдельный класс.
  if (rainy && tmax >= 27 && tmin >= 18) return 'tropical-rainy';
  if (rainy && tmax >= 22) return 'warm-rainy';
  if (tmax >= 27) {
    if (tmax >= 34 && mm < 30) return 'desert-hot';                 // сухой жар пустыни
    // Континентальное лето (Мадрид, Ереван, Алматы): сухо, ночи прохладные, перепад
    // за сутки большой. Побережье с тёплыми ночами (Гоа в январе, Рим в июле) —
    // остаётся «тропики, сухо».
    if (tmin <= 19 && tmax - tmin >= 12 && mm < 80) return 'summer-hot';
    return 'tropical-dry';
  }
  // Сухой сезон с холодными ночами: Марракеш и Катманду зимой, Пекин весной,
  // Самарканд и Сантьяго осенью — перепад за сутки 12 градусов и больше.
  if (tmax >= 17 && mm < 40 && tmax - tmin >= 12) return 'desert-cool';
  // Днём почти тепло, но ночи холодные (Мадрид в марте, Банф в сентябре): по
  // ощущениям это прохладный сезон, одеваться слоями.
  if (tmax >= 12 && tmax < 20 && tmin <= 8) return 'temperate-cool';
  if (tmax >= 16) return 'temperate-warm';
  if (tmax >= 8) return 'temperate-cool';
  if (tmax >= -2) return 'temperate-cold';
  if (tmax >= -12) return 'winter-frost';
  return 'cold-extreme';
}

// Опубликованные нормы волны 1 хранятся строками «21-32°C» и «15 мм / 1 дн».
function fromPublished(slug, monthIdx) {
  const rec = MONTHLY_WEATHER[slug]?.months?.[monthIdx];
  if (!rec) return null;
  const t = rec.temp.match(/(-?\d+)\s*-\s*(-?\d+)/);
  const r = rec.rain.match(/(\d+)\s*мм\s*\/\s*(\d+)\s*дн/);
  if (!t || !r) return null;
  return { tmin: Number(t[1]), tmax: Number(t[2]), mm: Number(r[1]), days: Number(r[2]) };
}

export function getClimateNormals(slug) {
  return normals.places?.[slug] || null;
}

/** Запись месяца, из которой выводится класс: опубликованные нормы волны 1, иначе ERA5. */
export function getMonthRecord(slug, monthIdx) {
  return fromPublished(slug, monthIdx) || getClimateNormals(slug)?.months?.[monthIdx] || null;
}

export function getWeatherBucket(slug, monthIdx) {
  const pb = PLACE_BOUND[slug];
  if (pb) {
    if (pb.cold?.includes(monthIdx)) return 'temperate-cold';
    if (pb.jungle?.includes(monthIdx)) return 'tropical-jungle';
    if (pb.all) return pb.all;
  }
  const rec = getMonthRecord(slug, monthIdx);
  if (rec) return classifyMonth(rec);
  throw new Error(`Нет климата для «${slug}»: добавь город замера в scripts/fetch-climate-normals.mjs и перегенерируй climate-normals.generated.json`);
}
