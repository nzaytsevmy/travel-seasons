import { test, expect } from '@playwright/test';

// Показ денежной ссылки — знаменатель для «доли кликов по месту». 08.09.2026 выяснилось,
// что проверить его в скрытой панели браузера нельзя (окна нет, наблюдатель видимости молчит),
// а «код уехал на сайт» за проверку не считается. Этот тест открывает страницу в настоящем
// браузере, прокручивает её и ловит события показа вместе с формой ссылки.
test('Деньги: показ ссылки считается и несёт форму', async ({ page }) => {
  // Слушатель ставится ДО загрузки: наблюдатель успевает отработать по первому экрану
  // раньше, чем страница отдаст управление, и события того экрана иначе теряются.
  await page.addInitScript(() => {
    (window as any).__ttImp = [];
    document.addEventListener('tt:affiliate-impression', (e: any) => {
      (window as any).__ttImp.push(`${e.detail.form}/${e.detail.placement}`);
    });
  });
  await page.goto('/blog/dagestan-guide-2026/');
  // прокрутка по экрану: наблюдатель считает ссылку показанной при видимости половины цели
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(600);
  const seen: string[] = await page.evaluate(() => (window as any).__ttImp || []);
  expect(seen.length, 'ни одного показа денежной ссылки не поймано').toBeGreaterThan(0);
  const forms = new Set(seen.map((s) => s.split('/')[0]));
  expect([...forms].every((f) => ['line', 'button', 'card', 'sticky', 'top_line', 'end_line'].includes(f)),
    `неизвестная форма ссылки: ${[...forms].join(', ')}`).toBe(true);
});

// Сторож самой проверки: если событие показа перестанет нести форму ссылки, тест обязан
// краснеть. Подкладываем ссылку без разметки и убеждаемся, что она формой не считается.
test('Сторож: ссылка без метки места в показах не участвует', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__ttImp = [];
    document.addEventListener('tt:affiliate-impression', (e: any) => {
      (window as any).__ttImp.push(e.detail.cta_id || 'без метки');
    });
  });
  await page.goto('/blog/dagestan-guide-2026/');
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = 'https://example.com/';
    a.textContent = 'подложенная ссылка';
    document.querySelector('.prose')?.prepend(a);
  });
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(500);
  const seen: string[] = await page.evaluate(() => (window as any).__ttImp || []);
  expect(seen.includes('без метки'), 'чужая ссылка попала в показы денежных').toBe(false);
});
