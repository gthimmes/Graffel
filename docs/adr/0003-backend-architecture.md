# ADR-0003: Backend architecture — ASP.NET Core minimal API

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

v1 of Graffel is functionally client-side: localStorage + file download/upload cover all save/load needs. But the user has asked for a C# backend on the stack so v2 (accounts, Google Drive integration) and v3 (multiplayer) have a real home. The backend in v1 is small but real — its job is to host the SPA, expose a health check, and reserve the URL surface that v2 will fill in.

## Decision

**ASP.NET Core 10 minimal API**, single project, hosts the built React SPA as static files and exposes a small JSON API.

### Project layout

```
src/
  Graffel.Api/          # ASP.NET Core minimal API + static SPA host
    Program.cs
    Endpoints/
      HealthEndpoints.cs
      DiagramEndpoints.cs   # v1: empty/scaffolded for v2
    wwwroot/              # built React assets (output of vite build)
  Graffel.Web/          # Vite + React + TS source
    src/
    public/
    package.json
tests/
  Graffel.Api.Tests/    # xUnit + WebApplicationFactory integration tests
  Graffel.E2E/          # Playwright tests (TypeScript, runs against dev or prod build)
```

### URL surface (v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness probe — returns `{ "status": "ok", "version": "0.1.0" }` |
| GET | `/api/version` | App version metadata for the client |
| GET | `/*` (fallback) | Serves the SPA (index.html for any unmatched route) |

### URL surface (reserved for v2)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/google/start` | Begin Google OAuth flow |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/me` | Current user info |
| GET | `/api/diagrams` | List user's diagrams |
| POST | `/api/diagrams` | Create new diagram |
| GET | `/api/diagrams/{id}` | Load a diagram |
| PUT | `/api/diagrams/{id}` | Save a diagram |

These are *not* implemented in v1, but the routing structure (`/api/...`) is established so v2 slots in without churning the URL space.

### Hosting

- Dev: `dotnet run` runs Kestrel on port 5135. `npm run dev` runs Vite on 5173 with a proxy to Kestrel for `/api/*`. Two processes during development; one process in production.
- Prod: `dotnet publish` produces a self-contained binary that serves the built SPA from `wwwroot`. Single container, single port.

## Rationale

- **ASP.NET Core minimal API**: the user asked for C#; minimal API is the lightest idiomatic shape. No MVC ceremony, no controllers full of attributes.
- **One project hosts both API and SPA**: simplest deployment story — one binary, one port, zero CORS in production.
- **Vite dev proxy in development**: keeps the React DX fast (HMR) while still letting `/api/*` calls hit the real backend.
- **Test boundary**: `WebApplicationFactory` lets integration tests run the whole pipeline in-process — that's where the contract tests for `/healthz` and (later) `/api/diagrams` live.

## Consequences

**Positive:**
- One repo, one build, one deploy.
- v2 has a home — endpoints are documented and reserved.
- TDD-friendly: `WebApplicationFactory` gives us fast, in-process integration tests.

**Negative:**
- Two languages in one repo (C# + TS). Worth it for stack consolidation.
- The C# backend does very little in v1 — feels like overkill for a static-only app. Accepted because the moment we start v2, we don't have to retrofit a backend.

## Off-ramps

If the C# backend genuinely adds nothing to v1 and v2 slips, we can deploy `wwwroot` to a static host (Cloudflare Pages) and turn the API on later. The frontend doesn't depend on the backend in v1.
