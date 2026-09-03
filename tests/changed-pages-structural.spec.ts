import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { checkPageStructure, contentFileToUrl, WIDTHS, MAX_PAGES } from '../scripts/structural-checks.mjs';

// Структура изменённых страниц на четырёх ширинах. Пиксельные канарейки и замер скорости
// на правках только контента не запускаются (paths-ignore), поэтому вылет, битая картинка
// или «undefined» в тексте новой статьи иначе доехали бы до прода незамеченными.
const REPO = fileURLToPath(new URL('..', import.meta.url));

function gitLines(...args: string[]): string[] {
  try {
    return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}

function changedContentFiles(): string[] {
  const env = process.env.CHANGED_FILES;
  if (env !== undefined) return env.split('\n').map((s) => s.trim()).filter(Boolean);
  const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
  return [...new Set([
    ...gitLines('ls-files', '--others', '--exclude-standard', '--', 'src/content'),
    ...gitLines('diff', '--name-only', '--', 'src/content'),
    ...gitLines('diff', '--name-only', '--staged', '--', 'src/content'),
    ...gitLines('diff', '--name-only', `${base}...HEAD`, '--', 'src/content'),
  ])];
}

const urls: string[] = process.env.STRUCTURAL_URLS
  ? process.env.STRUCTURAL_URLS.split(',').map((s) => s.trim()).filter(Boolean)
  : changedContentFiles().map(contentFileToUrl).filter((u): u is string => Boolean(u));

// Структура меряется в одном браузере: в WebKit семантика overflow-x: clip другая, а предпушевый
// хук без аргументов гоняет все четыре проекта.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'структура меряется только в chromium-desktop');
});

const checked = urls.slice(0, MAX_PAGES);
const overflowed = urls.slice(MAX_PAGES);

test.describe('Структура изменённых страниц', () => {
  test('перечень страниц', () => {
    test.info().annotations.push({ type: 'pages', description: checked.join(', ') || 'изменённых страниц нет' });
    if (overflowed.length) test.info().annotations.push({ type: 'не проверены (потолок)', description: overflowed.join(', ') });
  });
  for (const url of checked) {
    for (const width of WIDTHS) {
      test(`${url} @${width}px: без вылета, битых картинок и мусора`, async ({ page }) => {
        const findings = await checkPageStructure(page, url, width);
        expect(findings, findings.join('\n')).toEqual([]);
      });
    }
  }
});

// Сторож: проверка обязана краснеть на подложенной беде, иначе она пустая.
test('Сторож структуры: подложенная битая вёрстка краснеет на 402px', async ({ page }) => {
  // Условия как на сайте: html и body с overflow-x: clip — без этого линейка documentElement.scrollWidth
  // зеленела на любом вылете, и сторож это не ловил (поймано кросс-ревью 03.09.2026).
  const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
    + '<style>html,body{overflow-x:clip}</style></head>'
    + '<body><h1>Пробная страница</h1><div style="width:900px;height:20px;background:#ccc"></div>'
    + '<img src="/net-takoy-kartinki.jpg" width="100" height="100" alt=""><p>цена undefined</p><a href="/">домой</a></body></html>';
  const server = createServer((req, res) => {
    if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); }
    else { res.writeHead(404); res.end(); }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  try {
    const findings = await checkPageStructure(page, `http://127.0.0.1:${port}/`, 402);
    expect(findings.some((f) => f.startsWith('вылет по ширине')), findings.join('\n')).toBe(true);
    expect(findings.some((f) => f.startsWith('битая картинка')), findings.join('\n')).toBe(true);
    expect(findings.some((f) => f.includes('мусорный токен')), findings.join('\n')).toBe(true);
  } finally {
    server.close();
  }
});
