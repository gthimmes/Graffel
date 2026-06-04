# ADR-0011: Alignment guides and snap-to-shape

**Status:** Accepted (amended 2026-06-03 for v3.9.1 — equal-spacing snap)
**Date:** 2026-06-03
**Decision owner:** Architect

## Context

v3.8 shipped connector polish (line styles, endpoint markers, silhouette anchors). With shape libraries (v3.0–v3.7) and connector ergonomics now in place, the remaining "draw.io feels old" gap is **alignment**: dragging a shape next to another never produces a clean line-up, and users compensate with manual nudging or the keyboard arrows.

Excalidraw, Figma, Sketch, and Lucidchart all do the same thing: while you drag, fine lines appear when an edge or center of the dragged shape aligns with an edge or center of any other shape; the shape snaps to that line. It's the highest-leverage "feels premium" feature we can ship without changing the data model.

ADR-0004 already established a connector waypoint grid snap (8 px). v3.9 extends the same grid to node moves and adds the new edge/center alignment behavior on top.

## Decision

### Pure-geometry snap module

A single `src/canvas/snap.ts` exports `computeSnap(input)` — pure function, no React, no DOM.

```ts
interface SnapInput {
  draggedRect: { x: number; y: number; w: number; h: number }
  otherRects: Array<{ id: string; x: number; y: number; w: number; h: number }>
  threshold?: number      // default 4
  gridSize?: number | null // null = no grid; 8 when grid-snap is on
  disabled?: boolean      // Alt held → identity
}

interface SnapResult {
  offset: { x: number; y: number }
  position: { x: number; y: number }   // dragged top-left after offset
  guides: Guide[]                      // ephemeral alignment lines
}
```

Snap candidates for each axis:
- Left↔left, center↔center, right↔right, and every cross pair (left↔right, etc.) — total nine per other rect per axis.
- Within `threshold` (default 4 px) → candidate.
- Smallest |delta| wins; on a tie, **center** beats **edge** (matches what users do mentally).
- Grid snap is the fallback **only when no alignment candidate fires on that axis**, and is applied per-axis independently.

Alt held → identity (zero offset, no guides). This is the universal "let me place it precisely" escape hatch.

### Guides

For each fired axis, emit one `Guide`:
- `axis: 'x' | 'y'` — vertical or horizontal line
- `position: number` — the constant coordinate of the line
- `range: [min, max]` — extent along the other axis, spanning the dragged rect plus all *other* rects that share the snap position
- `kind: 'edge' | 'center'`

Guides are **never persisted** — they live only in component-local React state during the drag.

### Rendering

`AlignmentGuides.tsx` is a tiny SVG overlay inside React Flow's `<ViewportPortal>` so it transforms with pan/zoom for free. Stroke width is `1 / zoom` so the line stays 1 px on screen at all zoom levels. Center guides are cyan; edge guides are magenta — colors borrowed from common UX patterns so users coming from other tools recognize them immediately.

### Wiring

`DiagramCanvas.onNodesChange`:
1. On each position change, build dragged + other rects from store state.
2. Call `computeSnap`.
3. Replace `change.position` with `snapped.position` so the store receives the snapped value.
4. Set `activeGuides` when the change is mid-drag (`change.dragging === true`); clear them on a non-drag position change.

Alt is tracked via a ref toggled by global keydown/keyup listeners — `disabled` is read at snap-call time, not at drag-start time, so releasing Alt mid-drag re-enables snap.

### Grid snap toggle

`diagramStore.snapGrid: boolean`, default `false`, persisted to `graffel.snapGrid.v1`. UI:
- Toolbar toggle button (`data-testid="action-snap-grid"`, `aria-pressed` reflects state).
- Keyboard: `Cmd/Ctrl+;`.

When on, axes without an alignment candidate snap to the nearest 8-px multiple — matching the v1.2 waypoint grid so the two systems feel coherent.

## Rationale

**Why a pure function?** Snap geometry is the kind of code that gets called every drag frame and is easy to get subtly wrong. Pure + unit-tested keeps the regression surface minimal. The wiring layer in `DiagramCanvas` is a thin shell around it.

**Why threshold = 4 px?** Tight enough that two shapes you're *trying* to keep distinct don't accidentally snap; loose enough that a casual drag lands aligned without precision work. Matches Figma's default.

**Why center beats edge on ties?** A tie means the dragged rect has equal-sized boundaries to the candidate — at that distance, the visual outcome of "center aligned" is what the user perceives even when edges also coincide.

**Why no equal-spacing snap in v3.9?** The geometry is combinatorial (every triple along an axis is a candidate) and the visual indicator (double-tick gap markers) is its own UX problem. The 90% UX win is edge/center alignment + grid; equal-spacing is a fast-follow (call it v3.9.1) once we have signal that users want it.

**Why Alt-held suppression and not a settings toggle?** A per-drag escape hatch is universally understood (Figma, Sketch, Illustrator all use Alt or Cmd). A global settings toggle would be one more thing to discover and remember.

## Consequences

**Positive:**
- "Feels premium" bar moves up materially with one focused slice.
- Geometry is unit-tested (19 tests in `snap.test.ts`); wiring tested end-to-end via Playwright.
- File format is unchanged. The `snapGrid` preference is per-user (localStorage), not per-diagram.

**Negative:**
- The cost is real: every drag frame computes a Cartesian product of dragged-lines × other-lines. With 100 nodes that's 9 × 9 × 99 = ~8,000 cheap comparisons per frame. Well under any threshold today; we revisit if 1,000+ node diagrams become common.
- Snap only operates on **moves**, not on **resize**. v1.1's resize handles bypass `onNodesChange`'s position pipeline. Documented non-goal for v3.9; pick up in v3.10 if it stings.
- Multi-node drag isn't snapped — only the actively dragged node gets snap checks. Multi-drag would need either a "group bounding box" snap or per-node parallel snaps; both are larger than this slice.

## v3.9.1 amendment — equal-spacing snap (shipped)

The Deferred list named equal-spacing as the first fast-follow; v3.9.1 ships it.

**Geometry.** For each axis (`x` for horizontal spacing, `y` for vertical), find every pair of other rects (P, Q) such that:
- All three of {P, Q, dragged} have their perpendicular-axis center coords within `ROW_TOLERANCE = 8 px` (twice the snap threshold) — visually "in a row" or "in a column".
- P sits fully on one side of the dragged rect on the main axis and Q sits fully on the other (no overlap with the dragged rect).

For each such pair, propose `delta = (gap2 - gap1) / 2` where gap1/gap2 are the edge-to-edge distances on the main axis. Snap when `|delta| ≤ SNAP_THRESHOLD`.

**Tie-break.** Edge/center alignment beats equal-spacing at the same `|delta|`. Implemented as a `kindPriority` field on each candidate: `center=2 > edge=1 > spacing=0`. So all three systems coexist without a separate ordering pass.

**Guide shape.** Spacing fires emit **two** spacing-kind guides — one per gap. Each carries an `axis`, a `perpendicular` coord (the median of the three row/column centers), and a `span` covering one edge-to-edge gap. `AlignmentGuides.tsx` renders them as a short line with tick marks at each end, in orange (#fb923c) so they read as distinct from cyan center / magenta edge alignment lines.

**Guide type became a discriminated union.** The original `Guide` had `position` and `range`; the spacing variant needs `perpendicular` and `span`. The shared `kind` field is the discriminator:

```ts
type Guide =
  | { kind: 'edge' | 'center'; axis: 'x' | 'y'; position: number; range: [number, number] }
  | { kind: 'spacing';         axis: 'x' | 'y'; perpendicular: number; span: [number, number] }
```

**Costs.** O(N²) over row/column-aligned rects per axis per frame. With 200 nodes loosely scattered, expect ~10 row-aligned per axis → 50 pairs per axis → cheap. Worst case (all 200 in a row): 20k comparisons. Still well under a frame budget; revisit only if 1k+ node diagrams become common.

## Deferred (remaining fast-follow candidates)

- **Multi-node drag snap** — treat the group as one rect or run per-node.
- **Resize snap** — same geometry, applied to resize handles.
- **Distribute / align toolbar actions** — buttons for "align centers" / "distribute horizontally" on a multi-selection.
