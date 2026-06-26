# ADR-0012: Drill-down containers (v3.14)

**Status:** Accepted
**Date:** 2026-06-11

## Context

Strategic differentiation: every mainstream diagramming tool treats a diagram as
a flat picture, while real architectures are nested. The tools that do model
nesting (IcePanel, Structurizr, Ilograph) are modeling-first with weak drawing
ergonomics. Graffel attacks the same problem from the drawing side: containers
(v3.11) become *enterable*, so one document holds the whole hierarchy and every
level stays readable.

## Decision

**Drilling is a view concern; the stored model is untouched.**

- `viewRootId: string | null` is ephemeral store state (like selection — not
  persisted in the document). The canvas renders only the view root's subtree;
  the view root's direct children render as top-level React Flow nodes. Because
  child positions are stored parent-relative (ADR-implicit since v3.11), the
  drilled view's coordinate frame *is* the stored frame — no position conversion
  anywhere, and drag/snap/reparent math is shared between levels.
- `data.collapsed?: boolean` is persisted per container. A collapsed container
  hides its subtree at any level; **edges into hidden nodes re-target to the
  nearest visible ancestor** (the collapsed container), so a collapsed cluster
  reads as a single node with real connections — a context diagram for free.
  Edges whose endpoints both collapse to the same node, or whose endpoint has no
  visible ancestor in the current level, are not rendered.
- Pure math lives in `src/canvas/drilldown.ts` (`visibleNodeIds`,
  `visibleRepresentative`, `remapEdgeForView`), unit-tested independently of
  React Flow.
- Navigation (enter/exit) is allowed in read-only mode — share links are
  explorable. Mutation (collapse toggling, adding shapes) stays gated.
- `addNode` parents new shapes to the current view root: drilling in and drawing
  builds the container's interior directly.
- `zoomOnDoubleClick` is disabled globally: double-click means "edit label"
  (plain shapes) or "enter container" (containers), never zoom. Note: d3-zoom's
  dblclick handler `stopImmediatePropagation()`s, which silently swallowed node
  double-clicks in read-only views until disabled.

## Consequences

- Any level can be exported (PNG/SVG capture the current viewport) — each level
  is a presentable diagram.
- Per-level rendering keeps node counts small; the 60fps/200-node budget applies
  per level, not per document.
- Undo/redo and document loads guard `viewRootId` (reset to root if the level's
  container no longer exists).

## Deferred (fast-follows)

- ~~**Boundary stubs**~~ — shipped v3.17: cross-level edges render as clickable
  chips (`boundaryStubsForView` in `canvas/drilldown.ts`) on the in-level
  endpoint; click reveals the peer (`revealNode`).
- ~~**Level-aware share URLs**~~ — shipped v3.17: `#l=<id>` hash deep-links
  (`canvas/levelLink.ts`), read on load in `DiagramCanvas`/`ShareView` and kept
  in sync via `replaceState`; breadcrumb "Link" button copies one.
- ~~**Presenter walkthrough**~~ — shipped v3.23: ordered stops (level + selection
  + note) authored in a 🎬 Present panel and played full-screen; persisted with
  the document and presentable read-only in share views. See
  [ADR-0013](./0013-walkthrough-mode.md).
