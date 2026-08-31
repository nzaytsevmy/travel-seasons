import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('плановая публикация следует измеренной очереди трафика', async () => {
  const [prompt, queue] = await Promise.all([
    read('DAILY-ARTICLE-PROMPT.md'),
    read('DAILY-ARTICLE-QUEUE.md'),
  ]);

  assert.match(prompt, /DAILY-ARTICLE-QUEUE\.md/);
  assert.match(prompt, /одн(?:у|а) (?:контентн(?:ую|ая) единиц(?:у|а)|задач[ау])/i);
  assert.match(prompt, /свеж(?:ий|его|ие) (?:замер|данн)/i);
  assert.match(prompt, /каннибализац/i);
  assert.match(prompt, /NEW[\s\S]{0,100}REVISE[\s\S]{0,100}WAVE/i);
  assert.doesNotMatch(prompt, /сначала архив Никиты/i);
  assert.doesNotMatch(prompt, /объ[её]м\s*[—-]\s*от 3[\s ]?000 слов/i);

  for (const required of [
    'Отдых в Черногории после 1 ноября',
    'Когда лучше ехать в Китай',
    'Когда лучше ехать во Вьетнам',
    'Египет по месяцам',
    'country×month',
    'GSC',
    'Яндекс Вебмастер',
    'Вордстат',
    'Wordcraft',
  ]) {
    assert.match(queue, new RegExp(required.replaceAll('×', '[×x]'), 'i'), required);
  }

  assert.match(queue, /\bNEW\b[\s\S]{0,160}Черногори[яи]/i);
  assert.match(queue, /\bREVISE\b[\s\S]{0,160}Китай/i);
  assert.match(queue, /\bREVISE\b[\s\S]{0,160}Вьетнам/i);
  assert.match(queue, /\bREVISE\b[\s\S]{0,160}Египет/i);
  assert.match(queue, /Турци[яи][\s\S]{0,200}(?:не создавать|запрещен|закрыт)/i);
  assert.match(queue, /Кипр[\s\S]{0,200}(?:не создавать|запрещен|закрыт)/i);
  assert.match(queue, /ОАЭ[\s\S]{0,200}(?:не создавать|запрещен|закрыт)/i);
  assert.match(queue, /Мексик[аи][\s\S]{0,200}(?:не создавать|запрещен|закрыт)/i);
});

test('очередь различает новые URL, ревизии и волны существующих страниц', async () => {
  const queue = await read('DAILY-ARTICLE-QUEUE.md');

  assert.match(queue, /NEW[\s\S]{0,240}нов(?:ый|ого) URL/i);
  assert.match(queue, /REVISE[\s\S]{0,240}(?:существующ|каноническ)/i);
  assert.match(queue, /WAVE[\s\S]{0,280}(?:существующ|дубл)/i);
  assert.match(queue, /24 существующ[\s\S]{0,240}Хайнань/i);
  assert.equal(queue.match(/\[ \]/g)?.length, 24);
  assert.doesNotMatch(queue, /\/trips\/\{month\}\/montenegro\/[\s\S]{0,80}(?:создать|добавить)/i);
  assert.match(queue, /2[–-]3 недели/i);
  assert.match(queue, /не публиковать ради выполнения расписания/i);
});

test('Черногория: отпускной интент отделён от визового и связан в обе стороны', async () => {
  const [vacation, visa] = await Promise.all([
    read('src/content/blog/montenegro-after-november-2026.mdx'),
    read('src/content/blog/montenegro-visa-2026.mdx'),
  ]);

  assert.match(vacation, /^title:\s*["']Отдых в Черногории после 1 ноября 2026:/m);
  assert.match(vacation, /\/blog\/montenegro-visa-2026\//);
  assert.match(visa, /\/blog\/montenegro-after-november-2026\//);
  assert.match(vacation, /^## (?:Где жить|Какой курорт)/m);
  assert.match(vacation, /^## Сколько стоит/m);
  assert.match(vacation, /^## (?:Когда ехать|Что с сезоном)/m);

  const images = vacation.match(/^!\[[^\]]+\]\([^)]+\)/gm) ?? [];
  assert.ok(images.length >= 10, `в отпускном гайде ${images.length} иллюстраций, нужно не меньше 10`);
});
