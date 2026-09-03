import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkArticleReview, readPostMeta, proseHash } from '../scripts/article-review-gate.mjs';

const post = `---
title: "Пробная"
reviewed: 2026-09-04
authoredBy: writer-a
reviewRef: reviews/blog/probnaya.json
qualityScore:
  topic: 9
  facts: 8.5
  visuals: 7
  experience: 6
  internalLinks: 9
  legal: 10
  overall: 8.3
  ceiling: "До десяти не хватает личной поездки автора и зрелых результатов страницы"
---
текст`;

function fixture(review) {
  const root = mkdtempSync(join(tmpdir(), 'article-review-'));
  mkdirSync(join(root, 'reviews', 'blog'), { recursive: true });
  if (review) writeFileSync(join(root, 'reviews', 'blog', 'probnaya.json'), JSON.stringify(review));
  return root;
}
const good = {
  schemaVersion: 1, slug: 'probnaya', reviewer: 'reviewer-b', reviewedAt: '2026-09-04',
  qualityScore: { topic: 9, facts: 8.5, visuals: 7, experience: 6, internalLinks: 9, legal: 10, overall: 8.3,
    ceiling: 'До десяти не хватает личной поездки автора и зрелых результатов страницы' },
  rationale: 'Факты сверены с двумя первоисточниками, шаблонных оборотов нет, личный опыт не заявлен.',
  risks: [],
};
const meta = readPostMeta(post);

test('шапка читается: дата сверки, автор, ссылка, семь осей и потолок', () => {
  assert.equal(meta.reviewed, '2026-09-04');
  assert.equal(meta.authoredBy, 'writer-a');
  assert.equal(meta.qualityScore.overall, 8.3);
  assert.ok(meta.qualityScore.ceiling.length > 20);
});

test('честный артефакт другого рецензента проходит', () => {
  assert.deepEqual(checkArticleReview({ slug: 'probnaya', meta }, fixture(good)), { ok: true });
});

test('рецензент совпадает с автором — отбой', () => {
  const planted = { ...good, reviewer: 'Writer-A' };
  assert.notEqual(planted.reviewer.toLowerCase(), good.reviewer.toLowerCase(), 'беда не подложилась');
  const r = checkArticleReview({ slug: 'probnaya', meta }, fixture(planted));
  assert.equal(r.ok, false); assert.match(r.reason, /совпадает с authoredBy/);
});

test('оценка в статье не совпадает с оценкой рецензента — отбой', () => {
  const planted = { ...good, qualityScore: { ...good.qualityScore, facts: 9.5 } };
  assert.notEqual(planted.qualityScore.facts, good.qualityScore.facts, 'беда не подложилась');
  const r = checkArticleReview({ slug: 'probnaya', meta }, fixture(planted));
  assert.equal(r.ok, false); assert.match(r.reason, /qualityScore\.facts/);
});

test('потолок переписан автором после оценки — отбой', () => {
  const planted = { ...good, qualityScore: { ...good.qualityScore, ceiling: 'Другой потолок, которого рецензент не писал' } };
  const r = checkArticleReview({ slug: 'probnaya', meta }, fixture(planted));
  assert.equal(r.ok, false); assert.match(r.reason, /ceiling/);
});

test('сверена с 03.09.2026, а артефакта нет — отбой; сверена раньше — проходит без артефакта', () => {
  const noRef = { ...meta, reviewRef: '' };
  const r = checkArticleReview({ slug: 'probnaya', meta: noRef }, fixture(null));
  assert.equal(r.ok, false); assert.match(r.reason, /нет reviewRef/);
  const old = { ...noRef, reviewed: '2026-08-20' };
  assert.deepEqual(checkArticleReview({ slug: 'probnaya', meta: old }, fixture(null)), { ok: true });
});

test('артефакт привязан к тексту: правка после оценки — отбой, пробелы — не правка', () => {
  const hash = proseHash(post);
  const withHash = { ...good, proseHash: hash };
  assert.deepEqual(checkArticleReview({ slug: 'probnaya', meta, proseHash: hash }, fixture(withHash)), { ok: true });
  const edited = proseHash(post.replace('текст', 'текст переписан после оценки'));
  assert.notEqual(edited, hash, 'беда не подложилась');
  const r = checkArticleReview({ slug: 'probnaya', meta, proseHash: edited }, fixture(withHash));
  assert.equal(r.ok, false); assert.match(r.reason, /proseHash/);
  assert.equal(proseHash(post.replace('текст', '  текст \n')), hash, 'пробелы не должны менять хеш');
  const noHash = checkArticleReview({ slug: 'probnaya', meta, proseHash: hash }, fixture(good));
  assert.equal(noHash.ok, false); assert.match(noHash.reason, /нет proseHash/);
});

test('артефакт от другого slug, без даты или с коротким обоснованием — отбой', () => {
  assert.match(checkArticleReview({ slug: 'probnaya', meta }, fixture({ ...good, slug: 'drugaya' })).reason, /другому slug/);
  assert.match(checkArticleReview({ slug: 'probnaya', meta }, fixture({ ...good, reviewedAt: '' })).reason, /reviewedAt/);
  assert.match(checkArticleReview({ slug: 'probnaya', meta }, fixture({ ...good, rationale: 'коротко' })).reason, /rationale/);
});
