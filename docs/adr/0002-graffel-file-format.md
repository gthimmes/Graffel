# ADR-0002: `.graffel` file format

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

Diagrams must persist to localStorage (v1), to local disk via download/upload (v1), to Google Drive (v2), and eventually carry CRDT operations for realtime multiplayer (v3). A file format chosen for v1 will be load-bearing for years. Versioning it correctly *now* is the difference between a clean v3 migration and a painful one.

## Decision

A versioned JSON envelope with a stable schema, schema version number, and explicit reserved fields for v2/v3 needs.

```jsonc
{
  "format": "graffel",
  "schemaVersion": 1,
  "id": "01HXYZ...",                 // ULID, diagram identity (stable across saves)
  "metadata": {
    "title": "Untitled diagram",
    "createdAt": "2026-05-17T12:34:56Z",
    "updatedAt": "2026-05-17T12:45:00Z",
    "appVersion": "0.1.0"
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  },
  "nodes": [
    {
      "id": "n_01HXYZ...",
      "type": "service",             // 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'service' | 'database' | 'queue' | 'boundary'
      "position": { "x": 100, "y": 200 },
      "size":     { "w": 160, "h": 80 },
      "data": {
        "label": "API Gateway",
        "style": {}                  // per-node style overrides; empty object by default
      }
    }
  ],
  "edges": [
    {
      "id": "e_01HXYZ...",
      "source": "n_01HXYZ...",
      "sourceHandle": "right",       // 'top' | 'right' | 'bottom' | 'left' | null
      "target": "n_01HXYZ...",
      "targetHandle": "left",
      "type": "orthogonal",          // 'orthogonal' | 'straight' | 'bezier'
      "data": {
        "label": "",
        "style": {}
      }
    }
  ],
  "reserved": {
    "remote": null,                  // v2: { driveFileId, ownerId, ... }
    "ops": null                      // v3: CRDT op log slot
  }
}
```

### Rules

1. **`schemaVersion` is mandatory.** Loaders MUST refuse to open files whose `schemaVersion` is greater than they understand. Older versions go through an explicit migration function.
2. **IDs are ULIDs.** Sortable, collision-resistant, future-friendly for distributed editing in v3.
3. **No back-references.** Edges name source/target by node id; the file is a flat list, not a tree. This is friendlier to diffs, CRDTs, and partial loads.
4. **`reserved.remote` and `reserved.ops` are explicit nulls in v1.** They reserve the keys so v2/v3 can populate them without a schema bump.
5. **`data.style` per node/edge is an open object.** Style additions don't require a schema bump unless they change semantics.
6. **Files are pretty-printed JSON, 2-space indent.** Human-readable matters — these files will land in git repos and Drive folders.

## Migration policy

- Schema bump rules:
  - **Patch (no version bump):** adding optional keys, adding new node types, adding new style properties.
  - **Minor (version bump, backward-compatible):** removing optional keys with sensible defaults.
  - **Major (version bump, migration required):** changing existing field semantics, restructuring nodes/edges shape.
- Every major bump ships with a migration function `migrate_v{N}_to_v{N+1}(doc)`.
- Loaders own the migration chain; writers always write the current version.

## Consequences

**Positive:**
- v2 cloud sync drops a `driveFileId` into `reserved.remote` — no schema bump.
- v3 multiplayer drops op logs into `reserved.ops` — no schema bump.
- Files are diffable in git; users can hand-edit if needed.
- Forward-incompatible files fail loudly, not silently.

**Negative:**
- JSON is verbose vs binary; large diagrams (1000+ nodes) will be ~hundreds of KB. Acceptable for v1's 200-node target.
- ULIDs are 26 chars; longer than nanoid. Worth it for sortability.

## Off-ramps

If the JSON grows uncomfortably (multiplayer history pushes file size into MB-range), we can layer compression (`.graffel.gz`) without changing the schema, or split history out into a sidecar file.
