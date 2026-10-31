import { test, expect } from '@playwright/test';
import { checkPageStructure } from '../scripts/structural-checks.mjs';

// Acceptance for this package: include360px, which is outside the existing
// four-width release checker. Uses the ordinary CI preview and its exact build.
const widths = [360, 402, 768, 1024, 1280];
const packingCases = [
  ['/packing/egypt/', true],
  ['/packing/egypt/october/', true],
  ['/packing/egypt/november/', true],
  ['/packing/egypt/september/', false],
  ['/packing/egypt/december/', false],
  ['/packing/armenia/', false],
  ['/packing/nepal/november/', false],
] as const;
const guidePaths = [
  '/blog/hurghada-sharm-2026/',
  '/blog/kair-iz-hurgady/',
  '/blog/bolshoy-egipetskiy-muzey/',
];

for (const width of widths) {
  for (const [path, expected] of packingCases) {
    test(`paid package: packing ${path} at${width}`, async ({ page }) => {
      expect(await checkPageStructure(page, path, width)).toEqual([]);
      const region = page.getByRole('region', { name: 'Выбрать маршрут по Египту', exact: true });
      await expect(region).toHaveCount(expected ? 1 : 0);
      if (path.split('/').filter(Boolean).length === 3) {
        await expect(page.getByRole('heading', { name: /^Погода / })).toBeVisible();
        const checkbox = page.locator('main input[type="checkbox"]').first();
        await checkbox.focus();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await page.keyboard.press('Space');
        await expect(checkbox).not.toBeChecked();
      }
      if (expected) {
        await expect(region.locator('a').first()).toHaveAttribute('href', guidePaths[0]);
        expect(await region.locator('a').evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(guidePaths);
        await expect(region.locator('li p')).toHaveCount(3);
        const cairo = region.getByRole('link').nth(1);
        await cairo.focus();
        await expect(cairo).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/blog\/kair-iz-hurgady\/$/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Каир из Хургады');
      }
    });
  }

  for (const slug of ['georgia-insurance-2026', 'strahovka-dlya-trekkinga-v-nepale', 'gde-ostanovitsya-v-erevane', 'kair-iz-hurgady']) {
    test(`paid package: article ${slug} at${width}`, async ({ page }, info) => {
      expect(await checkPageStructure(page, `/blog/${slug}/`, width)).toEqual([]);
      const images = page.locator('.prose img');
      expect(await images.count()).toBeGreaterThanOrEqual(4);
      expect(await images.evaluateAll(nodes => nodes.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
      if (width <= 402) {
        const cells = page.locator('.table-wide td[data-label]:not(:first-child)');
        expect(await cells.count()).toBeGreaterThan(0);
        expect(await cells.first().evaluate(cell => getComputedStyle(cell, '::before').content)).not.toBe('none');
      }
      if (info.project.name === 'chromium-desktop') {
        await info.attach(`${slug}-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      }
    });
  }
}
