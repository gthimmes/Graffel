# ADR-0001: Canvas engine — React Flow (`@xyflow/react`)

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

Graffel v1 is a node-and-edge diagramming canvas. Picking the rendering / interaction substrate is the single biggest v1 architectural decision — it shapes the data model, the connector ergonomics that are our differentiator, and the headroom for v2/v3.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Custom SVG / Canvas** | Maximum control; no third-party lock-in | Weeks of foundational work before any feature; we'd reinvent pan/zoom, selection, hit-testing, drag, connection routing |
| **Konva.js / Fabric.js** | Mature 2D engines; good performance | Imperative APIs; we'd build the node-graph layer ourselves; not React-native |
| **tldraw `@tldraw/editor`** | Beautiful canvas, excellent UX | Opinionated stylistic direction (whiteboard-y); harder to make it feel "architecture-first"; heavier dependency |
| **Excalidraw** | Lovely hand-drawn feel | Same stylistic mismatch; not designed to be embedded as an engine |
| **React Flow (`@xyflow/react`)** | Built exactly for nodes + edges; React-native; MIT; active maintenance; pan/zoom/select/multi-select/connections built-in; custom node components are React | Less suited if we later want free-form whiteboard mode |

## Decision

**Use React Flow (`@xyflow/react`, v12+).**

It is the only option whose core data model — nodes and edges with custom React components — is shaped exactly like the architecture-diagramming use case the PRD targets. Our v1 differentiator is **connector ergonomics**, and React Flow ships with the foundation (handles, edge components, drag-to-connect) we'd otherwise spend weeks rebuilding. Custom shapes (service, database, queue, boundary) are React components — natural for the team.

## Consequences

**Positive:**
- v1 connector-from-edge-handle works on day one of canvas work.
- Custom node types map cleanly to architecture primitives.
- Pan/zoom/selection are not v1 work.
- Library is React-native — matches our stack with zero adapter code.

**Negative / risks:**
- React Flow's free version is MIT but "React Flow Pro" exists; we must verify the features we need (custom edges, handles, controlled flow) are in the OSS core. They are, per docs.
- If we later want a freeform whiteboard mode (Excalidraw-style), React Flow is the wrong substrate — we'd add a separate canvas or migrate. Acceptable tradeoff for v1 architecture focus.
- Performance ceiling on very large diagrams (>1000 nodes) is documented as good but not infinite. The v1 goal of 200 nodes at 60fps is well within React Flow's published range.

## Off-ramps

If React Flow proves wrong (UX feel, performance, license shift):
1. **Short term:** abstract our domain model behind a thin `CanvasEngine` interface so we render against an API surface, not React Flow's primitives directly. ADR-0002 (file format) ensures persistence is engine-agnostic.
2. **Medium term:** Konva.js is the fallback — same data model, different render surface, ~2-3 weeks to swap.

## Implementation notes

- Pin to `@xyflow/react@^12`.
- Wrap React Flow in our own `<DiagramCanvas>` component; downstream features (palette, command palette, export) talk to our wrapper, not React Flow directly.
- Custom node types live in `src/nodes/`. Custom edge type for orthogonal-routed connectors lives in `src/edges/`.
- Selection, copy/paste, undo/redo: use React Flow's state hooks; back them with our own Zustand or Redux store so undo/redo can span more than just node/edge state.
