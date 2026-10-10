#!/usr/bin/env node
// Predict the existing mobile hero byte gate with Astro's own image service.
import { readFileSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import imageService from 'astro/assets/services/sharp';

export async function checkArticleCover(file, root = process.cwd()) {
  const article = resolve(root, file);
  const inside = (parent, child) => {
    const rel = relative(parent, child);
    return rel && !rel.startsWith('..') && !isAbsolute(rel);
  };
  if (!inside(resolve(root, 'src/content/blog'), article)) throw new Error('Expected a blog source inside this project');
  const raw = readFileSync(article, 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!frontmatter) throw new Error(`${file}: missing frontmatter`);
  const image = frontmatter.match(/^coverImage:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1]?.trim();
  if (!image || !image.startsWith('.')) throw new Error(`${file}: expected a local coverImage`);
  const source = resolve(dirname(article), image);
  if (!inside(resolve(root, 'src'), source)) throw new Error(`${file}: image is outside project sources`);
  const qualityText = frontmatter.match(/^coverQuality:\s*(.*?)\s*$/m)?.[1];
  const quality = qualityText === undefined ? 65 : Number(qualityText);
  if (!Number.isInteger(quality) || quality < 50 || quality > 75) throw new Error(`${file}: coverQuality must be an integer from 50 to 75`);
  const input = readFileSync(source);
  if (input.length > 16 * 1024 * 1024) throw new Error(`${file}: use a web-sized source below 16 MiB`);
  const rendered = await imageService.transform(input, { width: 960, format: 'webp', quality }, {
    service: { config: { limitInputPixels: 25_000_000 } },
  });
  const bytes = rendered.data.byteLength, limitKiB = 150;
  return { ok: bytes <= limitKiB * 1024, file, source: relative(root, source), width: 960, quality, bytes, kib: Math.round(bytes / 1024 * 100) / 100, limitKiB };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const files = process.argv.slice(2);
    if (!files.length) throw new Error('Usage: node scripts/check-article-cover.mjs src/content/blog/<slug>.md[x]');
    let passed = true;
    for (const file of files) {
      const result = await checkArticleCover(file);
      console.log(JSON.stringify(result));
      if (!result.ok) passed = false;
    }
    process.exitCode = passed ? 0 : 1;
  } catch (error) {
    console.error(error.message); process.exitCode = 1;
  }
}
