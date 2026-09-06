// Один прогон Playwright на машину: см. scripts/machine-lock.mjs (три перезагрузки
// ноутбука 04–06.09.2026 от параллельных сборок и прогонов). В CI замок выключен.
// @ts-ignore — модуль на JS без объявления типов
import { acquire } from '../scripts/machine-lock.mjs';

export default async function globalLock() {
  const release = await acquire('playwright', { label: 'playwright test' });
  return async () => { release(); };
}
