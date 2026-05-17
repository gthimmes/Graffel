# Graffel

A web-hosted diagramming tool for software architects and engineers — built around an architecture-first canvas, painless connectors, and clean export.

Current status: **v1 MVP scaffolded and green.** Single-user, local save, PNG/SVG export.

See [`docs/PRD.md`](docs/PRD.md) for product spec and [`docs/adr/`](docs/adr/) for architecture decisions.

## Stack

- **Frontend:** Vite + React + TypeScript + [React Flow](https://reactflow.dev) (`@xyflow/react`) + Zustand
- **Backend:** ASP.NET Core 10 minimal API (serves the SPA + reserves v2 endpoints)
- **Tests:** xUnit (backend integration via `WebApplicationFactory`), Vitest (frontend units), Playwright (E2E)

## Layout

```
docs/
  PRD.md
  adr/0001-canvas-engine.md
  adr/0002-graffel-file-format.md
  adr/0003-backend-architecture.md
src/
  Graffel.Api/          ASP.NET Core minimal API + wwwroot
  Graffel.Web/          Vite + React + TS source
tests/
  Graffel.Api.Tests/    xUnit integration tests
src/Graffel.Web/e2e/    Playwright E2E
```

## Run

### Development (two processes, HMR)

```powershell
# Terminal 1 — backend
dotnet run --project src/Graffel.Api --urls http://localhost:5135

# Terminal 2 — frontend (proxies /api and /healthz to the backend)
cd src/Graffel.Web
npm install
npm run dev      # opens http://localhost:5173
```

### Production-shaped (single process)

```powershell
# Build the SPA into the API's wwwroot, then serve from one process.
cd src/Graffel.Web
npm install
npm run build

dotnet run --project ../Graffel.Api --urls http://localhost:5135
# open http://localhost:5135
```

## Test

```powershell
# Backend integration tests
dotnet test

# Frontend unit tests
cd src/Graffel.Web
npm test

# End-to-end (builds the SPA, starts the API, runs Chromium)
npx playwright install chromium      # first time only
npm run e2e
```
