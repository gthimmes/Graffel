# PRD: Graffel v1 — single-user canvas

**Status:** Approved
**Owner:** Glenn Thimmes
**Last updated:** 2026-05-17
**One-liner:** A web-hosted single-user diagramming canvas with first-class connectors, architecture-friendly shapes, and effortless save/export — the foundation everything else builds on.

---

## 0. Opportunity framing

**Recommendation:** Pursue, with hard phasing discipline. Multiplayer is the v3 problem, not the v1 problem.

**Problem.** Architects and engineers reach for draw.io by default because it's free and runs anywhere — but the connector ergonomics, dated UI, and shape sprawl create friction every session. Lucidchart is polished but locked behind seats; Excalidraw is delightful but stylistically informal; tldraw is a great canvas but not architecture-focused. The gap: a modern, opinionated, architecture-first diagramming tool that's obvious for beginners and dense for superusers — with first-class connector ergonomics and frictionless export.

**Why now.** UX-led entrants in adjacent spaces (Excalidraw, tldraw, Linear-style polish) have proven the market rewards "ultra-obvious + power-user dense." Browser-native canvas rendering + modern React tooling makes v1 cheap. The strategic answer is to own the stack.

**Confidence.** Medium-high on the problem (the UX gap is real). Medium on capture (crowded market, but UX-led entrants have succeeded). Phased delivery keeps the bet cheap and falsifiable.

**Alternatives considered.**
1. **Fork Excalidraw or tldraw.** Cheaper, but inherits their stylistic direction. Rejected — the goal is real differentiation.
2. **Wrap draw.io.** No. The UX is exactly the thing we're fixing.
3. **Don't build it.** Valid only as a sanity check. The user has stated the tool itself is the goal — pursue.

---

## 1. Problem

Software engineers and architects need to communicate system designs visually and reach for draw.io by default — but it *feels* like 2010. Connector behavior is fiddly (snapping, routing, label placement), shape libraries are sprawling and undifferentiated, modern affordances (command palette, smart alignment, undo-as-feature) are missing or weak. The result: users tolerate it instead of enjoying it.

## 2. Why now

The strategic answer is to own the stack. The product answer is that UX-led entrants in adjacent spaces (Excalidraw, tldraw, Linear-style polish) have proven the market rewards "ultra-obvious + power-user dense." The technical answer is that browser-native canvas rendering + modern React tooling makes v1 cheap.

## 3. Goals (success criteria for v1)

- **Time-to-first-diagram** (cold start to a connected 3-shape diagram): under 60 seconds for a first-time user.
- **Connector creation friction:** drag from a shape edge → connector auto-routes → drop on another shape. Zero modals, zero tool-switches.
- **Export reliability:** PNG + SVG export of any diagram produces visually identical output to canvas, 100% of the time.
- **Local save reliability:** diagrams saved to browser storage survive refresh, browser restart, and tab close, with zero data loss.
- **Performance:** 60fps pan/zoom on diagrams up to 200 nodes on a 2020-era laptop.

**Kill criteria:** if v1 ships and Time-to-first-diagram or connector friction are not visibly better than draw.io's, the angle is wrong — revisit before investing in v2.

## 4. Non-goals (v1)

- No accounts, no auth.
- No realtime multiplayer (v3).
- No Google Drive integration (v2).
- No team / sharing features (v2+).
- No mobile / touch optimization. Desktop browser only.
- No template gallery beyond ~5 starters.
- No code-to-diagram or AI generation.

## 5. User & use cases

**Primary persona:** Mid-to-senior software engineer or architect, comfortable with keyboard-driven tools, frustrated by draw.io's friction, drawing on a laptop browser.

**Use cases:**
- **System architecture sketch.** When prepping a design doc, I want to draw services + connectors + boundaries in under 5 minutes, so I can paste the SVG into my doc.
- **Sequence diagram.** When walking through a flow with a teammate, I want to lay out an interaction sequence with minimal mouse work.
- **Whiteboard-style brainstorm.** When thinking through tradeoffs alone, I want to drop shapes and connect them with no friction.

## 6. Solution sketch

A single-page web app. Center is an infinite, pannable, zoomable canvas. Left edge: a minimal palette (rectangle, ellipse, diamond, text, service, database, queue, boundary). Top: a thin toolbar with undo/redo, zoom, export, save. Right: contextual property panel (visible only when something is selected).

**Connector ergonomics (the differentiator):**
- Every shape has 4 edge-anchors that surface on hover.
- Drag from an anchor → a live preview connector follows the cursor → drop on any shape.
- Connector auto-routes by default; hold modifier for straight-line.
- Labels: double-click the connector → inline text input.
- Moving a shape reroutes its connectors with no jitter.

**Keyboard:**
- `/` opens a command palette.
- `R`/`E`/`D`/`T` quick-insert shapes at cursor.
- Arrow keys nudge; shift+arrow nudges 10x; cmd/ctrl+D duplicates.
- Cmd+Z / cmd+shift+Z unbounded undo/redo.

**Storage:**
- Save = serialize canvas state to JSON, persist to `localStorage` and offer "Download .graffel file" (JSON).
- Open = drag a `.graffel` file onto the canvas or click Open.
- Autosave to localStorage every few seconds.

**Export:**
- PNG (raster, configurable resolution).
- SVG (vector, preferred for documentation embedding).

## 7. Open questions (resolved as part of this PRD pass)

- **Canvas engine:** React Flow (`@xyflow/react`). See [ADR-0001](./adr/0001-canvas-engine.md).
- **File format:** versioned JSON envelope. See [ADR-0002](./adr/0002-graffel-file-format.md).
- **Backend stack:** ASP.NET Core minimal API serving the React SPA. See [ADR-0003](./adr/0003-backend-architecture.md).
- **Brand:** "Graffel" stays — the repo name *is* the product name.

## 8. Risks & tradeoffs

- **Risk: UX bar is subjective.** Mitigation: §3 success criteria are concrete user-flow metrics, not vibes.
- **Risk: Canvas engine choice locks in a year of architecture.** Mitigation: ADR-0001 documents the decision and the off-ramps.
- **Tradeoff: Single-player v1 when the long-term goal is multiplayer.** Deliberate. Multiplayer added to an existing single-player canvas is straightforward; multiplayer-from-day-one explodes the data model. Phasing protects the goal.
- **Risk: Scope creep into "AI-powered" or "diagram-from-code".** Mitigation: §4 non-goals.

## 9. Rollout

- **Phase 1: Internal use.** Build to 80% feature completeness. Use it daily for two weeks. Fix what's annoying.
- **Phase 2: Public soft launch.** Deploy to a static host. Share on HN/Reddit. No accounts, no signup.
- **Phase 3: Iterate based on signal.** If engagement is high, start v2 (cloud save + GDrive). If not, revisit.
- **Kill switch:** v1 is static + localStorage; rollback is a deploy revert.

## 10. Hand-offs

- **Architect:** §6, §3, §7 → ADRs 0001/0002/0003 (delivered).
- **Designer:** §3, §5, §6 → flow doc for empty-canvas → first-shape → first-connector → export journey.
- **Engineer:** Unblocked once ADRs land. TDD discipline (red → green → refactor); Playwright at the system boundary.
- **QA:** §3 goals and §5 use cases define the acceptance test plan. Three flows have automated coverage: cold start → first connector, export round-trip, localStorage persistence across reload.
- **Security:** Minimal v1 surface (no auth, no PII leaving the browser). Reconvene before v2.

---

## Phased roadmap (now / next / later)

- **Shipped:** v1.0 canvas MVP — single-user, localStorage + file download/upload, PNG/SVG export, palette, connectors.
- **Shipped:** v1.1 Inspector — right-side property panel for node + edge styling, resize, edge geometry type switch.
- **Shipped:** v1.2 connector waypoints — draggable corners on connectors for explicit geometry control.
- **In progress:** v1.3 keyboard + history — undo/redo, quick-insert R/E/D/T, duplicate, nudge.
- **Next:** v1.4 command palette — `/` opens fuzzy-searchable command palette. After this, v1 PRD is complete.
- **Later:** v2 — accounts, Google Drive save/open, share-by-link view-only. Gate: v1.x shows engagement signal.
- **Later (low confidence on timing):** v3 — realtime multiplayer. Gate: v2 has a user base that asks for it.

Not a commitment with dates. Now/next/later, not Q3/Q4/Q1.

---

## v1.1 — Inspector (current)

**Why this slice.** v1.0 ships a usable canvas but offers no per-element control. The PRD's solution sketch (§6) named a contextual property panel; we deferred to ship faster. v1.1 closes that gap.

**Scope (a single Inspector panel on the right edge, selection-driven):**

When **one node** is selected:
- Resize handles on the node itself (8 handles: corners + edge midpoints)
- Label (text input in the inspector, alternative to in-canvas double-click)
- Text alignment: horizontal (left/center/right) × vertical (top/middle/bottom)
- Font family (fixed list of ~6 web-safe families for v1.1; arbitrary fonts later)
- Font size, weight (regular/medium/bold), color
- Fill color, border color

When **one edge** is selected:
- Edge type: straight / orthogonal / curved
- Label
- Stroke color, stroke width

When **nothing or multi-selection**: panel shows an empty/hint state.

**Decisions resolved up front:**
- Fonts: fixed web-safe list (system-ui, Inter, Roboto, Georgia, Menlo, Times) — not arbitrary loaders. Reason: avoids font-loading complexity and licensing in v1; trivial to swap to Google Fonts later.
- Resize handles: all 8 (corners + edge midpoints). Reason: matches user expectation; cost is the same.
- Color picker: small custom swatch grid (8 presets per slot) + native `<input type="color">` for arbitrary. Reason: presets cover 90% of cases, fallback covers the rest.
- Schema impact: none. New fields live in `data.style` (open object per ADR-0002); `edge.type` already in schema.

**Goals (v1.1):**
- Time-to-styled-shape: under 5 seconds from selection to a font/color change visible on canvas.
- Resize round-trip: drag a handle, release, value persists across reload.
- Edge type switch: change reflects on canvas immediately, no full re-render flash.

**Non-goals for v1.1:**
- Arbitrary font loaders (Google Fonts, custom upload)
- Per-character text formatting (bold one word) — text styling is shape-wide
- Edge waypoints / explicit corner control — that's v1.2
- Grouping, layers, z-order controls
- Snap-to-other-shape alignment

**Hand-offs:**
- Engineer: build per TDD discipline (failing test first); add Playwright coverage for inspector flows.
- QA: three new golden flows — select-node-and-change-font, resize-persists-reload, switch-edge-to-curved.

---

## v1.2 — Connector waypoints (current)

**Why this slice.** v1.1 lets users switch a connector between orthogonal / straight / curved, but the *path* is still auto-routed. The user's PRD-stage ask was "where corners and turns are." This slice gives users direct, dragged control over connector geometry.

**Scope.** See [ADR-0004](./adr/0004-connector-waypoints.md) for the full design. In short:
- Each edge can carry an optional `data.waypoints: { x, y }[]` array (flow coordinates).
- A custom WaypointEdge renders an SVG path through source → waypoints → target. Orthogonal L-bends between consecutive points (when `edge.type === 'orthogonal'`).
- When an edge is selected:
  - Each waypoint shows a draggable circle handle. Drag = `moveEdgeWaypoint`; snaps to 8px grid.
  - Each segment shows a faded "ghost" handle at its midpoint. Drag = insert a new waypoint at the drop position (`addEdgeWaypoint`).
- The Inspector shows a "Corners: N" badge + a "Clear corners" button (`clearEdgeWaypoints`).
- Schema impact: none. Optional new field in `edge.data`.

**Goals (v1.2):**
- A user can place at least 2 corners on a connector in under 10 seconds, no documentation needed.
- Waypoints persist across reload + survive .graffel round-trip.
- Moving a connected shape does NOT drag the waypoint with it (the line just reaches farther — see ADR-0004 "consequences").

**Non-goals for v1.2:**
- Obstacle avoidance / auto-routing around other shapes.
- Snapping to other shapes' alignment lines.
- Bezier curves with waypoints (documented limitation; bezier ignores waypoints).
- Touch-friendly handle sizing.

**Hand-offs:**
- Engineer: TDD on the waypoint store actions before any rendering; Playwright for drag interactions.
- QA: cover insert-via-midpoint-drag, move-via-handle-drag, clear-via-inspector, and waypoint-survives-reload.

---

## v1.3 — Keyboard & history (current)

**Why this slice.** v1.0–1.2 are mouse-driven. The original PRD §6 names a battery of keyboard ergonomics — undo/redo, quick-insert shape shortcuts, duplicate, arrow-nudge. Without these, a power user can't use Graffel productively.

**Scope:**
- **Undo / redo** via Cmd+Z and Cmd+Shift+Z (Ctrl on Windows). Snapshot-based history bounded to 50 entries. See [ADR-0005](./adr/0005-history-undo-redo.md). Toolbar shows ↶ Undo / ↷ Redo buttons with disabled state.
- **Quick-insert** R / E / D / T → insert Rectangle / Ellipse / Diamond / Text at the current cursor position (canvas flow coords).
- **Cmd+D** → duplicate current selection at +20px offset.
- **Arrow keys** → nudge selected nodes 1px; **Shift+Arrow** nudges 10px.
- **Cmd+A** → select all nodes + edges.

**Non-goals for v1.3:**
- Per-field undo granularity (whole-state snapshots only).
- Multi-key chords (no leader-key combos like `g g`).
- Touch-friendly equivalents.
- Selection-state in undo history (PRD §3 goal is structural undo, not UX undo).

**Goals:**
- Undo restores the last structural change in under 100ms, including for waypoint moves and style changes.
- Cmd+D + arrow nudge feels instant — no jank.
- Drag-a-shape produces ONE undo entry, not 60 (coalescing).

**Hand-offs:**
- Engineer: history middleware first (TDD); then keyboard layer.
- QA: cover undo-after-delete, redo-after-undo, quick-insert-at-cursor, duplicate, arrow-nudge.

---

## v1.4 — Command palette (next, then v1 done)

**Why this slice.** The PRD §6 names a Linear-style command palette opened with `/`. This is the last v1 ergonomic gap. After v1.4 lands, v1 PRD is fully delivered.

**Scope:**
- **`/`** opens a centered modal with a search input and a results list.
- **Arrow ↑/↓** navigates, **Enter** runs, **Esc** closes, click anywhere outside also closes.
- **Commands cover the v1 surface:** Insert any shape, Set font family / size / weight, Set fill / border color, Switch edge type, Clear waypoints, Export PNG / SVG, Download .graffel, Open file, New, Undo, Redo.
- **Fuzzy match:** simple substring scoring with token-prefix bonus. Good enough for v1; can swap in fzf-style later.
- Each command has `id`, `label`, `keywords[]`, optional `shortcut` hint, `run()` function.

**Non-goals for v1.4:**
- Recent-commands history / pinning.
- Command-aware argument prompts ("Set fill to ___" arguments).
- Plugin-extensible command sources.

**Goals:**
- Cold open of palette to first character typed: under 100ms.
- Insert-a-service-via-palette: under 5 seconds total.

**Hand-offs:**
- Engineer: command registry + fuzzy match first (TDD); then modal UI.
- QA: cover `/` opens, type filters, Enter executes, Esc closes, and verify the executed command actually mutated the document.
