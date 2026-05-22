# ADR-0009: Share-by-link, view-only

**Status:** Accepted
**Date:** 2026-05-21
**Decision owner:** Architect

## Context

v2.2 closes the v2 PRD with a single collaboration surface: a shareable URL that lets anyone view a diagram in read-only mode. The questions:

1. What does the share token look like, and where is it stored?
2. How does an unauthenticated viewer load the diagram content?
3. What is "read-only" in the UI?

## Decision

A short opaque token resolves at `/v/{token}` to the underlying diagram's JSON. Tokens are stored in an in-memory registry server-side; the resolve endpoint is public (no auth). Read-only mode hides the toolbar's editing controls and the inspector + palette.

### Token format

- 22-character URL-safe base64 of 16 random bytes. Roughly the shape of `nanoid(22)` — collision-resistant and short.
- Tokens are opaque to the client. We do not encode the Drive file id into them.

### Storage

- v2.2: in-memory `ConcurrentDictionary<token, ShareRecord>` in the API process. Restarts wipe shares.
- ShareRecord: `{ token, driveFileId, ownerId, createdAt, revokedAt? }`.
- The same `IShareStore` abstraction allows a SQLite or Redis store later without touching callers.

Trade-off: in-memory storage means shares don't survive a restart. Acceptable for v2.2 (single-process, beta-scale users). Persistent storage is a v2.3 / v3 problem.

### Resolving a share

`GET /v/{token}` is the SPA route the user hits. The SPA fetches `GET /api/share/{token}` which:

1. Looks up the token. Revoked or unknown → 404.
2. Pulls the access token of the **owner** (not the viewer) from a stashed owner credential. **This is the tricky bit** — the viewer is anonymous; we need to call Drive on the owner's behalf.

**For v2.2 we sidestep the owner-credential problem entirely**: at share creation time, we **snapshot the diagram's JSON into the share record**. Resolving a share returns the snapshot, not a live Drive read.

- Pros: viewers can resolve shares even when the owner is offline; no long-lived credential storage; works without the "act as service account" complexity.
- Cons: shares don't reflect edits made after the share was created. The owner can re-share to update.

We accept this trade-off and document it. The `IShareStore` interface stays compatible with a future "live-link" mode if we change our minds.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST   | `/api/share` | required | Create a share. Body: `{ driveFileId? , body? }` (either a Drive file id to snapshot, OR a raw body to snapshot). Returns `{ token, url }`. |
| GET    | `/api/share/{token}` | none | Returns the snapshot `{ body }`. 404 if unknown or revoked. |
| DELETE | `/api/share/{token}` | owner | Revoke. 204 on success, 404 if unknown, 403 if not owner. |

### Read-only mode in the SPA

`/v/{token}` mounts the canvas with:
- No Toolbar editing controls (no Save, Open, palette controls — just a read-only "Viewing: <title>" banner and a Sign in CTA in case the viewer is a Graffel user).
- No Palette.
- No Inspector.
- The diagram store loads the snapshot. All mutating actions are gated behind a `readOnly` flag in the store; mutations no-op silently.
- React Flow nodes/edges are `draggable: false`, `selectable: true` (so users can read labels). Pan + zoom remain on.

### Token in the URL

- Public URL is `/v/{token}`. The SPA detects the `/v/` prefix on mount and switches into read-only mode.
- Tokens are not secrets — they're share links — but they're long enough to resist enumeration (16 bytes of entropy = 128 bits).

## Consequences

**Positive:**
- Viewers don't need accounts.
- No owner-credential dance — share creation snapshots the body.
- In-memory store keeps v2.2 deployable as a single process.
- Read-only mode is a state flag, not a separate route tree — keeps the SPA simple.

**Negative:**
- Shares are point-in-time. Editing the original after sharing does not change what viewers see; the owner must re-share. Document this in the UI ("Snapshot of …").
- Restarting the server kills all shares. v2.3 / v3 work moves to persistent storage.
- No expiry / password / domain-restriction. All deferred.

## Off-ramps

If we ever need "live" share links, the `IShareStore.Get(token)` becomes the seam: instead of returning a snapshot, it pulls the Drive file via stored owner credentials. Endpoint shape stays identical.
