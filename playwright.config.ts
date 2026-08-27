import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/.html-report' }]],
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://localhost:4322',
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
    command: 'npx astro preview --port 4322',
    url: 'http://localhost:4322/',
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
