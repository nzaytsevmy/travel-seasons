import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

export function scanStyles(root) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(css|astro|scss)$/.test(entry.name)) files.push(path);
    }
  };
  walk(root);
  for (const ext of ['.css', '.astro']) {
    if (!files.some(path => extname(path) === ext)) throw new Error(`Неполный охват: не найдены ${ext} в ${root}`);
  }
  const bad = files.filter(path => /text-wrap\s*:\s*pretty/i.test(
    readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))).map(path => relative(root, path));
  return {scanned: files.length, bad};
}
