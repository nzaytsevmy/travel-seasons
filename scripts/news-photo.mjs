// Подбор фотографии к заметке ленты /novosti/.
//
// Источник — Openverse: агрегатор фото со свободными лицензиями (Flickr, музеи,
// Викисклад). Ключ не нужен, фильтр «разрешено коммерческое использование»
// встроен в запрос, а лицензия и автор приходят машиночитаемыми — без этого
// публиковать чужой кадр нельзя.
//
// Порядок лицензий не случаен: сначала те, что не требуют ничего (cc0, pdm),
// потом простая атрибуция (by), и только потом by-sa. ShareAlike тянет за собой
// требования к производному материалу, и связываться с ним ради иллюстрации к
// новости незачем.
//
// Если стоки ничего не дали — заметка не остаётся без картинки: сработает
// подбор из своего архива (src/data/news-images.js). Лучше свой кадр с честной
// подписью, чем пустая карточка, которую не возьмут ни Дзен, ни Discover.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const UA = 'traveltribe-news/1.0 (https://traveltribe.ru)';
const API = 'https://api.openverse.org/v1/images/';

// Чем выше в списке, тем меньше обязательств. Значения — как их отдаёт Openverse.
const LICENSE_RANK = { cc0: 0, pdm: 1, by: 2, 'by-sa': 3 };

const LICENSE_LABEL = {
  cc0: 'CC0', pdm: 'общественное достояние',
  by: 'CC BY', 'by-sa': 'CC BY-SA',
};

/**
 * Запасной запрос из данных заметки. Нужен редко: Openverse ищет по английским
 * тегам, а заголовки у нас русские, поэтому слова из них бесполезны — по ним
 * находится случайное. Основной запрос пишет робот полем photoQuery, он знает
 * суть заметки и формулирует её по-английски.
 */
export function fallbackQuery(data) {
  const stop = new Set(['и','в','на','с','по','из','за','для','что','это','как','не','а','но','о','об',
    'the','a','an','of','in','on','for','to','and']);
  const words = (data.title ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w))
    .slice(0, 3);
  return [...(data.countries ?? []), ...words].join(' ').trim();
}

async function search(q, { wide = true, timeoutMs = 25000 } = {}) {
  // Широкий кадр предпочтителен, но по редким сюжетам его может просто не быть:
  // «numbat marsupial» с фильтром по пропорциям не находит ничего. Поэтому
  // второй заход идёт без него — лучше вертикальный кадр по теме, чем точный
  // формат не про то.
  const url = `${API}?q=${encodeURIComponent(q)}&license_type=commercial&size=large`
            + `${wide ? '&aspect_ratio=wide' : ''}&page_size=12&mature=false`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ac.signal });
    if (!res.ok) return [];
    const json = await res.json();
    return json.results ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ищет кадр под заметку. Возвращает описание найденного или null.
 * Ничего не скачивает — скачивание отдельным шагом, чтобы поиск можно было
 * прогнать всухую и посмотреть, что вообще находится.
 */
export async function findPhoto(data) {
  // Запрос пробуем от точного к общему. Openverse на длинной фразе с фильтром
  // размера легко отдаёт ноль: «numbat marsupial» — пусто, «numbat» — находит.
  // Поэтому каждый запрос дополнительно укорачиваем по словам.
  const shorten = (q) => {
    const w = q.split(/\s+/).filter(Boolean);
    return [...new Set([q, w.slice(0, 2).join(' '), w[0]])].filter(Boolean);
  };
  const queries = [...new Set(
    [data.photoQuery, fallbackQuery(data), (data.countries ?? [])[0]]
      .map((q) => (q ?? '').trim())
      .filter(Boolean)
      .flatMap(shorten)
  )];
  for (const q of queries) {
    let hits = [];
    for (const wide of [true, false]) {
      hits = (await search(q, { wide }))
        .filter((x) => x.url && x.license in LICENSE_RANK)
        .filter((x) => (x.width ?? 0) >= 1200)
        .sort((a, b) => LICENSE_RANK[a.license] - LICENSE_RANK[b.license]);
      if (hits.length) break;
    }
    if (hits.length) {
      // Возвращаем несколько кандидатов: часть ссылок в агрегаторе мертва
      // (источник удалил файл), и на 404 надо брать следующего, а не падать.
      return hits.slice(0, 5).map((x) => ({
        url: x.url,
        title: x.title ?? '',
        creator: x.creator ?? 'без указания автора',
        license: x.license,
        licenseLabel: LICENSE_LABEL[x.license] ?? x.license.toUpperCase(),
        licenseUrl: x.license_url ?? '',
        source: x.foreign_landing_url ?? x.url,
        width: x.width ?? 0,
        query: q,
      }));
    }
  }
  return [];
}

/** Первый кандидат, который реально скачался. */
export async function fetchFirstWorking(data, slug, root = process.cwd()) {
  for (const photo of await findPhoto(data)) {
    try {
      const got = await downloadPhoto(photo, slug, root);
      return { photo, ...got };
    } catch { /* мёртвая ссылка — пробуем следующего */ }
  }
  return null;
}

/** Скачивает кадр в src/content/news/_images/<slug>.jpg. */
export async function downloadPhoto(photo, slug, root = process.cwd()) {
  const res = await fetch(photo.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`фото не скачалось: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20_000) throw new Error('файл подозрительно мал, это не фотография');
  const rel = `_images/${slug}.jpg`;
  const abs = join(root, 'src/content/news', rel);
  if (!existsSync(dirname(abs))) mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
  return { rel: `./${rel}`, bytes: buf.length };
}

/** Строки фронтматтера с картинкой и обязательной атрибуцией. */
export function frontmatterLines(photo, rel, alt) {
  return [
    `image: "${rel}"`,
    `imageAlt: "${alt.replace(/"/g, "'")}"`,
    `imageCredit: "${photo.creator.replace(/"/g, "'")}"`,
    `imageLicense: "${photo.licenseLabel}"`,
    `imageLicenseUrl: "${photo.licenseUrl}"`,
    `imageSource: "${photo.source}"`,
  ];
}
