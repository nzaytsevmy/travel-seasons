// Общий на все рабочие копии каталог пережатых картинок.
//
// Зачем: Astro держит запас пережатых картинок в node_modules/.astro/assets —
// ~4300 файлов и 440 МБ НА КАЖДУЮ копию. Этими файлами кормится системный разбор
// картинок macOS (mediaanalysisd), а он вгонял драйверы AppleM2ScalerCSC и
// AppleT8110DART во взаимную блокировку: девять самоперезагрузок 04–08.09.2026
// (memory/project_mac_kernel_panics_scaler_dart.md). Один общий каталог с
// суффиксом .noindex невидим для Spotlight, поэтому разбор до него не добирается.
//
// Общий делается ТОЛЬКО каталог картинок, а не весь node_modules/.astro: рядом
// лежит data-store.json с разобранными коллекциями контента, и он у каждой ветки
// свой — общий data-store смешал бы статьи разных веток.
//
// ⛔ Каталог сборки dist так вынести НЕЛЬЗЯ, проверено 08.09.2026: Astro во время
// сборки исполняет свои промежуточные модули прямо из dist, и когда тот физически
// лежит вне проекта, Node ищет node_modules вверх от реального пути и не находит
// («Cannot find package 'piccolore'»). dist остаётся в копии.
//
// Без переменной ASTRO_IMAGE_CACHE_DIR скрипт не делает ничего: в CI каждый
// прогон и так стартует с чистого листа.
//
// Замер 08.09.2026: сборка с запасом 46 с, без запаса 94 с, из общего запаса 42 с.
import { mkdirSync, lstatSync, rmSync, symlinkSync, readlinkSync } from 'node:fs';

// Запас пережатых картинок — один на все копии.
link('node_modules/.astro/assets', process.env.ASTRO_IMAGE_CACHE_DIR, 'node_modules/.astro');

function link(from, to, parent) {
  if (!to) return;
  mkdirSync(to, { recursive: true });
  if (parent) mkdirSync(parent, { recursive: true });

  let st = null;
  try {
    st = lstatSync(from);
  } catch {}

  if (st?.isSymbolicLink() && readlinkSync(from) === to) return;
  if (st) rmSync(from, { recursive: true, force: true });
  symlinkSync(to, from);
  console.log(`вынесено из копии: ${from} -> ${to}`);
}
