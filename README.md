# Graffel

A web-hosted diagramming tool for software architects and engineers — built around an architecture-first canvas, painless connectors, and clean export.

Current status: **v1 complete + v2.0 auth foundation.** Canvas, inspector, waypoints, keyboard, command palette, Google sign-in.

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

## Google OAuth setup (v2.0+)

v2.0 onward, signing in goes through Google. The app builds and runs without
credentials configured — `/api/auth/google/start` returns a clear `503 google_not_configured`
in that case, so the test suite stays green. To exercise sign-in manually:

1. **Create a Google Cloud project.** [console.cloud.google.com](https://console.cloud.google.com/) → New Project.
2. **Enable the Google Drive API** in the API Library (needed for v2.1 Drive integration; v2.0 only needs identity scopes but consent covers both at once).
3. **Configure the OAuth consent screen** under APIs & Services → OAuth consent screen.
   - User type: External (Testing).
   - Add your own email as a test user.
   - Scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.file`.
4. **Create an OAuth 2.0 Client ID.** APIs & Services → Credentials → Create credentials → OAuth client ID.
   - Application type: Web application.
   - Authorized redirect URI: `http://localhost:5135/api/auth/google/callback` (add your prod URI later).
5. **Stash the credentials.** From `src/Graffel.Api`:

   ```powershell
   dotnet user-secrets init
   dotnet user-secrets set "Auth:Google:ClientId"     "your-client-id.apps.googleusercontent.com"
   dotnet user-secrets set "Auth:Google:ClientSecret" "your-client-secret"
   ```

   In production, set environment variables `Graffel__Auth__Google__ClientId` and `Graffel__Auth__Google__ClientSecret`.

6. **Run.** `dotnet run --project src/Graffel.Api --urls http://localhost:5135`, then click "Sign in with Google" in the top-right of the app.

If you skip these steps, the app still works for everything except sign-in — local diagrams, file download, export, palette, waypoints all continue to function.
