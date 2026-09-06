// Общий замок на машину: одна сборка сайта и один прогон Playwright за раз,
// в какой бы рабочей копии их ни запустили.
//
// ⛔ Зачем. 04–06.09.2026 ноутбук перезагрузился трижды; перед перезагрузкой
// 06.09 19:27 система дважды записала «WindowServer не отвечает». В это время шли
// две-три сборки сайта (каждая с кучей 6 ГБ) и прогоны Playwright по четыре
// браузера — на 16 ГБ памяти это гарантированный ступор. Правило «жди соседа до
// 20 минут» в промтах заходов держалось на честности каждого процесса; замок
// держит всех: сборка ждёт сборку, прогон ждёт прогон, без участия человека.
//
// Как устроено: каталог-замок в ~/.cache/tt-locks/<имя>.lock (mkdir атомарен),
// внутри файл owner с pid держателя. Держатель умер (перезагрузка, kill -9) —
// замок считается брошенным и забирается. В CI замок выключен: у каждой джобы
// своя машина.
import { mkdirSync, rmSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const LOCK_DIR = process.env.TT_LOCK_DIR || join(homedir(), '.cache', 'tt-locks');

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function readOwner(lock) {
  try { return JSON.parse(readFileSync(join(lock, 'owner'), 'utf8')); } catch { return null; }
}

function ageSeconds(path) {
  try { return (Date.now() - statSync(path).mtimeMs) / 1000; } catch { return Infinity; }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Занять замок `name`. Возвращает функцию освобождения. Ждёт до waitMinutes,
 * потом идёт без очереди с предупреждением: вечный тупик хуже перегруза.
 */
export async function acquire(name, { waitMinutes = 40, label = '', log = console.error } = {}) {
  if (process.env.CI) return () => {};
  mkdirSync(LOCK_DIR, { recursive: true });
  const lock = join(LOCK_DIR, `${name}.lock`);
  const started = Date.now();
  let told = false;
  for (;;) {
    try {
      mkdirSync(lock);
      writeFileSync(join(lock, 'owner'), JSON.stringify({
        pid: process.pid, cwd: process.cwd(), label, at: new Date().toISOString(),
      }));
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
    const owner = readOwner(lock);
    if (!owner) {
      // Каталог есть, а владельца ещё нет: сосед только что занял замок и не успел
      // записаться — ждём; старше 10 секунд без владельца — обломок, забираем.
      if (ageSeconds(lock) > 10) rmSync(lock, { recursive: true, force: true });
      await sleep(1_000);
      continue;
    }
    if (!alive(owner.pid)) {
      log(`♻ замок «${name}»: держатель pid ${owner.pid} мёртв (${owner.cwd}) — забираем.`);
      rmSync(lock, { recursive: true, force: true });
      continue;
    }
    if (Date.now() - started > waitMinutes * 60_000) {
      log(`⚠ замок «${name}»: pid ${owner.pid} (${owner.cwd}) держит его дольше ${waitMinutes} мин — идём без очереди.`);
      return () => {};
    }
    if (!told) {
      log(`⏳ замок «${name}»: ждём соседа pid ${owner.pid} (${owner.label || '?'}, ${owner.cwd}, с ${owner.at}). Это не зависание.`);
      told = true;
    }
    await sleep(15_000);
  }
  if (told) log(`▶ замок «${name}» получен через ${Math.round((Date.now() - started) / 1000)} с.`);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const owner = readOwner(lock);
    if (owner && owner.pid === process.pid) rmSync(lock, { recursive: true, force: true });
  };
  process.once('exit', release);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.once(sig, () => { release(); process.exit(130); });
  }
  return release;
}
