import { test, expect } from '@playwright/test';
import { targetViolations } from '../scripts/target-size.mjs';

const PAGES = ['/', '/countries/', '/visa/'];
async function checkPageTargets(page, path) {
  await page.goto(path);
  await page.waitForLoadState('load');
  expect(await page.evaluate(targetViolations), 'закрытое меню').toEqual([]);
  const burger = page.locator('#burger');
  if (await burger.isVisible()) await burger.click();
  for (const summary of await page.locator('#navmenu summary').all()) {
    await summary.click();
    expect(await page.evaluate(targetViolations), 'открытое меню').toEqual([]);
    await summary.click();
  }
}
for (const path of PAGES) {
  test(`Размер целей: ${path} — размеры и расстояния WCAG 2.5.8`, async ({ page }) => {
    await checkPageTargets(page,path);
  });
}

test('меню на контрольных ширинах 402 и 1280 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'остальные движки проверяют собственные размеры');
  for (const width of [402,1280]) {
    await page.setViewportSize({width,height:900});
    for (const path of PAGES) await checkPageTargets(page,path);
  }
});

test('сторож размеров видит тесные ссылки списка, допускает расстояние и текстовую ссылку', async ({ page }) => {
  await page.setContent(`<style>
    body{margin:0} ul{list-style:none;margin:0;padding:0} li{display:inline-block}
    a{font:10px Arial;display:inline-block;width:12px;height:12px;padding:0}
  </style><ul><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ul>`);
  expect((await page.evaluate(targetViolations)).length).toBe(2);
  await page.addStyleTag({content:'li{margin-right:24px}'});
  expect(await page.evaluate(targetViolations)).toEqual([]);
  await page.setContent('<p>Текст <a href="#a">ссылки</a> и <a href="#b">другой ссылки</a> внутри предложения.</p>');
  expect(await page.evaluate(targetViolations)).toEqual([]);
  await page.setContent('<details><summary style="width:40px;height:40px">Меню</summary><a href="#a" style="width:1px;height:1px">A</a></details>');
  expect(await page.evaluate(targetViolations)).toEqual([]);
});
