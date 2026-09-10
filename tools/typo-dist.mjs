// Типограф готового сайта: после сборки прогоняет текст каждой страницы через typo()
// из src/utils/typo.js. Правило Никиты 10.09.2026: «чтобы такого никогда нигде ни в
// одном проекте не было». Раньше типограф вызывали шаблоны поштучно, и всё, что выводили
// график года, погода, бюджет, карточка «на месте», подписи ссылок и часть статей, шло
// без него: проверка «Переносы» нашла 60 разрывов на пяти страницах.
//
// Трогается только текст между тегами. Атрибуты, скрипты, стили, код, SVG и <title>
// остаются байт в байт. Типограф идемпотентен: повторный прогон ничего не меняет.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { typo } from '../src/utils/typo.js';

const TOKEN = /<!--[\s\S]*?-->|<(script|style|pre|code|textarea|svg|title|noscript|math|kbd|samp)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]+>/gi;
// «в <a>Турцию</a>»: предлог в конце куска текста перед ссылкой или выделением —
// внутри одного куска типограф его не видит, потому что следующее слово уже в теге.
const SHORT_TAIL = /(^|[\s(«„])(в|во|с|со|к|ко|у|о|об|от|до|за|на|по|из|при|и|а|но|не|ни|же|ли|бы|для|над|под|без|про|или|что|как) $/i;
const INLINE_OPEN = /^<(a|b|strong|em|i|span|mark|abbr|time|small|sup|sub)\b/i;

export function typoHtml(html) {
  let out = '';
  let last = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(html))) {
    let text = typo(html.slice(last, m.index));
    if (INLINE_OPEN.test(m[0]) && SHORT_TAIL.test(text)) text = `${text.slice(0, -1)} `;
    out += text + m[0];
    last = TOKEN.lastIndex;
  }
  return out + typo(html.slice(last));
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

export default function ttTypography() {
  return {
    name: 'tt-typography',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = htmlFiles(fileURLToPath(dir));
        let changed = 0;
        for (const f of files) {
          const src = readFileSync(f, 'utf8');
          const res = typoHtml(src);
          if (res !== src) { writeFileSync(f, res); changed += 1; }
        }
        logger.info(`типограф: страниц ${files.length}, изменено ${changed}`);
      },
    },
  };
}
