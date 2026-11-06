import { test, expect } from './browser-fixture';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIRECTIONS, MONTHS } from '../src/data/directions.js';
import { видимыйТекст } from './visible-text';

function builtPage(path: string) {
  const html = readFileSync(join('dist', path, 'index.html'), 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  expect(main, path).toBeTruthy();
  const text = видимыйТекст(main ?? '').replace(/[\u200b\u2060]/g, '').replace(/\s+/g, ' ');
  return { html, text };
}

test('domestic visa and packing pages use domestic documents throughout', () => {
  for (const direction of DIRECTIONS.filter((item) => item.domestic)) {
    const visaPath = `visa/${direction.slug}`;
    const visa = builtPage(visaPath);
    expect(visa.text, visaPath).toMatch(/загранпаспорт не нужен|документы для поездки по России/iu);
    expect(visa.text, visaPath).not.toMatch(/страница для штампа|за въезд берут сбор|безвизовый режим обычно|консульства (Дагестан|Карелия|Алтай|Камчатка)/iu);
    expect(visa.html, visaPath).not.toMatch(/6 месяцев и пустой страницей|виза не нужна, но за въезд берут/iu);
    for (const suffix of ['', ...MONTHS.map((month) => `/${month.slug}`)]) {
      const path = `packing/${direction.slug}${suffix}`;
      const { text } = builtPage(path);
      expect(text, path).toMatch(/паспорт РФ|документ, на который оформлен билет/iu);
      expect(text, path).not.toMatch(/штамп на границе|виза не нужна.{0,55}безвизовый въезд|виза не нужна.{0,32}весь год/iu);
    }
  }
});

test('the catalogue lists all destinations without unverified promises', () => {
  const { html, text } = builtPage('visa');
  for (const direction of DIRECTIONS) expect(html).toContain(`href="/visa/${direction.slug}/"`);
  expect(text).not.toMatch(/в Шенгене только частично|через турагентство|Шенген — мультивизы для россиян отменены|\$50–100 на день поездки/iu);
});
