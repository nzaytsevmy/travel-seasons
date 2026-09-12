import { test, expect } from '@playwright/test';

// Строка разделов направления: раскладка на ширинах живых телефонов.
//
// ⛔ 12.09.2026 Никита показал на страницу Кипра: пятый раздел «Сравнить» падал на вторую
//    строку ОДИН — некрасивый перенос (его правило 10.09.2026). Замер брендовым шрифтом:
//    до 340 px пять разделов и так ложатся 3+2, с 430 px влезают в одну строку, между ними
//    выходило 4+1. Полосу 330–429 px чиним равными колонками по три.
//
// ⛔ Почему проверка по ширинам, а не «на глаз»: правило держится на ширине подписей
//    брендовым шрифтом. Переименуют раздел — полоса сдвинется, и одинокий пятый вернётся
//    молча. Здесь он краснеет.
//
// ⛔ Почему перезаход: шрифт бренда подключён с font-display:optional. Если файл не успел к
//    первой раскладке, страница живёт с запасным шрифтом — он уже, и все пять влезают в
//    строку даже там, где брендовым не влезают. Тогда проверка мерила бы не тот вид.
const ШИРИНЫ = [320, 360, 375, 390, 402, 414, 430, 480, 768, 1024, 1280];

test('строка разделов не оставляет один раздел на строке', async ({ page }) => {
  const плохие: string[] = [];
  await page.goto('/turkey/');
  await page.reload();                       // шрифт из кеша — раскладка брендовая
  for (const w of ШИРИНЫ) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const as = Array.from(document.querySelectorAll<HTMLElement>('.dt-a'));
      const строки: Record<number, number> = {};
      for (const a of as) {
        const t = Math.round(a.getBoundingClientRect().top);
        строки[t] = (строки[t] || 0) + 1;
      }
      const линии = Object.keys(строки).map(Number).sort((x, y) => x - y).map((k) => строки[k]);
      return {
        линии,
        всего: as.length,
        вылез: as.some((a) => a.getBoundingClientRect().right > window.innerWidth + 1),
        низкая: as.some((a) => a.getBoundingClientRect().height < 44),
      };
    });
    if (!r.всего) { плохие.push(`${w} px: строки разделов нет вовсе`); continue; }
    if (r.линии.length > 1 && r.линии[r.линии.length - 1] === 1) плохие.push(`${w} px: один раздел на последней строке (${r.линии.join('+')})`);
    if (r.линии.length > 2) плохие.push(`${w} px: разделы разъехались на ${r.линии.length} строки (${r.линии.join('+')})`);
    if (r.вылез) плохие.push(`${w} px: раздел вылезает за экран`);
    if (r.низкая) плохие.push(`${w} px: цель для пальца ниже 44 px`);
  }
  expect(плохие, `раскладка строки разделов:\n${плохие.join('\n')}`).toEqual([]);
});

// ⛔ Подпись вкладки «Когда ехать» обязана совпадать с общим расчётом лучших месяцев.
//    12.09.2026 компонент считал месяцы заново и брал ПЕРВЫЙ месяц с оценкой «хорошо»:
//    у Норвегии сводка говорила «июнь–август», а вкладка вела в январь. Расхождение было
//    у 58 направлений из 77. Сторож читает СОБРАННЫЕ страницы, поэтому ловит именно то, что
//    увидит читатель, а не повторяет логику компонента.
test('подпись вкладки «Когда ехать» совпадает с общим расчётом месяцев', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { DIRECTIONS } = await import('../src/data/directions.js');
  const { месяцыНаправления } = await import('../src/utils/best-months.js');
  const DIST = process.env.DIST_DIR || join(process.cwd(), 'dist');
  const плохие: string[] = [];
  let проверено = 0;
  for (const d of DIRECTIONS as any[]) {
    const f = join(DIST, d.slug, 'index.html');
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    const m = html.match(/title="Лучший месяц — ([^"]+)"/);
    if (!m) continue;
    проверено++;
    const подпись = m[1].replace(/[\u00A0\u2060]/g, ' ').trim();
    const { bestMonths } = месяцыНаправления(d) as any;
    const ожидается = bestMonths?.[0]?.nom;
    if (ожидается && подпись !== ожидается) плохие.push(`${d.slug}: вкладка «${подпись}», расчёт «${ожидается}»`);
  }
  expect(проверено, 'ни одной собранной страницы направления не нашлось — сначала собрать сайт').toBeGreaterThan(10);
  expect(плохие, `подпись вкладки спорит с расчётом (${плохие.length} из ${проверено}):\n${плохие.slice(0, 10).join('\n')}`).toEqual([]);
});
