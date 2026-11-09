import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteOnlySlugs, withoutSiteOnlyLinks } from '../src/data/site-only-feed.js';

test('праздничные ссылки доступны на сайте и не попадают в стороннюю ленту', () => {
  for (const [file, slug] of [
    ['thailand-guide-2026', 'novyy-god-tailand-2027'],
    ['phuket-samui-2026', 'novyy-god-tailand-2027'],
    ['fukuok-ili-haynan', 'novyy-god-vietnam-2027'],
    ['nyachang-fukuok-2026', 'novyy-god-vietnam-2027'],
    ['chto-vzyat-na-more-2026', 'hram-uluvatu-bali'],
  ]) {
    const source = readFileSync(new URL(`../src/content/blog/${file}.mdx`, import.meta.url), 'utf8');
    const link = `/blog/${slug}/`;
    assert.ok(source.includes(link), `${file}: ссылка на сайте отсутствует`);
    const filtered = withoutSiteOnlyLinks(source);
    assert.ok(!filtered.includes(link), `${file}: ссылка осталась в сторонней ленте`);
    assert.ok(filtered.includes('## '), `${file}: основной текст должен сохраниться`);
  }
  assert.deepEqual([...siteOnlySlugs].sort(), ['hram-uluvatu-bali', 'novyy-god-tailand-2027', 'novyy-god-vietnam-2027']);
  assert.equal(withoutSiteOnlyLinks('Соседний текст без ссылки.\n'), 'Соседний текст без ссылки.\n');
  assert.throws(() => withoutSiteOnlyLinks('Важный текст со [ссылкой](/blog/novyy-god-vietnam-2027/) внутри.'), /отдельной строкой/);
  assert.throws(() => withoutSiteOnlyLinks('[Старый материал](/blog/bali-guide-2026/): Важное описание, а также [новый гид](/blog/novyy-god-tailand-2027/).'), /отдельной строкой/);
  assert.throws(() => withoutSiteOnlyLinks('[Новый гид](/blog/novyy-god-tailand-2027/): Подробнее [здесь](/blog/bali-guide-2026/).'), /отдельной строкой/);
});

test('ссылка на Улувату удаляется из ленты без удаления пункта путеводителя', () => {
  const source = readFileSync(new URL('../src/content/blog/bali-guide-2026.mdx', import.meta.url), 'utf8');
  const line = source.split('\n').find(item => item.includes('/blog/hram-uluvatu-bali/'));
  assert.ok(line);
  const expected = line.replace('[Храм Улувату (Pura Luhur Uluwatu)](/blog/hram-uluvatu-bali/)', 'Храм Улувату (Pura Luhur Uluwatu)');
  const filtered = withoutSiteOnlyLinks(source);
  assert.ok(!filtered.includes('/blog/hram-uluvatu-bali/'));
  assert.ok(filtered.split('\n').includes(expected));
  assert.throws(() => withoutSiteOnlyLinks('Другая [ссылка](/blog/hram-uluvatu-bali/) внутри текста.'), /отдельной строкой/);
  assert.throws(() => withoutSiteOnlyLinks(`${line} [ссылка](/blog/novyy-god-tailand-2027/)`), /Неизвестный формат/);
});
