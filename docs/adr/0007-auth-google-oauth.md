# ADR-0007: Authentication — Google OAuth + cookie sessions

**Status:** Accepted
**Date:** 2026-05-21
**Decision owner:** Architect

## Context

v2 introduces accounts so users can save diagrams to Google Drive (v2.1) and share view-only links (v2.2). The auth question: which provider, which session model, how to test without hitting Google in CI.

## Decision

**Single provider: Google.** Cookie-based sessions managed by ASP.NET Core. OAuth scope includes Drive `drive.file` access from day one so v2.1 doesn't need a re-consent prompt.

### Provider choice: Google only

- v2's defining feature is Google Drive integration; the user is already going to need a Google account.
- Adding email/password, GitHub, etc. is auth surface area we'd own forever for zero v2 value.
- If a non-Google user appears later, layering a second provider on top of `Microsoft.AspNetCore.Authentication.*` is cheap.

### Session model: cookies, not JWTs

- The SPA and API live at the same origin (`http://localhost:5135` in dev, single deploy in prod). Cookies are the natural answer.
- HttpOnly + SameSite=Lax cookies are XSS-safe and CSRF-defensible without custom token plumbing.
- ASP.NET Core Data Protection encrypts the cookie; access + refresh tokens ride inside it for v2.0/v2.1. Token-store extraction is an easy refactor if it ever exceeds cookie size.

### Scopes requested

- `openid email profile` — identity.
- `https://www.googleapis.com/auth/drive.file` — read/write only files created by Graffel. **Not** `drive.readonly` or `drive` — minimum-privilege.

### URL surface (v2.0)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/google/start?returnUrl=…` | Issue a Challenge → 302 to Google |
| GET | `/api/auth/google/callback` | Handled by the Google handler; signs the user in via cookie; redirects to `returnUrl` |
| POST | `/api/auth/signout` | Clears the cookie; returns 204 |
| GET | `/api/me` | Returns `{ id, email, name, picture }` when signed in; 401 otherwise |

### Testing

- A `TestAuthHandler` (custom `AuthenticationHandler<>`) is registered in test environments. When a request includes the header `X-Test-User`, the handler signs in a synthetic user with that name/email and skips Google entirely.
- xUnit integration tests pass `X-Test-User` to exercise authed endpoints deterministically.
- Playwright tests configure a single global header (`request.extraHTTPHeaders`) so the entire suite runs against the test handler.
- The real Google handler stays wired but inert in tests — its endpoints exist but are never hit.

### What the operator must configure

Out-of-band (one-time):

1. Create a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen (External / Testing is fine for personal use).
4. Create an OAuth client ID (Web application). Authorized redirect URI: `http://localhost:5135/api/auth/google/callback` (dev) and the prod equivalent.
5. Stash `ClientId` + `ClientSecret` via `dotnet user-secrets` (dev) or `Graffel__Auth__Google__*` env vars (prod). The README documents the exact commands.

Without these, the app still runs and tests still pass — `/api/auth/google/start` returns 503 with a clear message instead of crashing.

## Consequences

**Positive:**
- Cookies + same-origin means zero CORS work.
- One-shot consent covers v2.0 + v2.1 (no second prompt when Drive lands).
- TestAuthHandler keeps the suite hermetic.

**Negative:**
- v2 doesn't work locally without out-of-band Google setup. Documented in README.
- Cookie-bound tokens means we can't call Drive without a live user (no service-worker calls). Acceptable for v2; revisit if we ever want background sync.

## Off-ramps

If we ever want background tasks acting on a user's Drive (e.g. v3 multiplayer presence), we move the access/refresh tokens out of the cookie into a server-side token store (SQLite or similar), keyed by user id. The `Command` / endpoint shape doesn't change.
