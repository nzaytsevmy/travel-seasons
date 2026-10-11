import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verifyIndexability } from '../scripts/check-lighthouse-indexability.mjs';

const profiles = [
  ['lighthouserc.json', { performance: 0.9, accessibility: 0.95, 'best-practices': 0.75, seo: 0.95 }],
  ['lighthouserc.mobile.json', { performance: 0.85, accessibility: 0.9, 'best-practices': 0.75, seo: 0.95 }],
];
const otherSEO = ['document-title', 'meta-description', 'http-status-code', 'link-text', 'crawlable-anchors', 'robots-txt', 'image-alt', 'hreflang', 'canonical'];
function matching(config, url) {
  const groups = config.ci.assert.assertMatrix;
  assert.ok(Array.isArray(groups), 'Intentional noindex archives require their own indexability contract');
  const selected = groups.filter(g => new RegExp(g.matchingUrlPattern).test(url));
  assert.equal(selected.length, 1, `Exactly one complete contract must apply to ${url}`);
  return selected[0].assertions;
}
for (const [file, scores] of profiles) {
  const config = JSON.parse(fs.readFileSync(new URL('../' + file, import.meta.url)));
  test(`${file}: indexable pages retain every existing category threshold and three runs`, () => {
    assert.equal(config.ci.collect.numberOfRuns, 3);
    const samples = [...config.ci.collect.url.filter(u => !u.includes('/blog/tag/')), 'https://traveltribe.ru/blog/tag/2026/child/', 'http://localhost:5432/blog/tagged/'];
    for (const url of samples) {
      const rules = matching(config, url);
      for (const [category, score] of Object.entries(scores)) assert.deepEqual(rules['categories:' + category], ['error', { minScore: score }]);
    }
  });
  test(`${file}: archives must stay noindex and pass every other weighted SEO audit`, () => {
    const samples = ['http://localhost:35547/blog/tag/2026/index.html', 'https://traveltribe.ru/blog/tag/2026/', 'http://localhost:4123/blog/tag/%D0%9F%D0%B5%D1%80%D1%83/index.html?x=1#top'];
    for (const url of samples) {
      const rules = matching(config, url);
      assert.equal(rules['categories:seo'], undefined, 'The indexing composite is not a quality score for excluded archives');
      assert.equal(rules['is-crawlable'], undefined, 'Exact noindex status is enforced by the separate report check');
      for (const id of otherSEO) assert.deepEqual(rules[id], ['error', { minScore: 1, aggregationMethod: 'pessimistic' }]);
      for (const category of ['performance', 'accessibility', 'best-practices']) assert.deepEqual(rules['categories:' + category], ['error', { minScore: scores[category] }]);
    }
    assert.ok(config.ci.collect.url.some(u => u.includes('/blog/tag/')), 'Archive coverage must remain');
  });
}

const report = (url, score) => ({ finalUrl: url, audits: { 'is-crawlable': { score }, 'document-title': { score: 1 } }, categories: { seo: { auditRefs: [{ id: 'is-crawlable', weight: 1 }, { id: 'document-title', weight: 1 }] } } });
const tagURL = 'http://localhost:35547/blog/tag/2026/index.html';
const homeURL = 'http://localhost:35547/index.html';
test('Report check requires intended indexability on all three runs', () => {
  const reports = [...Array.from({ length: 3 }, () => report(tagURL, 0)), ...Array.from({ length: 3 }, () => report(homeURL, 1))];
  assert.deepEqual(verifyIndexability(reports, [tagURL, homeURL], 3), { reports: 6, paths: 2 });
  for (const bad of [report(tagURL, 1), report(homeURL, 0), report(tagURL, null)]) assert.throws(() => verifyIndexability([bad]));
  assert.throws(() => verifyIndexability([...reports.slice(0, 2), report(tagURL, 1)]));
  assert.throws(() => verifyIndexability(reports.slice(1), [tagURL, homeURL], 3), /expected 3 Lighthouse runs/);
  assert.throws(() => verifyIndexability([], [tagURL], 3), /No Lighthouse reports/);
  assert.throws(() => verifyIndexability(reports, ['http://localhost/missing/'], 3), /Unexpected Lighthouse URL/);
  const futureAudit = report(tagURL, 0);
  futureAudit.categories.seo.auditRefs.push({ id: 'future-seo-audit', weight: 1 });
  futureAudit.audits['future-seo-audit'] = { score: 0 };
  assert.throws(() => verifyIndexability([futureAudit]), /perfect SEO score/);
});

test('CI runs the indexability check after mandatory Lighthouse collection and assertions', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/lighthouse.yml', import.meta.url), 'utf8');
  assert.match(workflow, /lhci autorun[^\n]*\n\s+node scripts\/check-lighthouse-indexability\.mjs \.lighthouseci "\$CONF"/);
});
