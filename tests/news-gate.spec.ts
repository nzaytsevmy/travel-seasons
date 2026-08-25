import { test, expect } from '@playwright/test';
import {
  checkDomains,
  checkLinksSubset,
  checkShingles,
  checkCorroboration,
  checkVolatility,
  checkYmylForm,
  checkDedup,
  gradeNote,
  stripHtml,
  checkDepthLink,
  checkTldr,
  checkOwnPhoto,
  loadPublished,
  loadSnapshot,
} from '../scripts/news-gate.mjs';
import { writeSnapshot, snapshotKey } from '../scripts/news-snapshot.mjs';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Гейт ленты /novosti/. Публикация автоматическая, поэтому эти проверки —
// единственное, что стоит между скрапленной страницей и продом.
//
// Разделение обязанностей: модель пишет заметку, а проверяет её скрипт, который
// сам сходил на источник. Проверка, которую делает та же модель, что писала, —
// не проверка.
//
// Каждый тест ниже писался КРАСНЫМ: сначала падал с внятной причиной, потом
// появлялась реализация.

const ALLOWED = ['iucn.org', 'nps.gov', 'kdmid.ru'];

const baseNote = {
  slug: '2026-08-01-test',
  data: {
    title: 'Тестовая заметка',
    date: new Date('2026-08-01'),
    checked: new Date('2026-08-01'),
    topic: 'nature',
    impact: 'medium',
    score: 5,
    countries: [],
    sources: [{ name: 'IUCN', url: 'https://iucn.org/press-release/x' }],
  },
  body: 'Обычный текст заметки без ссылок и без волатильных формулировок.',
};

test('домен источника вне белого списка — отбой', () => {
  const bad = { ...baseNote, data: { ...baseNote.data,
    sources: [{ name: 'Чужой сайт', url: 'https://example-travel-blog.com/news/1' }] } };
  expect(checkDomains(bad, ALLOWED).ok).toBe(false);
  expect(checkDomains(baseNote, ALLOWED).ok).toBe(true);
});

test('поддомен разрешённого домена проходит, похожий чужой — нет', () => {
  const sub = { ...baseNote, data: { ...baseNote.data,
    sources: [{ name: 'IUCN', url: 'https://www.iucn.org/press-release/x' }] } };
  expect(checkDomains(sub, ALLOWED).ok).toBe(true);

  // Классический обход: «iucn.org.evil.com» заканчивается не на разрешённый домен,
  // а «notiucn.org» — заканчивается, если сравнивать голым endsWith без точки.
  const spoof = { ...baseNote, data: { ...baseNote.data,
    sources: [{ name: 'Подделка', url: 'https://notiucn.org/x' }] } };
  expect(checkDomains(spoof, ALLOWED).ok).toBe(false);
});

test('ссылка в теле заметки, которой нет среди источников — отбой', () => {
  const injected = { ...baseNote,
    body: 'Подробности [здесь](https://iucn.org/press-release/x) и ещё [тут](https://evil.example/pwn).' };
  const r = checkLinksSubset(injected);
  expect(r.ok).toBe(false);
  expect(r.reason).toContain('evil.example');

  const clean = { ...baseNote, body: 'Подробности [здесь](https://iucn.org/press-release/x).' };
  expect(checkLinksSubset(clean).ok).toBe(true);
});

test('дословный кусок источника в заметке — отбой', () => {
  const sourceText = 'The numbat has improved in status thanks to decades of sustained conservation action in Australia';
  const copied = { ...baseNote, body: 'Как пишут: the numbat has improved in status thanks to decades of sustained conservation action.' };
  expect(checkShingles(copied, [sourceText]).ok).toBe(false);

  const retold = { ...baseNote, body: 'Нумбат сменил категорию после сорока лет работы по восстановлению вида.' };
  expect(checkShingles(retold, [sourceText]).ok).toBe(true);
});

test('заявленное число не найдено на странице источника — отбой', () => {
  const page = 'Population has grown from around 300 individuals to between 2,000 and 3,000.';
  expect(checkCorroboration('Численность выросла до 3000 особей', [page]).ok).toBe(true);
  expect(checkCorroboration('Численность выросла до 9500 особей', [page]).ok).toBe(false);
});

test('год не считается заявленным фактом и не валит заметку', () => {
  // Живой прогон 01.08.2026 отбраковал верную заметку про перепись тигров: «2025»
  // не нашлось на странице, потому что источник писал «this year». Год — контекст
  // фразы, а не цифра, которую заметка утверждает.
  const page = 'Nepal completed its tiger census this year, counting 355 individuals.';
  expect(checkCorroboration('Перепись 2025 года насчитала 355 тигров', [page]).ok).toBe(true);

  // Настоящие числа проверяться не перестают.
  expect(checkCorroboration('Перепись 2025 года насчитала 999 тигров', [page]).ok).toBe(false);
  // И четырёхзначное не-годом остаётся под проверкой.
  expect(checkCorroboration('Мостки длиной 2750 метров', [page]).ok).toBe(false);
});

test('волатильная формулировка — отбой', () => {
  const volatile1 = { ...baseNote, body: 'Аэропорт сегодня работает штатно, задержек нет.' };
  expect(checkVolatility(volatile1).ok).toBe(false);
  expect(checkVolatility(baseNote).ok).toBe(true);
});

test('визовая заметка без честного статуса — отбой', () => {
  const noStatus = { ...baseNote, data: { ...baseNote.data, topic: 'visa' } };
  expect(checkYmylForm(noStatus).ok).toBe(false);

  const withStatus = { ...baseNote, data: { ...baseNote.data, topic: 'visa', status: 'принято, не вступило' } };
  expect(checkYmylForm(withStatus).ok).toBe(true);

  // Для природы статус не обязателен.
  expect(checkYmylForm(baseNote).ok).toBe(true);
});

test('дубль по заголовку — отбой', () => {
  const published = [
    { slug: 'a', title: 'Нумбата понизили в Красном списке', sources: ['https://iucn.org/press-release/x'] },
  ];
  const sameTitle = { ...baseNote, data: { ...baseNote.data,
    title: '  нумбата  ПОНИЗИЛИ в красном списке ',
    sources: [{ name: 'IUCN', url: 'https://iucn.org/press-release/other' }] } };
  expect(checkDedup(sameTitle, published).ok).toBe(false);

  const fresh = { ...baseNote, data: { ...baseNote.data,
    title: 'Другая новость про другое',
    sources: [{ name: 'IUCN', url: 'https://iucn.org/press-release/other' }] } };
  expect(checkDedup(fresh, published).ok).toBe(true);
});

// Раньше правило было «тот же источник = дубль», и оно било по живым заметкам:
// нумбат и пустынная лягушка пришли из ОДНОГО обновления Красного списка, но это
// две разные новости. Теперь общий источник сам по себе не приговор — дубль
// только если вдобавок совпадает больше половины значимых слов заголовка.
test('один пресс-релиз даёт две разные новости — пропускаем, а повтор ловим', () => {
  const published = [
    { slug: 'numbat', title: 'Нумбата понизили в Красном списке', sources: ['https://iucn.org/press-release/x'] },
  ];
  const otherStory = { ...baseNote, data: { ...baseNote.data,
    title: 'Пустынную лягушку впервые внесли в Красный список' } };
  expect(checkDedup(otherStory, published).ok).toBe(true);

  const rewordedSame = { ...baseNote, data: { ...baseNote.data,
    title: 'Нумбата понизили в списке Красном' } };
  expect(checkDedup(rewordedSame, published).ok).toBe(false);
});

// Заметка без своего снимка неизбежно берёт запасной кадр из архива по теме, а
// он у соседних заметок одной темы один и тот же — так в ленте и оказались три
// одинаковые картинки подряд.
test('заметка без своего снимка — отбой', () => {
  expect(checkOwnPhoto(baseNote).ok).toBe(false);
  const withPhoto = { ...baseNote, data: { ...baseNote.data, image: './_images/x.jpg' } };
  expect(checkOwnPhoto(withPhoto).ok).toBe(true);
});

// Дедуп сравнивает заметку со списком уже опубликованного, и робот кладёт
// свежие заметки в ту же папку. Без `slug` вызывающий не может исключить
// заметку из сравнения с самой собой — и тогда каждая заметка сама себе дубль.
test('список опубликованного помечает заметки slug-ом', () => {
  const published = loadPublished(process.cwd());
  expect(published.length).toBeGreaterThan(0);
  const fromFeed = published.filter((p) => p.slug);
  expect(fromFeed.length).toBeGreaterThan(0);
  expect(new Set(fromFeed.map((p) => p.slug)).size).toBe(fromFeed.length);
});

test('оценка ниже порога — отбой', () => {
  expect(gradeNote({ ...baseNote, data: { ...baseNote.data, score: 3 } }, 4).ok).toBe(false);
  expect(gradeNote({ ...baseNote, data: { ...baseNote.data, score: 4 } }, 4).ok).toBe(true);
});

test('заметка без источников вообще — отбой', () => {
  const noSrc = { ...baseNote, data: { ...baseNote.data, sources: [] } };
  expect(checkDomains(noSrc, ALLOWED).ok).toBe(false);
});

test('очистка HTML режет скрипты даже с пробелом в закрывающем теге', () => {
  // CodeQL js/bad-tag-filter: «</script >» — валидный закрывающий тег. Регулярка
  // без \s* его пропускала, и содержимое скрипта утекало в «текст страницы»,
  // где число из JS могло «подтвердить» заметку. Для гейта это дыра, не придирка.
  const html = '<p>видимый текст</p><script >var secret = 987654;</script ><p>ещё текст</p>';
  const out = stripHtml(html);
  expect(out).toContain('видимый текст');
  expect(out).not.toContain('987654');

  // Закрывающий тег может нести и мусорные атрибуты: «</script foo=bar>» парсер
  // тоже закроет. Первая версия правки этого не ловила, CodeQL указал точнее.
  expect(stripHtml('<script>var a=33333;</script\t\n foo=bar>x')).not.toContain('33333');
  expect(stripHtml('<style>.a{top:44444px}</style bar>y')).not.toContain('44444');

  // Обычная форма и атрибуты в открывающем теге тоже не должны ломать очистку.
  expect(stripHtml('<script type="application/ld+json">{"x":11111}</script>a')).not.toContain('11111');
  expect(stripHtml('<style media="print">.a{width:22222px}</style >b')).not.toContain('22222');

  // Разрешив в закрывающем теге ЛЮБЫЕ символы до «>», мы позволили ему проглотить
  // начало следующего скрипта: в «</script <script>» кусок « <script» уходит внутрь
  // закрывашки, первый блок съедает границу второго, и содержимое второго остаётся
  // в тексте. Найдено сканированием кода GitHub (js/incomplete-multi-character-
  // sanitization) 03.08.2026 — и проверено вручную: утечка настоящая, а не придирка.
  // Лечится запретом угловых скобок ВНУТРИ тега: имя тега, атрибуты и «>» — но не «<».
  expect(stripHtml('<script>a</script <script>var s = 55555;</script>t')).not.toContain('55555');
  expect(stripHtml('<style>.a{}</style <style>.b{top:66666px}</style>t')).not.toContain('66666');

  // ⛔ Осознанно НЕ закрываем: «<scr<script>ipt>» — приём обфускации, при котором
  // тег собирается из кусков. Это домен полноценного разборщика HTML, а не регулярки,
  // и в НАШЕЙ сборке такого не бывает: страницы генерит Astro из наших же шаблонов.
  // Если гейт когда-нибудь начнёт читать произвольный чужой HTML — переписать на парсер.
});

test('заметка-тупик без ссылки вглубь сайта — отбой', () => {
  // Яндекс даёт поведенческим 30–45% формулы, а 92% трафика сайта оттуда.
  // Заметка, из которой некуда идти, гонит человека обратно в выдачу — это
  // прямой минус, а не нейтральный исход.
  const deadEnd = { ...baseNote, body: 'Текст без единой ссылки на свои страницы.' };
  expect(checkDepthLink(deadEnd).ok).toBe(false);

  const linked = { ...baseNote, body: 'Подробности в [гиде по Чили](/blog/chile-guide-2026/).' };
  expect(checkDepthLink(linked).ok).toBe(true);

  // Ссылка на внешний источник вглубь сайта не ведёт и не считается.
  const external = { ...baseNote, body: 'Смотри [первоисточник](https://iucn.org/press-release/x).' };
  expect(checkDepthLink(external).ok).toBe(false);

  // Ссылка на саму ленту — тоже не «вглубь», это круг на месте.
  const selfLoop = { ...baseNote, body: 'Ещё в [ленте](/novosti/).' };
  expect(checkDepthLink(selfLoop).ok).toBe(false);
});

test('капсула-ответ обязательна и уложена в 40–60 слов', () => {
  const ok = { ...baseNote, data: { ...baseNote.data,
    tldr: 'Сорок слов ровно столько сколько нужно чтобы ответить сразу и не заставлять читателя искать ответ в теле заметки потому что именно эту капсулу извлекает нейроответ и по ней человек решает читать ли дальше а значит она обязана нести суть' } };
  expect(checkTldr(ok).ok).toBe(true);

  expect(checkTldr({ ...baseNote, data: { ...baseNote.data, tldr: undefined } }).ok).toBe(false);
  expect(checkTldr({ ...baseNote, data: { ...baseNote.data, tldr: 'Слишком коротко.' } }).ok).toBe(false);
});

// Радар смотрит на National Geographic, Smithsonian, Mongabay — а сослаться на
// них было нельзя: в списке стоял только nationalgeographic.org, куда статьи не
// попадают. Робот находил интересное и не мог его опубликовать, отсюда пустые
// дни. Теперь такие издания разрешены — но ⛔ ТОЛЬКО для природы и транспорта.
// Визовый факт по-прежнему только от того, кто его объявил: по нему человек
// планирует поездку и тратит деньги.
const MEDIA = ['nationalgeographic.com', 'smithsonianmag.com'];

test('издание годится для природы, но не для визовой заметки', () => {
  const fromMedia = (topic: string) => ({ ...baseNote, data: { ...baseNote.data, topic,
    status: topic === 'visa' ? 'действует' : undefined,
    sources: [{ name: 'NG', url: 'https://www.nationalgeographic.com/animals/x' }] } });

  expect(checkDomains(fromMedia('nature'), ALLOWED, MEDIA).ok).toBe(true);
  expect(checkDomains(fromMedia('transport'), ALLOWED, MEDIA).ok).toBe(true);

  const visa = checkDomains(fromMedia('visa'), ALLOWED, MEDIA);
  expect(visa.ok).toBe(false);
  expect(visa.reason).toContain('визов');

  // Совсем посторонний домен не проходит ни по одной теме.
  const junk = { ...baseNote, data: { ...baseNote.data,
    sources: [{ name: 'x', url: 'https://random-blog.example/post' }] } };
  expect(checkDomains(junk, ALLOWED, MEDIA).ok).toBe(false);
});

// ── порядок ленты ────────────────────────────────────────────────────────────
// Баг 03.08.2026: свежеопубликованная заметка встала ВТОРОЙ. Обе были датированы
// 31 июля (дата события), сортировка смотрела только на неё, а при равенстве
// порядок решало имя файла: «amboseli» < «dfad» по алфавиту. Читатель видит
// новое не сверху, хотя пришёл именно за новым.
test('лента: при одинаковой дате события сверху та заметка, что проверена позже', async () => {
  const { freshEntries } = await import('../src/data/news.js');
  const mk = (slug: string, date: string, checked: string) => ({
    slug,
    data: { date: new Date(date), checked: new Date(checked) },
  });
  // Порядок на входе намеренно «правильный по алфавиту» — чтобы падало без фикса.
  const entries = [
    mk('amboseli-elephants', '2026-07-31', '2026-08-01'),
    mk('dfad-marine-areas', '2026-07-31', '2026-08-03'),
    mk('iguazu-boardwalk', '2026-07-30', '2026-07-31'),
  ];
  const order = freshEntries(entries as never, new Date('2026-08-03')).map((e: any) => e.slug);
  expect(order[0]).toBe('dfad-marine-areas');
  expect(order[1]).toBe('amboseli-elephants');
  expect(order[2]).toBe('iguazu-boardwalk');
});

// ── что вообще проверять ─────────────────────────────────────────────────────
// ⛔ Баг 09–10.08.2026, лента молчала двое суток. Гейт брал ВСЮ папку новостей,
// а не только сегодняшние заметки. Тайский туристический сайт закрылся от
// ботов, и давно опубликованная заметка про ЮНЕСКО каждую ночь уходила в
// «ОТБОЙ» → шаг workflow удалял её файл → защита «правка удаляет опубликованное,
// мерж только руками» останавливала весь PR, а вместе с ним и свежие заметки.
// Источник может умереть в любой день; это повод чинить ссылку, а не снимать с
// сайта проверенный когда-то факт.
test('в проверку попадают только новые заметки, опубликованные не трогаются', async () => {
  const { filesToCheck } = await import('../scripts/news-gate.mjs');
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const root = mkdtempSync(join(tmpdir(), 'news-gate-'));
  try {
    const dir = join(root, 'src/content/news');
    mkdirSync(dir, { recursive: true });
    // Из pre-push git передаёт GIT_DIR/GIT_WORK_TREE, и временный репозиторий
    // подменяется настоящим — тест падал при каждой отправке и проходил руками.
    const env = { ...process.env };
    for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX', 'GIT_COMMON_DIR']) delete env[k];
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, env });

    writeFileSync(join(dir, '2026-07-27-published.md'), '---\ntitle: "Старая"\n---\n');
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'опубликовано');

    writeFileSync(join(dir, '2026-08-09-fresh.md'), '---\ntitle: "Новая"\n---\n');

    // Нетронутая опубликованная заметка в проверку не идёт.
    expect(filesToCheck(root)).toEqual(['2026-08-09-fresh.md']);

    // А правка опубликованной — идёт: редактору-скептику разрешено поправить
    // слог на месте, и такая правка обязана пройти гейт, а не уехать мимо него.
    writeFileSync(join(dir, '2026-07-27-published.md'), '---\ntitle: "Старая, поправленная"\n---\n');
    expect(filesToCheck(root)).toEqual(['2026-07-27-published.md', '2026-08-09-fresh.md']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// Блок «свежее о направлении» на хабе страны собирается этой функцией. Если она
// начнёт отдавать чужие страны или терять сортировку, хаб будет показывать
// случайные заметки — заметить это глазами на 74 страницах невозможно.
test('свежее о направлении: только заметки этой страны, новые сверху, не больше лимита', async () => {
  const { newsForCountry } = await import('../src/data/news.js');
  const mk = (slug: string, country: string, added: string) => ({
    slug,
    data: { countries: [country], date: new Date(added), checked: new Date(added), added: new Date(added) },
  });
  const entries = [
    mk('old-thai', 'thailand', '2026-07-01'),
    mk('new-thai', 'thailand', '2026-08-09'),
    mk('mid-thai', 'thailand', '2026-08-01'),
    mk('brazil-one', 'brazil', '2026-08-08'),
  ];
  expect(newsForCountry(entries as never, 'thailand').map((e: any) => e.slug))
    .toEqual(['new-thai', 'mid-thai', 'old-thai']);
  expect(newsForCountry(entries as never, 'thailand', 2).map((e: any) => e.slug))
    .toEqual(['new-thai', 'mid-thai']);
  expect(newsForCountry(entries as never, 'japan')).toEqual([]);
});

// ── Снимок первоисточника, снятый браузером ──────────────────────────────────
//
// 19.08.2026 японский МИД и все японские посольства ушли за Akamai: 403 любому
// серверу, из любого места, с любым User-Agent. Гейт требует первоисточник по
// визам — и сам же его не может прочитать, то есть выбрасывал министерства и
// оставлял пересказы. Снимок закрывает эту дыру, но он же сам дыра, если
// принимать его без условий. Тесты ниже стерегут именно условия.

const LONG = 'текст страницы министерства '.repeat(20); // заведомо больше 400 знаков

function tempRoot() {
  const dir = mkdtempSync(join(tmpdir(), 'tt-snap-'));
  mkdirSync(join(dir, 'news/snapshots'), { recursive: true });
  return dir;
}

test('снимка нет — источник не подтверждён', () => {
  const root = tempRoot();
  try {
    const r = loadSnapshot('https://www.mofa.go.jp/a.html', root);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('нет');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('свежий снимок того же адреса засчитывается', () => {
  const root = tempRoot();
  try {
    const url = 'https://www.mofa.go.jp/a.html';
    writeSnapshot(root, { url, title: 'МИД', text: LONG, capturedAt: '2026-08-19' });
    const r = loadSnapshot(url, root, new Date('2026-08-20T00:00:00Z'));
    expect(r.ok).toBe(true);
    expect(r.capturedAt).toBe('2026-08-19');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('снимок, снятый с другого адреса, не подходит под источник', () => {
  const root = tempRoot();
  try {
    // Файл лежит под именем нужного адреса, а внутри — чужая страница.
    // Без сверки адреса так подменяется любой источник любым текстом.
    const url = 'https://www.mofa.go.jp/a.html';
    const body = { url: 'https://example.org/other', title: 'чужое', capturedAt: '2026-08-19', text: LONG };
    writeFileSync(join(root, 'news/snapshots', `${snapshotKey(url)}.json`), JSON.stringify(body), 'utf8');
    const r = loadSnapshot(url, root, new Date('2026-08-20T00:00:00Z'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('другого адреса');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('снимок старше месяца не годится: визовый факт протухает', () => {
  const root = tempRoot();
  try {
    const url = 'https://www.mofa.go.jp/a.html';
    writeSnapshot(root, { url, title: 'МИД', text: LONG, capturedAt: '2026-06-01' });
    const r = loadSnapshot(url, root, new Date('2026-08-19T00:00:00Z'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('переснять');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('дата снятия из будущего не принимается', () => {
  const root = tempRoot();
  try {
    const url = 'https://www.mofa.go.jp/a.html';
    writeSnapshot(root, { url, title: 'МИД', text: LONG, capturedAt: '2026-12-01' });
    const r = loadSnapshot(url, root, new Date('2026-08-19T00:00:00Z'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('будущего');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('обрывок страницы вместо снимка не принимается', () => {
  const root = tempRoot();
  try {
    const url = 'https://www.mofa.go.jp/a.html';
    const body = { url, title: 'МИД', capturedAt: '2026-08-19', text: 'коротко' };
    writeFileSync(join(root, 'news/snapshots', `${snapshotKey(url)}.json`), JSON.stringify(body), 'utf8');
    const r = loadSnapshot(url, root, new Date('2026-08-19T00:00:00Z'));
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('читаемого текста');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// ⛔ 25.08.2026: семь источников обходчика были записаны голыми строками вместо
// объектов. Код читает у них `.url` и `.name`, получает undefined, fetch падает
// с TypeError — и в отчёте семь раз подряд печаталось «undefined — err:TypeError
// — undefined». Со стороны это выглядело как «обходчик выдохся»: список считался
// из 37 источников, а работали 30. Молчаливая потеря семи источников хуже
// падения, поэтому форма записи проверяется тестом.
test('в обходчике нет источников с потерянным именем или адресом', () => {
  const cfg = JSON.parse(readFileSync(join(process.cwd(), 'news/config.json'), 'utf8'));
  const broken = (cfg.radar ?? [])
    .map((s: unknown, i: number) => ({ i, s }))
    .filter(({ s }: { s: any }) => !s || typeof s !== 'object' || !s.name || !s.url || !s.topic);
  expect(broken.map(({ i, s }: { i: number; s: unknown }) => `${i}: ${JSON.stringify(s)}`)).toEqual([]);
});

test('адреса источников разбираются и не повторяются', () => {
  const cfg = JSON.parse(readFileSync(join(process.cwd(), 'news/config.json'), 'utf8'));
  const urls = (cfg.radar ?? []).map((s: any) => String(s.url).replace(/\/+$/, ''));
  for (const u of urls) expect(() => new URL(u)).not.toThrow();
  const dupes = urls.filter((u: string, i: number) => urls.indexOf(u) !== i);
  expect(dupes).toEqual([]);
});
