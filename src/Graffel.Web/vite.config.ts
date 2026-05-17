import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `vite build` empties wwwroot/. Restore the .gitkeep marker so the empty dir
// stays committed (ASP.NET Core's static-web-assets loader requires it to exist).
const restoreGitkeep = (outDir: string) => ({
  name: 'restore-gitkeep',
  closeBundle() {
    writeFileSync(path.resolve(outDir, '.gitkeep'), '')
  },
})

// Vite dev server proxies /api and /healthz to the ASP.NET Core backend on 5135.
// `vite build` outputs into the API's wwwroot so a single dotnet publish ships both.
const wwwroot = path.resolve(__dirname, '../Graffel.Api/wwwroot')

export default defineConfig({
  plugins: [react(), restoreGitkeep(wwwroot)],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:5135', changeOrigin: true },
      '/healthz': { target: 'http://localhost:5135', changeOrigin: true },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../Graffel.Api/wwwroot'),
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['node_modules', 'dist', 'e2e/**', 'playwright.config.ts'],
  },
})
