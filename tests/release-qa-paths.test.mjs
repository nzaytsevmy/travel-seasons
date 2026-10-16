import test from 'node:test';
import assert from 'node:assert/strict';
import { isReleaseQaPath } from '../scripts/release-qa-paths.mjs';

test('release QA accepts generated Cyrillic tag URLs and existing site paths', () => {
  for (const path of ['/', '/blog/kupibilet-2026/', '/novosti/2026-10/',
    '/blog/tag/%D0%94%D0%B5%D0%BD%D1%8C%D0%B3%D0%B8/',
    '/blog/tag/%D0%9A%D1%83%D0%BF%D0%B8%D0%B1%D0%B8%D0%BB%D0%B5%D1%82/']) {
    assert.equal(isReleaseQaPath(path), true, path);
  }
});

test('release QA rejects alternate origins, traversal, encoded separators and malformed UTF-8', () => {
  for (const path of [null, '', 'https://example.com/', '//example.com/',
    '/blog/tag/../', '/blog/tag/%2e%2e/', '/blog/tag/%2F/', '/blog/tag/%5c/',
    '/blog/tag/%252f/', '/blog/tag/%D0/', '/blog/tag/%zz/',
    '/blog/tag/test/?next=https://example.com', '/blog/tag/test/#fragment',
    '/blog/%D0%94/', '/blog/tag/a%00b/', '/blog/tag/a%0ab/']) {
    assert.equal(isReleaseQaPath(path), false, String(path));
  }
});
