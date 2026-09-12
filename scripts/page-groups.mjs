// Какие типы страниц читают файл данных. Считается по импортам — руками не поддерживается.
//
// ⛔ Зачем. Дата страницы в карте сайта берётся из правки данных ЭТОЙ страны
//    (scripts/gen-page-lastmod.mjs), но раздавалась всем страницам страны сразу — и хабу,
//    и визе, и сборам, и поездкам. 12.09.2026 волна фактов про 64 страны подняла сегодняшнюю
//    дату у 1564 адресов из 2182 (72% карты), хотя страницы поездок не изменились ни на
//    строку: их шаблон не читает ни гидов, ни фактов «на месте», ни розеток, ни визовых
//    строк (сверено сравнением готовых страниц: 0 изменённых строк у Кипра, Узбекистана и
//    Турции). Такая дата — заявка поиску «сайт переписан целиком»: 27.08.2026 Googlebot ушёл
//    перепроверять 1930 адресов и до новых статей не добрался вовсе.
//
//    Теперь правка двигает дату только тем типам страниц, которые этот файл действительно
//    читают — прямо или через компонент.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

/** Входные шаблоны каждого типа страниц. */
export const ВХОДЫ = {
  hub: ['src/pages/[slug].astro'],
  visa: ['src/pages/visa/[slug].astro', 'src/pages/visa/index.astro'],
  packing: [
    'src/pages/packing/[country].astro',
    'src/pages/packing/[country]/[month].astro',
    'src/pages/packing/index.astro',
  ],
  trips: ['src/pages/trips/[month]/[country].astro', 'src/pages/trips/[month].astro'],
};

const ИМПОРТ = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g;
const кеш = new Map();

/** Все файлы, достижимые из шаблона по цепочке импортов (шаблон → компонент → данные). */
export function достижимые(вход, root = process.cwd()) {
  const ключ = `${root}|${вход}`;
  if (кеш.has(ключ)) return кеш.get(ключ);
  const виден = new Set();
  const стек = [вход];
  while (стек.length) {
    const файл = стек.pop();
    if (виден.has(файл)) continue;
    виден.add(файл);
    const полный = join(root, файл);
    if (!existsSync(полный)) continue;
    let текст;
    try { текст = readFileSync(полный, 'utf8'); } catch { continue; }
    for (const m of текст.matchAll(ИМПОРТ)) {
      let цель = normalize(join(dirname(файл), m[1]));
      if (!/\.[a-z]+$/.test(цель)) цель += '.js';
      стек.push(цель);
    }
  }
  кеш.set(ключ, виден);
  return виден;
}

/** Типы страниц, которые читают этот файл. Путь — от корня репозитория. */
export function группыФайла(файл, root = process.cwd()) {
  return Object.entries(ВХОДЫ)
    .filter(([, входы]) => входы.some((в) => достижимые(в, root).has(файл)))
    .map(([г]) => г);
}
