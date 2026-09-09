// @freshness: DATA_UPDATED — файл несёт датированную фактуру (погода по
//   месяцам). Сами числа живут в climate-normals.generated.json и меняются только
//   пересъёмкой скриптом; дата съёма печатается на странице из того же файла.
//
// Помесячная погода для ВСЕХ направлений сайта — из одного источника.
// Решение Никиты 05.09.2026: «один раз зафиксировать и забыть». До этого 19 стран
// были набиты руками со станций, остальные 58 брались из реанализа, и ручная
// таблица была единственным местом, которое требовало человека. Теперь всё
// выводится из src/data/climate-normals.generated.json (Open-Meteo ERA5, суточные
// данные за десять лет, сведённые по месяцам скриптом scripts/fetch-climate-normals.mjs,
// у каждого направления свой город замера). Нормы климата меняются на десятые
// градуса за десятилетие — расписания пересъёмки нет намеренно; следующий
// содержательный повод — нормы ВМО за 2001–2030 в 2031 году (REMINDERS.md).
//
// Формат записи сохранён для читателей таблицы:
//   months[0..11] = { temp: '24…31°C', rain: '281 мм / 19 дн', tmin, tmax, mm, days }
// temp и rain — строки для страниц, tmin/tmax/mm/days — числа для расчётов.
// Новое направление без норм не соберётся: tests/climate-coverage.test.mjs.

// Импорт как модуля, а не чтение файла по пути: в сборке Astro путь модуля
// указывает в dist/chunks/, где файла нет (05.09.2026, ENOENT на первой сборке).
import normals from './climate-normals.generated.json' with { type: 'json' };

// Знак минус и многоточие вместо дефисов: «−18…−8°C» читается, «-18--8°C» — нет.
const num = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));

export const CLIMATE_SOURCE = normals.source;      // как снято
export const CLIMATE_PERIOD = normals.period;      // за какие годы среднее
export const CLIMATE_GENERATED_AT = normals.generatedAt;

export const MONTHLY_WEATHER = Object.fromEntries(
  Object.entries(normals.places).map(([slug, p]) => [slug, {
    city: p.city,
    source: `${normals.source}; точка замера — ${p.city}`,
    months: p.months.map((m) => ({
      temp: `${num(m.tmin)}…${num(m.tmax)}°C`,
      rain: `${m.mm} мм / ${m.days} дн`,
      tmin: m.tmin, tmax: m.tmax, mm: m.mm, days: m.days,
    })),
  }]),
);

export function hasMonthlyWeather(slug) {
  return Boolean(MONTHLY_WEATHER[slug]?.months?.length === 12);
}

export function getMonthlyWeather(slug, monthIdx) {
  const data = MONTHLY_WEATHER[slug];
  if (!data?.months?.[monthIdx]) return null;
  return {
    ...data.months[monthIdx],
    city: data.city,
    source: data.source,
  };
}
