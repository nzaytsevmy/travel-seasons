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
} from '../scripts/news-gate.mjs';

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
