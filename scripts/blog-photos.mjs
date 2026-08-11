// Подбор иллюстраций к статье блога.
//
// Зачем отдельный инструмент, а не разовый скрипт: доводка блога до стандарта
// «фотография у каждого крупного раздела» — работа на десятки статей, и каждый
// раз повторяются одни и те же грабли. Их тут три, и все проверены руками
// 11.08.2026 на статье про города:
//
//  1. Сток отдаёт НЕ ТО, что просили, но с похожим названием. По «Krakow Main
//     Market Square» пришёл герб города, по «Valencia City of Arts» —
//     спутниковый снимок Европейского космического агентства, по «Naples
//     panorama» — музейный отпечаток XIX века, а по «Paris Montmartre» вообще
//     Руан. Отсюда обязательный `must`: имя места должно быть в названии кадра.
//  2. Отсев по названию дешевле отсева по пикселям — не тратим сеть на карты,
//     гербы и чертежи.
//  2а. ЗАПРОС ДЕРЖАТЬ КОРОТКИМ — одно-два слова. «Ruskeala marble canyon
//     Karelia» вернул пусто, «Ruskeala marble» — полную выдачу карьера
//     (11.08.2026). Сток ищет по совпадению всех слов, лишнее слово убивает
//     выдачу целиком; сужать надо через `must`, а не через длинный запрос.
//  3. Проверка глазами обязательна всё равно. Скрипт сам собирает контактный
//     лист, чтобы человек посмотрел двадцать кадров одним взглядом, а не
//     открывал их по одному.
//
// Лицензии: берём только свободные, автор и лицензия возвращаются машинно —
// без них чужой кадр публиковать нельзя. Порядок предпочтения — в news-photo.
//
// Запуск:
//   node scripts/blog-photos.mjs <slug> '<ключ>=<англ. запрос>[|<обяз. слово>]' ...
// Пример:
//   node scripts/blog-photos.mjs chto-vzyat-na-more sunscreen='sunscreen beach'
//
// Кладёт кадры в src/content/blog/_images/<slug>/<ключ>.jpg, атрибуцию — в
// _credits.json рядом, контактный лист — в contact.jpg той же папки.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { findPhoto } from './news-photo.mjs';

const UA = 'traveltribe-blog/1.0 (https://traveltribe.ru)';

// Не фотография места: символика, картография, чертежи, музейные отпечатки,
// сшитые панорамы (у них гнутся здания) и интерьеры вместо города.
// `logo|oil|brand` — из статьи про Рицу 11.08.2026: по запросу «Gega waterfall»
// пришёл фирменный знак нефтяной компании GEGA OIL с подписью «Gega Blu».
// Название кадра не всегда выдаёт подделку, поэтому контактный лист и просмотр
// глазами остаются обязательными — фильтр лишь снимает очевидный мусор.
const NOT_A_SCENE =
  /\b(coat of arms|crest|emblem|flag|map|mapa|satellite|from space|ESA|NASA|aerial|engraving|lithograph|postcard|rijksmuseum|RP-F|drawing|diagram|blueprint|logo|oil|brand|trademark|1[89]\d\d|equirectangular|360|spherical|interior|indoor)\b/i;

export function parseSpec(arg) {
  const eq = arg.indexOf('=');
  if (eq < 0) throw new Error(`не разобрать «${arg}», нужно ключ=запрос`);
  const key = arg.slice(0, eq).trim();
  const [query, must] = arg.slice(eq + 1).split('|');
  return { key, query: query.trim(), must: (must ?? '').trim() };
}

/** Первый кандидат, который скачался и прошёл проверки. */
async function grab(sharp, spec, dir, seen) {
  // ⛔ Обязательное слово сравниваем подстрокой, а НЕ собираем из него регулярку:
  // выражение из аргумента командной строки — это дыра, которую сканер
  // безопасности справедливо пометил высокой (заявка 218, 11.08.2026). Для
  // «имя города должно быть в названии кадра» регулярка и не нужна.
  const must = spec.must ? spec.must.toLowerCase() : '';
  const cands = (await findPhoto({ photoQuery: spec.query, countries: [] }))
    .filter((p) => !NOT_A_SCENE.test(p.title ?? ''))
    .filter((p) => !must || (p.title ?? '').toLowerCase().includes(must));

  for (const p of cands) {
    try {
      const res = await fetch(p.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(String(res.status));
      const raw = Buffer.from(await res.arrayBuffer());
      if (raw.length < 20_000) throw new Error('файл мал для фотографии');
      const src = sharp(raw).rotate();
      const { width = 0, height = 0 } = await src.metadata();
      if (width < 1200) throw new Error(`узкий кадр ${width}px`);
      const ratio = height ? width / height : 0;
      if (ratio > 2.1 || ratio < 0.8) throw new Error(`полоса ${width}×${height}`);
      // Отсев рисованного: логотипов, плакатов, схем. Фильтр по названию их не
      // ловит — фирменный знак нефтяной компании назывался «Gega Blu» и по
      // запросу «Gega waterfall» шёл первым. Зато ловит детализация: замерено
      // 11.08.2026 — у того логотипа 1.07, у трёх фотографий Абхазии 7.36–7.69.
      const { entropy } = await src.stats();
      if (entropy < 4) throw new Error(`рисунок, а не фото (детализация ${entropy.toFixed(2)})`);
      const buf = await src
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      // Один и тот же кадр приходит по разным запросам: «Yupshara gorge» и
      // «Yupshara canyon» дали байт в байт одинаковую картинку под двумя
      // именами (Рица, 11.08.2026). Два одинаковых кадра в статье — брак.
      const hash = createHash('md5').update(buf).digest('hex');
      if (seen.has(hash)) throw new Error(`дубль кадра «${seen.get(hash)}»`);
      seen.set(hash, spec.key);
      writeFileSync(join(dir, `${spec.key}.jpg`), buf);
      return { photo: p, kb: Math.round(buf.length / 1024) };
    } catch { /* мёртвая ссылка или брак — следующий кандидат */ }
  }
  return null;
}

/** Контактный лист: двадцать кадров одним взглядом вместо двадцати открытий. */
async function contactSheet(sharp, dir, keys) {
  const cw = 420, ch = 280, cols = 4;
  const rows = Math.ceil(keys.length / cols);
  const tiles = [];
  for (const [i, k] of keys.entries()) {
    const buf = await sharp(join(dir, `${k}.jpg`))
      .resize({ width: cw, height: ch, fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    tiles.push({ input: buf, left: (i % cols) * cw, top: Math.floor(i / cols) * ch });
  }
  await sharp({ create: { width: cw * cols, height: ch * rows, channels: 3, background: '#fff' } })
    .composite(tiles)
    .jpeg({ quality: 86 })
    .toFile(join(dir, 'contact.jpg'));
}

const isMain = process.argv[1] && process.argv[1].endsWith('blog-photos.mjs');
if (isMain) {
  const [slug, ...specs] = process.argv.slice(2);
  if (!slug || !specs.length) {
    console.error("нужно: node scripts/blog-photos.mjs <slug> 'ключ=запрос[|обязательное слово]' ...");
    process.exit(1);
  }
  const dir = join(process.cwd(), 'src/content/blog/_images', slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sharp = (await import('sharp')).default;

  const credits = existsSync(join(dir, '_credits.json'))
    ? JSON.parse(readFileSync(join(dir, '_credits.json'), 'utf8'))
    : {};
  const got = [];
  const seen = new Map();   // хеш кадра → ключ, под которым он уже сохранён

  for (const arg of specs) {
    const spec = parseSpec(arg);
    const r = await grab(sharp, spec, dir, seen);
    if (!r) {
      console.log(`✗ ${spec.key.padEnd(16)} ничего по «${spec.query}»`);
      continue;
    }
    credits[spec.key] = {
      creator: r.photo.creator,
      license: r.photo.licenseLabel,
      licenseUrl: r.photo.licenseUrl,
      source: r.photo.source,
      title: r.photo.title,
    };
    got.push(spec.key);
    console.log(`✓ ${spec.key.padEnd(16)} ${r.photo.licenseLabel.padEnd(7)} ${r.photo.creator} — ${r.photo.title}`);
  }

  writeFileSync(join(dir, '_credits.json'), JSON.stringify(credits, null, 2));
  if (got.length) {
    await contactSheet(sharp, dir, got);
    console.log(`\nконтактный лист: src/content/blog/_images/${slug}/contact.jpg — ПОСМОТРЕТЬ ГЛАЗАМИ до вставки`);
  }
}
