import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Исходники статей блога — часть правил проверяется по .md/.mdx, а не по вёрстке:
// даты во фронтматтере в собранный HTML не попадают.
const BLOG_SRC = fileURLToPath(new URL('../src/content/blog', import.meta.url));
const blogSources = () =>
  readdirSync(BLOG_SRC)
    .filter((n) => /\.mdx?$/.test(n))
    .map((n) => join(BLOG_SRC, n));

// Инварианты зависят только от сборки, не от вьюпорта — один прогон достаточно.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'build-output инвариант — один прогон');
});

test('dist собран (html-файлы есть)', () => {
  expect(files.length).toBeGreaterThan(100);
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
  const RATE: Record<string, number> = { $: 82.9977, '€': 95.7793, AUD: 58.6047 };
  // ⚠️ Число НЕ должно перескакивать строку: первая версия проверки включала
  // \s в цифры и склеила «$50» последней строкой списка с «≈ 200 000 ₽» итога
  // строкой ниже — ложная тревога. Пробелы разрешены только внутри строки.
  const re = /(\$|€|AUD ?)\s?([\d  ]+(?:[–-][\d  ]+)?)[^≈₽\n]{0,40}≈\s?([\d  ]+(?:[–-][\d  ]+)?)\s*(тыс\.\s*)?₽/g;
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

test('Монетизация: каждый блог-пост содержит ≥1 партнёрскую ссылку (rel=sponsored)', () => {
  // Правило Фазы 7 (план монетизации, 2026-07-02): травел-пост без CTA = потерянный трафик.
  // Только /blog/<slug>/ — листинги (/blog/, /blog/tag/*, пагинация) не считаются.
  const re = /rel="?[^">]*sponsored/;
  const bad: string[] = [];
  for (const f of files) {
    const rel = f.replace(DIST, '');
    const m = rel.match(/^\/blog\/([^/]+)\/index\.html$/);
    if (!m || m[1] === 'tag' || /^page/.test(m[1])) continue;
    if (!re.test(readFileSync(f, 'utf8'))) bad.push(rel);
  }
  expect(bad, `посты без партнёрских ссылок:\n${bad.join('\n')}`).toEqual([]);
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
    { what: 'служебные поля frontmatter', re: /^(coverImage|coverPosition|coverPositionCard|sourceType|howto):/m },
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
  ];
  const found = FORBIDDEN.filter(({ re }) => re.test(text)).map(({ what, re }) => ({
    what,
    пример: (text.match(re) || [''])[0].slice(0, 90),
    строк: (text.match(new RegExp(re.source, 'gm')) || []).length,
  }));
  expect(found, JSON.stringify(found, null, 2)).toEqual([]);
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
  expect(home, 'нет цели на клик в Telegram').toContain('telegram_click');
  const affList = home.match(/AFF=\[[^\]]*\]/)?.[0] ?? '';
  expect(affList, 't.me попал в AFF — ссылки на свой канал получат rel=sponsored').not.toContain('t.me');
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
  //   platipomiru — своя CPA-ссылка без sub_id и без erid (erid ждём от партнёра);
  //   g2afse (YouTravel) — другая сеть, свой формат метки, erid тоже ещё не выдан.
  const SKIP = /platipomiru\.com|g2afse\.com/;
  const bad: { file: string; href: string }[] = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/gi)) {
      // Астро кодирует «&» и как &amp;, и как &#x26; — раскодировать надо оба,
      // иначе тест объявляет обезличенными ссылки, у которых метка на месте.
      const href = unescapeAmp(m[1]);
      if (!/tpk\.mx|pxf\.io|aviasales\.ru\/\?/.test(href)) continue;
      if (SKIP.test(href)) continue;
      const labelled = /pxf\.io/.test(href)
        ? /sharedID=546042_[a-z0-9_]+/.test(href)   // хвост после «_» обязан быть непустым
        : /[?&]sub_id=[a-z0-9_]+/.test(href);
      if (!labelled) bad.push({ file: f.replace(DIST, ''), href: href.slice(0, 110) });
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
test('Иллюстрации: тронутая статья с 8+ разделами имеет ≥4 фото и описательные подписи', () => {
  const root = join(DIST, '..');
  // ⛔ Каждый вызов в try/catch. В облачной сборке клон неполный: ссылки
  // origin/main там нет, и `git diff origin/main...HEAD` падает с ошибкой —
  // на этом гейт свалил три проверки сразу после добавления (11.08.2026).
  // Недоступный источник — не повод ронять тест: до пуша всё равно отработает
  // локальный прогон, где история полная.
  const git = (...args: string[]) => {
    try {
      return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        .split('\n')
        .map((x) => x.trim())
        .filter((x) => /^src\/content\/blog\/[^/]+\.mdx?$/.test(x));
    } catch {
      return [];
    }
  };

  const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
  const touched = [...new Set([
    ...git('ls-files', '--others', '--exclude-standard', '--', 'src/content/blog'),
    ...git('diff', '--name-only', '--', 'src/content/blog'),
    ...git('diff', '--name-only', '--staged', '--', 'src/content/blog'),
    ...git('diff', '--name-only', `${base}...HEAD`, '--', 'src/content/blog'),
    ...git('diff', '--name-only', 'HEAD~1', 'HEAD', '--', 'src/content/blog'),
  ])];

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
