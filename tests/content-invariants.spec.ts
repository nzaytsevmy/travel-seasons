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
    const text = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
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
