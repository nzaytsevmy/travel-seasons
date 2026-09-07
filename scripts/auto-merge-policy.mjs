const CORE_CHECKS = [
  'build',
  'контент и функциональные тесты',
  'scan',
  'Analyze (actions)',
  'Analyze (javascript-typescript)',
  'Analyze (python)',
];

const VISUAL_CHECKS = Array.from({ length: 4 }, (_, i) => `visual (${i + 1}/4)`);
const LIGHTHOUSE_CHECKS = ['desktop', 'mobile'].flatMap((preset) =>
  Array.from({ length: 8 }, (_, i) => `${preset} (${i + 1}/8)`),
);

// ⛔ Список обязан совпадать с paths-ignore в visual-tests.yml и lighthouse.yml.
// Разошлись — заявка встаёт намертво: GitHub не запускает пропущенный по путям
// прогон, а эта политика продолжает ждать visual (1/4) и mobile (8/8), пока не
// истекут 42 минуты. Сторож совпадения — tests/auto-merge-policy.test.mjs.
export function isContentOnly(files) {
  if (!Array.isArray(files) || files.length === 0) return false;

  return files.every((file) =>
    file.startsWith('src/content/') ||
    file.startsWith('news/') ||
    file.startsWith('reviews/') ||
    /^public\/llms[^/]*\.txt$/.test(file) ||
    file.endsWith('.md'),
  );
}

export function requiredChecks(files) {
  if (isContentOnly(files)) return [...CORE_CHECKS];
  return [...CORE_CHECKS, ...VISUAL_CHECKS, ...LIGHTHOUSE_CHECKS];
}

export function evaluateChecks(required, runs) {
  const byName = new Map();
  for (const run of runs) {
    const sameName = byName.get(run.name) || [];
    sameName.push(run);
    byName.set(run.name, sameName);
  }

  const missing = [];
  const pending = [];
  const failed = [];

  for (const name of required) {
    const matching = byName.get(name) || [];
    if (matching.length === 0) {
      missing.push(name);
      continue;
    }

    if (matching.some((run) => run.status !== 'completed')) {
      pending.push(name);
      continue;
    }

    // Повторный успешный запуск исправляет прежний красный результат.
    if (!matching.some((run) => run.conclusion === 'success')) {
      failed.push(name);
    }
  }

  return {
    ready: missing.length === 0 && pending.length === 0 && failed.length === 0,
    missing,
    pending,
    failed,
  };
}
