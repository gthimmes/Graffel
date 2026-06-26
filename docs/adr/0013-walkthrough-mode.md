# ADR-0013: Walkthrough (presenter) mode

**Status:** Accepted
**Date:** 2026-06-25
**Decision owner:** Architect

## Context

Drill-down containers (ADR-0012) gave Graffel a depth story: a diagram is no
longer one flat canvas but a navigable hierarchy of levels. The job architects
actually hire a diagramming tool for, though, isn't *drawing* the architecture —
it's *explaining* it: "let me walk you through how a request flows." draw.io and
Lucidchart make you do that by manually panning and talking; nobody can follow a
live cursor hunt across a 200-node canvas.

ADR-0012 listed "presenter walkthrough" as a deferred fast-follow. This ADR
ships it. It's the payoff slice for the depth bet — the feature that turns
drill-down from a navigation convenience into a presentation medium.

## Decision

### A walkthrough is an ordered list of "stops"

A **stop** captures everything needed to re-stage a moment of the explanation:

```ts
interface TourStop {
  id: string
  title: string
  note: string
  viewRootId: string | null   // the drill-down level (container id, or root)
  selectedNodeIds: string[]    // the shapes to frame + highlight
}
interface Presentation { stops: TourStop[] }
```

A stop is **not** a saved camera viewport (x/y/zoom). It's a *semantic* anchor —
a level plus a selection — and the camera is *derived* at playback time by
fitting the view to the highlighted nodes. This is deliberate:

- It survives editing. Move or resize the shapes and the stop still frames the
  right things; a saved pixel viewport would drift.
- It reuses machinery that already exists and is already tested: `viewRootId`
  drives the level (ADR-0012), `selectedNodeIds` drives selection, and React
  Flow's `fitView({ nodes })` frames them.

### Capture from the live editor, replay through the same state

Authoring is "set up the view, then snapshot it": drill to a level, select what
matters, click **Add current view as stop**. `addTourStop()` reads the current
`viewRootId` + `selectedNodeIds` — no separate camera-capture path.

Playback (`gotoStop`/`nextStop`/`prevStop`) writes those same two pieces of state
back. Because applying a stop is just navigation + selection — never a mutation —
**presenting works in read-only share views**, exactly like drill-down does.

A small pure module (`canvas/tour.ts`) holds the non-trivial logic so it's unit
-testable in isolation: `resolveStop` reconciles a stored stop against the
current diagram (a deleted level falls back to root; vanished selected ids are
dropped, so playback never points at a ghost), `moveStop` reorders, `clampIndex`
bounds the cursor.

### Tours persist with the document, additively

The walkthrough is diagram content, not a per-user preference, so it lives in the
`.graffel` document under an **optional** `presentation` field. Optional is the
whole trick: no `schemaVersion` bump, the v1 loader ignores it, tour-free
diagrams serialize byte-for-byte as before, and — because share links serialize
`toDocument()` — a shared diagram **carries its walkthrough**, so a recipient can
press Present and watch the authored tour read-only.

Tour edits feed the existing debounced autosave (the autosave effect now also
depends on `tourStops`). Tour mutations are intentionally kept **out of the
node/edge undo history** — they're a separate authoring surface, and polluting
shape-edit undo with "untitled stop" steps would be surprising.

### UI split: author in the app, present everywhere

- **Authoring** (`TourPanel`, a right-rail panel toggled by the toolbar's
  🎬 Present button) is editor-only: add/title/annotate/reorder/preview/delete
  stops, then launch. Mounted in the app, not in share views.
- **Presenting** (`Presenter`, a full-screen bottom control bar) is mounted in
  **both** the app and the share view, since a read-only viewer must be able to
  play a tour the author shipped. Prev / Next / a step counter / Exit, plus
  keyboard nav (→/Space/PageDown/Enter advance, ←/PageUp back, Esc exits). The
  canvas stays visible behind the bar; each step re-frames the camera on the
  stop's highlighted shapes.

## Consequences

**Positive:**
- The depth bet (ADR-0012) now has a reason to exist for *viewers*, not just
  editors: a diagram becomes a guided explanation.
- Semantic stops (level + selection, camera derived) stay correct as the diagram
  is edited — no viewport drift.
- Zero file-format risk: additive optional field, no schema bump, full backward
  and forward compatibility; tours round-trip through share for free.
- Presentation is navigation-only, so read-only share views present without any
  special-casing.

**Negative:**
- A stop can't capture a *custom* camera framing that isn't "fit to these nodes"
  (e.g. deliberately showing whitespace, or a half-off-screen detail). Accepted:
  the semantic model is worth more than pixel-exact framing for v1; a future stop
  could carry an optional explicit viewport override.
- The authoring panel and the Inspector can both occupy the right rail at once on
  narrow windows. Acceptable now; a later pass can make them mutually exclusive.
- No transitions *between* stops beyond the camera tween + the existing level-
  change fade — no "draw the path as you talk." Out of scope; a later slice.

## Implementation notes

- Pure logic + tests: `src/canvas/tour.ts` (+ `tour.test.ts`).
- Store: `tourStops` / `presenting` / `presentIndex` plus
  add/remove/update/move/start/stop/goto/next/prev actions in
  `src/store/diagramStore.ts`; `presentation` round-tripped in
  `toDocument`/`loadDocument` (+ `diagramTour.test.ts`).
- UI: `src/ui/TourPanel.tsx`, `src/ui/Presenter.tsx`, `src/ui/tourUiStore.ts`;
  toolbar 🎬 Present button; mounted in `App.tsx` and `share/ShareView.tsx`
  (the latter also gets a ▶ Present button when the doc has a tour).
- E2E: `e2e/walkthrough.spec.ts` (author two stops across levels, present and
  step, keyboard nav, note display, persistence across reload).
