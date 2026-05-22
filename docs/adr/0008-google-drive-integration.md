# ADR-0008: Google Drive integration

**Status:** Accepted
**Date:** 2026-05-21
**Decision owner:** Architect

## Context

v2.1 makes the user's `.graffel` files cloud-resident. Three design questions:

1. **Where does the Drive call happen — frontend (gapi.js) or backend?**
2. **What's the listing UX — Drive Picker iframe, or our own list?**
3. **How is the file's identity tracked across sessions?**

## Decision

**Backend proxies all Drive calls.** Listing is our own list (no Picker iframe in v2.1). File identity rides on `doc.reserved.remote.driveFileId`.

### Why backend-proxied (not frontend gapi)

- The OAuth access token already lives in the cookie (from `SaveTokens = true` in ADR-0007). Doing Drive calls from the backend means **the token never leaves the server**, which simplifies the threat model.
- The frontend can use `fetch('/api/drive/files')` with the existing same-origin cookie. No client-side OAuth flow, no gapi.js bundle, no client_id leakage.
- Trade-off: extra server hop. Negligible at v2's scale.

### Listing: our own list, not the Drive Picker

- The Drive Picker iframe requires loading `apis.google.com/js/api.js` + a separate API key + an OAuth consent dialog dance. Heavy for a list that has at most dozens of `.graffel` files in v2.
- Our `drive.file` scope already constrains the listing to files Graffel created — the natural filter.
- We list via `files.list?q=mimeType='application/json' and properties has { key='graffel' value='1' }` and surface name + modified time.
- The Picker becomes worth considering if/when we want users to attach arbitrary Drive files. v2.1 doesn't need it.

### File identity tracking

- ADR-0002 reserved `doc.reserved.remote` for this. v2.1 fills it with:

  ```jsonc
  {
    "driveFileId": "1abcXYZ...",
    "ownerEmail":  "alice@example.com",
    "lastSyncedAt": "2026-05-21T10:00:00Z"
  }
  ```

- "Save to Drive" picks the path:
  - If `reserved.remote.driveFileId` is set and the file still exists → **PATCH** that file with new content.
  - Otherwise → **POST** a new file, set `reserved.remote`, save back.
- "Open from Drive" loads the file content, parses, and the resulting doc carries its identity automatically.

### Marker properties on Drive files

- Each file gets `properties: { app: "graffel", v: "1" }` — Drive's first-class metadata, queryable, opaque to other apps.
- The file's `name` is the diagram title plus `.graffel` extension (e.g. `System architecture.graffel`).
- The file's `mimeType` is `application/json`. Drive previews JSON in its viewer, which is fine for fallback inspection.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/drive/files` | List the user's Graffel-created files (`{id, name, modifiedTime}` array) |
| GET    | `/api/drive/files/{id}` | Get the JSON content of a Drive file |
| POST   | `/api/drive/files` | Create a new Drive file from a `.graffel` body |
| PUT    | `/api/drive/files/{id}` | Update an existing Drive file with a new body |
| DELETE | `/api/drive/files/{id}` | Delete a Drive file (v2.1 doesn't expose this in the UI yet, but the endpoint is there) |

All endpoints require auth (the default `Graffel` policy). The Google scheme's `SaveTokens = true` means we can pull the access token out of `HttpContext.GetTokenAsync("access_token")` and call Drive.

### Token refresh

- Google access tokens last ~1 hour. The refresh token (also saved in the cookie) is used to mint a new access token when the old one 401s.
- The Drive client (`Google.Apis.Drive.v3`) handles refresh natively when given a `UserCredential`. We construct one per-request from the cookie tokens.

### Testing — IDriveStore abstraction

- The backend introduces an `IDriveStore` interface with the four operations above.
- Production binding: `GoogleDriveStore` (calls the real Google API).
- Test binding: `InMemoryDriveStore` (a dictionary). Wired in the test composition.
- Tests therefore exercise the **endpoint contracts and frontend behavior** without ever hitting Google. Real-Drive verification is manual, documented in README.

## Consequences

**Positive:**
- Token security: access token never reaches the browser.
- Cleaner test story than mocking gapi.js.
- File identity is per-document (in `reserved.remote`), not per-session — survives reloads.
- The `IDriveStore` abstraction is the natural insertion point for a v2.2 share-link backend or v3 multiplayer sync.

**Negative:**
- Listing performance is throttled by Drive's API quotas (well within free tier for v2 scale).
- "Pick any file" UX requires the Picker; v2.1 doesn't have it.
- A file moved/deleted in Drive by the user can leave `reserved.remote.driveFileId` stale — handled by falling back to "create new" on next save, with a console warning.

## Off-ramps

If we ever need offline-first sync (CRDT-style), the JSON-blob model still works — the file content just becomes a CRDT document. The `IDriveStore` shape doesn't change.
