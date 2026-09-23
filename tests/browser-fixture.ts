import { test as base } from '@playwright/test';
export * from '@playwright/test';

// На Mac WebKit удерживает GPU-память даже между закрытыми контекстами.
// Изоляция, ранее применявшаяся только к visual.spec.ts, нужна и функциональным
// тестам: 24.09.2026 один header.spec.ts достиг лимита Browser Guard.
export const test = process.platform === 'darwin' ? base.extend<{}, { browserIsolation: boolean }>({
  browserIsolation: [async ({}, use) => { await use(true); }, { scope: 'worker', auto: true }],
  context: async ({ playwright, browserName }, use) => {
    // Playwright Test применяет разрешённые launch/context options и recorder
    // также к публичным launch()/newContext(). Не перекрываем их project.use:
    // иначе потеряются test.use() и опции, разрешённые для конкретного теста.
    const browser = await playwright[browserName].launch();
    let context;
    try {
      context = await browser.newContext();
      await use(context);
    } finally {
      try { await context?.close(); } finally { await browser.close(); }
    }
  },
}) : base;
