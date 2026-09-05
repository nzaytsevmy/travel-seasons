import { defineConfig, devices } from '@playwright/test';
import { previewPort } from './scripts/preview-port.mjs';

// Свой порт у каждой рабочей копии (см. scripts/preview-port.mjs): соседние
// сессии больше не делят 4322 и не снимают чужую сборку.
const PORT = previewPort();

export default defineConfig({
  testDir: './tests',
  // В CI время файлов проверяется отдельным шагом сразу после build. В длинном
  // browser-shard к моменту этой проверки dist уже обслуживается preview-сервером
  // и контракт артефакта смешивается с поведением сервера/раннера.
  testIgnore: process.env.SKIP_PAGE_MTIME_TESTS === '1'
    ? ['**/page-mtimes.spec.ts']
    : [],
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/.html-report' }]],
  use: {
    baseURL: process.env.PREVIEW_URL || `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    video: 'off',
    // Доп. защита: блокируем сторонние трекеры даже если попали в HTML
    extraHTTPHeaders: { 'X-Playwright': '1' },
  },
  // ⛔ Сервер поднимает сам прогон, а не человек в соседнем окне. Запущенный
  //    руками `astro preview` умирает вместе с оболочкой, из которой стартовал,
  //    и прогон начинает краснеть на нетронутых страницах: 27.08 так пришло
  //    семь ложных падений подряд с «соединение отклонено», а до того одиннадцать
  //    эталонов записались страницами ошибки — их чуть не закрепили как образец.
  //    В CI адрес приходит снаружи, там поднимать нечего.
  webServer: process.env.PREVIEW_URL ? undefined : {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,  // 2% разница — допуск на mini-pixel jitter
      threshold: 0.2,
    },
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-desktop',   use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-tablet',  use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'webkit-mobile',    use: { ...devices['iPhone 14'] } },
  ],
});
