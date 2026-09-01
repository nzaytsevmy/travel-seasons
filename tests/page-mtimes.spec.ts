import { test, expect } from '@playwright/test';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Время последнего изменения у файлов страниц.
//
// ⛔ Зачем. Сервер отвечает роботу «не изменилось» только если время файла старше
//    того, что робот запомнил. Сборка создаёт все файлы заново — и без правки у
//    всех время одинаковое, момент выкладки. Замер по журналам за 19–27.08.2026:
//    Googlebot получил 2 203 полных ответа и НИ ОДНОГО «не изменилось», Яндекс —
//    3 324 и ни одного. За те же дни Google открыл десять августовских статей
//    один раз, Яндекс — 96.
//
//    Поломка молчаливая: сайт работает, страницы на месте, в карте всё верно.
//    Видно только в журналах сервера, куда никто не смотрит.

const КАТАЛОГ = 'dist';
const КАРТА = `${КАТАЛОГ}/sitemap-0.xml`;
const ОБЩАЯ_ОБОЛОЧКА = [
  'astro.config.mjs',
  'src/layouts',
  'src/components/SwissHeader.astro',
  'src/components/CookieConsent.astro',
  'src/styles/global.css',
  'src/scripts/monetization-tracking.js',
  'src/data/monetization.js',
  'src/data/affiliate.js',
];

function гитДатаПутей(пути: string[]): number {
  try {
    const t = execFileSync('git', ['log', '-1', '--format=%ct', '--', ...пути],
      { encoding: 'utf-8' }).trim();
    return t ? +t * 1000 : 0;
  } catch { return 0; }
}

const датаОболочки = гитДатаПутей(ОБЩАЯ_ОБОЛОЧКА);

type Пара = { путь: string; дата: string; файл: string };

function страницы(): Пара[] {
  const xml = readFileSync(КАРТА, 'utf8');
  const out: Пара[] = [];
  for (const m of xml.matchAll(/<loc>https:\/\/traveltribe\.ru([^<]*)<\/loc><lastmod>([^<]*)<\/lastmod>/g)) {
    const путь = m[1];
    const файл = путь.endsWith('/') ? `${КАТАЛОГ}${путь}index.html` : `${КАТАЛОГ}${путь}`;
    if (existsSync(файл)) out.push({ путь, дата: m[2], файл });
  }
  return out;
}

test('1. время файла совпадает с более свежей из дат страницы и общей оболочки', () => {
  const все = страницы();
  expect(все.length, 'страниц из карты не нашлось — сборки нет?').toBeGreaterThan(1500);
  const разошлись = все.map((с) => {
    const было = Math.floor(statSync(с.файл).mtimeMs / 1000);
    const надо = Math.floor(Math.max(new Date(с.дата).valueOf(), датаОболочки) / 1000);
    return { ...с, было, надо };
  }).filter((с) => с.было !== с.надо);
  expect(разошлись.length,
    `у ${разошлись.length} страниц время файла не равно max(карта, оболочка). ` +
    `Первые: ${разошлись.slice(0, 3).map((с) => `${с.путь} (${с.было} вместо ${с.надо})`).join(', ')}. ` +
    `Значит после сборки проставили неверное время: робот или браузер получит ` +
    `протухшую страницу либо будет перекачивать её без причины.`).toBe(0);
});

test('2. изменение общей оболочки действительно поднимает дату старых страниц', () => {
  expect(датаОболочки, 'git-дата общей оболочки не определилась').toBeGreaterThan(0);
  const старшеОболочки = страницы().filter((с) => new Date(с.дата).valueOf() < датаОболочки);
  expect(старшеОболочки.length, 'нет страниц старше общей оболочки — проверять нечего').toBeGreaterThan(100);
  const неПоднялись = старшеОболочки.filter((с) =>
    Math.floor(statSync(с.файл).mtimeMs / 1000) !== Math.floor(датаОболочки / 1000));
  expect(неПоднялись.length,
    `${неПоднялись.length} старых страниц не получили дату общей оболочки`).toBe(0);
});

test('3. страницы вне карты сайта тоже получили дату', () => {
  // ⛔ Роботы ходят и туда: за 19–27.08.2026 на страницы вне карты пришлось
  //    346 заходов из 5 070, причём 84 — на две юридические, не менявшиеся с
  //    10 июля. Без даты они остаются с временем сборки и качаются заново.
  const своё = new Set(страницы().map((с) => с.файл));
  const все: string[] = [];
  const обойти = (д: string) => {
    for (const имя of readdirSync(д, { withFileTypes: true })) {
      const п = `${д}/${имя.name}`;
      if (имя.isDirectory()) обойти(п);
      else if (имя.name === 'index.html') все.push(п);
    }
  };
  обойти(КАТАЛОГ);
  const вне = все.filter((f) => !своё.has(f));
  expect(вне.length, 'страниц вне карты не нашлось — проверять нечего').toBeGreaterThan(50);

  const час = 3600 * 1000;
  // ⛔ «Дата свежее часа» — это ещё не «проставлено сборкой»: страницу могли
  //    честно править прямо перед отправкой. 28.08.2026 переезд палитры тронул
  //    исходник /my/, его git-дата совпала со временем сборки, и гейт не пускал
  //    легитимную правку. Свежая дата — беда только там, где последний коммит
  //    по файлу СТАРШЕ этой даты: значит, дату дала не правка, а сборка.
  // ⛔ Прямая подстановка dist → src находит исходник только у страниц, которые
  //    лежат в репозитории файлом. Страницы из общего шаблона с параметром —
  //    /packing/antarctica/april/ собирается из [country]/[month].astro — она не
  //    находит вовсе, возвращает ноль, и гейт объявляет их «помеченными сборкой».
  //    Всплыло 29.08.2026: правка шаблона сборов покрасила 25 закрытых месяцев
  //    Антарктиды, которые намеренно живут вне карты сайта.
  const исходники = (f: string): string[] => {
    const прямой = f.replace('dist/', 'src/pages/').replace(/index\.html$/, 'index.astro');
    if (existsSync(прямой)) return [прямой];
    // Спускаемся по каталогам, принимая на каждом шаге и точное имя, и [параметр].
    const сегменты = f.replace(/^dist\//, '').replace(/\/index\.html$/, '').split('/');
    let каталоги = ['src/pages'];
    for (let i = 0; i < сегменты.length; i++) {
      const последний = i === сегменты.length - 1;
      const следующие: string[] = [];
      for (const к of каталоги) {
        if (!existsSync(к)) continue;
        for (const з of readdirSync(к, { withFileTypes: true })) {
          const динамическая = /^\[.+\]/.test(з.name);
          if (последний) {
            const имя = з.name.replace(/\.astro$/, '');
            if (з.isFile() && з.name.endsWith('.astro') && (имя === сегменты[i] || /^\[.+\]$/.test(имя))) следующие.push(`${к}/${з.name}`);
            if (з.isDirectory() && (з.name === сегменты[i] || динамическая) && existsSync(`${к}/${з.name}/index.astro`)) следующие.push(`${к}/${з.name}/index.astro`);
          } else if (з.isDirectory() && (з.name === сегменты[i] || динамическая)) следующие.push(`${к}/${з.name}`);
        }
      }
      каталоги = следующие;
      if (!каталоги.length) return [];
    }
    return каталоги.filter((x) => x.endsWith('.astro'));
  };
  const гитДата = (f: string) => {
    let последняя = 0;
    for (const src of исходники(f)) {
      try {
        // Имя файла уходит отдельным доводом, а не склейкой в строку команды:
        // склейку сканер кода справедливо метит как способ подсунуть шелл лишнее.
        const t = execFileSync('git', ['log', '-1', '--format=%ct', '--', src], { encoding: 'utf-8' }).trim();
        if (t) последняя = Math.max(последняя, +t * 1000);
      } catch { /* нет истории — пропускаем */ }
    }
    return последняя;
  };
  const свежие = вне
    .filter((f) => Date.now() - statSync(f).mtimeMs < час)
    .filter((f) => Math.abs(statSync(f).mtimeMs - Math.max(гитДата(f), датаОболочки)) > 10 * 60 * 1000);
  expect(свежие.length,
    `${свежие.length} страниц вне карты помечены временем сборки, а не своей датой. ` +
    `Первые: ${свежие.slice(0, 3).join(', ')}`).toBe(0);
});

test('4. время не в будущем и не за пределами разумного', () => {
  const сейчас = Date.now();
  const год = 365 * 24 * 3600 * 1000;
  const плохие = страницы().filter((с) => {
    const t = statSync(с.файл).mtimeMs;
    return t > сейчас + 24 * 3600 * 1000 || t < сейчас - 3 * год;
  });
  expect(плохие.length, `у ${плохие.length} страниц время в будущем или старше трёх лет`).toBe(0);
});
