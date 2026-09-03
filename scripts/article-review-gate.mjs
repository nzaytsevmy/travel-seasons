// Гейт независимой оценки статьи блога — по образцу news-gate (checkIndependentReview).
// Статья, сверенная (reviewed) с REVIEW_REQUIRED_FROM и позже, обязана нести authoredBy и
// reviewRef на артефакт reviews/blog/<slug>.json, где reviewer не равен автору, а qualityScore
// совпадает с шапкой статьи число в число. Так «второе мнение» становится проверкой, а не
// обещанием в промте. Гейт применяется к ТРОНУТЫМ статьям (см. tests/content-invariants.spec.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const REVIEW_REQUIRED_FROM = '2026-09-03';
export const AXES = ['topic', 'facts', 'visuals', 'experience', 'internalLinks', 'legal', 'overall'];
const fail = (reason) => ({ ok: false, reason });
const pass = { ok: true };

function isoDay(value) {
  if (!value) return null;
  const s = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// Читает из шапки статьи только то, что нужно гейту. Разбор намеренно плоский и
// совпадает с тем, как тест «Честный потолок» читает qualityScore.
export function readPostMeta(raw) {
  const fm = raw.split('---')[1] ?? '';
  const scalar = (key) => fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]*)["']?\\s*$`, 'm'))?.[1]?.trim() ?? '';
  const block = fm.match(/^qualityScore:\s*\n((?:\s{2}\S.*\n?)*)/m)?.[1] ?? '';
  const qualityScore = {};
  for (const key of AXES) {
    const v = block.match(new RegExp(`^  ${key}:\\s*(\\d+(?:\\.\\d+)?)\\s*$`, 'm'))?.[1];
    if (v !== undefined) qualityScore[key] = Number(v);
  }
  const ceiling = block.match(/^  ceiling:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  if (ceiling) qualityScore.ceiling = ceiling;
  return {
    reviewed: isoDay(scalar('reviewed')),
    authoredBy: scalar('authoredBy'),
    reviewRef: scalar('reviewRef'),
    qualityScore,
  };
}

// Хеш прозы статьи (без шапки, пробелы схлопнуты): рецензент кладёт его в артефакт, и гейт
// доказывает, что оценивался ИМЕННО этот текст. Правка после оценки — хеш разошёлся, гейт красный.
// Получить: node scripts/article-review-gate.mjs hash src/content/blog/<slug>.mdx
export function proseHash(raw) {
  const body = raw.split('---').slice(2).join('---');
  return createHash('sha256').update(body.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
}

export function checkArticleReview(post, root = process.cwd()) {
  const { slug, meta } = post;
  const required = Boolean(meta.reviewed && meta.reviewed >= REVIEW_REQUIRED_FROM);
  const ref = meta.reviewRef?.trim();
  if (!ref) return required ? fail(`статья сверена ${meta.reviewed}, но нет reviewRef с независимой оценкой`) : pass;
  if (!/^reviews\/blog\/[a-z0-9][a-z0-9-]*\.json$/.test(ref)) {
    return fail(`reviewRef вне reviews/blog или с небезопасным именем: ${ref}`);
  }
  const authoredBy = meta.authoredBy?.trim();
  if (!authoredBy) return fail('нет authoredBy: независимость рецензента нечем проверить');

  let review;
  try {
    review = JSON.parse(readFileSync(join(root, ref), 'utf8'));
  } catch (error) {
    return fail(`артефакт оценки не читается: ${error.message}`);
  }
  if (review.slug !== slug) return fail(`артефакт относится к другому slug: ${review.slug ?? 'нет'}`);
  if (!review.reviewer || typeof review.reviewer !== 'string') return fail('в артефакте нет reviewer');
  if (review.reviewer.trim().toLowerCase() === authoredBy.toLowerCase()) {
    return fail('reviewer совпадает с authoredBy — оценка не независимая');
  }
  const reviewedAt = isoDay(review.reviewedAt);
  if (!reviewedAt) return fail('в артефакте нет корректного reviewedAt');
  if (meta.reviewed && reviewedAt < meta.reviewed) return fail(`reviewedAt ${reviewedAt} раньше reviewed ${meta.reviewed}`);

  const qs = review.qualityScore;
  if (!qs || typeof qs !== 'object') return fail('в артефакте нет qualityScore рецензента');
  for (const key of AXES) {
    if (typeof qs[key] !== 'number') return fail(`в артефакте нет qualityScore.${key}`);
    if (meta.qualityScore[key] !== qs[key]) {
      return fail(`qualityScore.${key} в статье ${meta.qualityScore[key]} не совпадает с оценкой рецензента ${qs[key]}`);
    }
  }
  const ceilingInPost = (meta.qualityScore.ceiling ?? '').trim();
  if (typeof qs.ceiling !== 'string' || qs.ceiling.trim() !== ceilingInPost) {
    return fail('ceiling в статье не совпадает с ceiling рецензента');
  }
  if (typeof review.rationale !== 'string' || review.rationale.trim().length < 40) {
    return fail('rationale рецензента короче 40 знаков');
  }
  if (post.proseHash) {
    if (typeof review.proseHash !== 'string') return fail('в артефакте нет proseHash — не доказано, что рецензент читал этот текст');
    if (review.proseHash !== post.proseHash) return fail(`proseHash артефакта ${review.proseHash} не совпадает с текстом ${post.proseHash}: статья правилась после оценки`);
  }
  return pass;
}

// CLI: node scripts/article-review-gate.mjs hash <файл статьи>
if (process.argv[1]?.endsWith('article-review-gate.mjs') && process.argv[2] === 'hash') {
  process.stdout.write(proseHash(readFileSync(process.argv[3], 'utf8')) + '\n');
}
