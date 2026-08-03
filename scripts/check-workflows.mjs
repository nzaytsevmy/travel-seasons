// Проверка расписаний CI на повтор ключей.
//
// ⛔ Зачем отдельный скрипт. 01.08.2026 в одном шаге оказалось два блока `env`.
// Обычный разбор YAML такое прощает — берёт последний и молчит, поэтому локальная
// проверка была зелёной. А GitHub отвергает весь файл целиком: замер скорости не
// запустился вовсе, и в списке проверок его просто НЕ БЫЛО. Это худший вид
// поломки — не красный крест, а тишина, которую легко принять за успех.
//
// Разбираем сами, без библиотеки: нужен ровно один вопрос — не повторяется ли
// ключ на одном уровне вложенности внутри одного блока.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = '.github/workflows';
let bad = 0;

for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
  const lines = readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
  // Ключи, встреченные на каждом уровне отступа. Список элемента (`- `) и любой
  // ключ с меньшим отступом начинают новый блок, то есть сбрасывают накопленное.
  const seen = new Map();
  // Внутри блочного скаляра (`run: |`, `<<'EOF'`) лежит не YAML, а скрипт. Его
  // строки ключами не являются: два `try:` в питоне на одном отступе — обычный
  // код, а не повтор ключа. Ложное срабатывание 03.08.2026 на распараллеленной
  // проверке картинок; подгонять скрипт под сторож было бы хуже, чем починить
  // сторож. Блок кончается, когда отступ вернулся на уровень самого ключа.
  let blockIndent = null;

  lines.forEach((line, i) => {
    if (blockIndent !== null) {
      const indent = line.match(/^(\s*)/)[1].length;
      if (!line.trim() || indent > blockIndent) return;
      blockIndent = null;
    }
    if (/^\s*#/.test(line) || !line.trim()) return;
    // `ключ: |`, `ключ: >`, `ключ: |-` и т.п. открывают блочный скаляр.
    const block = line.match(/^(\s*)(?:-\s+)?[A-Za-z_][\w.-]*:\s*[|>][+-]?\s*$/);
    if (block) blockIndent = block[1].length;
    const m = line.match(/^(\s*)(-\s+)?([A-Za-z_][\w.-]*):(\s|$)/);
    if (!m) return;
    const [, pad, dash, key] = m;
    const depth = pad.length + (dash ? dash.length : 0);

    for (const d of [...seen.keys()]) if (d > depth) seen.delete(d);
    if (dash) seen.delete(depth);          // новый элемент списка — новый блок

    if (!seen.has(depth)) seen.set(depth, new Map());
    const here = seen.get(depth);
    if (here.has(key)) {
      bad++;
      console.log(`  ✖ ${file}:${i + 1} — ключ «${key}» уже был на строке ${here.get(key)}`);
    } else {
      here.set(key, i + 1);
    }
  });
}

console.log(bad === 0 ? '✅ Расписания CI: повторов ключей нет.' : `\n✖ повторов: ${bad}`);
process.exit(bad ? 1 : 0);
