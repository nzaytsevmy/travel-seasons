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
  // Обращения чата к пользователю — второй проход по полному документу
  // (research/wikipedia-signs-of-ai-writing.wiki, раздел «Communication
  // intended for the user»): «I hope this helps», «Would you like…»,
  // «Certainly!» и русские аналоги. В тексте сайта им взяться неоткуда,
  // кроме вставки из чата — порог ноль.
  [/I hope this helps/i, 'обращение чата «I hope this helps»'],
  [/Would you like me to/i, 'обращение чата «Would you like me to…»'],
  [/is there anything else/i, 'обращение чата «is there anything else»'],
  [/as an AI (language )?model/i, 'самоописание «as an AI model»'],
  [/(^|[>\s])(Надеюсь, это поможет|Чем ещё могу помочь|Хотите, я)/im, 'русское обращение чата'],
  [/как (языковая модель|ИИ[- ]модель)/i, 'русское самоописание модели'],
  [/utm_source=(chatgpt|openai|gemini|perplexity|copilot)/i, 'партнёрская метка перехода из чата в ссылке'],
  [/referrer=grok\.com/i, 'метка перехода Grok в ссылке'],
  // Полное чтение первоисточника (research/wikipedia-signs-of-ai-writing.wiki,
  // 28.08.2026) добрало хвосты, которых не было в выжимке: маркеры Grok и
  // Perplexity, лентикулярные сноски DeepSeek, стрелку возврата сноски,
  // заглушки-шаблоны и катофф-дисклеймеры. У всех порог ноль.
  [/grok[-_](card|render_citation)/i, 'служебная метка Grok'],
  [/attributableIndex/i, 'служебная метка ChatGPT «attributableIndex»'],
  [/ppl-ai-file-upload/i, 'файловая ссылка Perplexity'],
  [/\[(attached_file|web):\s*\d/i, 'метка вложения Perplexity'],
  [/【\d+†/, 'лентикулярная сноска DeepSeek'],
  [/↩/, 'стрелка возврата сноски из чата'],
  [/\[(вставьте|укажите|ваше имя|your name)/i, 'заглушка-шаблон, которую забыли заполнить'],
  [/(INSERT_|PASTE_|_URL_HERE)/, 'заглушка адреса из чата'],
  [/20\d\d-[Xx]{2}-[Xx]{2}/, 'дата-заглушка «20NN-XX-XX»'],
  [/на момент (моего )?последнего обновления/i, 'катофф-дисклеймер модели'],
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
