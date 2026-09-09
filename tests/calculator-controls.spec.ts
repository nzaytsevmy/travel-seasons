import { test, expect } from '@playwright/test';

// Переключатели калькулятора («Уровень», «Валюта»): кнопки обязаны сидеть внутри
// своей рамки на любой ширине, подписи — не резаться, на телефоне цель ≥44 точек.
//
// ⛔ 06.09.2026: минимум 44px поставили кнопке, а рамке оставили 40px — тёмная
//    кнопка «Эконом» на десктопе вылезала из рамки на 8 точек (Никита прислал
//    два скриншота: 902 и широкий экран). На @360 тот же минимум перекрывался
//    мобильным правилом, и цели так и оставались 40px — правка июля не работала
//    там, куда целилась, и ломала там, куда не смотрела.
const ШИРИНЫ = [360, 402, 640, 641, 768, 902, 1100, 1101, 1280, 1440];

test('переключатели калькулятора: кнопки внутри рамки на десяти ширинах, на телефоне не мельче 44 точек', async ({ page }) => {
  const беды: string[] = [];
  for (const w of ШИРИНЫ) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/calculator/', { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const out: string[] = [];
      for (const seg of document.querySelectorAll<HTMLElement>('.tc-seg')) {
        const s = seg.getBoundingClientRect();
        const имя = seg.getAttribute('aria-label') || seg.id;
        for (const b of seg.querySelectorAll<HTMLElement>('.tc-seg-btn')) {
          const k = b.getBoundingClientRect();
          const t = (b.textContent || '').trim();
          if (k.top < s.top - 0.5 || k.bottom > s.bottom + 0.5 || k.left < s.left - 0.5 || k.right > s.right + 0.5) {
            out.push(`«${имя}»: кнопка «${t}» вылезает из рамки (кнопка ${Math.round(k.top)}–${Math.round(k.bottom)}, рамка ${Math.round(s.top)}–${Math.round(s.bottom)})`);
          }
          if (innerWidth <= 640 && k.height < 44) out.push(`«${имя}»: кнопка «${t}» ${Math.round(k.height)}px < 44`);
          if (b.scrollWidth > b.clientWidth + 1) out.push(`«${имя}»: подпись «${t}» режется`);
        }
      }
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push('страница едет вбок');
      return out;
    });
    for (const x of r) беды.push(`@${w}: ${x}`);
  }
  expect(беды, беды.join('\n')).toEqual([]);
});
