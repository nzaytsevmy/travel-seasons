// Порт предпросмотра для локальных прогонов — свой у каждой рабочей копии.
//
// Зачем: две сессии в соседних worktree делили порт 4322, и прогон Playwright с
// `reuseExistingServer` брал чужой сервер, не говоря об этом. 05.09.2026 так
// вышло «64 зелёных» на чужой старой сборке, а проверка перед push падала на
// нетронутых страницах соседа. Порт считается из пути копии: стабилен между
// запусками, различен у соседей. `PREVIEW_PORT` — ручной override. В CI адрес
// приходит снаружи через `PREVIEW_URL`, этот модуль там не участвует.
//
// Одна точка правды: playwright.config.ts импортирует функцию, scripts/pre-push.sh
// вызывает файл как команду и читает порт из вывода.
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export function previewPort(root = process.cwd()) {
  const forced = Number(process.env.PREVIEW_PORT);
  if (Number.isInteger(forced) && forced > 0) return forced;
  const key = realpathSync(root);
  const h = parseInt(createHash('sha1').update(key).digest('hex').slice(0, 4), 16);
  return 4322 + (h % 100);   // 4322…4421
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(String(previewPort()) + '\n');
}
