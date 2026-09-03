import { test, expect } from '@playwright/test';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';

// Готовые HTML должны сохранять дату реального изменения, а не время сборки.
// Иначе Last-Modified не даёт 304, и поисковые роботы перекачивают старые страницы.

const КАТАЛОГ = 'dist';
const КАРТА = `${КАТАЛОГ}/sitemap-0.xml`;
const КОНТРАКТ = JSON.parse(readFileSync(`${КАТАЛОГ}/.page-mtime-contract.json`, 'utf8')) as {
  version: number;
  shellMtimeSeconds: number;
  sitemapPages: number;
  sourcePages: number;
  sourcePageMtimes: Record<string, number>;
};
const датаОболочки = КОНТРАКТ.shellMtimeSeconds * 1000;

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
  expect(КОНТРАКТ.sitemapPages, 'manifest postbuild не совпал с картой').toBe(все.length);
  const разошлись = все.map((с) => {
    const было = Math.floor(statSync(с.файл).mtimeMs / 1000);
    const надо = Math.floor(Math.max(new Date(с.дата).valueOf(), датаОболочки) / 1000);
    return { ...с, было, надо };
  }).filter((с) => с.было !== с.надо);
  expect(разошлись.length,
    `у ${разошлись.length} страниц время файла не равно max(карта, оболочка). ` +
    `Первые: ${разошлись.slice(0, 3).map((с) => `${с.путь} (${с.было} вместо ${с.надо})`).join(', ')}`).toBe(0);
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

  // Постбилд уже однозначно разрешил URL в шаблон и выставил дату. Гейт сверяет
  // готовый dist с точным контрактом этой же сборки, а не повторяет платформозависимый
  // поиск динамического Astro-шаблона.
  expect(КОНТРАКТ.version, 'сборка создала устаревший mtime-контракт').toBe(2);
  expect(КОНТРАКТ.sourcePages, 'постбилд обработал не все страницы вне карты').toBe(вне.length);
  expect(Object.keys(КОНТРАКТ.sourcePageMtimes).length,
    'mtime-контракт не содержит все обработанные страницы').toBe(вне.length);
  const разошлись = вне.map((f) => {
    const ключ = f.replace(/^dist\//, '');
    const было = Math.floor(statSync(f).mtimeMs / 1000);
    const надо = КОНТРАКТ.sourcePageMtimes[ключ];
    return { f, было, надо };
  }).filter((x) => x.надо === undefined || x.было !== x.надо);
  expect(разошлись.length,
    `у ${разошлись.length} страниц вне карты время файла не равно времени, выбранному постбилдом. ` +
    `Первые: ${разошлись.slice(0, 3).map((x) => `${x.f} (${x.было} вместо ${x.надо})`).join(', ')}`).toBe(0);
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
