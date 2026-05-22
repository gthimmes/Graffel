import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiProjectDir = path.resolve(__dirname, '../Graffel.Api')

// E2E hits the production-shaped stack: `vite build` drops the SPA into
// ../Graffel.Api/wwwroot, then ASP.NET Core serves both the SPA and the /healthz
// + /api/* endpoints from the same origin. That matches v1 production.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [['list']],
  retries: 0,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5135',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && dotnet run --project "${apiProjectDir}" --no-launch-profile --urls http://127.0.0.1:5135`,
    url: 'http://127.0.0.1:5135/healthz',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Force the in-memory Drive store so E2E doesn't hit Google.
      // Double-underscore is .NET configuration's section separator for env vars.
      Drive__UseInMemory: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
