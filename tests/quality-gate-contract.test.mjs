import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('обязательный full-site SEO audit работает локально и в CI', async () => {
  const [prePush, buildWorkflow] = await Promise.all([
    read('scripts/pre-push.sh'),
    read('.github/workflows/build.yml'),
  ]);

  assert.match(prePush, /npm run check:seo/,
    'pre-push обещает SEO-гейт, но не запускает его');
  assert.match(buildWorkflow, /npm run check:seo/,
    'PR build обязан проверять canonical, sitemap, schema и orphan по dist');
});
