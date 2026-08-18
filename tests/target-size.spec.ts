import { test, expect } from '@playwright/test';

/**
 * Размер кликабельных целей — критерий WCAG 2.2 §2.5.8 (Target Size Minimum).
 *
 * Замер 18.08.2026 на главной нашёл девять целей мельче 24×24 px: строка
 * «Ещё 33 в сезоне — показать все» высотой 18 px, ссылка на канал в подвале —
 * 14 px, четыре ссылки строки тем — по 16 px. Пальцем в такие попадают со
 * второго раза, а сам критерий обязателен с 2023 года.
 *
 * ⛔ Ссылки ВНУТРИ предложения прозой критерий выводит из-под правила
 * (исключение inline): раздувать их нельзя, поедут межстрочные интервалы.
 * Поэтому проверка смотрит только на то, что стоит отдельным элементом
 * управления, а ссылки внутри абзаца и пункта списка пропускает.
 */
const PAGES = ['/', '/countries/', '/visa/'];

for (const path of PAGES) {
  test(`Размер целей: ${path} — ни одной кликабельной цели мельче 24 px`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');

    const small = await page.evaluate(() => {
      const visible = (el: Element) => {
        const s = getComputedStyle(el as HTMLElement);
        const b = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0;
      };
      return [...document.querySelectorAll('a,button,[role=button],input,select,summary')]
        .filter(visible)
        .filter((el) => !el.closest('p, li'))   // исключение inline: ссылка в предложении
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            t: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        })
        .filter((x) => x.h < 24 || x.w < 24);
    });

    expect(small, `цели мельче 24 px:\n${small.map((x) => `  ${x.t} — ${x.w}×${x.h}`).join('\n')}`).toEqual([]);
  });
}
