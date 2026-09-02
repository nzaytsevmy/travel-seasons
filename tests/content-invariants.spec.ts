import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { видимыйТекст } from './visible-text';
import { fileURLToPath } from 'node:url';
import { buildQueue } from '../scripts/revision-queue.mjs';

// Инвариант-гейт по СБОРКЕ (dist/): ловит КЛАССЫ багов на ЛЮБОМ посте, в т.ч. вне
// PAGES-списка скриншот-гейта. Без baseline — чистые assert'ы.
// Появился после аудита 2026-06-07: новые pillar-посты (kamchatka/thailand/vietnam/…)
// не входили в visual PAGES → проскочили «от чаще в составе тура», двойное «от от»,
// и остаточная видимая метка «реклама» возле партнёрских ссылок.

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function allHtml(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...allHtml(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = allHtml(DIST);

/** Открывающие теги <a>, содержащие фрагмент адреса.
 *
 * Не вырезаем <script> регулярным выражением: такой фильтр уже пропускал
 * вложенные/регистровые варианты и получил два замечания CodeQL. Здесь ищем
 * сам фрагмент и убеждаемся, что он находится внутри открывающего тега ссылки.
 */
function ссылкиСФрагментом(html: string, фрагмент: string): string[] {
  const lower = html.toLowerCase();
  const needle = фрагмент.toLowerCase();
  const found = new Set<string>();
  let from = 0;
  while (from < lower.length) {
    const at = lower.indexOf(needle, from);
    if (at === -1) break;
    const start = lower.lastIndexOf('<', at);
    const end = start === -1 ? -1 : lower.indexOf('>', start);
    const scriptOpen = lower.lastIndexOf('<script', start);
    const scriptClose = lower.lastIndexOf('</script', start);
    if (start !== -1 && end > at && scriptOpen <= scriptClose) {
      const tag = html.slice(start, end + 1);
      if (/^<a(?:\s|>)/i.test(tag) && /\bhref\s*=/i.test(tag)) found.add(tag);
    }
    from = at + needle.length;
  }
  return [...found];
}

/** Стили лежат отдельными файлами — приметы дизайна живут там же, где вёрстка. */
function allCss(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...allCss(p));
    else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

// Исходники статей блога — часть правил проверяется по .md/.mdx, а не по вёрстке:
// даты во фронтматтере в собранный HTML не попадают.
const BLOG_SRC = fileURLToPath(new URL('../src/content/blog', import.meta.url));
const blogSources = () =>
  readdirSync(BLOG_SRC)
    .filter((n) => /\.mdx?$/.test(n))
    .map((n) => join(BLOG_SRC, n));

// Какие статьи тронуты в этом заходе — общая мерка для всех проверок текста ниже.
//
// ⛔ «Тронута» — это изменился ТЕКСТ или факты, а не любой байт файла.
// 17.08.2026 сокращение описаний под выдачу задело 27 статей одной служебной
// строкой в шапке, и проверки потребовали заодно вычистить слова-паразиты в
// пятнадцати статьях, а проверка свежести — заново сверить факты во всех
// двадцати семи. Пересверка уже проверенного стоит дня работы и ничего не даёт,
// а гейт, который краснеет от правки поискового описания, начинают обходить.
// Поэтому правка одной шапочной строки статью не «трогает»: текст тот же.
const REPO = join(DIST, '..');

const gitLines = (...args: string[]): string[] => {
  try {
    return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
      .split('\n').map((x: string) => x.trim())
      .filter((x: string) => /^src\/content\/blog\/[^/]+\.mdx?$/.test(x));
  } catch {
    return [];
  }
};

/** То, что человек читает как текст: заголовок и тело.
 *  ⛔ Шапка целиком служебная: теги, обложка, даты, журнал сверок и описание
 *  правятся без единого слова в прозе. Пока сравнивался весь файл, слияние
 *  тегов в 15 статьях покрасило языковой гейт требованием чистить «просто»
 *  и «уже» в текстах, которых правка не касалась. Гейт, краснеющий от
 *  служебной строки, начинают обходить — поэтому «тронуто» = изменилась проза. */
const meaningful = (src: string) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return src;
  const [, fm, body] = m;
  const title = (fm.match(/^title:.*$/m) ?? [''])[0];
  return `${title}\n${body}`;
};

function touchedPosts(): string[] {
  const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
  const all = [...new Set([
    ...gitLines('ls-files', '--others', '--exclude-standard', '--', 'src/content/blog'),
    ...gitLines('diff', '--name-only', '--', 'src/content/blog'),
    ...gitLines('diff', '--name-only', '--staged', '--', 'src/content/blog'),
    ...gitLines('diff', '--name-only', `${base}...HEAD`, '--', 'src/content/blog'),
    ...gitLines('diff', '--name-only', 'HEAD~1', 'HEAD', '--', 'src/content/blog'),
  ])];
  return all.filter((rel) => {
    const abs = join(REPO, rel);
    if (!existsSync(abs)) return true;
    let was: string;
    try {
      was = execFileSync('git', ['show', `${base}:${rel}`],
        { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      return true;   // в основе такой статьи нет — значит новая, проверяем целиком
    }
    return meaningful(was) !== meaningful(readFileSync(abs, 'utf8'));
  });
}

// Инварианты зависят только от сборки, не от вьюпорта — один прогон достаточно.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'build-output инвариант — один прогон');
});

/* ⛔ Слои примет ИИ и стоп-слов — ОДИН список на весь прогон.
   Раньше они жили внутри проверки статей, и до главной, хабов и
   программных страниц не доставали вовсе: 28.08.2026 оказалось, что
   ни одна страница вне блога на приметы не смотрится. Держим их на
   уровне файла, чтобы вторая проверка брала ровно те же слова, а не
   свою копию, которая разойдётся при первой же правке. */

const PARASITES = ['просто', 'очень', 'достаточно', 'ведь'];
// ⛔ «Уже» — не паразит, а служебное слово со смыслом «раньше, чем ожидалось»
// (решение Никиты 14.08.2026). Нулевой порог дважды остановил живые фразы в
// статье про двадцать направлений — «про эту бумагу узнают уже в аэропорту»,
// «перелёт добирают уже на месте», — и обе замены вышли суше оригинала.
// Синонима у слова нет, поэтому вместо запрета — лимит на статью: одиночное
// употребление осмысленно, три подряд это уже вода.
const SOFT = { 'уже': 2 };
const CLICHES = [
  'как показывает практика', 'согласно исследованиям', 'эксперты сходятся',
  'трудно переоценить', 'в заключение', 'подводя итог',
];
const OFFICE = ['осуществляется', 'посредством', 'в рамках', 'является одним из'];
// Слой «рекламного травел-тона» — из редакционного документа Википедии
// «Signs of AI writing» (WikiProject AI Cleanup, ~15 000 слов наблюдений).
// Их примета номер один: машинный текст сползает в тон рекламного
// травел-гайда — пустые восторги вместо фактов. Наш жанр — эпицентр риска.
// Слои из редакционного документа Википедии «Signs of AI writing» (16
// категорий, ~15 000 слов наблюдений проекта чистки машинных правок),
// переведённые на русские аналоги. Замер 28.08.2026 по всем 75 статьям:
// жёсткие слои дают 6 вхождений на 4 старые статьи — стоп-лист Никиты
// уже выжег почти всё, массового красного не будет.
// Тире и долю жирного НЕ меряем осознанно: русская типографика с « — »
// (медиана 32 на 1000 слов) и жирные ключи — наш канон, не примета;
// мера с ложными тревогами хуже отсутствия меры.
const AD_TONE = [ // пышность рекламного травел-тона
  'жемчужина', 'в самом сердце', 'затерянн', 'захватывает дух', 'захватывающий дух',
  'обязателен к посещению', 'обязательно к посещению', 'настоящий рай',
  'настоящая сокровищница', 'богатое наследие', 'богатая палитра', 'яркая культура',
  'незабываем', 'уникальная атмосфера', 'поражает воображение',
  'калейдоскоп', 'изюминка', 'уютно расположивш', 'симфония вкус', 'гобелен',
];
const SIGNIF = [ // раздутая значимость
  'является свидетельством', 'служит свидетельством', 'знаковый момент',
  'поворотный момент', 'играет ключевую роль', 'играет важную роль',
  'подчёркивает важность', 'подчёркивает значимость', 'оставляет неизгладим',
  'неотъемлемая часть', 'непреходящ', 'служит напоминанием',
];
const AI_VOCAB = [ // словарь генераторов
  'многогранн', 'замысловат', 'скрупулёзн', 'окунуться в атмосферу',
  'погрузиться в атмосферу', 'динамично развивающ', 'широкий спектр',
  'богатый выбор', 'выступает в качестве', 'представляет собой',
];
const VAGUE_SRC = [ // ссылка в никуда: «эксперты» без имени
  'по мнению экспертов', 'специалисты отмечают', 'наблюдатели отмечают',
  'как отмечают исследователи', 'отраслевые издания',
];
const WATER = [ // вводные-вода и «современный мир»
  'стоит отметить', 'важно отметить', 'следует отметить', 'важно понимать',
  'нельзя не отметить', 'в современном мире', 'в эпоху цифров', 'в наше время',
  'важно учитывать', 'важно помнить', 'в итоге,',
];
// Деепричастные хвосты-анализ («…, подчёркивая значимость») — мягко:
// живые употребления бывают, лимит на статью. «Сказочн» тоже мягко: живое
// слово при снеге и льде (Рускеала зимой), примета — только россыпью.
// «Не только … но и» — формула-параллелизм из полного чтения вики-документа;
// живой максимум по блогу — 2 на статью (замер 28.08.2026), россыпь — примета.
// «Стоит помнить» — живое одно («стоит помнить и про таможенный порог»),
// жёсткий запрет дал бы ложную тревогу.
const SOFT_TAILS = { 'подчёркивая': 1, 'демонстрируя': 1, 'символизируя': 1,
  'сказочн': 1, 'не только': 2, 'стоит помнить': 1 };
// ⛔ Имена собственные и чужая речь — не приметы. Разбор 28.08.2026: все
//    шесть найденных на сайте вхождений оказались легитимными — «Восточная
//    жемчужина» это телебашня в Шанхае, «симфония камней» — базальтовые
//    скалы в Армении, «дух захватывает» — цитата посетительницы с указанным
//    источником. Поэтому перед подсчётом вычитаем известные имена и
//    вырезаем длинные цитаты в «ёлочках»: чужой голос вправе быть пышным.
const PROPER_NAMES = ['восточная жемчужина', 'симфония камней'];
const безЦитатИИмён = (t: string) => {
  let out = t.replace(/«[^»]{20,500}»/g, '«…»');
  // ⛔ Без регистра: «Восточная жемчужина» с большой буквы не вычиталась
  //    строгим сравнением — всплыло 29.08.2026, когда гейт расширили на блог.
  for (const имя of PROPER_NAMES) out = out.replace(new RegExp(имя, 'gi'), '');
  return out;
};

test('dist собран (html-файлы есть)', () => {
  expect(files.length).toBeGreaterThan(100);
});

test('Брендовый обзор не приписывает себе форумы и личную поездку', () => {
  const html = readFileSync(join(DIST, 'blog', 'sletat-ru-2026', 'index.html'), 'utf8');
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? '';

  expect(main).not.toContain('форумам туристов');
  expect(main).not.toContain('Лично эту визу/маршрут');
  expect(main).toContain('анонимные отзывы не использовались как доказательство');
});

test('FlightRoutes: «от» только перед ценой (нет «от <текст>» и «от от»)', () => {
  // prefix-span «от» + <strong>значение</strong>; значение ОБЯЗАНО начинаться с цифры.
  const re = /fr-price-prefix[^>]*>от<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/g;
  const bad: { file: string; value: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const val = m[1].trim();
      if (!/^[0-9]/.test(val)) bad.push({ file: f.replace(DIST, ''), value: val });
    }
  }
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

// Из редакционного канона первичек (12.08.2026, раздел в SEO-CHECKLIST-2026.md).
// Правило BBC-дат, адаптация: вечнозелёная статья с «вчера»/«на днях» начинает
// врать через неделю после публикации. Лента новостей живёт по своим датам и
// исключена. Замер перед вводом гейта: на 66 статьях блога — 0 вхождений.
test('Вечнозелёность: в статьях блога нет относительных дат', () => {
  // JS \b не знает кириллицы (кириллица не входит в \w) — границы вручную.
  const RE = /(^|[\s>«"(—-])(вчера|позавчера|на днях|на этой неделе|на прошлой неделе|в прошлом месяце)(?=$|[\s<».,!?:;)"])/i;
  const bad: string[] = [];
  for (const f of files) {
    if (!f.includes('/blog/') || f.includes('/tag/') || /blog\/(index|\d+)\.html$/.test(f)) continue;
    const html = readFileSync(f, 'utf8');
    const main = html.match(/<article[\s>][\s\S]*?<\/article>/i)?.[0] ?? '';
    const text = main.replace(/<[^>]+>/g, ' ');
    const m = text.match(RE);
    if (m) bad.push(`${f.replace(DIST, '')} — «${m[0]}»`);
  }
  expect(bad.slice(0, 10), bad.join('\n')).toEqual([]);
});

// Асессоры Google: преувеличенный заголовок = Low, «крайне» преувеличенный = Lowest
// (QRG §4.0/§5.2). Проверяем title всех страниц блога.
// Дата «обновлено» в шапке двигается при ЛЮБОЙ правке, а факты пересверяют реже —
// и статья начинает обещать свежесть, которой нет. Замер 12.08.2026: у 20 статей
// разрыв дошёл до 95 дней (виза в Японию: «обновлено 12 августа», факты — от 9 мая).
// Яндекс называет такое обманом ожиданий, асессоры Google запрещают высокие оценки
// при устаревших датозависимых фактах. Порог 100 дней — не идеал, а работающая
// граница: на момент ввода за ней не было никого, значит гейт ловит НОВЫЕ разрывы,
// а не красит легаси (5 статей с разрывом 69–88 дней разбираются отдельной ревизией).
test('Свежесть: «обновлено» не убегает от даты проверки фактов больше чем на 100 дней', () => {
  const MON: Record<string, number> = { января:1, февраля:2, марта:3, апреля:4, мая:5, июня:6,
    июля:7, августа:8, сентября:9, октября:10, ноября:11, декабря:12 };
  const bad: string[] = [];
  for (const f of blogSources()) {
    const src = readFileSync(f, 'utf8');
    const up = src.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})/m);
    if (!up) continue;
    // берём САМУЮ ПОЗДНЮЮ дату проверки: у статьи их может быть несколько
    // («первая публикация» + «пересверка»), и ранняя дала бы ложную тревогу.
    const dates: number[] = [];
    const re = /(?:Актуально на:?|[Пп]ересверка|проверял[а]?(?: по первоисточникам)?)\s*(\d{1,2})\s+([а-яё]+)\s+(20\d\d)/g;
    for (const m of src.matchAll(re)) {
      const mon = MON[m[2]];
      if (mon) dates.push(Date.UTC(Number(m[3]), mon - 1, Number(m[1])));
    }
    if (!dates.length) continue;
    const checked = Math.max(...dates);
    const updated = Date.parse(up[1] + 'T00:00:00Z');
    const gap = Math.round((updated - checked) / 864e5);
    if (gap > 100) bad.push(`${f.split('/').pop()} — обновлено ${up[1]}, факты старше на ${gap} дн.`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Навигация: строка «ещё по направлению» — до трёх ссылок, без дублей и самоссылок', () => {
  // Строка ставится под капсулой-ответом и должна оставаться короткой: она
  // стоит в начале чтения, длинный список там крадёт внимание у ответа.
  // ⚠️ Ищем по элементу, а не по началу атрибута: сборщик срезает кавычки И
  // меняет порядок атрибутов — регулярка «<nav class=country-row» уже один раз
  // насчитала 5 строк вместо 46.
  const RE = /<nav[^>]*\bcountry-row\b[^>]*>([\s\S]*?)<\/nav>/;
  const LINK = /href="?(\/[^"\s>]+)"?\s*>/g;
  const bad: string[] = [];
  for (const f of files) {
    if (!f.includes('/blog/') || f.includes('/tag/') || /blog\/(index|\d+)\.html$/.test(f)) continue;
    const m = readFileSync(f, 'utf8').match(RE);
    if (!m) continue;
    const page = f.replace(DIST, '').replace(/index\.html$/, '');
    const hrefs = [...m[1].matchAll(LINK)].map((x) => x[1]);
    if (!hrefs.length) bad.push(`${page} — строка есть, ссылок нет`);
    if (hrefs.length > 3) bad.push(`${page} — ${hrefs.length} ссылок, максимум 3`);
    if (new Set(hrefs).size !== hrefs.length) bad.push(`${page} — дубль внутри строки`);
    if (hrefs.includes(page)) bad.push(`${page} — ссылка на саму себя`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Деньги: рублёвая конвертация не расходится с валютой на порядок', () => {
  // Курсы ЦБ на 13.08.2026 — база сравнения. Полоса широкая (±40%): курс со
  // временем уходит, задача гейта — ловить опечатку и потерянный ноль, а не
  // требовать ежедневной переоценки.
  // Курсы ЦБ на 13.08.2026. S$ добавлен 14.08: без него «S$30» читалось как
  // доллар США, и сходилось только за счёт широкой полосы.
  const RATE: Record<string, number> = { $: 82.9977, '€': 95.7793, AUD: 58.6047, 'S$': 64.8065 };
  // ⚠️ Число НЕ должно перескакивать строку: первая версия проверки включала
  // \s в цифры и склеила «$50» последней строкой списка с «≈ 200 000 ₽» итога
  // строкой ниже — ложная тревога. Пробелы разрешены только внутри строки.
  const re = /(S\$|\$|€|AUD ?)\s?([\d  ]+(?:[–-][\d  ]+)?)[^≈₽\n]{0,40}≈\s?([\d  ]+(?:[–-][\d  ]+)?)\s*(тыс\.\s*)?₽/g;
  const num = (s: string) => Number(s.replace(/[  ]/g, ''));
  const bad: string[] = [];
  for (const f of blogSources()) {
    for (const m of readFileSync(f, 'utf8').matchAll(re)) {
      const rate = RATE[m[1].trim()] ?? RATE.$;
      const src = m[2].split(/[–-]/).filter((x: string) => x.trim()).map(num);
      const dst = m[3].split(/[–-]/).filter((x: string) => x.trim()).map(num);
      if (src.length !== dst.length) continue;
      const mult = m[4] ? 1000 : 1;
      src.forEach((a: number, i: number) => {
        const got = dst[i] * mult;
        const exp = a * rate;
        if (Math.abs(got - exp) / exp > 0.4)
          bad.push(`${f.split('/').pop()} — ${m[1]}${a} указано как ${got} ₽, по курсу ≈${Math.round(exp)} ₽`);
      });
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Заголовки: без «!!!», капс-криков и шок-слов', () => {
  const bad: string[] = [];
  // Аббревиатуры капсом легитимны; страницы меток берут имя метки как есть.
  const ABBR = /^(ЮНЕСКО|ЕАЭС|АСЕАН|НАТО)$/;
  for (const f of files) {
    if (!f.includes('/blog/') || f.includes('/tag/')) continue;
    const html = readFileSync(f, 'utf8');
    const title = html.match(/<title>([^<]*)/i)?.[1] ?? '';
    const caps = (title.match(/[А-ЯЁ]{5,}/g) ?? []).filter((w) => !ABBR.test(w));
    if (/!{2,}/.test(title) || /(ШОК|СЕНСАЦИЯ|ВЫ НЕ ПОВЕРИТЕ)/i.test(title) || caps.length) {
      bad.push(`${f.replace(DIST, '')} — «${title}»`);
    }
  }
  expect(bad.slice(0, 10), bad.join('\n')).toEqual([]);
});

test('Партнёрские ссылки: нет видимой метки «реклама» (юр-страницы исключены)', () => {
  // A: элемент .ad-mark/.adm/-disc с текстом «реклам…»; B: маркер «реклама ·».
  // /legal/ исключаем — там «реклама/рекламы» легитимны в прозе (38-ФЗ, оферта).
  const reAdMark = /class="[^"]*(?:ad-mark|adm|cta-disc)[^"]*"[^>]*>\s*реклам/i;
  const reMarker = /реклама\s*[·•]/i;
  const bad: { file: string; hit: string }[] = [];
  for (const f of files) {
    if (f.includes('/legal/')) continue;
    const html = readFileSync(f, 'utf8');
    const a = html.match(reAdMark);
    if (a) bad.push({ file: f.replace(DIST, ''), hit: a[0].slice(0, 60) });
    const b = html.match(reMarker);
    if (b) bad.push({ file: f.replace(DIST, ''), hit: b[0].slice(0, 60) });
  }
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

test('Текст читателю: нет внутренних имён файлов кода в <code> (утечка реализации)', () => {
  // Читателю нельзя показывать исходники проекта (prices.json, regions.js, *.astro/*.mdx).
  // URL-пути (/altai/) и erid/rel="sponsored" сюда НЕ попадают (нет код-расширения).
  // Аудит 2026-06-07: на /about/ светилось <code>prices.json</code>.
  const re = /<code[^>]*>[^<]*\b[\w-]+\.(?:json|js|ts|astro|mdx|mjs|jsx|tsx)\b[^<]*<\/code>/gi;
  const bad: { file: string; hit: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) bad.push({ file: f.replace(DIST, ''), hit: m[0].slice(0, 80) });
  }
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

test('Партнёрские CTA: нет литеральной → в тексте .aff-cta (декор-стрелки в CTA запрещены каноном)', () => {
  // Канон 2026-07-06: стрелка в CTA запрещена вовсе (раньше её рисовал ::after — удалён).
  const re = /<a\b[^>]*class="[^"]*aff-cta[^"]*"[^>]*>([^<]*)<\/a>/gi;
  const bad: { file: string; text: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      if (m[1].includes('→')) bad.push({ file: f.replace(DIST, ''), text: m[1].trim().slice(0, 60) });
    }
  }
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

// Закрывающий тег по спецификации может нести пробелы и мусорные атрибуты:
// «</script >», «</script\t\n bar>» — всё это валидно, и парсер такое закроет.
// Регулярка, ждущая ровно «</script>», такой блок пропускает, и содержимое
// скрипта утекает в проверяемый текст: `localStorage` из разметки для
// поисковика начинает считаться жаргоном в тексте читателю.
// Ровно эта ловушка уже описана и закрыта в гейте новостей — здесь оставался
// наивный вариант, и на него указало сканирование кода GitHub.
// Внутри тега — [^<>], а не [^>]: иначе закрывающий тег проглатывает начало
// следующего скрипта («</script <script>»), первый блок съедает границу второго,
// и содержимое второго остаётся в «тексте читателю». Та же дыра была и в гейте
// новостей, чинилась одновременно. Повтор до неизменности — на случай, если
// удаление одного блока обнажило другой.
const SCRIPT_BLOCK = /<script\b[^<>]*>[\s\S]*?<\/script\b[^<>]*>/gi;
const stripScripts = (html: string) => {
  let out = html, prev;
  do { prev = out; out = out.replace(SCRIPT_BLOCK, ' '); } while (out !== prev);
  return out;
};

test('Язык: нет жаргона в тексте читателю (простые человеческие слова)', () => {
  // Решение Никиты 2026-07-10: «сложные слова» → человеческие. SEO-термины
  // (all-inclusive, e-Visa, VOA, топ-10) сознательно ОСТАВЛЕНЫ — это поисковые запросы.
  // «Реестр» и «бэкпекер» тоже оставлены осознанно (title/H1-мотив и название ценового уровня).
  // «релокация»/«геолокация»/«оптимизация» — нормальные слова, не путать с «локация»/«оптимально».
  const STOP = [
    /компаратор/i, /вайб/i, /справка-хаб/i, /one-way/i,
    /оптимальн/i, /\bоптимум/i, /(?<!ре)(?<!гео)локаци/i,
    /комьюнити/i, /must-(see|have)/i, /self-drive/i, /при наличии/i,
    /кросс-источников/i,
    // рунглиш и утечка реализации в текст читателю
    /\bкэш(?!ир)/i, /бэкенд/i, /localStorage/,
  ];
  const bad: { file: string; word: string; ctx: string }[] = [];
  for (const f of files) {
    const text = stripScripts(readFileSync(f, 'utf8'));
    for (const re of STOP) {
      const m = text.match(re);
      if (m) {
        const i = m.index ?? 0;
        bad.push({ file: f.replace(DIST, ''), word: m[0], ctx: text.slice(Math.max(0, i - 40), i + 40) });
      }
    }
  }
  expect(bad, JSON.stringify(bad.slice(0, 20), null, 2)).toEqual([]);
});

test('Канон: нет eyebrow-надписи непосредственно перед <h1>', () => {
  // Канон CLAUDE.md: eyebrow-кикеры над заголовками запрещены (выпилены 2026-07-06,
  // остатки семейства *-idx сняты 2026-07-10). Ловим <div class="...idx|eyebrow...">…</div>
  // прямо перед <h1> — именно так выглядели cp-idx / sl-idx / pmu-idx / bb-eyebrow.
  const re = /<div[^>]*class="[^"]*(?:\bidx\b|-idx|eyebrow)[^"]*"[^>]*>[\s\S]{0,200}?<\/div>\s*<h1/i;
  const bad: { file: string; hit: string }[] = [];
  for (const f of files) {
    const m = readFileSync(f, 'utf8').match(re);
    if (m) bad.push({ file: f.replace(DIST, ''), hit: m[0].slice(0, 90) });
  }
  expect(bad, JSON.stringify(bad.slice(0, 10), null, 2)).toEqual([]);
});

test('CTA-канон: ни одна ссылка/кнопка не заканчивается декоративной «→»', () => {
  // Решение Никиты 2026-07-06 («сайт не должен выглядеть сделанным ИИ»): хвостовая
  // стрелка в тексте <a>/<button> запрещена по всему сайту. Семантика не ловится этим
  // инвариантом: маршруты «Москва → HKT» стоят в середине текста, prev/next-навигация
  // месяцев («июль →») — единственное осознанное исключение, задаётся списком ниже.
  // Только prev/next-навигация месяцев: «август →». Явный список, а не /^[а-яё]+ →$/,
  // иначе гейт пропускал бы любое одно кириллическое слово со стрелкой («далее →»).
  const MONTHS_RU = 'январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь';
  const ALLOW = [new RegExp(`^(${MONTHS_RU}) →$`, 'i')];
  const re = /<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const bad: { file: string; text: string }[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!/→$/.test(text)) continue;
      if (ALLOW.some((a) => a.test(text))) continue;
      const key = text.slice(0, 80);
      if (seen.has(key)) continue; // дедуп по тексту — иначе тысячи повторов с шаблонных страниц
      seen.add(key);
      bad.push({ file: f.replace(DIST, ''), text: key });
    }
  }
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

// llms-full.txt — ПУБЛИЧНЫЙ файл, его читают ИИ-боты (GPTBot, ClaudeBot, PerplexityBot),
// и его содержимое попадает в ответы ассистентов. Генератор сваливал туда сырой
// frontmatter и MDX-потроха: пути к обложкам, импорты .astro-компонентов, имена
// хелперов партнёрки и sub_id. Это прямо против инварианта «никогда не светить
// читателю внутренние идентификаторы» (CLAUDE.md) — а скриншот-гейт и dist-проверки
// сюда не достают, поэтому утечка жила незамеченной. Аудит 2026-07-17.
test('llms-full.txt: нет внутренних идентификаторов (пути, импорты, frontmatter)', () => {
  // Гоняем генератор прямо здесь, а не читаем закоммиченный файл: иначе сломанный
  // gen-llms.mjs проходил бы тест, пока кто-то не соберёт проект (файл в репо
  // остался бы старым и чистым). Скрипт идемпотентен — он же крутится в prebuild.
  const root = fileURLToPath(new URL('../', import.meta.url));
  execFileSync(process.execPath, ['scripts/gen-llms.mjs'], { cwd: root, stdio: 'pipe' });
  const file = fileURLToPath(new URL('../public/llms-full.txt', import.meta.url));
  const text = readFileSync(file, 'utf8');
  const FORBIDDEN: { what: string; re: RegExp }[] = [
    { what: 'служебные поля frontmatter', re: /^(coverImage|coverPosition|coverPositionCard|sourceType|howto|qualityScore|volatileFacts):/m },
    { what: 'путь к исходникам картинок', re: /\.\/_images\//m },
    { what: 'имя .astro-компонента', re: /\.astro\b/m },
    { what: 'имя .mdx-исходника', re: /\.mdx\b/m },
    { what: 'MDX-импорт', re: /^import\s+.+\s+from\s+/m },
    { what: 'MDX-export (имена переменных и sub_id партнёрки)', re: /^export\s+const\s+/m },
    { what: 'путь к внутреннему модулю', re: /\.\.\/\.\.\/(components|data)\//m },
    // Не перечисляем компоненты поимённо: список устареет, новый виджет протечёт
    // молча. Ловим любой JSX-тег — в русской прозе «<» + латинская заглавная не
    // встречается, ложных срабатываний быть не должно.
    { what: 'имя JSX-компонента', re: /<[A-Z][A-Za-z0-9]*[\s/>]/m },
    // 29.08.2026: денежные врезки писались в статьях обычной вёрсткой
    // (<p>, <span class="cta-note">, <div class="editorial-cta">), а чистка знала
    // только про компоненты с заглавной и <a>. В публичный файл для ИИ-ботов
    // утекло 72 куска разметки и 60 обрывков встроенных картинок — вместе с
    // именами CSS-классов рекламных блоков.
    { what: 'сырая HTML-вёрстка', re: /<\/?(p|div|span|section|figure|figcaption|ul|ol|li|table|thead|tbody|tr|td|th|br|hr|em|strong|small|sup|sub|blockquote|details|summary)\b[^>]*>/m },
    { what: 'обрывок встроенной картинки', re: /<\/?(svg|g|text|tspan|path|rect|circle|ellipse|line|polyline|polygon|defs|clipPath|use)\b[^>]*>/m },
  ];
  const found = FORBIDDEN.filter(({ re }) => re.test(text)).map(({ what, re }) => ({
    what,
    пример: (text.match(re) || [''])[0].slice(0, 90),
    строк: (text.match(new RegExp(re.source, 'gm')) || []).length,
  }));
  expect(found, JSON.stringify(found, null, 2)).toEqual([]);
  expect(text.match(/[ \t]+$/gm) || [], 'генератор не оставляет пробелы в концах строк').toEqual([]);
});

// Вес hero-обложки — единственное, что реально предсказывает провал mobile Lighthouse.
// Замер 17.07.2026 (LCP-ресурс → perf): 277 КБ → 0.82 ✗ · 188 КБ → 0.81 ✗ ·
// 168 КБ → 0.88 · 137 КБ → 0.96 · 101 КБ → 0.95 · 67 КБ → 0.95. Граница провала
// лежит между 168 и 188 КБ; порог 150 КБ даёт запас.
//
// Ориентация обложки САМА ПО СЕБЕ не предсказывает: bolivia — портрет 1280x1920 и
// даёт 0.95, а zagranpasport — ландшафт и весит 137 КБ. Портрет лишь коррелирует,
// потому что несёт в 2.4 раза больше пикселей на ту же отрисованную ширину. Поэтому
// гейт меряет байты, а не aspect-ratio — иначе ловил бы здоровые посты и пропускал
// тяжёлый ландшафт.
//
// Зачем гейт: japan-guide падал в CI и ронял чужие PR, а vietnam-guide (0.82) не
// входит в lighthouserc.mobile.json — то есть просто не проходил планку молча.
test('hero-обложка: вес варианта под мобайл не выше 150 КБ (LCP)', () => {
  const MAX_KB = 150;
  // Какой вариант берёт браузер — не смоделировано, а СВЕРЕНО с Lighthouse 17.07.2026:
  // bolivia 960w=100КБ (намерено 101), vietnam 960w=277 (277), peru 960w=67 (67),
  // bali 960w=168 (168). То есть при sizes=100vw и вьюпорте 412 выбирается наименьший
  // вариант >= ~824px, а не >= 412*2.625. У japan варианта >=824 просто не было
  // (срcset «640w, 900w») → браузер брал весь портрет 900px = 188 КБ. Отсюда правило.
  const NEED_W = 412 * 2;
  const heavy: { page: string; kb: number; file: string; width: number }[] = [];
  const broken: { page: string; why: string }[] = [];
  for (const f of files) {
    if (!/\/blog\/[^/]+\/index\.html$/.test(f)) continue;
    if (f.includes('/tag/')) continue;
    const html = readFileSync(f, 'utf8');
    // Ищем hero-source ПОСЛЕ маркера post-cover, а не первый на странице: если
    // когда-нибудь выше обложки появится другой <picture>, гейт не должен молча
    // начать мерить чужую картинку. Сейчас (проверено по 51 странице) source один
    // и всегда в post-cover.
    const coverAt = html.indexOf('post-cover');
    if (coverAt < 0) continue; // страницы без hero (не пост) — не наш случай
    // HTML части страниц не минифицирован (astro-compress), поэтому кавычки у type
    // опциональны. У srcset кавычки есть всегда: значение содержит пробелы и запятые,
    // минификатор их убрать не может (проверено: 0 из 51 без кавычек).
    const src = html.slice(coverAt).match(/<source[^>]*type=["']?image\/webp["']?[^>]*>/i);
    if (!src) { broken.push({ page: f.replace(DIST, ''), why: 'у post-cover нет <source webp>' }); continue; }
    // Калибровка NEED_W верна только при sizes=100vw. Сменится sizes — гейт обязан
    // упасть и потребовать перекалибровки, а не тихо мерить не тот вариант.
    if (!/sizes=["']?100vw/i.test(src[0])) {
      broken.push({ page: f.replace(DIST, ''), why: 'sizes у hero не 100vw — перекалибруй NEED_W в этом тесте' }); continue;
    }
    const ss = src[0].match(/srcset=["']([^"']+)["']/i);
    if (!ss) { broken.push({ page: f.replace(DIST, ''), why: 'у hero-source нет srcset' }); continue; }
    // Берём только w-дескрипторы: случайный "2x" при parseInt дал бы width=2 и
    // сломал бы выбор варианта.
    const variants = [...ss[1].matchAll(/([^\s,]+)\s+(\d+)w/g)]
      .map((m) => ({ url: m[1], width: parseInt(m[2], 10) }))
      .sort((a, b) => a.width - b.width);
    if (!variants.length) { broken.push({ page: f.replace(DIST, ''), why: 'в srcset нет w-вариантов' }); continue; }
    const picked = variants.find((v) => v.width >= NEED_W) || variants[variants.length - 1];
    const asset = join(DIST, picked.url.replace(/^\//, ''));
    // Битый путь = LCP-ресурса нет. Это провал гейта, а не повод молча пропустить.
    if (!existsSync(asset)) { broken.push({ page: f.replace(DIST, ''), why: `файл из srcset не существует: ${picked.url}` }); continue; }
    const kb = statSync(asset).size / 1024;
    if (kb > MAX_KB) {
      heavy.push({ page: f.replace(DIST, ''), kb: Math.round(kb), file: picked.url.split('/').pop()!, width: picked.width });
    }
  }
  expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
  expect(heavy, JSON.stringify(heavy, null, 2)).toEqual([]);
});

test('Аналитика: window.ym никто не перехватывает (счётчик и цели живы)', () => {
  // 30.07.2026 на проде window.ym не существовало вовсе (hasOwnProperty === false),
  // хотя tag.js грузился. Обработчик исходящих ссылок защищён проверкой
  // `"function" == typeof window.ym`, поэтому единственная цель сайта не срабатывала
  // ни разу. Причина — интеграция partytown с forward:['ym',…]: она подменяет
  // window.ym пересылкой в Web Worker, куда аналитику намеренно НЕ выносили
  // (Вебвизору нужен DOM, это записано в комментарии самого Layout.astro).
  // Скриптов type="text/partytown" в репозитории ноль, то есть воркер грузился впустую.
  // Ищем именно подключение, а не слово: в Layout.astro осталось упоминание в
  // комментарии, и оно безвредно.
  const RE = /~partytown|type=["']?text\/partytown|partytown-sw\.js|partytown-sandbox/i;
  const bad = files.filter((f) => RE.test(readFileSync(f, 'utf8')));
  expect(bad.slice(0, 5), `partytown подключён на ${bad.length} стр. — он перехватывает window.ym`).toEqual([]);
});

test('Аналитика: клик в Telegram шлёт свою цель, но канал не метится как рекламный', () => {
  // 31.07.2026 живой прогон на проде: клик по ссылке t.me не порождал НИ ОДНОЙ цели —
  // главный канал возврата был невидим в статистике. Очевидный ход (дописать 't.me'
  // в AFF) не годится: тот же список метит ссылки rel="sponsored" в _refLinksNewTab,
  // а свой канал не рекламная ссылка. Поэтому отдельный список и отдельная цель.
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const moduleCode = [...home.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/gi)]
    .map((match) => join(DIST, match[1].replace(/^\//, '')))
    .filter(existsSync)
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  expect(`${home}\n${moduleCode}`, 'нет цели на клик в Telegram').toContain('telegram_click');
  const affList = home.match(/AFF\s*=\s*\[[^\]]*\]/)?.[0] ?? '';
  expect(affList, 't.me попал в AFF — ссылки на свой канал получат rel=sponsored').not.toContain('t.me');
  const ownLinks = ссылкиСФрагментом(home, 't.me');
  expect(ownLinks.length, 'на главной нет ссылки на свой Telegram').toBeGreaterThan(0);
  expect(ownLinks.filter((link) => /\brel=["'][^"']*sponsored/i.test(link))).toEqual([]);
});

test('Аналитика: инлайн-снипет создаёт очередь window.ym до загрузки tag.js', () => {
  // Без стаба ym(…, 'init', …) на строке ниже падает, и счётчик не инициализируется.
  const home = join(DIST, 'index.html');
  const html = readFileSync(home, 'utf8');
  // Минификатор переименовывает аргументы, поэтому ищем форму, а не буквы:
  // t[c]=t[c]||function(){(t[c].a=t[c].a||[]).push(arguments)}
  expect(html).toMatch(/(\w)\[(\w)\]=\1\[\2\]\|\|function\(\)\{\(\1\[\2\]\.a=\1\[\2\]\.a\|\|\[\]\)\.push/);
  expect(html).toContain('mc.yandex.ru/metrika/tag.js');
});

const unescapeAmp = (s: string) => s.replace(/&amp;|&#x26;|&#38;/gi, '&');

test('Атрибуция: у каждой партнёрской ссылки есть метка страницы (иначе клик обезличен)', () => {
  // Аудит 03.08.2026: у Airalo метка живёт ВНУТРИ sharedID после подчёркивания и на всех
  // 31 ссылке хвост был пустым (`sharedID=546042_`) — клики засчитывались, но опознать
  // страницу-источник было нельзя. Та же дыра нашлась ещё у семи партнёров через голый
  // TP_LINKS.*. Тест ловит КЛАСС бага на всём dist, а не конкретные страницы.
  //
  // Исключения — только там, где метку физически выдаёт партнёр, а не мы:
  //   platipomiru — своя CPA-ссылка без sub_id и без erid (erid ждём от партнёра).
  //
  // ⛔ g2afse (YouTravel) из общего исключения выведен 20.08.2026. Это главная
  // денежная кнопка дорогих направлений (средний чек около 100 000 ₽), и она
  // висела вообще без метки: понять, какая страница принесла заказ, было нельзя.
  // Метка у этой сети своя — `sub1` вместо `sub_id`, поэтому проверяется
  // отдельным правилом ниже.
  //
  const SKIP = /platipomiru\.com/;
  const bad: { file: string; href: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/gi)) {
      // Астро кодирует «&» и как &amp;, и как &#x26; — раскодировать надо оба,
      // иначе тест объявляет обезличенными ссылки, у которых метка на месте.
      const href = unescapeAmp(m[1]);
      if (!/tpk\.mx|pxf\.io|aviasales\.ru\/\?|g2afse\.com/.test(href)) continue;
      if (SKIP.test(href)) continue;
      const rel = f.replace(DIST, '');
      const labelled = /pxf\.io/.test(href)
        ? /sharedID=546042_[a-z0-9_]+/.test(href)   // хвост после «_» обязан быть непустым
        : /g2afse\.com/.test(href)
          ? /[?&]sub1=[a-z0-9_]+/.test(href)        // Affise: своя метка, sub1
          : /[?&]sub_id=[a-z0-9_]+/.test(href);
      if (!labelled) bad.push({ file: rel, href: href.slice(0, 110) });
    }
  }
  expect(bad.slice(0, 15), `ссылок без метки страницы: ${bad.length}\n` +
    JSON.stringify(bad.slice(0, 15), null, 2)).toEqual([]);
});

test('Атрибуция: у deep-link метка стоит ДО адреса назначения (иначе теряется)', () => {
  // tpk.mx читает свои параметры до &u=; всё, что после, уезжает партнёру как часть URL.
  const bad: { file: string; href: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/href="([^"]*tpk\.mx[^"]*)"/gi)) {
      const href = unescapeAmp(m[1]);
      if (!href.includes('&u=') || !href.includes('sub_id=')) continue;
      if (href.indexOf('sub_id=') > href.indexOf('&u=')) {
        bad.push({ file: f.replace(DIST, ''), href: href.slice(0, 110) });
      }
    }
  }
  expect(bad.slice(0, 15), JSON.stringify(bad.slice(0, 15), null, 2)).toEqual([]);
});

test('Партнёрские шортлинки на страницах совпадают с рабочим списком', () => {
  // 03.08.2026 партнёрка сменила шортлинк страховки, и в кабинете значился уже
  // новый. В проекте остался старый: он ещё отвечал, но 37 ссылок на 27 страницах
  // вели через адрес, которого у партнёра в списке нет. Такое не видно, пока не
  // пропадут деньги, и никакая проверка это не ловила — ссылки были вписаны
  // руками мимо общего списка.
  //
  // Правило: каждый партнёрский шортлинк на собранном сайте обязан встречаться
  // в единой точке. Хочешь новый адрес — меняешь его там, а не на странице.
  const src = readFileSync(fileURLToPath(new URL('../src/data/affiliate.js', import.meta.url)), 'utf8');
  const known = new Set([...src.matchAll(/https:\/\/([a-z0-9]+)\.tpk\.mx\/([A-Za-z0-9]+)/g)]
    .map((m) => `${m[1]}/${m[2]}`));
  expect(known.size, 'в едином списке не нашлось ни одного шортлинка — сломан разбор').toBeGreaterThan(5);

  const bad = new Map<string, string>();
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/https:\/\/([a-z0-9]+)\.tpk\.mx\/([A-Za-z0-9]+)/g)) {
      const key = `${m[1]}/${m[2]}`;
      if (!known.has(key)) bad.set(key, f.replace(DIST, ''));
    }
  }
  expect([...bad], `шортлинки со страниц, которых нет в едином списке:\n` +
    [...bad].map(([k, f]) => `  ${k}  (${f})`).join('\n')).toEqual([]);
});

// ─── Сторож: данные, подставленные в скрипт, не должны разрывать страницу ───
//
// На страницах карты, калькулятора и сравнения наши данные подставляются прямо
// внутрь тега <script>. Если в такое значение когда-нибудь попадёт текст с
// последовательностью «</script», браузер закроет скрипт раньше времени, и всё
// после неё станет разметкой — то есть чужой текст превратится в код страницы.
//
// Сейчас туда идут только наши собственные данные (точки на карте, цены, названия
// месяцев), и разрыва нет — проверено по всем 2354 страницам сборки. Сторож стоит
// на будущее: робот новостей каждый день тащит на сайт чужой текст, и однажды
// кто-то соединит одно с другим, не подумав. Ровно эта дыра описана у движка
// (XSS в define:vars через неполную очистку «</script>»), и она единственная из
// девяти оставшихся, чью возможность мы реально используем.
//
// Оракул простой и не зависит от версии движка: на исправной странице число
// открывающих тегов скрипта равно числу закрывающих. Разрыв ломает это равенство
// — закрывашка из данных закрывает настоящий скрипт, а настоящая остаётся лишней.
test('Скрипты: данные не разрывают страницу (нет лишних закрывающих тегов)', () => {
  const broken: { file: string; open: number; close: number }[] = [];
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    const open = (t.match(/<script\b/gi) || []).length;
    const close = (t.match(/<\/script\b/gi) || []).length;
    if (open !== close) broken.push({ file: f.replace(DIST, ''), open, close });
  }
  expect(broken, `страницы, где скрипт разорван:\n${broken.slice(0, 10)
    .map((b) => `  ${b.file}: открытий ${b.open}, закрытий ${b.close}`).join('\n')}`).toEqual([]);
});

// ─── Сторож: статья кластера получает блок своего направления, а не общий ───
//
// Блок «Спланировать поездку» ведёт из статьи в чек-лист сборов, визовую страницу,
// хаб направления и калькулятор — то есть в узлы, где человек и конвертится.
// Направление статьи определялось условием «пост стоит ПЕРВЫМ в списке кластера».
// Из-за этого 13 статей, стоящих в списке вторыми и ниже, получали общий блок
// «Куда дальше» и теряли ещё и список соседей по теме: у страницы про загранпаспорт
// в Абхазию оказалось 15 внутренних ссылок против 27 у соседней статьи того же
// кластера. Замер 04.08.2026 по собранному сайту.
//
// ⛔ Чинить бланкетно нельзя: 9 статей (оплата за границей, eSIM, «сколько стоит
// неделя») входят сразу в несколько кластеров, и страновой блок был бы для них
// враньём — им общий блок положен по делу. Поэтому правило: своё направление у
// статьи есть, если она первая в кластере ЛИБО входит ровно в один кластер.
test('Кластер: статья одного направления ведёт в его чек-лист и визу, а не в общий блок', async () => {
  const { RELATED_POSTS } = await import('../src/data/related-posts.js');
  const where: Record<string, string[]> = {};
  const firstOf = new Set<string>();
  for (const [dir, posts] of Object.entries(RELATED_POSTS as Record<string, { slug: string }[]>)) {
    if (posts[0]) firstOf.add(posts[0].slug);
    for (const p of posts) (where[p.slug] ??= []).push(dir);
  }
  // однозначные: не первые, но живут ровно в одном кластере
  const shouldHaveOwnBlock = Object.entries(where)
    .filter(([slug, dirs]) => dirs.length === 1 && !firstOf.has(slug))
    .map(([slug, dirs]) => ({ slug, dir: dirs[0] }));

  const bad: string[] = [];
  for (const { slug, dir } of shouldHaveOwnBlock) {
    const f = join(DIST, 'blog', slug, 'index.html');
    if (!existsSync(f)) continue;
    const t = readFileSync(f, 'utf8');
    if (!t.includes(`/packing/${dir}/`) || !t.includes(`/visa/${dir}/`)) {
      bad.push(`${slug} → ожидался блок направления ${dir}`);
    }
  }
  expect(bad, `статьи с общим блоком вместо своего:\n${bad.join('\n')}`).toEqual([]);
});

// ─── Сторож: в машинную разметку не должны утекать неподставленные выражения ───
//
// Вопросы и ответы для разметки FAQPage собираются из ИСХОДНОГО текста статьи,
// а не из собранной страницы. Поэтому выражение вида {price} в ответе на вопрос
// на странице подставится, а в разметку уедет дословно — и поисковик получит
// «{tbsCheapMonth}» вместо цены. Поймано 04.08.2026 при переводе цен на живую
// выгрузку: на странице было «ноябрь 2026, 24 364 ₽», в разметке — сырые скобки.
//
// Проверяем всю машинную разметку целиком: цена таких утечек высокая, а стоит
// проверка ничего.
test('Разметка: в JSON-LD не утекли неподставленные выражения из исходника', () => {
  const bad: string[] = [];
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script/gi)) {
      // ⛔ Проверяем только ТЕКСТОВЫЕ поля. В адресах фигурные скобки законны:
      // «?q={search_term_string}» — штатная заглушка поиска по сайту из schema.org,
      // и она обязана быть дословной. Первая версия сторожа падала на ней на 2354
      // страницах — сначала проверил сторожа, потом уже поверил.
      for (const v of m[1].matchAll(/"(?:text|name|headline|description)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
        const leak = v[1].match(/\{[a-zA-Z_$][\w$]*(\([^)]*\))?\}/);
        if (leak) bad.push(`${f.replace(DIST, '')}: ${leak[0]}`);
      }
    }
  }
  expect(bad, `неподставленные выражения в разметке:\n${bad.slice(0, 10).join('\n')}`).toEqual([]);
});

// ─── Раздел новостей: у заметки есть свой адрес, и он ровно один ───
//
// До 10.08.2026 заметка была пунктом ленты без собственного адреса: двадцать
// заметок жили по трём адресам, и раздел за 30 дней набрал в Google ноль
// показов — ранжироваться было нечему. Теперь у каждой заметки своя страница;
// эти два сторожа следят, чтобы связка не развалилась молча.
test('Новости: у каждой заметки есть своя страница, и лента на неё ссылается', () => {
  const feed = join(DIST, 'novosti/index.html');
  expect(existsSync(feed), 'ленты новостей нет в сборке').toBe(true);
  const html = readFileSync(feed, 'utf8');

  const slugs = readdirSync(join(DIST, '..', 'src/content/news'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  expect(slugs.length).toBeGreaterThan(0);

  const noPage = slugs.filter((s) => !existsSync(join(DIST, 'novosti', s, 'index.html')));
  expect(noPage, `заметки без своей страницы:\n${noPage.join('\n')}`).toEqual([]);

  // Хотя бы одна ссылка с ленты в заметки должна быть — иначе страницы сироты.
  // Сжатый HTML идёт одной строкой и без кавычек, поэтому ищем без них тоже.
  const linked = slugs.filter((s) => new RegExp(`href="?/novosti/${s}/`).test(html));
  expect(linked.length, 'лента не ссылается ни на одну заметку').toBeGreaterThan(0);
});

test('Новости: текст заметки объявлен статьёй только на своей странице', () => {
  const listings = [join(DIST, 'novosti/index.html'),
                    ...readdirSync(join(DIST, 'novosti'), { withFileTypes: true })
                      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}$/.test(e.name))
                      .map((e) => join(DIST, 'novosti', e.name, 'index.html'))];
  const bad = listings.filter((f) => existsSync(f) && readFileSync(f, 'utf8').includes('"NewsArticle"'));
  expect(bad, `NewsArticle на листинге (должен быть только на странице заметки):\n${bad.join('\n')}`).toEqual([]);
});

// ── Стандарт иллюстраций (решение Никиты 11.08.2026) ────────────────────────
//
// Ревизия блога в тот день: 64 статьи, медиана — ТРИ картинки на двенадцать
// разделов, то есть обложка, аватар автора и одна иллюстрация на весь текст.
// У самой посещаемой статьи было двадцать разделов и три картинки. Для темы
// «куда поехать» это закрытый канал: по таким запросам заметная доля переходов
// приходит из поиска по картинкам, а сплошная простыня текста хуже удерживает.
//
// Гейт намеренно проверяет ТОЛЬКО статьи, тронутые в этом заходе. Если включить
// его на весь блог сразу, красными станут пятьдесят статей и гейт начнут
// обходить — планка держится тем, что её нельзя нарушить в своей же правке.
// Тот же приём, что у гейта новостей после остановки ленты 09.08.2026.
test('Паспорт статьи: новая статья не выходит без замера спроса и адверсарной проверки', () => {
  // Решение Никиты 13.08.2026: канон семантики — критичный, а не желательный.
  // Тема без замера спроса и статья без второй пары глаз не публикуются.
  // Машина не может оценить «десять из десяти для человека» — она проверяет
  // следы того, что работа сделана: замер спроса записан, дата разбора
  // проставлена, иллюстраций хватает (отдельный гейт ниже).
  //
  // ⛔ Только НОВЫЕ статьи: датой отсечки взят день ввода правила. Старые 67
  // паспорта не имеют и красить их нельзя — гейт, красящий легаси, обходят.
  const RULE_FROM = Date.parse('2026-08-13T00:00:00Z');
  const root = join(DIST, '..');
  const touched = touchedPosts();

  const bad: string[] = [];
  for (const rel of touched) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const fm = src.split('---')[1] ?? '';
    const pub = fm.match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    if (!pub || Date.parse(pub + 'T00:00:00Z') < RULE_FROM) continue;  // старая статья
    if (!/^demand:\s*\S/m.test(fm)) {
      bad.push(`${rel}: нет замера спроса (поле demand: «сколько запросов, чем и когда мерили»)`);
    }
    if (!/^reviewed:\s*\d{4}-\d{2}-\d{2}/m.test(fm)) {
      bad.push(`${rel}: нет даты адверсарной проверки фактов (поле reviewed)`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Честный потолок: у тронутой статьи заполнены все оси qualityScore', () => {
  const required = ['topic', 'facts', 'visuals', 'experience', 'internalLinks', 'legal', 'overall'];
  const bad: string[] = [];
  for (const rel of touchedPosts()) {
    const abs = join(REPO, rel);
    if (!existsSync(abs)) continue;
    const fm = readFileSync(abs, 'utf8').split('---')[1] ?? '';
    const block = fm.match(/^qualityScore:\s*\n((?:\s{2}\S.*\n?)*)/m)?.[1];
    if (!block) {
      bad.push(`${rel}: нет qualityScore — оценка не должна появляться только после вопроса владельца`);
      continue;
    }
    for (const key of required) {
      const raw = block.match(new RegExp(`^  ${key}:\\s*(\\d+(?:\\.\\d+)?)\\s*$`, 'm'))?.[1];
      const score = Number(raw);
      if (!raw || !Number.isFinite(score) || score < 0 || score > 10) {
        bad.push(`${rel}: qualityScore.${key} должен быть числом от 0 до 10`);
      }
    }
    const ceiling = block.match(/^  ceiling:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim() ?? '';
    if (ceiling.length < 20) bad.push(`${rel}: qualityScore.ceiling не объясняет, чего не хватает до 10/10`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Изменчивые факты: у цены и прогноза есть срок пересмотра и fallback', () => {
  const bad: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const rel of touchedPosts()) {
    const abs = join(REPO, rel);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const [, fm = '', body = ''] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
    if (!/(?:\d[\d\s ]*\s?₽|прогноз(?:а|е|ом)?\s+20\d{2})/i.test(body)) continue;

    const ids = [...fm.matchAll(/^\s{2}- id:\s*["']?([^"'\n]+)["']?\s*$/gm)].map((m) => m[1]);
    const checked = [...fm.matchAll(/^\s{4}checkedAt:\s*(\d{4}-\d{2}-\d{2})\s*$/gm)].map((m) => m[1]);
    const review = [...fm.matchAll(/^\s{4}reviewAfter:\s*(\d{4}-\d{2}-\d{2})\s*$/gm)].map((m) => m[1]);
    const fallback = [...fm.matchAll(/^\s{4}fallback:\s*["']([^"']{20,})["']\s*$/gm)].map((m) => m[1]);
    if (!ids.length || ids.length !== checked.length || ids.length !== review.length || ids.length !== fallback.length) {
      bad.push(`${rel}: volatileFacts должны содержать id, checkedAt, reviewAfter и содержательный fallback`);
      continue;
    }
    for (let i = 0; i < ids.length; i++) {
      if (review[i] <= checked[i]) bad.push(`${rel}: ${ids[i]} пересматривается не позже даты проверки`);
      if (review[i] < today) bad.push(`${rel}: ${ids[i]} просрочен ${review[i]} — примените fallback или пересверьте факт`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/**
 * Храповик качества.
 *
 * Замер 19.08.2026 показал закономерность: там, где гейт проверяет КАЖДУЮ статью
 * (паспорт, иллюстрации), нарушений ноль; там, где только тронутые в заходе
 * (журнал сверок, язык), нарушают семь из десяти — 51 и 57 статей из 71. Правило
 * без сплошной проверки не соблюдается, это устройство проверки, а не лень авторов.
 *
 * Но и сплошной гейт «ноль везде» не годится: он покрасит полсотни статей разом,
 * а такие гейты обходят, а не чинят (проверено 13.08.2026 на стоп-листе слов).
 *
 * Отсюда храповик: считаем нарушителей по ВСЕМ статьям и сравниваем с записанным
 * числом. Стало больше — падение с именами новых нарушителей. Стало меньше —
 * зелено и подсказка опустить планку. Старое чинится ревизиями, новое не
 * добавляется. ⛔ Число в замере поднимать вручную нельзя: это маскировка
 * регресса, и в заявке такая правка видна отдельной строкой.
 */
test('Качество: храповик — нарушителей не становится больше', () => {
  const baseline = JSON.parse(readFileSync(join(REPO, 'tests/quality-baseline.json'), 'utf8'));
  const posts = readdirSync(join(REPO, 'src/content/blog'))
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  const noJournal: string[] = [];
  const stopWords: string[] = [];
  for (const f of posts) {
    const raw = readFileSync(join(REPO, 'src/content/blog', f), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) continue;
    const [, fm, body] = m;
    if (!/^checks:/m.test(fm)) noJournal.push(f);
    if (/(^|[^а-яёА-ЯЁ])(просто|очень|достаточно|уже|ведь)([^а-яё]|$)/i.test(body)) stopWords.push(f);
  }

  const grown: string[] = [];
  if (noJournal.length > baseline.withoutJournal) {
    grown.push(`без журнала сверок: ${noJournal.length} против ${baseline.withoutJournal} в замере ${baseline.measuredAt}`);
  }
  if (stopWords.length > baseline.withStopWords) {
    grown.push(`со словами-паразитами: ${stopWords.length} против ${baseline.withStopWords} в замере ${baseline.measuredAt}`);
  }
  expect(grown, grown.join('\n')).toEqual([]);

  // Стало лучше — не падаем, но говорим вслух: планку надо опустить, иначе
  // храповик перестаёт держать достигнутое.
  if (noJournal.length < baseline.withoutJournal || stopWords.length < baseline.withStopWords) {
    console.log(`  ↳ стало лучше: без журнала ${noJournal.length} (в замере ${baseline.withoutJournal}), ` +
      `со словами-паразитами ${stopWords.length} (в замере ${baseline.withStopWords}). ` +
      `Опустите числа в tests/quality-baseline.json.`);
  }
});

test('Язык: в тронутой статье нет слов-паразитов, штампов и канцелярита', () => {
  // Список из редакционного ТЗ, присланного Никитой 13.08.2026. Наши правила
  // говорили «чистый русский» общими словами — и два таких слова спокойно
  // доехали до готовой статьи про Сингапур: поймал их список, а не проверка.
  //
  // ⛔ Проверяем ТОЛЬКО тронутые в заходе статьи, как гейт иллюстраций. Замер
  // 13.08.2026: 243 вхождения на 67 статей, медиана 3, чистых статей всего 5.
  // Гейт «ноль везде» покрасил бы 62 статьи разом — такие гейты обходят, а не
  // чинят. Старое чистится ревизиями, новое не пропускается.
  const root = join(DIST, '..');
  const touched = touchedPosts();

  const bad: string[] = [];
  for (const rel of touched) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    // ⛔ Цитаты чужих людей из проверки исключаются: их слова — факт, а не наш
    //    текст, и править их ради гейта значит подделывать цитату. Найдено
    //    29.08.2026: «очередь формируется очень быстро» — дословный отзыв
    //    туриста, и гейт требовал его переписать.
    const body = src.split('---').slice(2).join('---')
      .split('\n').filter((s) => !/^\s*>\s*«/.test(s)).join('\n');
    // JS \b не знает кириллицы — границы слова руками, как в гейте дат.
    const hits = (list: string[]) => list.flatMap((w) => {
      const re = new RegExp(`(^|[\\s(«—-])${w}([\\s.,;:!?»)]|$)`, 'gim');
      return (body.match(re) ?? []).map(() => w);
    });
    const p = hits(PARASITES);
    const c = hits(CLICHES);
    const o = hits(OFFICE);
    const чистое = безЦитатИИмён(body);
    const hitsЧ = (words: string[]) => words.flatMap((w) => {
      const re = new RegExp(`(^|[\\s(«—-])${w}`, 'gim');
      return (чистое.match(re) ?? []).map(() => w);
    });
    const ad = hitsЧ([...AD_TONE, ...SIGNIF, ...AI_VOCAB, ...VAGUE_SRC, ...WATER]);
    for (const [w, limit] of Object.entries(SOFT_TAILS)) {
      const n = hits([w]).length;
      if (n > limit) bad.push(`${rel}: «${w}» ${n} раз при лимите ${limit} — хвост-анализ из примет ИИ`);
    }
    for (const [w, limit] of Object.entries(SOFT)) {
      const n = hits([w]).length;
      if (n > limit) bad.push(`${rel}: «${w}» ${n} раз при лимите ${limit} — оставить осмысленные, остальные убрать`);
    }
    if (p.length) bad.push(`${rel}: слова-паразиты — ${[...new Set(p)].join(', ')} (${p.length})`);
    if (c.length) bad.push(`${rel}: штампы — ${[...new Set(c)].join(', ')}`);
    if (o.length) bad.push(`${rel}: канцелярит — ${[...new Set(o)].join(', ')}`);
    if (ad.length) bad.push(`${rel}: рекламный травел-тон (вики-примета ИИ) — ${[...new Set(ad)].join(', ')}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Свежесть: тронутую статью нельзя выложить с просроченной сверкой', () => {
  // Мягкий гейт: срабатывает ТОЛЬКО на статьях, которые трогали в этом заходе.
  // Жёсткий вариант («ни одной просроченной на сайте») остановил бы работу
  // целиком: на 14.08.2026 просрочено десять статей из 68, и чинить их разом
  // никто не станет — такие гейты обходят, а не выполняют. Смысл здесь в
  // другом: нельзя тихо поправить запятую в статье, где визовые правила
  // годичной давности. Тронул — сверь, или объясни правку в журнале.
  const root = join(DIST, '..');
  const touched = touchedPosts();
  if (!touched.length) return;

  const queue = buildQueue();
  const bad: string[] = [];
  for (const rel of touched) {
    const slug = rel.split('/').pop()!.replace(/\.mdx?$/, '');
    const row = queue.find((r: { slug: string }) => r.slug === slug);
    if (row && row.overdue > 0) {
      bad.push(`${slug}: сверка просрочена на ${row.overdue} дн. (последняя ${row.checked}, интервал ${row.interval}) — сверить факты и записать в журнал`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Описание страницы влезает в выдачу — не длиннее 200 знаков', () => {
  // ⛔ Порог поднят со 160 до 200 (21.08.2026). Прежнее правило писалось под
  // Google: он режет около 155–160. Но Яндекс выводит описание до 250 знаков и
  // даёт нам ВТРОЕ больше трафика, чем Google, — короткое описание там просто
  // теряет место в выдаче. Обрезка Google при этом ничего не ломает, если суть
  // стоит в первых 150 знаках, а это требование к тексту, а не к длине.
  // Прежнее обоснование: 17.08.2026 страниц длиннее 160 было 92, из них 82 статьи
  // и десяток разделов, включая визовый и страновой. Считаем по СБОРКЕ, а не по
  // исходникам: у программных страниц описание собирается из данных страны и
  // вылезает за предел только на некоторых сочетаниях.
  // ⛔ Разбирать тег строго «сначала name, потом content» НЕЛЬЗЯ: сжатие HTML
  // переставляет свойства и снимает кавычки — в сборке лежит
  // `<meta content="…" name=description>`. Первая версия проверки искала
  // обратный порядок, не находила НИ ОДНОЙ страницы из 2400 и всегда была
  // зелёной. Подложил описание в 240 знаков — проверка промолчала.
  // Поэтому: берём каждый тег целиком, ищем свойство в любом месте и с любыми
  // кавычками, а длину меряем по расшифрованному тексту (`&amp;` — один знак
  // для читателя, а не пять).
  const LIMIT = 200;
  // ⛔ Расшифровка одним проходом. Прежняя версия шла цепочкой замен и начинала
  //    с `&amp;` — из-за этого `&amp;lt;` превращался в `<`, то есть текст
  //    расшифровывался дважды. На длине это почти не сказывалось, но приём
  //    неверный, и анализатор кода справедливо его пометил.
  const СУЩНОСТИ: Record<string, string> = {
    '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#039;': "'",
    '&lt;': '<', '&gt;': '>', '&nbsp;': ' ',
  };
  const decode = (s: string) => s.replace(/&(?:amp|quot|#0?39|lt|gt|nbsp);/g, (m) => СУЩНОСТИ[m] ?? m);
  const metaDescription = (html: string): string | null => {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
      if (!/\bname\s*=\s*["']?description["'\s>]/i.test(tag)) continue;
      const c = tag.match(/\bcontent\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (c) return decode(c[2] ?? c[3] ?? c[4] ?? '');
    }
    return null;
  };
  const bad: string[] = [];
  let withDescription = 0;
  for (const f of files) {
    if (!f.endsWith('index.html')) continue;
    const d = metaDescription(readFileSync(f, 'utf8'));
    if (d === null) continue;
    withDescription++;
    if (d.length > LIMIT) bad.push(`${f.replace(DIST, '')} — ${d.length} знаков`);
  }
  // Само-проверка линейки: если описания вдруг перестали находиться, проверка
  // зелёная не потому, что всё хорошо, а потому, что она ослепла.
  expect(withDescription, 'описания не нашлись ни на одной странице — сломан разбор тега').toBeGreaterThan(100);
  expect(bad.slice(0, 10), `${bad.length} страниц с длинным описанием:\n${bad.slice(0, 10).join('\n')}`).toEqual([]);
});

test('Журнал проверок: записи заполнены и дата обновления им не противоречит', () => {
  // Журнал введён 14.08.2026, чтобы свежесть статьи была видна читателю и
  // подтверждена первоисточниками, а дата обновления перестала быть словом на
  // веру. Схема статьи уже требует дату, текст и хотя бы один источник со
  // ссылкой — здесь ловим то, что схеме не видно: отписки в одно слово, даты
  // из будущего и рассинхрон с датой обновления.
  const root = join(DIST, '..');
  const touched = touchedPosts();

  const bad: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const rel of touched) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const fm = src.split('---')[1] ?? '';
    if (!/^checks:/m.test(fm)) continue;

    const dates = [...fm.matchAll(/^\s+- date:\s*(\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]);
    const whats = [...fm.matchAll(/^\s+what:\s*"([^"]*)"/gm)].map((m) => m[1]);
    const changed = [...fm.matchAll(/^\s+changed:\s*"([^"]*)"/gm)].map((m) => m[1]);
    if (dates.length !== whats.length || dates.length !== changed.length) {
      bad.push(`${rel}: в журнале ${dates.length} дат, ${whats.length} описаний и ${changed.length} итогов — записи неполные`);
      continue;
    }
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] > today) bad.push(`${rel}: запись журнала датирована будущим (${dates[i]})`);
      if (whats[i].length < 15) bad.push(`${rel}: в записи ${dates[i]} не сказано, что сверяли`);
      if (changed[i].length < 10) bad.push(`${rel}: в записи ${dates[i]} не сказано, что изменилось («без изменений» — тоже ответ)`);
      // Первое предложение уходит наверх страницы отдельной строкой: длинное
      // отодвигает ответ, ради которого пришли из поиска (первая версия заняла
      // на телефоне шесть строк).
      const head = changed[i].split(/(?<=\.)\s/)[0] ?? changed[i];
      if (head.length > 90) bad.push(`${rel}: первая фраза записи ${dates[i]} длиной ${head.length} — она идёт наверх страницы, нужно до 90`);
    }
    const upd = fm.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    const last = dates.slice().sort().at(-1);
    if (upd && last && upd > last) {
      bad.push(`${rel}: дата обновления ${upd} новее последней сверки ${last} — свежесть без проверки`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Иллюстрации: тронутая статья с 8+ разделами имеет ≥4 фото и описательные подписи', () => {
  const root = join(DIST, '..');
  // ⛔ Каждый вызов в try/catch. В облачной сборке клон неполный: ссылки
  // origin/main там нет, и `git diff origin/main...HEAD` падает с ошибкой —
  // на этом гейт свалил три проверки сразу после добавления (11.08.2026).
  // Недоступный источник — не повод ронять тест: до пуша всё равно отработает
  // локальный прогон, где история полная.
  const touched = touchedPosts();

  const problems: string[] = [];
  for (const rel of touched) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;            // файл удалён в этом же заходе
    const src = readFileSync(abs, 'utf8');
    const h2 = (src.match(/^## /gm) ?? []).length;
    if (h2 < 8) continue;                      // короткой заметке галерея не нужна

    // Считаем и markdown-картинки, и вставки компонентами (PhotoGrid, Image).
    const md = [...src.matchAll(/^!\[([^\]]*)\]\(([^)]+)\)/gm)];
    const comp = (src.match(/<(?:Image|Picture|PhotoGrid)\b/g) ?? []).length;
    if (md.length + comp < 4) {
      problems.push(`${rel}: ${h2} разделов, но всего ${md.length + comp} иллюстраций (нужно ≥4)`);
    }
    // Подпись для незрячих и для поиска по картинкам: «фото», «img», пустая — не подпись.
    for (const [, alt, path] of md) {
      if (alt.trim().length < 15) {
        problems.push(`${rel}: подпись «${alt}» у ${path} слишком короткая, опишите кадр словами`);
      }
    }
  }
  expect(problems, `не дотягивают до стандарта иллюстраций:\n${problems.join('\n')}`).toEqual([]);
});

/**
 * Свежесть в карте сайта и в лентах.
 *
 * 26.08.2026: переработанная статья про визу в Черногорию выросла с 846 слов до
 * 2 431, а карта сайта продолжала отдавать дату первой публикации — 1 августа.
 * Поисковик видит страницу месячной давности и может не переобойти её вовсе
 * (та же беда, что с устаревшей датой указателя карты). Замер в тот день: у 62
 * статей из 82 реальная правка свежее даты публикации.
 *
 * Причина одна на оба места: страница статьи давно считает дату обновления по
 * журналу сверок, а карта сайта и ленты знали только pubDate/updatedDate.
 * Проверяем сплошь и по СБОРКЕ: это инвариант генерации, а не правило о прозе,
 * красить легаси тут нечем.
 */
const freshFromFrontmatter = (fm: string): string => {
  const one = (re: RegExp) => fm.match(re)?.[1]?.replace(/['"]/g, '').trim() ?? '';
  const pub = one(/^pubDate:\s*(.+)$/m);
  const upd = one(/^updatedDate:\s*(.+)$/m);
  // Записи журнала сверок идут с отступом внутри checks: — поле верхнего уровня
  // (pubDate/updatedDate/tripDate) под этот вид не подходит.
  const checks = [...fm.matchAll(/^\s+-?\s*date:\s*(.+)$/gm)].map((m) => m[1].replace(/['"]/g, '').trim());
  return [pub, upd, ...checks].filter(Boolean).sort().at(-1)!;
};

test('Карта сайта: у статьи стоит дата последней сверки, а не первой публикации', () => {
  const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
  const lastmod: Record<string, string> = {};
  for (const m of xml.matchAll(/<loc>https:\/\/traveltribe\.ru\/blog\/([a-z0-9-]+)\/<\/loc><lastmod>([^<]+)<\/lastmod>/g)) {
    lastmod[m[1]] = m[2].slice(0, 10);
  }

  const stale: string[] = [];
  for (const abs of blogSources()) {
    const slug = abs.split('/').pop()!.replace(/\.mdx?$/, '');
    const fm = readFileSync(abs, 'utf8').split(/^---\s*$/m)[1] ?? '';
    const fresh = freshFromFrontmatter(fm);
    if (!fresh || !lastmod[slug]) continue;
    if (lastmod[slug] < fresh) {
      stale.push(`${slug}: в карте ${lastmod[slug]}, а сверяли ${fresh}`);
    }
  }
  expect(stale, `карта сайта занижает свежесть:\n${stale.join('\n')}`).toEqual([]);
});

test('Лента блога: статьи идут по последней сверке, свежая переработка не тонет', () => {
  const html = readFileSync(join(DIST, 'blog', 'index.html'), 'utf8');
  const order: string[] = [];
  for (const m of html.matchAll(/href="\/blog\/([a-z0-9-]+)\/"/g)) {
    if (!order.includes(m[1])) order.push(m[1]);
  }

  const fresh: Record<string, string> = {};
  for (const abs of blogSources()) {
    const slug = abs.split('/').pop()!.replace(/\.mdx?$/, '');
    fresh[slug] = freshFromFrontmatter(readFileSync(abs, 'utf8').split(/^---\s*$/m)[1] ?? '');
  }

  const listed = order.filter((s) => fresh[s]);
  const wrong: string[] = [];
  for (let i = 1; i < listed.length; i++) {
    if (fresh[listed[i - 1]] < fresh[listed[i]]) {
      wrong.push(`${listed[i]} (${fresh[listed[i]]}) стоит ниже ${listed[i - 1]} (${fresh[listed[i - 1]]})`);
    }
  }
  expect(wrong, `лента не по свежести:\n${wrong.join('\n')}`).toEqual([]);
});

test('Язык: главная и хабы чисты от примет — не только статьи блога', () => {
  // ⛔ Дыра, найденная 28.08.2026: проверка примет смотрела ТОЛЬКО статьи
  //    блога. Главная, хабы и программные страницы не смотрелись вовсе — а
  //    именно главную мы переделывали под «не похоже на машину». Замер по
  //    десяти страницам показал ноль примет во всех восьми слоях, поэтому
  //    порог здесь сразу нулевой: чинить нечего, задача — не дать съехать.
  //
  // ⛔ Страницы стран сюда НЕ входят осознанно. На них 46 вхождений стоп-слов
  //    («очень» 28, «достаточно» 9, «просто» 7, «ведь» 1) и одно «затерянный»
  //    в текстах-исходниках. Примет машинного письма среди них нет ни одной —
  //    это старая вода, а не машинный тон. Гейт, который краснеет на 46
  //    местах сразу, обходят, а не выполняют: чистится отдельной волной, как
  //    долг старых статей. Когда волна пройдёт — список расширить.
  //
  // ⛔ Ритм (доля предложений с двумя тире) здесь НЕ меряется. На странице
  //    с карточками и таблицами разметка склеивает подписи в одно «предложение»:
  //    замер главной дал 16,7% при пороге 14%, и обе «фразы» оказались
  //    склейкой ценников через тире-разделители. Мера с ложными тревогами
  //    хуже отсутствия меры.
  // Все страницы сайта, кроме статей блога и новостей: те охраняет проверка
  // тронутых статей, и нулевой порог на старом тексте покрасил бы их разом.
  const СТРАНИЦЫ = files
    .filter((ф) => ф.endsWith(`${sep}index.html`))
    .filter((ф) => !/[\\/](blog|novosti|news)[\\/]/.test(ф));
  const bad: string[] = [];
  expect(СТРАНИЦЫ.length, 'страниц вне блога в сборке').toBeGreaterThan(1000);
  for (const файл of СТРАНИЦЫ) {
    const п = dirname(файл).replace(DIST, '') || '/';
    const видимый = видимыйТекст(readFileSync(файл, 'utf8')).replace(/\s+/g, ' ');
    const чистое = безЦитатИИмён(видимый);
    const границей = (список: string[]) => список.flatMap((w) =>
      (видимый.match(new RegExp(`(^|[\\s(«—-])${w}([\\s.,;:!?»)]|$)`, 'gim')) ?? []).map(() => w));
    const спереди = (список: string[]) => список.flatMap((w) =>
      (чистое.match(new RegExp(`(^|[\\s(«—-])${w}`, 'gim')) ?? []).map(() => w));
    const жёстко = [...границей(PARASITES), ...границей(CLICHES), ...границей(OFFICE),
                    ...спереди([...AD_TONE, ...SIGNIF, ...AI_VOCAB, ...VAGUE_SRC, ...WATER])];
    if (жёстко.length) bad.push(`/${п}/: ${[...new Set(жёстко)].join(', ')} (${жёстко.length})`);
    // ⛔ Мягкий лимит здесь считает РАЗНЫЕ фразы, а не вхождения. Лимит «два
    //    на страницу» откалиброван на статьях, где одно вхождение — одно место
    //    в тексте. На программной странице шаблон повторяет одну и ту же фразу
    //    в капсуле, в ответе и в сводке: 27.08.2026 «Пирамиды днём уже тяжело»
    //    дало пять вхождений одной фразы и покрасило десять чистых страниц.
    //    Считаем окружение слова, а не само слово.
    for (const [w, лимит] of Object.entries({ ...SOFT_TAILS, ...SOFT })) {
      // Ключ места — восемнадцать БУКВ перед словом, без пробелов и знаков.
      // Хвост брать нельзя: одна и та же фраза кончается по-разному в капсуле
      // и в ответе на вопрос, а точка с запятой в перечне дробит её ещё раз.
      const места = new Set<string>();
      for (const m of видимый.matchAll(new RegExp(`(^|[\\s(«—-])${w}([\\s.,;:!?»)]|$)`, 'gim'))) {
        const до = видимый.slice(Math.max(0, m.index! - 60), m.index!)
          .toLowerCase().replace(/[^a-zа-яё]/g, '');
        места.add(до.slice(-18));
      }
      if (места.size > лимит) bad.push(`/${п}/: «${w}» в ${места.size} разных местах при лимите ${лимит}`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// ⛔ Вики-слои примет — НОЛЬ по ВСЕМУ корпусу, включая блог и новости.
//    Введён 29.08.2026 после сплошного прогона всех 2489 страниц теми же
//    паттернами: корпус оказался чист (одно срабатывание, и то — честная
//    редакционная оговорка, см. исключение ниже). Раз чист — держим нулём
//    везде, а не только на тронутых: разовый замер стал постоянной защитой.
//    ⛔ Стоп-лист («просто», «очень», канцелярит) сюда НЕ входит — у него
//    настоящий долг в старых статьях (243 вхождения), нулевой гейт на нём
//    обходили бы, а не чинили; он остаётся храповиком тронутых статей.
//    Мягкие лимиты тоже не здесь: у них живые исключения (Рускеала).
test('Вики-слои: приметы машинного письма — ноль на всех страницах сборки', () => {
  // Записанные исключения — легитимные употребления, найденные и разобранные
  // при вводе гейта. Каждое — с адресом и причиной; вычитаются ДО подсчёта.
  const ЛЕГИТИМНО = [
    // лента новостей, редакционный манифест источников: «отраслевые издания
    // я читаю, но как наводку, где искать, а не как источник цифры» —
    // противоположность примете «ссылка в никуда».
    'отраслевые издания я читаю',
  ];
  const ВСЕ = files.filter((ф) => ф.endsWith(`${sep}index.html`));
  expect(ВСЕ.length, 'страниц в сборке').toBeGreaterThan(2000);
  const bad: string[] = [];
  for (const файл of ВСЕ) {
    const п = dirname(файл).replace(DIST, '') || '/';
    const видимый = видимыйТекст(readFileSync(файл, 'utf8')).replace(/\s+/g, ' ');
    let чистое = безЦитатИИмён(видимый);
    for (const фраза of ЛЕГИТИМНО) чистое = чистое.replace(new RegExp(фраза, 'gi'), '');
    const найдено = [...AD_TONE, ...SIGNIF, ...AI_VOCAB, ...VAGUE_SRC, ...WATER]
      .flatMap((w) => (чистое.match(new RegExp(`(^|[\\s(«—-])${w}`, 'gim')) ?? []).map(() => w));
    if (найдено.length) bad.push(`/${п}/: ${[...new Set(найдено)].join(', ')} (${найдено.length})`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Вид: ни машинных шрифтов, ни палитры из типовых генераций', () => {
  // ⛔ Приметы машинного ДИЗАЙНА мы разбирали отдельно от текста, но не
  //    охраняли ничем. Здесь заперты две вещи, у которых ложных тревог не
  //    бывает: наборные шрифты, которые генераторы ставят по умолчанию, и
  //    цвета трёх типовых палитр (тёплый крем с терракотой, индиго-фиолетовый
  //    акцент, запрещённая брендбуком пара крем + старое золото).
  //
  // ⛔ Служебные цвета светофора (#22c55e, #4a9eff, #f59e0b, #ef4444) сюда НЕ
  //    входят: это сигнал «хорошо / так себе / плохо» у сезонов, а не украшение.
  //    Первый заход списка их поймал — и дал 2471 ложную тревогу на ровном месте.
  //
  // ⛔ Шрифт ищем ТОЛЬКО внутри объявления font-family и до ближайшего
  //    разделителя. Поиск по всему файлу нашёл «Inter» внутри слова «pointer»
  //    в описании курсора и обвинил чистую страницу.
  const ШРИФТЫ = ['Inter', 'Space Grotesk', 'Poppins', 'Montserrat', 'DM Sans',
                  'Plus Jakarta', 'Nunito', 'Raleway', 'Lato'];
  const ЦВЕТА = ['#f4f2eb', '#f4f1ea', '#8e6618', '#e07a5f',
                 '#6366f1', '#8b5cf6', '#7c3aed', '#a855f7'];
  const все = [...files, ...allCss(DIST)];
  const bad: string[] = [];
  for (const ф of все) {
    const t = readFileSync(ф, 'utf-8');
    for (const объявление of t.match(/font-family\s*:[^;{}"']*/gi) ?? []) {
      for (const ш of ШРИФТЫ) {
        if (new RegExp(`(^|[\\s,:'"])${ш}([\\s,;'"]|$)`, 'i').test(объявление)) {
          bad.push(`${ф.replace(DIST, '')}: шрифт «${ш}» — набор по умолчанию у генераторов`);
        }
      }
    }
    const низ = t.toLowerCase();
    for (const c of ЦВЕТА) if (низ.includes(c)) bad.push(`${ф.replace(DIST, '')}: цвет ${c} из типовой палитры генераций`);
    if (bad.length > 8) break;
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Типографика: заголовки на всех типах страниц набраны антиквой', async ({ page }) => {
  // ⛔ Переход на язык дневника прошёл наполовину и этого никто не заметил.
  //    Замер 28.08.2026: у «Сезонов» заголовок был набран моноширинным (весь
  //    блок там моно ради таблицы, и заголовок утащило туда же), у всех страниц
  //    «По месяцам» — наборным, а у статей блога, сезонных страниц, хаба виз,
  //    калькулятора и страницы карт наборными были и подзаголовки. Причина
  //    одна: общее правило `h1,h2,h3` весит меньше правил страниц и молча им
  //    проигрывало.
  //
  // ⛔ Пиксельный прогон это НЕ ловит: «Сезоны» и «По месяцам» помечены как
  //    изменчивые и не снимаются вовсе, а на длинной статье заголовок занимает
  //    доли процента площади при допуске в два процента.
  //
  // ⛔ Меряем ВЫЧИСЛЕННЫЙ шрифт настоящих заголовков, а не имена классов в
  //    стилях. Заход по именам дал две ложные тревоги подряд: «подзаголовок»
  //    оказался абзацем, «имя» — подписью ссылки. Заход по всем 2476 собранным
  //    страницам занимал 27 минут — такие гейты обходят. Здесь по одной
  //    странице на каждый тип: правило компонента одно на все его страницы.
  const ТИПЫ = ['/', '/countries/', '/visa/', '/visa/brazil/', '/seasons/',
    '/seasons/egypt/may/', '/trips/', '/trips/july/', '/trips/july/turkey/',
    '/calculator/', '/packing/', '/packing/kenya/', '/compare/',
    '/compare/turkey-vs-egypt/', '/blog/', '/blog/tutu-ru-2026/', '/novosti/',
    '/about/', '/events/', '/kenya/', '/cards/', '/my/'];
  const bad: string[] = [];
  for (const u of ТИПЫ) {
    const ответ = await page.goto(u);
    expect(ответ?.status(), `страница ${u} пропала`).toBeLessThan(400);
    const чужие = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3')]
      .filter((e) => (e as HTMLElement).innerText.trim())
      .map((e) => ({ т: e.tagName, ш: getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, ''),
                     txt: (e as HTMLElement).innerText.trim().slice(0, 24) }))
      .filter((x) => x.ш !== 'Old Standard TT'));
    for (const c of чужие) bad.push(`${u}: ${c.т} «${c.txt}» набран «${c.ш}»`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Снимки: у каждой страницы сборов показан снимок страны', async ({ page }) => {
  // ⛔ 74 снимка на 74 страны лежали в репозитории и не показывались НИ РАЗУ:
  //    страница сборов рисовала на их месте пустой цветной прямоугольник.
  //    Никита принял его за не загрузившееся фото и спросил «где фотки?»
  //    (28.08.2026). Это второй случай той же беды — до него так же лежала
  //    неподключённой карта мест, наполненная для 26 стран.
  //
  // ⛔ Поэтому мерим ДВЕ разные вещи. Статически — что тег снимка есть на
  //    каждой из 74 страниц: пропажа на одной стране иначе не видна. Живьём —
  //    что снимок реально ЗАГРУЗИЛСЯ (natural > 0): тег на месте, а файла нет —
  //    ровно та же пустая коробка, только уже с разметкой.
  const стр = readdirSync(join(DIST, 'packing'))
    .filter((d) => existsSync(join(DIST, 'packing', d, 'index.html')));
  expect(стр.length, 'страницы сборов пропали').toBeGreaterThan(60);
  const без: string[] = [];
  for (const s of стр) {
    const h = readFileSync(join(DIST, 'packing', s, 'index.html'), 'utf8');
    const герой = h.match(/<div class="pack-hero"[^>]*>([\s\S]*?)<\/div>/);
    if (!герой) { без.push(`${s}: блока снимка нет вовсе`); continue; }
    if (!/<img|<picture/.test(герой[1])) без.push(`${s}: пустая коробка вместо снимка`);
  }
  expect(без, без.join('\n')).toEqual([]);

  for (const u of ['/packing/malaysia/', '/packing/turkey/']) {
    const ответ = await page.goto(u);
    expect(ответ?.status(), `страница ${u} пропала`).toBeLessThan(400);
    const мёртвые = await page.evaluate(() => [...document.querySelectorAll('.pack-hero img')]
      .filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0)
      .map((i) => (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src));
    expect(мёртвые, `${u}: снимок не загрузился — ${мёртвые.join(', ')}`).toEqual([]);
  }
});

test('Факты: сумма обязательного полиса в Грузию одна на весь сайт', () => {
  // ⛔ Требование грузинского закона — страховая сумма не ниже 30 000 ЛАРИ
  //    (около 969 тыс ₽). Сайт хранил ещё и пересказ в долларах — «от 5 000 $
  //    амбулаторно и 30 000 $ стационар», — и эти числа расходятся втрое.
  //
  // ⛔ Копий оказалось ТРИ, и находились они по одной: справочник виз (28.08),
  //    страница безвиза (29.08) и журнал визовых изменений (29.08). Каждый раз
  //    казалось, что беда закрыта. Поэтому проверка смотрит всю сборку разом.
  //
  // ⛔ Исключение — статья про саму страховку: там доллары стоят осознанно, в
  //    сравнении «требование 30 000 лари ≈ 11 000 $, минимальный полис на
  //    рынке 30 000 $ перекрывает его втрое».
  const bad: string[] = [];
  for (const ф of files) {
    if (ф.includes('/blog/georgia-insurance-2026/')) continue;
    const h = readFileSync(ф, 'utf8');
    if (!/Грузи/.test(h)) continue;
    if (/от 30 000 \$|30 000 \$ \(амбул|амбулаторная помощь от 5 000 \$/.test(h)) {
      bad.push(`${ф.replace(DIST, '')}: сумма полиса в долларах вместо лари`);
    }
  }
  expect(bad.slice(0, 15), bad.slice(0, 15).join('\n')).toEqual([]);
});

test('Деньги: в тексте партнёрской ссылки нет голого имени партнёра', () => {
  // ⛔ Замер 29.08.2026 по всей сборке: 406 ссылок из 10 446 показывали человеку
  //    только имя партнёра — «Aviasales», «Cherehapa», «Airalo». Это нарушает
  //    требование W3C 2.4.4 (назначение ссылки читается из её текста) и наш
  //    канон: текст ссылки = действие + предмет + цифра.
  //
  // ⛔ Три шаблона давали 385 из 406 — сборы по стране, визовые карточки и
  //    страницы стран. Одна правка шаблона чинит сотни страниц; гейт нужен,
  //    чтобы они не вернулись при следующей правке.
  const ИМЕНА = new Set(['aviasales', 'cherehapa', 'airalo', 'travelata', 'ostrovok',
    'отелло', 'otello', 'drimsim', 'youtravel', 'sputnik8', 'tutu', 'туту', 'level',
    'tripster', 'tiqets', 'суточно', 'sutochno']);
  const bad: string[] = [];
  for (const ф of files) {
    const h = readFileSync(ф, 'utf8');
    for (const m of h.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*(?:tpk\.mx|pxf\.io|platipomiru|drimsim)[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
      // Разметку снимает общий разборщик: наивное выражение теряет текст за
      // атрибутом с «>» и пропускает мусор из комментариев (см. visible-text.ts).
      const текст = видимыйТекст(m[1], '').trim().toLowerCase().replace(/\.$/, '').trim();
      if (ИМЕНА.has(текст)) bad.push(`${ф.replace(DIST, '')}: ссылка показывает только «${текст}»`);
    }
  }
  expect(bad.slice(0, 20), bad.slice(0, 20).join('\n') + (bad.length > 20 ? `\n… и ещё ${bad.length - 20}` : '')).toEqual([]);
});

test('Деньги: жд-билеты не предлагаются, пока программа не согласована', () => {
  // ⛔ 6 июля 2026 две брони жд-билетов на $64,18 отменены партнёром:
  //    «Для работы с ЖД-билетами требуется дополнительное согласование».
  //    Это единственная подтверждённая потеря денег за полугодие, и ссылки
  //    после неё жили на сайте ещё два месяца.
  //
  // ⛔ Исключение — бренд-статья про сам сервис: там ссылка и есть предмет
  //    страницы, убрать её значило бы писать о сервисе и прятать его.
  const bad: string[] = [];
  for (const ф of files) {
    if (ф.includes('/blog/tutu-ru-2026/')) continue;
    const h = readFileSync(ф, 'utf8');
    for (const m of h.matchAll(/href="([^"]*tutu\.tpk\.mx[^"]*)"/g)) {
      if (decodeURIComponent(m[1]).includes('/poezda')) bad.push(`${ф.replace(DIST, '')}: жд-ссылка`);
    }
  }
  expect(bad.slice(0, 20), bad.slice(0, 20).join('\n')).toEqual([]);
});

test('Вид: раздел не рисует своей подложки поверх фона сайта', async ({ page }) => {
  // ⛔ У страницы виз остался «бумажный» слой от старого реестра: на всю
  //    площадь блока лежала плитка шума (::before, mix-blend-mode: multiply)
  //    плюс краевой градиент (::after). Цвет фона при этом БЫЛ сайтовым —
  //    серым его делал именно множащий слой: он затемнял #fbfbfa и обрывался
  //    ровными краями, отчего раздел выглядел наклейкой поверх сайта.
  //    Никита показал это скриншотом 28.08.2026, третьей правкой подряд по
  //    одной и той же странице.
  //
  // ⛔ Почему не поймал ни один прежний гейт: в разметке цвета правильные,
  //    палитра сайтовая, беду даёт НАЛОЖЕНИЕ. А пиксельный прогон принял
  //    подложку за эталон — она стояла с самого рождения страницы, и «не
  //    изменилось» тут значит «не чинилось».
  //
  // ⛔ Мерим вычисленный стиль в браузере, а не текст правил: слой может
  //    прийти из любого файла, и имена классов о нём ничего не говорят.
  const ТИПЫ = ['/', '/countries/', '/visa/', '/visa/brazil/', '/seasons/',
    '/seasons/egypt/may/', '/trips/', '/trips/july/', '/calculator/',
    '/packing/', '/compare/', '/blog/', '/novosti/', '/about/', '/events/',
    '/cards/'];
  const bad: string[] = [];
  for (const u of ТИПЫ) {
    const ответ = await page.goto(u);
    expect(ответ?.status(), `страница ${u} пропала`).toBeLessThan(400);
    const найдено = await page.evaluate(() => {
      const out: string[] = [];
      const прозрачно = (c: string) => c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
      const фонСайта = getComputedStyle(document.body).backgroundColor;
      const м = document.querySelector('main');
      if (!м) return ['нет <main>'];
      const с = getComputedStyle(м);
      if (!прозрачно(с.backgroundColor) && с.backgroundColor !== фонСайта)
        out.push(`свой фон ${с.backgroundColor} при фоне сайта ${фонСайта}`);
      for (const где of ['::before', '::after']) {
        const п = getComputedStyle(м, где);
        // Слой во всю площадь: есть содержимое, лежит абсолютом и растянут.
        const площадь = п.content !== 'none' && п.position === 'absolute'
          && п.inset !== 'auto' && п.inset !== '';
        if (!площадь) continue;
        if (п.mixBlendMode !== 'normal')
          out.push(`${где}: слой во всю площадь с наложением «${п.mixBlendMode}»`);
        if (п.backgroundImage !== 'none')
          out.push(`${где}: слой во всю площадь с подложкой-картинкой`);
      }
      return out;
    });
    for (const с of найдено) bad.push(`${u}: ${с}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Формат раздела: поиск, ориентиры и доступность на страницах-подборах', async ({ page }) => {
  // ⛔ Правила из research/section-page-format.md — те, что проверяются машиной.
  //    Каждое найдено тем, что сначала было НАРУШЕНО в наших же макетах.
  //
  //    Поиск: NN/g — больше половины людей «поисковые» и идут прямо в строку.
  //    Пропуск к содержимому: WebAIM — иначе человек на клавиатуре каждый раз
  //    проходит всю шапку. Ориентиры: MDN — семантикой, а не ролями.
  //    Видимый фокус: WCAG 2.4.7; `outline:0` без замены — прямой запрет.
  //
  // ⛔ Проверяем страницы-ПОДБОРЫ: те, где человек выбирает из многого. На
  //    статье поиск не нужен, там уже ответ.
  const ПОДБОРЫ = ['/countries/', '/visa/', '/seasons/', '/trips/', '/packing/'];
  const bad: string[] = [];
  for (const u of ПОДБОРЫ) {
    const ответ = await page.goto(u);
    expect(ответ?.status(), `страница ${u} пропала`).toBeLessThan(400);
    const м = await page.evaluate(() => {
      const видим = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const фокусБезКонтура = [...document.querySelectorAll('a,button,input,select')]
        .filter(видим)
        .filter((e) => { const c = getComputedStyle(e);
          return c.outlineStyle === 'none' && c.outlineWidth === '0px' && !/inset/.test(c.boxShadow); }).length;
      return {
        поиск: document.querySelectorAll('input[type="search"]').length,
        пропуск: [...document.querySelectorAll('a[href^="#"]')]
          .some((a) => /содерж|контент|main/i.test(a.getAttribute('href') + a.textContent)),
        main: document.querySelectorAll('main').length,
        nav: document.querySelectorAll('nav').length,
        h1: document.querySelectorAll('h1').length,
        безAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
        фокусБезКонтура,
      };
    });
    if (!м.пропуск) bad.push(`${u}: нет ссылки «к содержимому» — клавиатура проходит шапку заново`);
    if (м.main !== 1) bad.push(`${u}: ориентир main — ${м.main}, норма 1`);
    if (м.nav < 1) bad.push(`${u}: нет ориентира nav`);
    if (м.h1 !== 1) bad.push(`${u}: заголовков первого уровня ${м.h1}, норма 1`);
    if (м.безAlt) bad.push(`${u}: снимков без описания ${м.безAlt}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Предзагрузка кадра: у каждого тега есть адрес (робот Яндекса без него выдумывает /preload)', () => {
  // ⛔ Выгрузка обхода 28.08.2026: 97 заходов робота на несуществующие адреса
  //    «страница + preload», 25 в августе. Причина — тег предзагрузки кадра с
  //    набором вариантов, но БЕЗ href: стандарт разрешает, робот спотыкается,
  //    бюджет обхода горит, а новые страницы из-за скупого обхода голодают
  //    (это уже записанные грабли). Порог ноль: ложных срабатываний не бывает.
  const bad: string[] = [];
  for (const ф of files) {
    for (const тег of readFileSync(ф, 'utf-8').match(/<link rel="preload" as="image"[^>]*>/g) ?? []) {
      if (!/\bhref=/.test(тег)) bad.push(`${ф.replace(DIST, '')}: тег предзагрузки кадра без адреса`);
      if (bad.length > 6) break;
    }
    if (bad.length > 6) break;
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Курсоры: в своих курсорах нет декоративных стрелок и чужих цветов', () => {
  // ⛔ Стрелка «→» запрещена каноном по всему сайту, но прежний гейт смотрел
  //    ТОЛЬКО текст ссылок и кнопок. 28.08.2026 стрелка нашлась внутри картинки
  //    своего курсора на карточках визовой страницы — вместе с цветом старого
  //    реестра, который переезд на язык дневника не тронул. Оба прошли мимо
  //    всех проверок, потому что жили в адресе данных, а не в разметке.
  const bad: string[] = [];
  for (const ф of [...files, ...allCss(DIST)]) {
    const t = readFileSync(ф, 'utf-8');
    for (const курсор of t.match(/cursor:\s*url\([^)]*\)/g) ?? []) {
      if (/→|%E2%86%92/.test(курсор)) bad.push(`${ф.replace(DIST, '')}: стрелка «→» внутри курсора`);
      if (/a3372a|%23a3372a/i.test(курсор)) bad.push(`${ф.replace(DIST, '')}: цвет старого реестра внутри курсора`);
      if (bad.length > 6) break;
    }
    if (bad.length > 6) break;
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('Деньги: месячная страница ведёт на перелёт в свой месяц', () => {
  const месяцы = new Map([
    ['january', 1], ['february', 2], ['march', 3], ['april', 4],
    ['may', 5], ['june', 6], ['july', 7], ['august', 8],
    ['september', 9], ['october', 10], ['november', 11], ['december', 12],
  ]);
  const примеры: string[] = [];
  let проверено = 0;
  let ошибок = 0;

  for (const файл of files) {
    const части = файл.slice(DIST.length + 1).split(sep);
    const slug = части[0] === 'packing' ? части[2] : части[1];
    const ожидаемый = месяцы.get(slug);
    if (!ожидаемый || !['packing', 'trips', 'events'].includes(части[0])) continue;

    const html = readFileSync(файл, 'utf8');
    for (const тег of ссылкиСФрагментом(html, 'aviasales.tpk.mx')) {
      let decoded = тег.replaceAll('&amp;', '&');
      try { decoded = decodeURIComponent(decoded); } catch { /* покажет другой гейт адресов */ }
      const дата = decoded.match(/\/search\/[A-Z]{3}\d{2}(\d{2})[A-Z]{3}1/i);
      if (!дата) continue;
      проверено++;
      const фактический = Number(дата[1]);
      if (фактический !== ожидаемый) {
        ошибок++;
        if (примеры.length < 20) {
          примеры.push(`${файл.replace(DIST, '')}: страница ${slug}, ссылка на месяц ${фактический}`);
        }
      }
    }
  }

  expect(проверено, 'не найдено ни одной датированной авиассылки').toBeGreaterThan(0);
  expect(ошибок, `${ошибок} авиассылок ведут не на месяц страницы:\n${примеры.join('\n')}`).toBe(0);
});

test('Деньги: страновые CTA сохраняют выбранное направление у партнёра', () => {
  // Проверяем не форму хелпера, а все реальные ссылки собранных шаблонов.
  // Страница уже знает страну: общая форма после клика обнуляет information scent
  // и заставляет человека повторить поиск. Неподдерживаемый оффер лучше не показывать.
  const ошибки: string[] = [];
  let страховок = 0;
  let туров = 0;
  let esim = 0;
  let авиапоисков = 0;

  const hrefИзТега = (тег: string) => {
    const m = тег.match(/\bhref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return unescapeAmp(m?.[1] ?? m?.[2] ?? m?.[3] ?? '');
  };
  const назначение = (href: string, key: 'u' | 'redirect') => {
    try { return new URL(href).searchParams.get(key) ?? ''; }
    catch { return ''; }
  };

  for (const файл of files) {
    const части = файл.slice(DIST.length + 1).split(sep);
    const страновая =
      (части[0] === 'packing' && (части.length === 3 || части.length === 4)) ||
      (части[0] === 'trips' && части.length === 4) ||
      (части[0] === 'visa' && части.length === 3);
    if (!страновая) continue;

    const rel = '/' + части.join('/');
    const html = readFileSync(файл, 'utf8');

    for (const тег of ссылкиСФрагментом(html, 'cherehapa.tpk.mx')) {
      страховок++;
      const target = назначение(hrefИзТега(тег), 'u');
      let выбраннаяСтрана = false;
      try {
        const параметры = new URL(target).searchParams;
        выбраннаяСтрана = параметры.has('countries[0]') || параметры.has('countryGroups[0]');
      } catch {}
      if (!выбраннаяСтрана) {
        ошибки.push(`${rel}: страховка открывает форму без страны — ${target}`);
      }
    }

    for (const тег of ссылкиСФрагментом(html, 'travelme.g2afse.com')) {
      туров++;
      const href = hrefИзТега(тег);
      const target = назначение(href, 'redirect');
      if (!/^https:\/\/youtravel\.me\/tours\/(country|region)\//.test(target)) {
        ошибки.push(`${rel}: авторский тур открывает общий каталог — ${target || href}`);
      }
    }

    for (const тег of ссылкиСФрагментом(html, 'airalo.pxf.io')) {
      esim++;
      const target = назначение(hrefИзТега(тег), 'u');
      if (!/^https:\/\/airalo\.com\/ru\/[a-z0-9-]+-esim\/?$/.test(target)) {
        ошибки.push(`${rel}: eSIM открывает общий каталог — ${target}`);
      }
    }

    if (части[0] === 'packing' && части.length === 3) {
      for (const тег of ссылкиСФрагментом(html, 'aviasales.tpk.mx')) {
        авиапоисков++;
        const target = назначение(hrefИзТега(тег), 'u');
        if (!/\/search\/[A-Z]{3}\d{4}[A-Z]{3}1/i.test(target)) {
          ошибки.push(`${rel}: перелёт открывает пустой поиск — ${target}`);
        }
      }
    }
  }

  expect(страховок, 'не найдено ни одной страновой ссылки на страховку').toBeGreaterThan(0);
  expect(туров, 'не найдено ни одной страновой ссылки на авторские туры').toBeGreaterThan(0);
  expect(esim, 'не найдено ни одной страновой ссылки на eSIM').toBeGreaterThan(0);
  expect(авиапоисков, 'не найдено ни одной авиассылки на странице сборов по стране').toBeGreaterThan(0);
  expect(ошибки.slice(0, 30), `${ошибки.length} холодных страновых CTA:\n${ошибки.slice(0, 30).join('\n')}`).toEqual([]);
});

test('Деньги: в партнёрских URL нет повреждённого percent-encoding', () => {
  const ошибки: string[] = [];
  for (const файл of files) {
    const html = readFileSync(файл, 'utf8');
    for (const тег of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)) {
      const href = unescapeAmp(тег[1]);
      if (/tpk\.mx|pxf\.io|g2afse\.com/.test(href) && href.includes('%%')) {
        ошибки.push(`${файл.replace(DIST, '')}: ${href.slice(0, 150)}`);
      }
    }
  }
  expect(ошибки, ошибки.join('\n')).toEqual([]);
});
