// Calculate the conservatively sized mobile candidate for the formats emitted
// by the blog template. Unknown expressions fail closed instead of silently
// weakening the 150 KiB cover gate.
export function extractHeroFigure(html) {
  const match = /<figure\b[^>]*\bclass\s*=\s*(?:"[^"]*\bpost-cover\b[^"]*"|'[^']*\bpost-cover\b[^']*'|post-cover(?=[\s>]))/i.exec(html);
  if (!match) return null;
  const end = html.indexOf('</figure>', match.index);
  return end < 0 ? null : html.slice(match.index, end + '</figure>'.length);
}

export function mobileHeroRequiredWidth(sizes, width, height) {
  if (sizes === '100vw' || sizes === '(max-width: 720px) calc(100vw - 2.8rem), 675px') return 824;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('invalid hero size dimensions');
  const cropFactor = (frame) => Math.max(1, Math.ceil((width / height / frame) * 1000) / 1000);
  const mobile = cropFactor(4 / 3);
  const desktop = cropFactor(16 / 9);
  const up = (n, factor) => Math.ceil(n * factor * 1000) / 1000;
  const down = (n, factor) => Math.floor(n * factor * 1000) / 1000;
  const expected = `(max-width: 720px) calc(${up(100, mobile)}vw - ${down(2, mobile)}rem), (max-width: 767px) calc(${up(720, mobile)}px - ${down(2, mobile)}rem), calc(${up(720, desktop)}px - ${down(2.8, desktop)}rem)`;
  if (sizes !== expected) throw new Error('unknown hero sizes');
  const mobileCssPixels = 412 * up(100, mobile) / 100 - 16 * down(2, mobile);
  if (mobileCssPixels <= 0) throw new Error('invalid mobile hero size');
  return Math.max(824, Math.ceil(mobileCssPixels * 2));
}

export function inspectMobileHeroVariant(srcset, requiredWidth, sizeForUrl) {
  const variants = [...(srcset || '').matchAll(/([^\s,]+)\s+(\d+)w/g)]
    .map(match => ({ url: match[1], width: Number(match[2]) }))
    .sort((a, b) => a.width - b.width);
  if (!variants.length) return { problem: 'missing-srcset' };
  const picked = variants.find(value => value.width >= requiredWidth) || variants.at(-1);
  const bytes = sizeForUrl(picked.url);
  if (!Number.isFinite(bytes) || bytes <= 0) return { problem: 'missing-file', ...picked };
  if (bytes > 150 * 1024) return { problem: 'oversized', ...picked, bytes };
  return { problem: null, ...picked, bytes };
}
