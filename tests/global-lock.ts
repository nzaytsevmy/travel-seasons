// Один ТЯЖЁЛЫЙ прогон Playwright на машину: см. scripts/machine-lock.mjs (три
// перезагрузки ноутбука 04–06.09.2026 от параллельных сборок и прогонов по
// четыре браузера). Лёгкий прогон — перечисленные файлы из белого списка, один
// браузер, без эталонов — идёт мимо очереди: правило и замер в
// tests/lock-scope.mjs. В CI замок выключен вовсе, там у каждой джобы своя машина.
// @ts-ignore — модуль на JS без объявления типов
import { acquire } from '../scripts/machine-lock.mjs';
// @ts-ignore — модуль на JS без объявления типов
import { isLightRun } from './lock-scope.mjs';

export default async function globalLock() {
  // @ts-ignore — типов node в этом конфиге нет, как и в остальном файле
  if (isLightRun(process.argv)) {
    console.error('замок playwright: лёгкий прогон, идём без очереди');
    return async () => {};
  }
  const release = await acquire('playwright', { label: 'playwright test' });
  return async () => { release(); };
}
