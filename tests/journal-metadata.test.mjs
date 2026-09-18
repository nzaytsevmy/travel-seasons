import test from 'node:test';
import assert from 'node:assert/strict';
import { journalMetadataProblems } from '../scripts/check-journal-metadata.mjs';

const source = ({ changed = 'Checked current airline conditions.', what = 'Compared the official airline conditions', date = '2026-09-18', updated = date } = {}) =>
  `---\nupdatedDate: ${updated}\nchecks:\n  - date: ${date}\n    what: "${what}"\n    changed: "${changed}"\n---\nArticle body.\n`;
const check = (s) => journalMetadataProblems(s, { rel: 'test.mdx', today: '2026-09-18' });
test('valid checks and an article without checks keep the existing behavior', () => {
  assert.deepEqual(check(source()), []);
  assert.deepEqual(check('---\ntitle: Old article\n---\nBody'), []);
});
test('the 155-character lead regression fails without a build or browser', () => {
  assert.match(check(source({ changed: 'x'.repeat(155) }))[0], /155.*90/);
  assert.deepEqual(check(source({ changed: 'Short first sentence. ' + 'x'.repeat(155) })), []);
});
test('independent cases retain completeness, future-date and freshness checks', () => {
  assert.ok(check(source().replace('    what:', '    missing:')).some(x => /неполные/.test(x)));
  assert.ok(check(source({ date: '2026-09-19' })).some(x => /будущим/.test(x)));
  assert.ok(check(source({ what: 'Short' })).some(x => /что сверяли/.test(x)));
  assert.ok(check(source({ changed: 'Short' })).some(x => /что изменилось/.test(x)));
  assert.ok(check(source({ updated: '2026-09-19' })).some(x => /свежесть без проверки/.test(x)));
});
