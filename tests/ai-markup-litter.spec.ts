import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Мусор разметки генераторов — по всем страницам сайта, не только тронутым.
 *
 * Источник — редакционный документ Википедии «Signs of AI writing»
 * (WikiProject AI Cleanup): у вставленного из чата текста остаются хвосты
 * служебной разметки, которых в живом тексте не бывает НИКОГДА. Поэтому
 * здесь, в отличие от гейта языка, порог — ноль и охват — весь сайт:
 * ложных срабатываний у этих строк не существует.
 *
 * Ловим: служебные метки ChatGPT (oaicite, contentReference, turn0search),
 * метки Gemini ([cite: …], [span_…]), незапечённый маркдаун в видимом
 * тексте (##, **, ```), обломки разделителей (:::).
 */

const DIST = join(process.cwd(), 'dist');

const ЛИТЕР: [RegExp, string][] = [
  [/oaicite/i, 'служебная метка ChatGPT «oaicite»'],
  [/contentReference/i, 'служебная метка ChatGPT «contentReference»'],
  [/turn\d+(search|view|file)\d+/i, 'служебная метка ChatGPT «turnNsearchN»'],
  [/\[cite:\s*\d/i, 'метка цитаты Gemini «[cite: N]»'],
  [/\[span_\d/i, 'метка Gemini «[span_N]»'],
  [/:::\s*(writing|note|info)/i, 'обломок служебного разделителя «:::»'],
];

// Маркдаун в ВИДИМОМ тексте — отдельно: символы легитимны в <code>/<pre>/<script>,
// поэтому сначала вырезаем эти блоки, потом ищем.
const МАРКДАУН: [RegExp, string][] = [
  [/(^|>)\s*##\s+[А-ЯЁA-Z]/m, 'незапечённый заголовок маркдауна «## …»'],
  [/\*\*[а-яёa-z0-9][^*<>]{2,60}\*\*/i, 'незапечённый жирный маркдауна «**…**»'],
  [/```/, 'незапечённый блок кода «```»'],
];

function страницы(dir: string, из: string[] = []): string[] {
  for (const имя of readdirSync(dir, { withFileTypes: true })) {
    const п = join(dir, имя.name);
    if (имя.isDirectory()) страницы(п, из);
    else if (имя.name.endsWith('.html')) из.push(п);
  }
  return из;
}

test('на страницах нет служебного мусора генераторов', () => {
  const все = страницы(DIST);
  expect(все.length, 'сборка пуста — проверять нечего').toBeGreaterThan(100);

  const беды: string[] = [];
  for (const ф of все) {
    const html = readFileSync(ф, 'utf-8');
    for (const [re, что] of ЛИТЕР) {
      if (re.test(html)) беды.push(`${ф.replace(DIST, '')}: ${что}`);
    }
    // видимый текст: без script/style/code/pre и без атрибутов тегов
    const видимый = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<(code|pre)[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, '>');
    for (const [re, что] of МАРКДАУН) {
      if (re.test(видимый)) беды.push(`${ф.replace(DIST, '')}: ${что}`);
    }
    if (беды.length > 12) break; // первых дюжины хватит для диагноза
  }
  expect(беды, беды.join('\n')).toEqual([]);
});
