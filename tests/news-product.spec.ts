import { test, expect } from './browser-fixture';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkPageStructure, WIDTHS } from '../scripts/structural-checks.mjs';
import { feedEntries } from '../src/data/news.js';
import { inactiveNewsTopicPaths } from '../src/data/news-topics.js';
import { newsFrontmatter } from '../src/data/news-frontmatter.js';

// The new composed route must be tested after the real Astro build, including
// every pagination page. Content-file mapping alone does not cover these URLs.
const root = join(process.cwd(), 'dist', 'novosti', 'tema');
function pages(dir: string, prefix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? pages(join(dir, entry.name), `${prefix}${entry.name}/`)
    : entry.name === 'index.html' ? [prefix] : []);
}
const urls = existsSync(root) ? pages(root, '/novosti/tema/') : [];
const newsRoot = join(process.cwd(), 'dist', 'novosti');
const sourceRoot = join(process.cwd(), 'src', 'content', 'news');
const sourceEntries = readdirSync(sourceRoot).filter(file => /\.mdx?$/.test(file)).map(file => {
  const slug = file.replace(/\.mdx?$/, '');
  const data = newsFrontmatter(readFileSync(join(sourceRoot, file), 'utf8'));
  return { slug, data: { ...data, date: new Date(data.date), checked: new Date(data.checked),
    added: data.added ? new Date(data.added) : undefined } };
});
const cultureSlugs = sourceEntries.filter(entry => entry.data.topic === 'culture' && !entry.data.archived).map(entry => entry.slug);
const allCultureSlugs = sourceEntries.filter(entry => entry.data.topic === 'culture').map(entry => entry.slug);
const inactivePaths = new Set(inactiveNewsTopicPaths(sourceEntries));
const expectedRss = feedEntries(sourceEntries, 60);
const expectedRssCulture = expectedRss.filter(entry => entry.data.topic === 'culture').map(entry => entry.slug);
const archiveUrls = existsSync(newsRoot) ? readdirSync(newsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
  .map(entry => `/novosti/${entry.name}/`) : [];
test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium-desktop'));
test('each news topic has a real built landing page', () => {
  for (const slug of ['vizy-i-vezd', 'transport-i-dostup', 'priroda'])
    expect(urls).toContain(`/novosti/tema/${slug}/`);
  expect(urls).toContain('/novosti/tema/kultura-i-sobytiya/');
});
test('cultural news uses one consistent label, archive and RSS entry', async ({ page, request }) => {
  const archive = '/novosti/tema/kultura-i-sobytiya/';
  const culturePages = urls.filter(url => url.startsWith(archive));
  await page.goto('/novosti/');
  await expect(page.locator(`main a[href="${archive}"]`)).toHaveCount(cultureSlugs.length ? 1 : 0);
  const rss = await request.get('/novosti/rss.xml');
  expect(rss.status()).toBe(200);
  const xml = await rss.text();
  const parsed = await page.evaluate(({ xml, slugs }) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const items = [...doc.querySelectorAll('item')];
    return { invalid: Boolean(doc.querySelector('parsererror')), count: items.length,
      entries: items.flatMap(node => {
        const link = node.querySelector('link')?.textContent || '';
        const slug = slugs.find(value => link.endsWith(`/novosti/${value}/`));
        return slug ? [{ slug, label: node.querySelector('description')?.textContent }] : [];
      }) };
  }, { xml, slugs: allCultureSlugs });
  expect(parsed.invalid).toBe(false);
  expect(parsed.count).toBe(expectedRss.length);
  expect(parsed.entries.map(entry => entry.slug).sort()).toEqual([...expectedRssCulture].sort());
  for (const entry of parsed.entries) expect(entry.label).toContain('Культура и события');
  if (!cultureSlugs.length) {
    expect((await page.goto(archive))?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('main a[href="/novosti/"]').first()).toBeVisible();
    await expect(page.locator('main ol.nvt-list')).toHaveCount(0);
    return;
  }
  expect(culturePages).toHaveLength(Math.ceil(cultureSlugs.length / 30));
  const links: string[] = [];
  for (const url of culturePages) {
    expect((await page.goto(url))?.status()).toBe(200);
    links.push(...await page.locator('main ol.nvt-list a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!)));
  }
  expect(links.sort()).toEqual(cultureSlugs.map(slug => `/novosti/${slug}/`).sort());
  for (const slug of cultureSlugs.slice(0, 3)) {
    expect((await page.goto(`/novosti/${slug}/`))?.status()).toBe(200);
    await expect(page.locator('.nvp-meta')).toContainText('Культура и события');
    await expect(page.locator(`main a[href="${archive}"]`)).toHaveCount(1);
  }
});
for (const url of [...urls, '/novosti/', ...archiveUrls]) {
  for (const width of WIDTHS) {
    test(`news discovery ${url} @${width}`, async ({ page }) => {
      expect(await checkPageStructure(page, url, width)).toEqual([]);
      await expect(page.locator('main h1')).toHaveCount(1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`https://traveltribe.ru${url}`);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      if (inactivePaths.has(url)) expect(robots).toContain('noindex');
      else expect(robots).not.toContain('noindex');
      if (url.startsWith('/novosti/tema/')) {
        const count = await page.locator('main ol.nvt-list > li').count();
        if (inactivePaths.has(url)) expect(count).toBe(0);
        else expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(30);
      }
    });
  }
}
