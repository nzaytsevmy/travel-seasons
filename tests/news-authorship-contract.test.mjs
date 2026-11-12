import test from 'node:test';
import assert from 'node:assert/strict';
import { newsAuthorshipProblems } from '../scripts/news-authorship-contract.mjs';

function page(type, author, byline) {
  return `<script type="application/ld+json">${JSON.stringify({ '@graph': [
    { '@type': 'Person', '@id': 'https://traveltribe.ru/about/#person' },
    { '@type': type, author: { '@id': author }, publisher: { '@id': 'https://traveltribe.ru/#org' } },
  ] })}</script>${byline}`;
}
for (const [type, cls] of [['NewsArticle', 'nvp-byline'], ['CollectionPage', 'nv-byline'], ['CollectionPage', 'nvt-byline']]) {
  test(`${type}/${cls}: editorial author can coexist with global founder`, () => {
    const html = page(type, 'https://traveltribe.ru/#org', `<p class="${cls}"><a href="/">Редакция TravelTribe</a> · <a href="https://t.me/traveltriberu">@traveltriberu</a></p>`);
    assert.deepEqual(newsAuthorshipProblems(html), []);
  });
  test(`${type}/${cls}: personal authorship is rejected independently of publisher`, () => {
    const html = page(type, 'https://traveltribe.ru/about/#person', `<p class="${cls}">Ведёт <a href="/about/">Никита Зайцев</a></p>`);
    assert.ok(newsAuthorshipProblems(html).some(problem => problem.includes('author must')));
    assert.ok(newsAuthorshipProblems(html).some(problem => problem.includes('Personal attribution')));
  });
}
test('Article without a visible byline is rejected', () => {
  assert.ok(newsAuthorshipProblems(page('NewsArticle', 'https://traveltribe.ru/#org', '')).some(problem => problem.includes('visible editorial byline')));
});
test('Editorial signature includes the public channel', () => {
  const html = page('CollectionPage', 'https://traveltribe.ru/#org', '<p class="nv-byline"><a href="/">Редакция TravelTribe</a></p>');
  assert.ok(newsAuthorshipProblems(html).some(problem => problem.includes('channel link')));
});
test('HTML parsing accepts nested labels, character references and unquoted attributes', () => {
  const html = page('CollectionPage', 'https://traveltribe.ru/#org', '<P class=nv-byline><a href=/><span>Редакция&nbsp;TravelTribe</span></a> · <a href=https://t.me/traveltriberu>@traveltriberu</a></P>');
  assert.deepEqual(newsAuthorshipProblems(html), []);
});
test('A byline-looking string in a script cannot stand in for an editorial signature', () => {
  const html = page('NewsArticle', 'https://traveltribe.ru/#org', '<script>const signature = "<p class=nvp-byline>Редакция TravelTribe</p>";</script>');
  assert.ok(newsAuthorshipProblems(html).some(problem => problem.includes('visible editorial byline')));
});
test('Channel addresses require exact equality, including scheme, host and path', () => {
  for (const url of ['https://example.invalid/https://t.me/traveltriberu', 'https://t.me/traveltriberu.extra', 'http://t.me/traveltriberu']) {
    const html = page('CollectionPage', 'https://traveltribe.ru/#org', `<p class="nv-byline"><a href="/">Редакция TravelTribe</a> · <a href="${url}">@traveltriberu</a></p>`);
    assert.ok(newsAuthorshipProblems(html).some(problem => problem.includes('channel link')), url);
  }
});
