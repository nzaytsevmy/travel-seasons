// Гейт ленты /novosti/. Публикация автоматическая, поэтому между скрапленной
// страницей и продом стоит только этот скрипт.
//
// Принцип: модель пишет заметку, проверяет её ЭТОТ код, который сам сходил на
// источник. Проверка, которую делает та же модель, что писала, — не проверка.
//
// Функции ниже чистые и без сети, чтобы их можно было прогнать тестами
// (tests/news-gate.spec.ts). Сеть — только в fetchSources и в CLI внизу.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

// ── разбор заметки ────────────────────────────────────────────────────────────

/** Минимальный разбор frontmatter: нам нужны поля, а не полный YAML. */
export function parseNote(raw, slug) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${slug}: нет frontmatter`);
  const [, fm, body] = m;
  const data = { countries: [], sources: [] };
  let list = null;

  for (const line of fm.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && list) {
      if (list === 'sources') data.sources.push({ name: '', url: '' });
      else data[list].push(unquote(item[1]));
      const inline = item[1].match(/^name:\s*(.*)$/);
      if (inline) data.sources.at(-1).name = unquote(inline[1]);
      continue;
    }
    const sub = line.match(/^\s{4,}(name|url):\s*(.*)$/);
    if (sub && list === 'sources' && data.sources.length) {
      data.sources.at(-1)[sub[1]] = unquote(sub[2]);
      continue;
    }
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (val === '') { list = key; if (!data[key]) data[key] = []; continue; }
    list = null;
    data[key] = key === 'score' ? Number(val) : unquote(val);
  }
  if (data.date) data.date = new Date(data.date);
  if (data.checked) data.checked = new Date(data.checked);
  return { slug, data, body: body.trim() };
}

const unquote = (s) => s.trim().replace(/^["'](.*)["']$/, '$1');

// ── проверки ──────────────────────────────────────────────────────────────────

const fail = (reason) => ({ ok: false, reason });
const pass = { ok: true };

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return null; }
}

/** Домен разрешён, если совпадает точно или является его поддоменом. */
function domainAllowed(host, allowed) {
  return allowed.some((d) => host === d || host.endsWith('.' + d));
}

/**
 * 1. Ссылаться можно только на домены из белого списка. Главный сценарий
 *    подставы: скрапленная страница подсовывает свою ссылку, модель её цитирует.
 */
export function checkDomains(note, allowed, media = []) {
  const sources = note.data.sources ?? [];
  if (sources.length === 0) return fail('нет ни одного источника');
  // Издания (National Geographic, Smithsonian, Mongabay и подобные) годятся
  // как источник для природы и транспорта: там и живёт то интересное, ради чего
  // лента затевалась, а числа гейт всё равно сверяет по самой странице.
  //
  // ⛔ Для визовых заметок — нет. По ним человек планирует поездку и тратит
  // деньги, и пересказ издания тут не годится: нужен тот, кто правило объявил.
  const ymyl = note.data.topic === 'visa';
  for (const s of sources) {
    const host = hostOf(s.url);
    if (!host) return fail(`нечитаемый URL источника: ${s.url}`);
    if (domainAllowed(host, allowed)) continue;
    if (!ymyl && domainAllowed(host, media)) continue;
    if (ymyl && domainAllowed(host, media)) {
      return fail(`визовый факт со слов издания (${host}) — нужен тот, кто правило объявил`);
    }
    return fail(`домен вне белого списка: ${host}`);
  }
  return pass;
}

/**
 * 2. В теле допустимы только те URL, которые перечислены источниками. Придуманный
 *    моделью или подобранный со страницы адрес сюда не пролезет.
 */
export function checkLinksSubset(note) {
  const allowed = new Set((note.data.sources ?? []).map((s) => s.url.replace(/\/+$/, '')));
  const found = note.body.match(/https?:\/\/[^\s)\]"'<>]+/g) ?? [];
  for (const u of found) {
    if (!allowed.has(u.replace(/[.,;)]+$/, '').replace(/\/+$/, ''))) {
      return fail(`в тексте ссылка, которой нет среди источников: ${u}`);
    }
  }
  return pass;
}

const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

/**
 * 3. Дословные совпадения с источником. Восемь слов подряд — уже не пересказ,
 *    а копипаста, пусть и переставленная.
 */
export function checkShingles(note, sourceTexts, n = 8) {
  const noteWords = words(note.body);
  if (noteWords.length < n) return pass;
  const noteShingles = new Set();
  for (let i = 0; i + n <= noteWords.length; i++) noteShingles.add(noteWords.slice(i, i + n).join(' '));

  for (const text of sourceTexts) {
    const sw = words(text);
    for (let i = 0; i + n <= sw.length; i++) {
      const sh = sw.slice(i, i + n).join(' ');
      if (noteShingles.has(sh)) return fail(`дословный кусок источника: «${sh}»`);
    }
  }
  return pass;
}

// Годы из проверки исключены. Живой прогон 01.08.2026 отбраковал верную заметку
// про перепись тигров в Непале, потому что «2025» не нашлось на странице: источник
// писал «this year». Год в заметке почти всегда контекст фразы, а не заявленный
// факт, и его несёт отдельное поле `date`, которое видно читателю. Оставлять эту
// проверку значит терять правильные заметки — а именно этого гейт делать не должен.
const isYear = (s) => s.length === 4 && Number(s) >= 1900 && Number(s) <= 2100;

/**
 * 4. Числа из заметки должны встречаться на странице источника. Ловит выдумку;
 *    неверную интерпретацию верного числа — не ловит, это честное ограничение.
 */
export function checkCorroboration(noteText, sourceTexts) {
  const nums = [...new Set((noteText.match(/\d[\d\s.,]*\d|\d/g) ?? [])
    .map((s) => s.replace(/[\s.,]/g, ''))
    .filter((s) => s.length >= 3)                 // 2-3 и «сорок лет» не проверяем
    .filter((s) => !isYear(s)))];                 // год — контекст, а не заявленный факт
  if (nums.length === 0) return pass;

  const haystack = sourceTexts.join(' ').replace(/[\s.,'’]/g, '');
  for (const n of nums) {
    if (!haystack.includes(n)) return fail(`числа ${n} нет на странице источника`);
  }
  return pass;
}

// Правило дословно из шапки src/data/visa-changes.js: волатильный статус
// протухает за дни и делает ленту вредной.
const VOLATILE = [
  /работает штатно/i, /на сегодня/i, /сегодня\s/i, /сейчас нет задержек/i,
  /по состоянию на сегодня/i, /в данный момент/i, /вчера/i, /завтра/i,
  /курс на сегодня/i, /временно приостановлен[оы]? на день/i,
];

/** 5. Волатильность. */
export function checkVolatility(note) {
  for (const re of VOLATILE) {
    const m = note.body.match(re);
    if (m) return fail(`волатильная формулировка: «${m[0].trim()}»`);
  }
  return pass;
}

const STATUSES = ['действует', 'принято, не вступило', 'отменено'];

/**
 * 6. YMYL-форма. Путать «действует» и «принято, но не вступило» опаснее всего:
 *    человек планирует поездку по правилу, которого ещё нет.
 */
export function checkYmylForm(note) {
  if (note.data.topic !== 'visa') return pass;
  const st = note.data.status;
  if (!st) return fail('визовая заметка без поля status');
  if (!STATUSES.includes(st)) return fail(`недопустимый status: «${st}»`);
  return pass;
}

const normTitle = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** 7. Дубль: тот же источник или тот же заголовок среди уже опубликованного. */
export function checkDedup(note, published) {
  const urls = new Set((note.data.sources ?? []).map((s) => s.url.replace(/\/+$/, '')));
  const title = normTitle(note.data.title ?? '');
  const words = (x) => new Set(normTitle(x).split(' ').filter((w) => w.length > 3));
  const mine = words(note.data.title ?? '');
  for (const p of published) {
    const pt = normTitle(p.title ?? '');
    if (pt && (pt === title || pt.includes(title) || title.includes(pt))) {
      return fail(`заголовок повторяет уже опубликованный: «${p.title}»`);
    }
    // Один пресс-релиз может дать две РАЗНЫЕ новости: нумбат и пустынная лягушка
    // пришли из одного обновления Красного списка, и обе законны. Поэтому сам по
    // себе общий источник не дубль. Дубль — когда источник тот же И заголовки
    // пересекаются больше чем наполовину по значимым словам.
    if ((p.sources ?? []).some((u) => urls.has(u.replace(/\/+$/, '')))) {
      const theirs = words(p.title ?? '');
      const common = [...mine].filter((w) => theirs.has(w)).length;
      const smaller = Math.min(mine.size, theirs.size) || 1;
      if (common / smaller > 0.5) {
        return fail(`та же новость из того же источника: «${p.title}»`);
      }
    }
  }
  return pass;
}

/**
 * 9. Заметка не должна быть тупиком. Яндекс даёт поведенческим 30–45% формулы,
 *    а оттуда приходит 92% трафика сайта: человек, которому из заметки некуда
 *    идти, возвращается в выдачу — это прямой минус, а не нейтральный исход.
 *    Ссылка на первоисточник не считается: она уводит наружу. Ссылка на саму
 *    ленту тоже: это круг на месте.
 */
export function checkDepthLink(note) {
  const internal = (note.body.match(/\]\((\/[^)]*)\)/g) ?? [])
    .map((m) => m.slice(m.indexOf('(') + 1, -1))
    .filter((u) => !u.startsWith('/novosti'));
  if (internal.length === 0) {
    return fail('нет ни одной ссылки вглубь сайта — читателю некуда идти дальше');
  }
  return pass;
}

/**
 * 10. Капсула-ответ. 40–60 слов прямого ответа ДО контекста: именно её
 *     извлекает нейроответ, и по ней человек решает, читать ли дальше.
 */
export function checkTldr(note) {
  const t = (note.data.tldr ?? '').trim();
  if (!t) return fail('нет капсулы-ответа (поле tldr)');
  const n = t.split(/\s+/).filter(Boolean).length;
  if (n < 25) return fail(`капсула короткая: ${n} слов, нужно 40–60`);
  if (n > 75) return fail(`капсула длинная: ${n} слов, нужно 40–60`);
  return pass;
}

/**
 * 11. У заметки робота обязан быть СВОЙ снимок со стока. Запасной кадр из архива
 *     подбирается по теме, а значит несколько заметок одной темы неизбежно
 *     получают один и тот же — именно так в ленте оказались три одинаковые
 *     картинки подряд. Требуем photoQuery и image: нет снимка — нет публикации.
 *     Заметки, написанные руками, поле image заполняют сами и проверку проходят.
 */
export function checkOwnPhoto(note) {
  if (note.data.image) return pass;
  return fail('нет своего снимка: заполни photoQuery, чтобы сток нашёл кадр по теме');
}

/** 8. Порог интересности по news/RUBRIC.md. */
export function gradeNote(note, minScore) {
  const s = note.data.score;
  if (typeof s !== 'number' || Number.isNaN(s)) return fail('нет оценки score');
  if (s < minScore) return fail(`оценка ${s} ниже порога ${minScore}`);
  return pass;
}

// ── сеть ──────────────────────────────────────────────────────────────────────

/**
 * Текст страницы без разметки. Закрывающий тег по спецификации HTML может
 * нести и пробелы, и мусорные атрибуты: «</script >», «</script\t\n bar>» —
 * всё это валидно и всё это парсер закроет. Регулярка, ждущая ровно
 * «</script>», такой кусок пропускает, содержимое скрипта утекает в текст, и
 * число из JS может «подтвердить» заметку, хотя человеку на странице оно не
 * показано. Поэтому граница по имени тега и любые символы до «>».
 * Поймано CodeQL (js/bad-tag-filter) — для гейта это дыра, а не придирка.
 */
export function stripHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Скачивает источники САМ, а не верит модели. Страница, закрытая от ботов или
 * отдающая пустоту, считается неподтверждающей: факт без проверяемого источника
 * в ленту не идёт.
 */
export async function fetchSources(note, { timeoutMs = 20000, attempts = 3 } = {}) {
  const texts = [];
  for (const s of note.data.sources ?? []) {
    let last = null;
    for (let i = 0; i < attempts; i++) {
      // Случайный обрыв не должен стоить заметки. Замерено 01.08.2026: из четырёх
      // прогонов подряд по одному и тому же набору один выбросил живую заметку с
      // «источник недоступен» — сеть моргнула. Повторяем только временное:
      // 404 и 403 повторять бессмысленно, страница правда не отдаётся.
      if (i > 0) await new Promise((r) => setTimeout(r, 2000 * i));
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(s.url, {
          signal: ac.signal,
          headers: { 'User-Agent': 'traveltribe-news-gate/1.0 (+https://traveltribe.ru/)' },
        });
        if (!res.ok) {
          last = { ok: false, reason: `источник отдал ${res.status}: ${s.url}`, texts };
          if (res.status === 429 || res.status >= 500) continue;
          return last;
        }
        const html = await res.text();
        const text = stripHtml(html);
        if (text.trim().length < 400) {
          return { ok: false, reason: `на странице нет читаемого текста (JS-only или блок ботов): ${s.url}`, texts };
        }
        texts.push(text);
        last = null;
        break;
      } catch (e) {
        last = { ok: false, reason: `источник недоступен (${e.name}): ${s.url}`, texts };
      } finally {
        clearTimeout(t);
      }
    }
    if (last) return last;
  }
  return { ok: true, texts };
}

// ── прогон ────────────────────────────────────────────────────────────────────

export async function runGate(note, { allowed, media = [], minScore, published, offline = false }) {
  const checks = [
    ['домены', () => checkDomains(note, allowed, media)],
    ['ссылки в тексте', () => checkLinksSubset(note)],
    ['волатильность', () => checkVolatility(note)],
    ['YMYL-форма', () => checkYmylForm(note)],
    ['дубль', () => checkDedup(note, published)],
    ['оценка', () => gradeNote(note, minScore)],
    ['капсула-ответ', () => checkTldr(note)],
    ['ссылка вглубь', () => checkDepthLink(note)],
    ['свой снимок', () => checkOwnPhoto(note)],
  ];
  for (const [name, fn] of checks) {
    const r = fn();
    if (!r.ok) return { ok: false, check: name, reason: r.reason };
  }
  if (offline) return { ok: true, check: 'все, кроме сетевых' };

  const fetched = await fetchSources(note);
  if (!fetched.ok) return { ok: false, check: 'источник', reason: fetched.reason };

  for (const [name, fn] of [
    ['дословные совпадения', () => checkShingles(note, fetched.texts)],
    ['подтверждение чисел', () => checkCorroboration(note.body, fetched.texts)],
  ]) {
    const r = fn();
    if (!r.ok) return { ok: false, check: name, reason: r.reason };
  }
  return { ok: true, check: 'все' };
}

/**
 * Уже опубликованное — чтобы не публиковать одно и то же дважды.
 *
 * ⛔ Читать ВСЕГДА. Робот кладёт свежие заметки в ту же папку, где лежат старые,
 * и запускает проверку без аргументов. Если в этом случае список опубликованного
 * пуст, дедупа нет вовсе — именно так одна новость про ЮНЕСКО вышла дважды.
 * Заметку не сравнивают с ней же: за это отвечает `slug` у вызывающего.
 */
export function loadPublished(root) {
  const out = [];
  const dir = join(root, 'src/content/news');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const slug = basename(f, '.md');
      const n = parseNote(readFileSync(join(dir, f), 'utf8'), slug);
      out.push({ slug, title: n.data.title, sources: (n.data.sources ?? []).map((s) => s.url) });
    }
  }
  const vc = join(root, 'src/data/visa-changes.js');
  if (existsSync(vc)) {
    const raw = readFileSync(vc, 'utf8');
    for (const m of raw.matchAll(/title:\s*'([^']+)'/g)) out.push({ title: m[1], sources: [] });
  }
  return out;
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
if (isMain) {
  const args = process.argv.slice(2);
  const dirArg = args.find((a) => !a.startsWith('--'));
  const offline = args.includes('--offline');
  const root = process.cwd();
  const cfg = JSON.parse(readFileSync(join(root, 'news/config.json'), 'utf8'));
  const dir = dirArg ? join(root, dirArg) : join(root, 'src/content/news');
  // ⛔ Раньше здесь стояло `dirArg ? loadPublished(root) : []`: при обычном
  // запуске (робот зовёт скрипт БЕЗ аргумента) список опубликованного был пуст,
  // и дедуп не работал вовсе — так одна новость про ЮНЕСКО вышла дважды.
  const published = loadPublished(root);

  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  let bad = 0;
  for (const f of files) {
    const slug = basename(f, '.md');
    const note = parseNote(readFileSync(join(dir, f), 'utf8'), slug);
    const r = await runGate(note, {
      allowed: cfg.allowedSourceDomains, media: cfg.mediaSourceDomains ?? [],
      minScore: cfg.minScore, offline,
      // Сравнивать заметку с ней же бессмысленно: она совпадёт сама с собой.
      published: published.filter((p) => p.slug !== slug),
    });
    if (r.ok) console.log(`  ok      ${f}`);
    else { bad++; console.log(`  ОТБОЙ   ${f} — ${r.check}: ${r.reason}`); }
  }
  console.log(`\nпроверено ${files.length}, отбраковано ${bad}`);
  process.exit(bad > 0 ? 1 : 0);
}
