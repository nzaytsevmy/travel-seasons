import { test, expect } from './browser-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { publicPhotoCredits } from '../src/data/photo-credits.js';
import { parseNote } from '../scripts/news-gate.mjs';

const walk = (node: any): any[] => [node, ...(node.childNodes || []).flatMap(walk)];
const text = (node: any): string => ['script', 'style', 'template'].includes(node.tagName) ? ''
  : node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
// Общий типограф сайта меняет дефис числового диапазона на тире и связывает цифры.
// Это не потеря названия работы; буквенный текст и все адреса сверяются полностью.
const normalized = (value: string) => value.replace(/[\u200B\u2060]/g, '').replace(/[–—‑]/g, '-').replace(/(\d)\s*-\s*(?=\d)/g, '$1-').replace(/\s+/gu, ' ').trim();
const attr = (node: any, name: string) => node.attrs?.find((a: any) => a.name === name)?.value || '';
const files = (root: string): string[] => fs.readdirSync(root, { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? files(path.join(root, entry.name)) : [path.join(root, entry.name)]);
function addons(html: string) {
  return walk(parse(html)).filter(node => ['p', 'figcaption', 'small'].includes(node.tagName))
    .map(node => normalized(text(node)))
    .filter(value => /(?:^|[.!?] )(?:Фото(?:графии)?(?: на обложке| обложки)?\s*:|Фотографии (?:свои|городов —)|Кадр .+ — .+лицензи|Авторы по порядку:)/iu.test(value)
      || /(?:CC BY(?:-SA)?|CC0|Wikimedia Commons).*(?:оригинал|Фото)|Фото.*(?:CC BY(?:-SA)?|CC0|Wikimedia Commons)/iu.test(value));
}

test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium-desktop', 'HTML проверяется один раз'));

test('фотографии: на страницах нет приписок об авторах и лицензиях', () => {
  const findings = files('dist').filter(file => file.endsWith('.html') && file !== 'dist/legal/photos/index.html')
    .flatMap(file => addons(fs.readFileSync(file, 'utf8')).map(note => `${file}: ${note}`));
  expect(findings).toEqual([]);
});

test('фотографии: публичная страница сохраняет кредиты и доступна из подвала', () => {
  const html = fs.readFileSync('dist/legal/photos/index.html', 'utf8');
  const nodes = walk(parse(html));
  const allText = normalized(text(parse(html)));
  const links = new Set(nodes.filter(node => node.tagName === 'a').map(node => attr(node, 'href')));
  const records = files('src/content/blog/_images').filter(file => file.endsWith('_credits.json'))
    .flatMap(file => Object.values(JSON.parse(fs.readFileSync(file, 'utf8'))));
  const news = files('src/content/news').filter(file => file.endsWith('.md'))
    .map(file => parseNote(fs.readFileSync(file, 'utf8'), path.basename(file, '.md')));
  for (const credit of publicPhotoCredits(records, news)) {
    expect(allText).toContain(normalized(credit.creator));
    expect(allText).toContain(normalized(credit.title));
    expect(allText).toContain(normalized(credit.license));
    expect(links.has(credit.source), credit.source).toBe(true);
    expect(links.has(credit.licenseUrl), credit.licenseUrl).toBe(true);
    for (const change of credit.changes) expect(allText).toContain(normalized(change));
  }
  const notes = JSON.parse(fs.readFileSync('src/data/photo-credit-notes.json', 'utf8'));
  for (const [slug, article] of Object.entries(notes) as [string, any][]) {
    expect(nodes.some(node => node.tagName === 'details' && attr(node, 'id') === slug), slug).toBe(true);
    for (const note of article.notes) expect(allText).toContain(normalized(text(parse(note))));
  }
  for (const file of files('dist').filter(file => file.endsWith('.html'))) {
    const page = walk(parse(fs.readFileSync(file, 'utf8')));
    const footers = page.filter(node => node.tagName === 'footer');
    if (footers.length) expect(footers.some(footer => walk(footer).some(node => node.tagName === 'a' && attr(node, 'href') === '/legal/photos/')), file).toBe(true);
  }
});

test('фотографии: сторож отличает кредит от описания места', () => {
  expect(addons('<p><em>Фото: Niels Lange, <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>; оригинал.</em></p>')).toHaveLength(1);
  expect(addons('<figcaption>Фотографии: Автор (CC BY-SA).</figcaption>')).toHaveLength(1);
  expect(addons('<p>Деталь комплекса Риннодзи.</p><figcaption>Пляж Ахарэн на островах Кэрама.</figcaption>')).toEqual([]);
});
