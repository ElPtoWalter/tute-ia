import { defineConfig } from "@playwright/test";

const viewports = [
  { name: "desktop-1440x900", viewport: { width: 1440, height: 900 } },
  { name: "mobile-390x844", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "compact-360x800", viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
  { name: "landscape-844x390", viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }
];

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 6_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined
  },
  projects: viewports.map(project => ({ name: project.name, use: project })),
  webServer: {
    command: "python -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
