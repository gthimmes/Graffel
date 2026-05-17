# ADR-0004: Connector waypoints and orthogonal routing

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

v1.0 ships connectors with React Flow's built-in `smoothstep` (orthogonal), `straight`, and `default` (bezier) edge types. These auto-route — the user has no say in where the corners go. The v1.2 ask is **"control the shape of the lines better. Straight vs curved, where corners and turns are."**

The Inspector (v1.1) handles "straight vs curved" via `edge.type`. v1.2 handles "where corners go."

## Decision

Add explicit **waypoints** to edges: a user-editable list of intermediate points between source and target. Render with a custom edge component that draws orthogonal segments between consecutive waypoints (source → wp₁ → wp₂ → ... → wpₙ → target).

### Data model

New field on `GraffelEdge.data`:

```ts
waypoints?: Array<{ x: number; y: number }>
```

- Stored in **flow coordinates** (the same coordinate space as `node.position`).
- Absent or empty array → React Flow's built-in routing (current behavior, no change).
- Present → custom edge takes over; routing passes through each waypoint in order.

No schema bump per ADR-0002 (open `data` object, new optional field).

### Routing algorithm (v1.2)

**Orthogonal-via-waypoints.** Given source point S, waypoints W₁..Wₙ, target T:

1. Compute the source/target connection points (existing React Flow logic per `sourceHandle`/`targetHandle`).
2. Build the polyline: S → W₁ → W₂ → ... → Wₙ → T.
3. Between each pair of consecutive points, insert an L-shaped (two-segment) orthogonal path that goes horizontal-then-vertical OR vertical-then-horizontal based on the predominant direction.
4. Render as a single SVG `<path>`.

The user **owns** the shape — we don't try to be smart about avoiding nodes or other edges in v1.2. Obstacle avoidance is a v1.3 problem if it surfaces.

### Interaction

When an edge is **selected**:

- **Each waypoint** gets a draggable handle (small circle). Drag → `moveEdgeWaypoint(edgeId, index, newPosition)`. Snaps to a configurable grid (default 8px).
- **Each segment** gets a "ghost" handle at its midpoint (half-opacity). Dragging the ghost converts it into a real waypoint at the drop position → `addEdgeWaypoint(edgeId, segmentIndex, position)`. The new waypoint is inserted between the existing two.
- **Right-click on a waypoint** removes it (`removeEdgeWaypoint`). Discoverable later via a small "×" on hover.
- The **Inspector** shows "N corners" and offers a "Clear corners" button (`clearEdgeWaypoints`).

When an edge is **not selected**: handles are hidden; only the rendered path is visible.

### Edge type interaction

- `edge.type === 'straight'` with waypoints → straight segments between consecutive points (no orthogonal bend).
- `edge.type === 'orthogonal'` with waypoints → orthogonal L-bends between consecutive points (default).
- `edge.type === 'bezier'` with waypoints → in v1.2 we ignore waypoints when type is bezier (the curve is its own thing). Document this as a known limitation.

### Snapping

- **Grid snap:** 8px during drag. Hardcoded for v1.2; later: a setting.
- **No** snap-to-other-shape-alignment in v1.2 (was listed as a v1.1 non-goal; remains non-goal for v1.2).

## Rationale

**Why explicit waypoints vs. auto-routing improvements?** Auto-routing algorithms (orthogonal-with-obstacle-avoidance) are deep, expensive, and never produce the path the user wanted. Letting users place corners directly is the standard answer (draw.io, Lucidchart, Visio all do this) and it's a fraction of the engineering work.

**Why a custom edge component instead of patching React Flow's built-in types?** React Flow's built-in edge types (`smoothstep`, `straight`, `bezier`) compute their paths from source/target only. Adding waypoints requires our own path builder — either inside a custom edge or as a wholly separate edge component. The latter is cleaner.

**Why flow coordinates, not screen coordinates?** Waypoints must survive pan/zoom and shape moves (kind of — moving a shape should NOT drag its waypoints; the line just reaches further). Flow coordinates are the natural choice.

## Consequences

**Positive:**
- The "where corners go" UX gap is closed.
- File format is stable — waypoints are an optional data field.
- The user owns the connector geometry; we don't fight them with auto-routing.

**Negative:**
- Waypoints don't follow shapes. If you place a waypoint and then move a connected shape, the line still routes through the waypoint. That's the correct behavior, but may surprise users coming from auto-routing tools.
- No obstacle avoidance: a waypoint placed inside another shape will produce a path that crosses it. We accept this for v1.2.
- Bezier + waypoints not supported — documented limitation.

## Open questions (deferred, not blocking)

- Should waypoint dragging snap to the alignment of nearby shapes? *Defer.*
- Should we auto-collapse a waypoint if the user drags it onto the line between its neighbors? *Defer; add if it feels annoying.*
- Touch interaction for handles? *Defer to mobile work.*
