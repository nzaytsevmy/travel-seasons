// Подбор фотографии к заметке ленты /novosti/.
//
// Источники идут ЦЕПОЧКОЙ, а не по одному: Openverse → Викисклад → Pixabay.
// Первым остаётся Openverse — агрегатор фото со свободными лицензиями (Flickr,
// музеи, Викисклад). Ключ не нужен, фильтр «разрешено коммерческое
// использование» встроен в запрос, а лицензия и автор приходят
// машиночитаемыми — без этого публиковать чужой кадр нельзя.
//
// ⛔ Цепочка появилась 04.09.2026, и причина — не красота, а доступность.
// В тот день Openverse перестал отвечать: сначала таймауты на каждом запросе,
// потом обрыв TLS. Подборщик честно вернул «без кадра» по обеим заметкам дня,
// и гейт ленты их не пропустил — «нет своего снимка». Один источник означает,
// что выпуск ленты падает вместе с ним.
//
// Порядок внутри цепочки продуман, и он НЕ «от красивого к скучному»:
//   1) Openverse — самый широкий охват свободных лицензий;
//   2) Викисклад — знает названные места. Заметке нужен ИМЕННО Ринджани, а не
//      обобщённый вулкан: подстановка похожего места — это тот же класс ошибки,
//      что карта вместо рифа и автомобиль Jaguar вместо зверя;
//   3) Pixabay — красивые обобщённые кадры (океан, самолёт, документы) на темы,
//      где у первых двух только скучная институциональная съёмка.
//
// ⛔ Unsplash в цепочку не берём, и это не про вкус. Лицензия у него щедрая, но
// правила программного доступа требуют показывать кадр С ИХ серверов и прямо
// запрещают постоянное хранение копии у себя. У нас картинка скачивается,
// ужимается и живёт в репозитории — ради скорости, вида и независимости от
// чужого домена на каждом показе страницы. У Pixabay требование ОБРАТНОЕ:
// постоянный хотлинк запрещён, копию держать у себя нужно, — оно совпадает с
// тем, как сайт устроен. Проверено по живым документам 04.09.2026.
//
// Порядок лицензий не случаен: сначала те, что не требуют ничего (cc0, pdm),
// потом простая атрибуция (by), и только потом by-sa. ShareAlike тянет за собой
// требования к производному материалу, и связываться с ним ради иллюстрации к
// новости незачем.
//
// Если стоки ничего не дали — заметка не остаётся без картинки: сработает
// подбор из своего архива (src/data/news-images.js). Лучше свой кадр с честной
// подписью, чем пустая карточка, которую не возьмут ни Дзен, ни Discover.

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { homedir } from 'node:os';

const UA = 'traveltribe-news/1.0 (https://traveltribe.ru)';
const API = 'https://api.openverse.org/v1/images/';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const PIXABAY_API = 'https://pixabay.com/api/';

// Чем выше в списке, тем меньше обязательств. Значения — как их отдаёт Openverse.
const LICENSE_RANK = { cc0: 0, pdm: 1, by: 2, pixabay: 2, 'by-sa': 3 };

const LICENSE_LABEL = {
  cc0: 'CC0', pdm: 'общественное достояние',
  by: 'CC BY', 'by-sa': 'CC BY-SA',
  pixabay: 'лицензия Pixabay',
};

const LICENSE_URL = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  pdm: 'https://creativecommons.org/publicdomain/mark/1.0/',
  pixabay: 'https://pixabay.com/service/license-summary/',
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

// Служебные слова из названий на стоках: они не говорят, ЧТО на кадре.
const NOISE = new Set(['file', 'jpg', 'jpeg', 'png', 'img', 'dsc', 'the', 'a', 'of', 'in', 'on',
  'at', 'and', 'national', 'park', 'parque', 'nacional', 'cropped', 'banner', 'panorama', 'view']);

// Кадры про занятие человека, а не про место: на них крупным планом узнаваемые
// люди. Чужие лица на своём сайте не размещаем, да и к новости про плату за вход
// нужен вид парка, а не чей-то велопоход. Не запрет, а отодвигание в конец.
const PEOPLE = /\b(cycl|bike|biking|hik|trek|climb|selfie|portrait|wedding|tourist|people|man|woman|girl|boy|kids?|children)/i;

/** Сколько в названии слов сверх самого запроса. Меньше — кадр ближе к теме. */
export function extraWords(title, query) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const asked = new Set(norm(query));
  const extra = norm(title).filter((w) => w.length > 2 && !asked.has(w) && !NOISE.has(w) && !/^\d+$/.test(w)).length;
  return extra + (PEOPLE.test(title) ? 3 : 0);
}

/**
 * Ответ источника. `reachable: false` означает «источник не отвечает», и это НЕ
 * то же самое, что «источник ничего не нашёл».
 *
 * ⛔ Разница стоит минут. Формулировок запроса у заметки до девяти, и если
 * лежащий источник возвращать пустым списком, цепочка честно спросит его девять
 * раз подряд и на каждой заплатит полный таймаут. 04.09.2026 прогон по трём
 * заметкам не закончился за десять минут именно так. Один отказ — источник
 * считается мёртвым до конца заметки, остальные формулировки к нему не идут.
 */
const answer = (hits, reachable = true) => ({ hits, reachable });

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
    if (!res.ok) return answer([], false);
    const json = await res.json();
    return answer(json.results ?? []);
  } catch {
    return answer([], false);
  } finally {
    clearTimeout(t);
  }
}

/** Голый текст из HTML-поля Викисклада: там автор приходит ссылкой с разметкой. */
const plain = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

/**
 * Лицензия Викисклада к нашим ключам. Принимаем ТОЛЬКО то, что разрешает
 * коммерческое использование: CC0, общественное достояние и CC BY / CC BY-SA.
 * ⛔ Всё остальное — отказ, а не «наверное можно». NC запрещает коммерческое
 * использование, ND запрещает переработку (мы кадр ужимаем, это переработка),
 * а GFDL без парной CC тянет требование прикладывать текст лицензии к странице.
 * Неизвестную строку тоже отбиваем: угадывать права на чужую фотографию нельзя.
 */
export function commonsLicense(shortName) {
  const s = plain(shortName).toLowerCase();
  if (!s) return null;
  if (/\bnc\b|noncommercial|\bnd\b|noderiv|fair use|non-free/.test(s)) return null;
  if (/^cc0|\bcc0\b|zero/.test(s)) return 'cc0';
  if (/public domain|^pd[-\s]|\bpd\b/.test(s)) return 'pdm';
  if (/cc[\s-]?by[\s-]?sa/.test(s)) return 'by-sa';
  if (/cc[\s-]?by/.test(s)) return 'by';
  return null;
}

/**
 * Викисклад. Нужен там, где у заметки НАЗВАННОЕ место: он знает конкретные
 * горы, водопады и парки поимённо, а обобщённые стоки — нет.
 */
async function searchCommons(q, { timeoutMs = 25000 } = {}) {
  const u = new URL(COMMONS_API);
  u.searchParams.set('action', 'query');
  u.searchParams.set('generator', 'search');
  u.searchParams.set('gsrsearch', `filetype:bitmap ${q}`);
  u.searchParams.set('gsrnamespace', '6');
  u.searchParams.set('gsrlimit', '12');
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size|extmetadata');
  u.searchParams.set('iiurlwidth', '1920');
  u.searchParams.set('format', 'json');
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(u, { headers: { 'User-Agent': UA }, signal: ac.signal });
    if (!res.ok) return answer([], false);
    const json = await res.json();
    return answer(Object.values(json.query?.pages ?? {}).flatMap((p) => {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) return [];
      const meta = ii.extmetadata ?? {};
      const license = commonsLicense(meta.LicenseShortName?.value);
      if (!license) return [];
      return [{
        url: ii.thumburl || ii.url,
        title: String(p.title ?? '').replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' '),
        creator: plain(meta.Artist?.value) || 'без указания автора',
        license,
        licenseLabel: LICENSE_LABEL[license],
        licenseUrl: plain(meta.LicenseUrl?.value) || LICENSE_URL[license] || '',
        source: ii.descriptionurl || ii.url,
        width: ii.width ?? 0,
      }];
    }));
  } catch {
    return answer([], false);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ключ Pixabay. Лежит рядом с остальными секретами, в репозиторий не попадает
 * и в строку команды не выносится. Нет ключа — источник молча пропускается:
 * цепочка обязана работать и без него.
 */
export function pixabayKey(env = process.env) {
  if (env.PIXABAY_API_KEY) return env.PIXABAY_API_KEY.trim();
  try {
    const file = readFileSync(join(homedir(), '.config/tt/secrets.env'), 'utf8');
    const m = file.match(/^\s*(?:export\s+)?PIXABAY_API_KEY\s*=\s*["']?([^"'\n\r]+)/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Pixabay. Последний в цепочке и по делу: он силён на обобщённых сюжетах
 * (океан, самолёт, документы), где Викисклад отдаёт институциональную скукоту,
 * и слаб на точных именах мест. Атрибуции лицензия не требует, но подпись автора
 * мы ставим всё равно — как и всем остальным.
 */
/**
 * Порог детализации ДЛЯ PIXABAY. Там среди «фотографий» попадается рисованное:
 * замер 04.09.2026 по 24 кадрам из четырёх запросов дал один рисунок —
 * трёхмерное табло вылетов — и он же оказался единственным с низкой
 * детализацией: 5,29 против 6,58–7,86 у всех остальных, настоящих.
 *
 * ⛔ Порог живёт отдельно от общего (2,5) и НЕ переносится на другие источники.
 * Причина в каноне блога: у честного ночного кадра детализация падала до 4,97,
 * то есть ниже этого самого рисунка. Общий порог поднимать нельзя — вылетит
 * ночная съёмка названного места. У Pixabay же он безопасен: туда цепочка ходит
 * за обобщённым сюжетом, кандидатов там десятки, и отказ стоит следующего кадра,
 * а не пустой заметки.
 *
 * ⛔ Число выведено на 24 кадрах. Это отправная точка, а не доказанная
 * константа: если живой прогон начнёт выбрасывать нормальные тёмные кадры,
 * порог двигать по новому замеру, а не по одному случаю.
 */
export const PIXABAY_ENTROPY_FLOOR = 6;

async function searchPixabay(q, { timeoutMs = 25000, key = pixabayKey() } = {}) {
  if (!key) return answer([]);
  const u = new URL(PIXABAY_API);
  u.searchParams.set('key', key);
  u.searchParams.set('q', q);
  u.searchParams.set('image_type', 'photo');
  u.searchParams.set('safesearch', 'true');
  u.searchParams.set('per_page', '12');
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(u, { headers: { 'User-Agent': UA }, signal: ac.signal });
    if (!res.ok) return answer([], false);
    const json = await res.json();
    return answer((json.hits ?? []).map((h) => ({
      // Теги — единственное описание кадра у Pixabay; по ним же работает отсев
      // «это карта, а не фотография» и подсчёт лишних слов.
      url: h.largeImageURL || h.webformatURL,
      title: String(h.tags ?? '').replace(/,/g, ' '),
      creator: h.user || 'без указания автора',
      license: 'pixabay',
      licenseLabel: LICENSE_LABEL.pixabay,
      licenseUrl: LICENSE_URL.pixabay,
      source: h.pageURL,
      width: h.imageWidth ?? 0,
      minEntropy: PIXABAY_ENTROPY_FLOOR,
    })));
  } catch {
    return answer([], false);
  } finally {
    clearTimeout(t);
  }
}

/** Openverse в общем виде: те же поля, что у остальных источников. */
async function searchOpenverse(q, { wide = true } = {}) {
  const res = await search(q, { wide });
  if (!res.reachable) return res;
  return answer(res.hits
    .filter((x) => x.url && x.license in LICENSE_RANK)
    .map((x) => ({
      url: x.url,
      title: x.title ?? '',
      creator: x.creator ?? 'без указания автора',
      license: x.license,
      licenseLabel: LICENSE_LABEL[x.license] ?? x.license.toUpperCase(),
      licenseUrl: x.license_url ?? LICENSE_URL[x.license] ?? '',
      source: x.foreign_landing_url ?? x.url,
      width: x.width ?? 0,
    })));
}

/**
 * Источники по порядку. Openverse ходит дважды — с фильтром широкого кадра и
 * без него: по редким сюжетам широкого кадра может не быть вовсе.
 */
export const SOURCES = [
  { name: 'Openverse', find: async (q) => {
    const wide = await searchOpenverse(q, { wide: true });
    // Источник не отвечает — второй заход бессмысленен, он упрётся в тот же таймаут.
    if (!wide.reachable || wide.hits.length) return wide;
    return searchOpenverse(q, { wide: false });
  } },
  { name: 'Викисклад', find: (q) => searchCommons(q) },
  { name: 'Pixabay', find: (q) => searchPixabay(q) },
];

/**
 * Запрос называет конкретное место или вид? Признак — заглавная буква:
 * запросы к стокам пишутся по-английски строчными, и заглавная в них означает
 * имя собственное. «Mount Rinjani Lombok» называет, «airport departure board» нет.
 *
 * ⛔ Нужно это ровно для одного решения — какой источник спрашивать раньше.
 * Названное место идёт на Викисклад: он знает поимённо конкретные горы и
 * водопады, а красивый сток отдаёт обобщённый вулкан, и подстановка похожего
 * места — тот же класс ошибки, что карта вместо рифа. Обобщённая тема
 * (аэропорт, океан, документы) идёт на Pixabay: у Викисклада на неё лежит
 * институциональная съёмка, которую читать не хочется.
 */
export function namesAPlace(query) {
  return /(^|\s)[A-ZА-ЯЁ][\wа-яё-]*/u.test(String(query ?? ''));
}

/** Порядок источников под конкретный запрос. Первым всегда самый широкий охват. */
export function sourcesFor(query) {
  const byName = (n) => SOURCES.find((s) => s.name === n);
  const rest = namesAPlace(query)
    ? [byName('Викисклад'), byName('Pixabay')]
    : [byName('Pixabay'), byName('Викисклад')];
  return [byName('Openverse'), ...rest].filter(Boolean);
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
  // ⛔ Источник перебирается ВНЕШНИМ циклом, запрос — внутренним. Порядок важен:
  // сначала надо исчерпать все формулировки на первом источнике и только потом
  // идти ко второму. Наоборот — значит по короткому обрубку запроса уйти на
  // Pixabay за обобщённым кадром, когда точный по полному запросу лежал на
  // Викискладе.
  // Порядок источников решает ГЛАВНЫЙ запрос заметки, а не её обрубки: у
  // коротких хвостов имя собственное часто теряется, и по ним цепочка ушла бы
  // не туда.
  for (const src of sourcesFor(queries[0])) {
    for (const q of queries) {
      const res = await src.find(q);
      // Источник лёг — уходим к следующему, не перебирая на нём формулировки.
      if (!res.reachable) break;
      let hits = res.hits.filter((x) => x.url && (x.width ?? 0) >= 1200);
      // ⛔ Раньше отбор шёл ЧИСТО по лицензии, и это ставило рядом с заметкой
      // случайный кадр: к плате за вход в Торрес-дель-Пайне встал зелёный
      // попугай, снятый в том же парке, — у него была лицензия посвободнее.
      //
      // Сток помечает тегом парка всё, что в парке снято: пуму, гуанако, овец,
      // карту, велосипедиста. Отличить кадр ПРО место от кадра, где место лишь
      // упомянуто, помогает название: у первого кроме самого места в названии
      // почти ничего нет, у второго — латинское имя вида и ещё полстроки.
      // Поэтому сначала «лишних слов в названии меньше», и только потом
      // лицензия и порядок выдачи.
      // Отсев по названию до скачивания: не тратим сеть на карты и автомобили.
      hits = hits.filter((x) => !titleRejection(x.title ?? ''));
      hits = hits
        .map((x, i) => ({ x, i, extra: extraWords(x.title ?? '', q) }))
        .sort((a, b) => (a.extra - b.extra)
          || (LICENSE_RANK[a.x.license] - LICENSE_RANK[b.x.license])
          || (a.i - b.i))
        .map((p) => p.x);
      if (hits.length) {
        // Возвращаем несколько кандидатов: часть ссылок в агрегаторе мертва
        // (источник удалил файл), и на 404 надо брать следующего, а не падать.
        return hits.slice(0, 5).map((x) => ({ ...x, query: q, source_name: src.name }));
      }
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

// ── Это вообще фотография, и та ли? ─────────────────────────────────────────
//
// Проверка «свой снимок» у гейта смотрит ТОЛЬКО на то, что файл есть. 03.08.2026
// это пропустило подряд четыре промаха: карту атолла вместо фотографии рифа,
// аквариумную дораду вместо тропической рыбы, автомобиль Jaguar E-Type вместо
// зверя и чёрного ягуара в вольере вместо обычного на воле. Каждый раз ловил
// человек глазами, а робот считал, что всё хорошо.
//
// Два слоя. Первый — по названию: сток отдаёт пустые теги, но название почти
// всегда честное («Jaguar E-Type», «Alif Dhaal Atoll», «Flags of France»).
// Второй — по самим пикселям, и он ловит то, чего в названии нет.

const NOT_A_PHOTO = /\b(maps?|mapa|karte|карт[аыу]|flags?|флаг\w*|coat of arms|герб\w*|logos?|логотип\w*|diagrams?|charts?|schemes?|схем\w*|blueprints?|drawings?|рисун\w+|paintings?|картин\w+|engravings?|гравюр\w*|sketch(es)?|posters?|плакат\w*|icons?|banknotes?|coins?|postage stamp|screenshots?|скриншот\w*)\b/i;

// Не тот предмет. У стока «jaguar» — это чаще автомобиль, чем зверь.
const WRONG_THING = /\b(e-type|xke|xjs|roadster|coupe|convertible|sedan|automobile|car show|motorcycle|locomotive|aircraft|jersey|football|fc\b)/i;

// Зверь в неволе — не то же, что зверь в природе, и читатель разницу видит.
const CAPTIVE = /\b(zoo|zoological|aquarium|аквариум|captive|enclosure|вольер|terrarium|safari park|circus|museum|музей|taxidermy|чучело|skeleton|skull|specimen|statue|sculpture|скульптура|monument|памятник|model|макет|replica)\b/i;

/** Отказ по названию кадра или null, если название не подозрительное. */
export function titleRejection(title = '') {
  if (NOT_A_PHOTO.test(title)) return 'это не фотография, а схема или рисунок';
  if (WRONG_THING.test(title)) return 'это другой предмет, а не природа';
  if (CAPTIVE.test(title)) return 'снято в неволе, в музее или это макет';
  return null;
}

/**
 * Три числа, по которым фотография отличается от схемы. Замер 03.08.2026 на
 * заведомо годных и заведомо плохих кадрах:
 *
 *   годные фотографии            заливки 0.24–0.67   белое 0.00–0.04
 *   карта атолла                 заливки 0.92        белое 0.88
 *   флаги (три разных)           заливки 0.65–0.83   белое 0.00–0.48
 *
 * Белое разделяет группы начисто, заливки — внахлёст. Первый порог по заливкам
 * я поставил 0.60 по трём кадрам и на большей выборке сразу поймал ложное
 * срабатывание: настоящее фото полога леса даёт 0.67, потому что кадр весь
 * зелёный. Порог поднят до 0.80 — карты и флаги остаются за ним, однотонные
 * фотографии проходят. Пропущенное здесь добирает отсев по названию.
 */
export async function photoStats(sharpModule, buf) {
  const { data, info } = await sharpModule(buf)
    .resize(96, 96, { fit: 'inside' }).removeAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const buckets = new Map();
  let nearWhite = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
    if (Math.min(r, g, b) > 235) nearWhite++;
  }
  const top8 = [...buckets.values()].sort((a, b) => b - a).slice(0, 8).reduce((s, v) => s + v, 0);
  return { flatShare: top8 / n, nearWhite: nearWhite / n };
}

/** Отказ по пикселям или null. */
export function statsRejection({ flatShare, nearWhite }) {
  if (nearWhite > 0.20) return `это схема на белом листе (${Math.round(nearWhite * 100)}% кадра белые)`;
  if (flatShare > 0.80) return `это схема или флаг (${Math.round(flatShare * 100)}% кадра — сплошные заливки)`;
  return null;
}

/**
 * Скачивает кадр в src/content/news/_images/<slug>.jpg.
 *
 * Оригинал со стока весит около полумегабайта. Заметок 2–4 в день, и через год
 * это полгигабайта в истории репозитория — история не чистится, вес останется
 * навсегда. Поэтому кадр ужимаем сразу: 1600px по широкой стороне с запасом
 * перекрывает требование Discover (не меньше 1200px), а сборка всё равно делает
 * из него webp нужных размеров.
 */
export async function downloadPhoto(photo, slug, root = process.cwd()) {
  const res = await fetch(photo.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`фото не скачалось: ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  if (raw.length < 20_000) throw new Error('файл подозрительно мал, это не фотография');

  let buf = raw;
  try {
    const sharp = (await import('sharp')).default;
    const src = sharp(raw).rotate();
    // ⛔ Ширину в описании сток обещает по оригиналу, а отдать может файл меньше:
    // по «alpine ibex» пришёл кадр 1024px при заявленных 1200+. Дзен и Discover
    // такой не возьмут, поэтому меряем сам файл и уходим к следующему кандидату.
    const { width = 0, height = 0 } = await src.metadata();
    if (width < 1200) throw new Error(`кадр узкий: ${width}px при нужных 1200`);
    // Схему, флаг и карту отличаем по самим пикселям — в названии этого может
    // не быть вовсе («Alif Dhaal Atoll» — карта, а по имени не догадаешься).
    const bad = statsRejection(await photoStats(sharp, raw));
    if (bad) throw new Error(`кадр узкий: ${bad}`);
    // Отсев рисованного там, где его много. Порог приходит от источника: у
    // Pixabay он свой, у остальных его нет вовсе — см. PIXABAY_ENTROPY_FLOOR.
    if (photo.minEntropy) {
      const { entropy } = await src.stats();
      if (entropy < photo.minEntropy) {
        throw new Error(`кадр узкий: рисунок, а не фотография (детализация ${entropy.toFixed(2)} при пороге ${photo.minEntropy})`);
      }
    }
    // Баннерные обрезки с Викисклада приходят полосой 7:1 — в карточке ленты от
    // такой остаётся щель. Держим кадр в разумных пропорциях, от вертикального
    // 3:4 до широкого 21:9.
    const ratio = height ? width / height : 0;
    if (ratio > 2.4 || ratio < 0.75) {
      throw new Error(`кадр узкий: пропорции ${width}×${height}, это полоса, а не фотография`);
    }
    buf = await src
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    // Узкий кадр — отказ, пусть возьмут следующего. Всё остальное (нет sharp,
    // битый декодер) не повод терять заметку: кладём как скачали.
    if (/кадр узкий/.test(e.message)) throw e;
  }

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

/** Вписывает строки картинки в конец фронтматтера, не трогая остальное. */
export function insertPhotoFrontmatter(raw, lines) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error('нет frontmatter');
  const fm = m[1].replace(/\s+$/, '');
  return raw.replace(m[0], `---\n${fm}\n${lines.join('\n')}\n---\n`);
}

// ── Запуск ───────────────────────────────────────────────────────────────────
//
// ⛔ Этого шага долго не было вовсе: робот честно писал `photoQuery`, а искать по
// нему кадр было некому — заметки уходили в ленту без своего снимка и получали
// запасной кадр из архива по теме, один и тот же у соседей. Отсюда и взялись три
// одинаковые картинки подряд.
//
// Скрипт не роняет прогон: заметку без кадра отбракует гейт проверкой «свой
// снимок», и лучше потерять одну заметку, чем весь день.

const isMain = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
if (isMain) {
  const root = process.cwd();
  const dir = join(root, 'src/content/news');
  const { parseNote } = await import('./news-gate.mjs');
  let done = 0, skipped = 0, failed = 0;

  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const slug = basename(f, '.md');
    const abs = join(dir, f);
    const raw = readFileSync(abs, 'utf8');
    let note;
    try { note = parseNote(raw, slug); } catch { continue; }
    if (note.data.image) { skipped++; continue; }

    const got = await fetchFirstWorking(note.data, slug, root);
    if (!got) {
      failed++;
      console.log(`  без кадра  ${f} — ни один из источников (${SOURCES.map((s) => s.name).join(', ')}) `
        + `не дал кадра по запросу «${note.data.photoQuery ?? fallbackQuery(note.data)}»`
        + (pixabayKey() ? '' : '; ключа Pixabay нет, этот источник пропущен'));
      continue;
    }
    // Подпись для незрячих — по-русски. `photoQuery` и название файла на стоке
    // английские, в alt русскоязычного сайта им не место.
    const alt = note.data.imageAlt || note.data.title;
    writeFileSync(abs, insertPhotoFrontmatter(raw, frontmatterLines(got.photo, got.rel, alt)));
    done++;
    // Источник печатаем всегда: по нему видно, работала ли цепочка и почему
    // кадр оказался обобщённым, а не про названное место.
    console.log(`  кадр       ${f} — ${got.photo.source_name ?? 'сток'}, ${got.photo.licenseLabel}, ${got.photo.creator}, ${Math.round(got.bytes / 1024)} КБ`);
  }
  console.log(`\nнайдено кадров ${done}, уже были ${skipped}, без кадра ${failed}`);
}
