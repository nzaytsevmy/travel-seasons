// Перезамер правок денежной логики. Запускается после снятия слепка
// посещаемости: сравнивает страницы из списка проверок с их «до» и пишет
// готовое сообщение для Telegram — вместе с промтом для рабочей сессии,
// чтобы перезамер не зависел от того, кто и когда его вспомнит.
//
// ⛔ Слепок считает скользящее окно 30 дней, поэтому дата «проверять_с»
// ставится так, чтобы бОльшая часть окна была уже ПОСЛЕ правки. Раньше неё
// сравнение смешивает старую и новую страницу и врёт в обе стороны.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CHECKS = 'seo-pulse/remeasure.json';
const TRAFFIC = 'seo-pulse/traffic.json';
const OUT = process.env.REMEASURE_OUT || '/tmp/remeasure.txt';

if (!existsSync(CHECKS) || !existsSync(TRAFFIC)) process.exit(0);
const { checks } = JSON.parse(readFileSync(CHECKS, 'utf8'));
const traffic = JSON.parse(readFileSync(TRAFFIC, 'utf8'));
const today = process.env.REMEASURE_TODAY || new Date().toISOString().slice(0, 10);

const строки = [];
for (const c of checks) {
  if (today < c['проверять_с']) continue;
  const [тип, slug] = c.page.split('/', 2);
  const слаг = c.page.slice(тип.length + 1);
  const т = traffic[тип]?.[слаг];
  if (!т || !т.live) { строки.push(`⚠️ ${слаг}: в свежем слепке нет живых визитов — проверить руками`); continue; }
  const доля = т.partner / т.live * 100;
  const было = c['до']['доля'];
  const дельта = доля - было;
  const знак = дельта >= 0 ? '+' : '';
  строки.push(
    `📊 Перезамер: ${слаг}\n` +
    `Правка (${c['правка_влита']}): ${c['что_правили']}\n` +
    `Было: ${c['до'].partner}/${c['до'].live} = ${было.toFixed(2)}% · ` +
    `Стало: ${т.partner}/${т.live} = ${доля.toFixed(2)}% (${знак}${дельта.toFixed(2)} п.п.)\n` +
    `Критерий: ${c['критерий']}\n\n` +
    `Промт для сессии:\n` +
    `«Перезамер правки страницы ${слаг} на traveltribe.ru. Сравни долю переходов ` +
    `к партнёру в seo-pulse/traffic.json с «до» в seo-pulse/remeasure.json. ` +
    `Помни: мера — прирост доли, не абсолют; окно слепка скользящее 30 дней; ` +
    `сезонный спад не путать с провалом правки — при сомнении сравни только ` +
    `поисковые заходы. Реши по критерию из файла: откатить правку или оставить ` +
    `и закрыть проверку — тогда удали её запись из remeasure.json.»`
  );
}

if (строки.length) {
  writeFileSync(OUT, строки.join('\n\n———\n\n'));
  console.log(`перезамеров готово: ${строки.length}`);
} else {
  console.log('перезамеры: рано или нечего');
}
