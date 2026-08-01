// Картинка к заметке ленты /novosti/.
//
// ЗАЧЕМ. Изначально заметки были типографскими, без изображений — из осторожности
// с авторскими правами. Цена решения оказалась выше, чем виделась: наш же
// dzen-rss.xml.js требует `enclosure` с картинкой, Discover требует ≥1200px, а по
// замерам 2026 страницы с текстом И изображением И структурными элементами
// отбираются в ИИ-выдачу заметно чаще чисто текстовых. Заметка без картинки
// отрезана от обеих лент.
//
// ОТКУДА КАРТИНКИ. Только свои, уже лежащие в репозитории. Робот работает на
// раннере, доступа к архиву нет, а тянуть чужие фото из интернета нельзя —
// это чужие права. Поэтому подбираем из того, что снято самим: сначала по стране
// заметки, потом по теме. Ни одного нового файла, ни одного чужого.
//
// Если однажды к заметке приложат конкретный кадр — поле `image` во фронтматтере
// перебивает подбор.

const COVERS = import.meta.glob('/src/content/blog/_images/*/cover.{jpg,jpeg,png}', { eager: true });

/** '/src/content/blog/_images/chile/cover.jpg' → 'chile' */
const slugOf = (path) => path.split('/').at(-2);

const BY_SLUG = Object.fromEntries(
  Object.entries(COVERS).map(([path, mod]) => [slugOf(path), mod.default])
);

// Страна заметки не всегда совпадает с именем папки: направлений на сайте больше,
// чем отснятых стран. Здесь только то, что реально проверено глазами по кадру.
const COUNTRY_ALIAS = {
  argentina: 'patagonia',
  ecuador: 'galapagos',
  greece: 'schengen',
  jordan: 'egypt',
  nepal: 'kamchatka',
  namibia: 'kenya',
  'south-africa': 'kenya',
  tanzania: 'kenya',
  botswana: 'kenya',
  peru: 'peru',
  bolivia: 'bolivia',
};

// Запас по теме, когда страна не подошла. Порядок выбран по кадрам, а не по
// алфавиту: сначала обобщённые виды (саванна на закате, лес с озером), потом
// конкретика. Змея из Амазонии рядом с заметкой про австралийского нумбата
// выглядит стоковой подстановкой — такие кадры годятся, только когда заметка
// действительно про это место.
const BY_TOPIC = {
  nature: ['kenya', 'karelia', 'galapagos', 'kamchatka', 'amazonia', 'australia',
           'bolivia', 'peru', 'antarctica', 'sri-lanka'],
  transport: ['patagonia', 'karelia', 'japan', 'antarctica', 'georgia', 'armenia',
              'morocco', 'cappadocia', 'china', 'vietnam'],
  visa: ['schengen', 'turkey', 'georgia', 'uae', 'thailand', 'egypt', 'china',
         'vietnam', 'armenia', 'azerbaijan'],
};

// Запас нарочно широкий. С двумя кадрами на тему три заметки подряд неизбежно
// получают повтор, и лента выглядит сломанной — именно это Никита и увидел.
// Несуществующие папки отфильтруются сами, лишние имена вреда не делают.

/**
 * Подбирает картинку: сначала по стране заметки, потом по теме.
 * Возвращает объект astro:assets (или undefined, если в репозитории пусто).
 */
export function pickNewsImage(data, slug = '', index = 0) {
  if (data.image) return data.image;

  for (const c of data.countries ?? []) {
    const key = COUNTRY_ALIAS[c] ?? c;
    if (BY_SLUG[key]) return BY_SLUG[key];
  }

  // Разные заметки одной темы обязаны получить РАЗНЫЕ кадры. Раньше запас
  // отдавал всем первый подходящий, и две соседние заметки про природу шли с
  // одинаковой картинкой подряд — лента выглядела сломанной. Выбираем по хешу
  // слага: стабильно между сборками (эталоны не плывут) и различно между
  // заметками.
  // К хешу слага подмешиваем позицию в ленте: хеш сам по себе даёт коллизии
  // (две заметки подряд получили один кадр), а сдвиг на индекс гарантирует, что
  // СОСЕДНИЕ заметки различаются всегда, пока в запасе больше одного кадра.
  const pool = (BY_TOPIC[data.topic] ?? []).filter((k) => BY_SLUG[k]);
  if (pool.length) return BY_SLUG[pool[(hash(slug) + index) % pool.length]];

  const all = Object.values(BY_SLUG);
  return all.length ? all[(hash(slug) + index) % all.length] : undefined;
}

/** Мелкий стабильный хеш строки: нужен только для равномерного выбора из списка. */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Подпись под картинкой: честно говорим, что кадр из архива, а не с места события. */
export function newsImageNote(data) {
  return data.image ? null : 'Фото из архива блога, иллюстрация к теме';
}
