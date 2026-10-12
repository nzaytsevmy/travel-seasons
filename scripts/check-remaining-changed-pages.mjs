import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contentFileToUrl, MAX_PAGES } from './structural-checks.mjs';

export function remainingStructuralBatches(raw) {
  const files = raw.split('\n').map((file) => file.trim()).filter(Boolean);
  const unmapped = files.filter((file) => /^src\/content\/(blog|news)\//.test(file)
    && !file.includes('/_images/') && /\.mdx?$/.test(file) && !contentFileToUrl(file));
  if (unmapped.length) throw Error(`Unmapped changed articles: ${unmapped.join(', ')}`);
  const urls = files.map(contentFileToUrl).filter(Boolean);
  const batches = [];
  for (let offset = MAX_PAGES; offset < urls.length; offset += MAX_PAGES) {
    batches.push(urls.slice(offset, offset + MAX_PAGES));
  }
  return batches;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.env.CHANGED_FILES === undefined) throw Error('CHANGED_FILES must identify the checked checkout.');
  for (const [index, urls] of remainingStructuralBatches(process.env.CHANGED_FILES).entries()) {
    console.log(`Remaining structural batch ${index + 1}: ${urls.join(', ')}`);
    const result = spawnSync('npx', ['playwright', 'test', 'tests/changed-pages-structural.spec.ts',
      '--project=chromium-desktop', '--workers=1',
      `--output=tests/.results/remaining-structural-${index + 1}`], {
      stdio: 'inherit',
      env: { ...process.env, STRUCTURAL_URLS: urls.join(','),
        PLAYWRIGHT_HTML_OUTPUT_DIR: `tests/.html-report/remaining-structural-${index + 1}` },
    });
    if (result.error || result.status !== 0) {
      console.error(result.error?.message || `Remaining structural batch failed: ${result.status}`);
      process.exit(result.status || 1);
    }
  }
}
