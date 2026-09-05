// Сторож классификатора правок (scripts/edit-kind.mjs): мелкая правка не должна включать
// тяжёлые гейты, а подложная переработка — обязана. Проверяется на синтетических статьях,
// без git: классификатор получает два текста и отвечает, что между ними произошло.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEdit, changedWords, SMALL_EDIT_MAX_WORDS } from '../scripts/edit-kind.mjs';

const words = (n, prefix = 'слово') => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`).join(' ');
const post = ({ title = 'Круиз в Антарктиду 2026', description = 'Сколько стоит и как ехать', body }) =>
  `---\ntitle: "${title}"\ndescription: "${description}"\npubDate: 2026-05-04\n---\n${body}`;
const BODY = [
  '## Когда ехать', 'Был там лично в январе 2025. Сезон ноябрь–март, пик декабрь–февраль.', '',
  '![Голубая стена ледника у воды](./_images/antarctica/iceberg-blue.jpg)', '',
  '## Сколько стоит', `Под ключ из Москвы от 750 000 ₽. ${words(60, 'подробность')}`, '',
  '## Что взять', words(80, 'вещь'),
].join('\n');
const base = post({ body: BODY });

test('исправление даты — мелкая правка: заменены два слова, без новых кадров', () => {
  const r = classifyEdit(base, base.replace('в январе 2025', 'в декабре 2024'));
  assert.equal(r.kind, 'small');
  assert.equal(r.wordsChanged, 2);
  assert.deepEqual(r.newImages, []);
  assert.equal(r.addedLines.length, 1);
  assert.match(r.addedLines[0], /в декабре 2024/);
});

test('правка только шапки (теги, журнал) — не правка прозы', () => {
  const r = classifyEdit(base, base.replace('pubDate: 2026-05-04', 'pubDate: 2026-05-04\ntags: ["Антарктида"]'));
  assert.equal(r.kind, 'meta');
  assert.equal(r.wordsChanged, 0);
});

test(`подложная переработка: больше ${SMALL_EDIT_MAX_WORDS} слов — тяжёлые гейты включены`, () => {
  const r = classifyEdit(base, base.replace('## Что взять', `## Что взять\n${words(SMALL_EDIT_MAX_WORDS + 1, 'новое')}`));
  assert.equal(r.kind, 'rework');
  assert.equal(r.wordsChanged, SMALL_EDIT_MAX_WORDS + 1);
});

test(`ровно ${SMALL_EDIT_MAX_WORDS} слов — ещё мелкая правка`, () => {
  const r = classifyEdit(base, base.replace('## Что взять', `## Что взять\n${words(SMALL_EDIT_MAX_WORDS, 'новое')}`));
  assert.equal(r.kind, 'small');
});

test('смена заголовка — переработка даже без правки прозы', () => {
  const r = classifyEdit(base, post({ title: 'Антарктида: цены 2027', body: BODY }));
  assert.equal(r.kind, 'rework');
  assert.equal(r.titleChanged, true);
  assert.equal(r.wordsChanged, 0);
});

test('смена описания — переработка: описание входит в хеш оценки', () => {
  const r = classifyEdit(base, post({ description: 'Новый сниппет для выдачи', body: BODY }));
  assert.equal(r.kind, 'rework');
  assert.equal(r.descriptionChanged, true);
});

test('новый кадр при мелкой правке — не переработка, но кадр назван', () => {
  const r = classifyEdit(base, base.replace('## Что взять', '![Пингвины на камнях](./_images/antarctica-gentoo.jpg)\n\n## Что взять'));
  assert.equal(r.kind, 'small');
  assert.deepEqual(r.newImages, ['antarctica-gentoo.jpg']);
});

test('перестановка абзацев не считается за изменённые слова', () => {
  const swapped = base.replace('## Что взять\n' + words(80, 'вещь'), '').replace('## Когда ехать', `## Что взять\n${words(80, 'вещь')}\n\n## Когда ехать`);
  assert.equal(changedWords(base, swapped), 0);
});

test('статьи в основе нет — новая, проверяется целиком', () => {
  const r = classifyEdit(null, base);
  assert.equal(r.kind, 'new');
  assert.deepEqual(r.newImages, ['antarctica/iceberg-blue.jpg']);
});
