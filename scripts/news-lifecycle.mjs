// Не даёт будущему правилу навсегда остаться в статусе «принято, не вступило».
// Гейт без сети: когда reviewOn наступил, ежедневная новостная автоматика должна
// заново открыть первоисточник, обновить status/checked и связанные страницы.

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseNote, checkLifecycle } from './news-gate.mjs';

const root = process.cwd();
const dir = join(root, 'src/content/news');
const dateArg = process.argv.find((arg) => arg.startsWith('--date='))?.slice('--date='.length);
const now = dateArg ? new Date(`${dateArg}T00:00:00Z`) : new Date();
if (Number.isNaN(now.getTime())) {
  console.error(`неверная дата: ${dateArg}`);
  process.exit(2);
}

let due = 0;
for (const file of readdirSync(dir).filter((name) => name.endsWith('.md')).sort()) {
  const slug = basename(file, '.md');
  const note = parseNote(readFileSync(join(dir, file), 'utf8'), slug);
  const result = checkLifecycle(note, now);
  if (!result.ok) {
    due += 1;
    console.error(`ПЕРЕПРОВЕРИТЬ ${file}: ${result.reason}`);
  }
}

if (due === 0) console.log('news lifecycle: просроченных проверок нет');
process.exit(due > 0 ? 1 : 0);
