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
- **Shipped:** v1.3 keyboard + history — undo/redo, quick-insert R/E/D/T, duplicate, nudge, select-all.
- **Shipped:** v1.4 command palette — `/`-opened fuzzy command palette covering every v1 action. **v1 PRD complete.**
- **Shipped:** v2.0 accounts — Google OAuth sign-in foundation. See [ADR-0007](./adr/0007-auth-google-oauth.md).
- **Shipped:** v2.1 Drive save/open — backend-proxied Drive calls. See [ADR-0008](./adr/0008-google-drive-integration.md).
- **Shipped:** v2.2 share-by-link view-only — snapshot share links. See [ADR-0009](./adr/0009-share-by-link.md). **v2 PRD complete.**
- **Shipped:** v3.0 shape library foundation + connector right-click menu. See [ADR-0010](./adr/0010-shape-library.md).
- **Shipped:** v3.1–v3.4 vendor packs (AWS / GCP / Azure / Kubernetes). Reversed in v3.5 — see ADR-0010 §"Icon policy".
- **Shipped:** v3.5 Vendor-neutral Cloud pack (16 industry-standard concepts); Arch Core de-vendor pass.
- **Shipped:** v3.6 UML pack — 12 UML 2.x primitives.
- **Shipped:** v3.7 Flowchart & User Flow pack — 16 shapes.
- **Shipped:** v3.21 AWS pack — 24 common services as opt-in, category-colored stylized tiles (EC2, Lambda, S3, RDS, DynamoDB, VPC, CloudFront, SQS, IAM, …). Ships disabled per ADR-0010's vendor off-ramp; `Pack.defaultEnabled` is now honored by library prefs.
- **Shipped:** v3.8 Connector polish — line styles (dashed/dotted), endpoint markers (8 styles × 3 sizes), silhouette-anchored handles.
- **Shipped:** v3.9 Alignment guides + snap-to-shape + opt-in 8 px grid snap. See [ADR-0011](./adr/0011-alignment-snapping.md).
- **Shipped:** v3.9.1 Equal-spacing snap — gap-equalizer with double-tick indicators between row/column-aligned neighbors.
- **Shipped:** v3.10 Connectors-on-silhouette + label ergonomics — anchors land on the drawn icon edge (letterbox-corrected + per-shape silhouette bounds measured from rendered pixels into `iconBounds.generated.ts`); a Playwright guard (`anchorTouch.spec.ts`) asserts all 79 shapes touch on 4 sides at default/wide/tall sizes. Labels are empty by default, sit above pictograms, and are repositionable (top/bottom/left/right/center); type-on-selected-shape edits the label.
- **Shipped:** v3.15 Clipboard & edge reconnection — Ctrl+C/X/V through the system clipboard (cross-tab/cross-diagram; containers travel with contents + internal edges; ids remapped on paste; pastes into the current drill-down level at the cursor); "Copy image" puts a PNG of the view on the clipboard; drag an edge endpoint to reconnect it (self-loops refused, undoable). First slice of the Path to phenomenal below.
- **Shipped:** v3.14 Drill-down containers — the strategic "depth" bet (see [ADR-0012](./adr/0012-drilldown-containers.md)): double-click a container to enter its interior (breadcrumb + Esc to climb out); collapse a container to hide contents with edges re-targeted to it (a context diagram for free, with a hidden-count badge); shapes added while drilled in belong to that level; share links are explorable (drill navigation works read-only). Fast-follows: boundary stubs for cross-level edges, presenter walkthrough, level-deep-linked shares.
- **Shipped:** v3.13 Pointer tools + z-order — a Select/Hand tool switcher (V/H, Space-hold to pan); Select rubber-bands a marquee multi-selection (feeds Ctrl+G grouping), middle-button still pans. New node right-click menu: Bring to front / forward, Send backward / to back (reorders the nodes array → stacking within a depth), plus Duplicate, Delete, and contextual Group/Ungroup. E2E in `toolsAndZorder.spec.ts`.
- **Shipped:** v3.12 On-canvas selection toolbar — a floating quick-style bar that tracks the selection (follows pan/zoom/drag, flips above/below). Nodes: Fill/Border/Text popovers + Group/Ungroup; edges: Stroke/Line/Arrows. Reuses the Inspector's `ColorPicker`/`Segmented`; the right-side Inspector stays the full editor. Pure positioning math in `ui/selectionBox.ts`; E2E in `selectionToolbar.spec.ts`.
- **Shipped:** v3.11 Containers & grouping — React Flow parent/child (`parentId`; child positions stored parent-relative). Ctrl+G wraps a selection in a new Group/Frame container; Ctrl+Shift+G (or the inspector Ungroup button) dissolves it. Dragging a shape onto a container nests it; dragging it out releases it (no `extent` clamp, so drag-out works). `arch-core:boundary` is a container too. Deleting a container takes its contents (undo restores); duplicating clones contents. Pure nesting math in `canvas/nesting.ts`; E2E in `grouping.spec.ts`. Fast-follows: container auto-grow/collapse, wiring `cloud:region`/`k8s:namespace` (pictograms with baked-in art) as containers.
- **Now:** the Path to phenomenal sequence (v3.15–v3.20) below.
- **Later (low confidence on timing):** v4 — realtime multiplayer. Gate: v3.x has a user base that asks for it.

Not a commitment with dates. Now/next/later, not Q3/Q4/Q1.

## Path to phenomenal (v3.15+)

Post-v3.14 audit verdict: the editor is competent; "phenomenal" lives in five
gaps — clipboard muscle memory, data-lifecycle trust, the connector ceiling, the
half-told depth story, and a mute first run. This sequence closes them in
pain-per-effort order:

- **v3.15 Clipboard & edge reconnection** — Ctrl+C/X/V through the system
  clipboard (works across tabs and diagrams; copies containers with contents and
  internal edges); "Copy as image" puts a PNG on the clipboard for Slack/docs;
  drag an edge endpoint to reconnect it to another shape (no more delete+redraw).
- **v3.16 Documents** — ✅ shipped: multi-document local library (list, recents,
  rename, delete), so "New" stops being destructive; native confirm()/alert()
  replaced with in-app modal dialogs; legacy single-doc key auto-migrated; fixed
  a share-view bug that overwrote your local document. **v3.16.1 (deferred):**
  autosave history / restore previous versions.
- **v3.17 Depth, finished** — ✅ shipped: cross-level edges now surface as
  clickable boundary-stub chips on the in-level endpoint ("← Web App" / "→ Email
  Provider") instead of vanishing; clicking one reveals the off-level peer. A
  brief fade animates level changes (reduced-motion aware). Level deep-links via
  the URL hash (`#l=<id>`) keep the address bar shareable and let a "🔗 Link"
  breadcrumb button copy a link that reopens the exact level — including for
  read-only share views. Completes ADR-0012's deferred list.
- **v3.18 First run** — ✅ shipped: empty-canvas welcome overlay with three
  one-click starters (Web service architecture, Flowchart, Microservices); the
  architecture starter nests services in an enterable container so drill-down is
  discovered immediately. Shortcut tips (`/` palette, double-click-to-drill,
  R/E/D/T) on the overlay, and a hover "⤢ Double-click to open" hint on every
  container. Overlay never shows in read-only share views.
- **v3.19 Connector mastery** — ✅ shipped: floating edges (each end auto-selects
  the shape's facing silhouette anchor and re-sides live as nodes move — no more
  lines stabbing through or dangling off a corner); obstacle-aware orthogonal
  routing (a Hanan-lattice + fewest-bends router bends connectors around
  intervening shapes with margin clearance, falling back to a smooth step if
  boxed in); slideable edge labels (drag a label anywhere along its connector,
  position persisted as a 0–1 fraction). Manual waypoints still override routing.
- **v3.20 Delight & proof** — ✅ shipped.
  - ✅ **One-shot auto-layout ("Tidy up")** — a toolbar button + `View: Tidy up`
    command run ELK (`elk.algorithm: layered`, lazily code-split so it stays out
    of the initial bundle) on the level currently in view, arranging its shapes
    into a clean left-to-right hierarchy and re-fitting the view. Applied as a
    single undoable step; respects drill-down (only the current level moves).
  - ✅ **200-node performance proof** — an E2E fixture seeds 200 nodes + ~210
    edges and samples every animation frame: continuous pan+zoom holds the §3
    **60fps budget** (median 16.7ms). The same fixture surfaced that dragging a
    heavily-connected node was a full-scene re-render (~8fps); fixed by caching
    rf node/edge identities so a move only re-renders the moved node + its
    incident edges (worst-case 13-edge hub now ~30fps), and by reading edge
    obstacle rects imperatively instead of subscribing every edge to node changes.
  - ✅ **Dark mode** — a toolbar toggle (🌙/☀️) flips the chrome + canvas palette
    via a `data-theme` attribute on `<html>`; preference persists (defaults to the
    OS setting). The whole UI is CSS-variable driven, so only one override block is
    needed; shape fills/text are authored colors, so diagrams keep their look.
  - ✅ **Container auto-grow** — dragging a child to (or past) a container's edge
    grows the container to keep it inside, shifting the origin and offsetting
    children when the content pokes past the top/left. Pure `fitContainer`, applied
    on drag-stop.

**Path to phenomenal: complete.** All five post-v3.14 gaps (clipboard, documents,
depth, first-run, connectors) plus the delight/proof slice are shipped.

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

---

## v2.0 — Accounts foundation (current)

**Why this slice.** v2.1 (Drive save/open) and v2.2 (share-by-link) both depend on knowing who the user is. v2.0 is just that: a Google OAuth sign-in, a cookie session, and an `/api/me` endpoint. No Drive yet.

**Scope.** See [ADR-0007](./adr/0007-auth-google-oauth.md) for the architecture. In short:
- "Sign in with Google" button in the toolbar.
- Server endpoints: `/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/signout`, `/api/me`.
- Scopes requested up front include `drive.file` so v2.1 can use the same consent.
- When signed in: toolbar shows the user's avatar + name + a Sign-out option.
- When signed out: the v1 features (localStorage save, file download, export) continue working unchanged — auth is **opt-in** for v2.0.

**Goals:**
- Time from "Sign in" click to authenticated UI: under 5 seconds (excluding Google's consent page).
- Reload preserves the session.
- A user with no Google credentials configured (operator hasn't set up Cloud Console) sees a clear "Sign-in is not configured" message, not a crash.

**Non-goals for v2.0:**
- Multi-provider auth (email/password, GitHub, etc.).
- Server-side user accounts table (no DB; identity comes from Google's `sub` claim, stored in the cookie).
- Drive integration (v2.1).
- Account deletion / data export UX (defer until we actually store user data server-side).

**Hand-offs:**
- Engineer: TestAuthHandler before the real Google handler; build with hermetic tests.
- QA: cover anon → sign-in → signed-in → sign-out cycle via TestAuthHandler; document manual Google flow steps for release verification.

---

## v2.1 — Google Drive save/open (next)

**Why this slice.** The user explicitly named GDrive as the primary remote storage in the original PRD discovery. v2.1 makes the local-only `.graffel` files cloud-resident.

**Scope:**
- "Save to Drive" creates (first time) or updates (subsequent saves) a `.graffel` file in the user's Drive, accessible only via the Graffel app (drive.file scope).
- "Open from Drive" shows a list of the user's Graffel-created files; clicking one loads it.
- The currently loaded diagram tracks its Drive file id (in the `.reserved.remote` slot per ADR-0002); subsequent saves overwrite that file.
- Local autosave to localStorage continues to work as a fallback.

**Non-goals for v2.1:**
- Background autosave to Drive (only explicit Save to Drive in v2.1).
- File rename / delete via the Graffel UI (do it in Drive).
- Conflict detection between Drive and local edits.

---

## v2.2 — Share-by-link (next, then v2 done)

**Why this slice.** The PRD names "share-by-link view-only" as the v2 collaboration surface — a stepping-stone to v3 multiplayer.

**Scope:**
- "Share" button creates a short token bound to the current Drive file id (or to a snapshot if not yet saved to Drive).
- The token resolves at `/v/{token}` to a read-only render of the diagram.
- Anyone with the link can view; no sign-in required to view.
- Owners can revoke a share token.
- Read-only mode hides the inspector + palette; canvas is pan/zoom only.

**Non-goals for v2.2:**
- Per-link expiry.
- Comments / annotations on shared diagrams.
- Embed (iframe) support.

After v2.2 lands, v2 PRD is complete — onward to v3 multiplayer.

---

## v3.0 — Shape library foundation + connector polish (current)

**Why this slice.** The v1 palette was a placeholder — text labels with colored squares that looked like checkboxes. To be credible as "architecture-first" we need real visual shapes, dozens of them, categorized and searchable. v3.0 lays the foundation (registry, palette UX, library manager) and ships the first two packs (Basic + Architecture Core). v3.1–v3.4 add the cloud packs.

Also: ADR-0004 (v1.2) gave users explicit waypoint placement. Users now want a one-click escape hatch — right-click → "Make right-angle" — to abandon explicit routing and let the auto-router take over. v3.0 closes that loop.

**Scope.** See [ADR-0010](./adr/0010-shape-library.md):
- Pack-based shape registry (`ShapeDef`, `Pack`); palette/canvas resolve shapes by id (`'basic:rectangle'`, `'arch-core:database'`).
- Two packs shipped: **Basic** (Rectangle, Ellipse, Diamond, Text) and **Architecture · Core** (Service, Database, Queue, Boundary, Server, Storage, Load Balancer, CDN, Cache, DNS, Function, API Gateway, Client, Mobile, IoT, External).
- Redesigned Palette: search input, collapsible categories, visual mini-SVG previews, tooltip on hover. No more colored-square swatches.
- Library Manager modal: toggle which packs appear; persists to localStorage.
- Connector right-click context menu: Make right-angle / Make straight / Make curved / Clear corners.
- Legacy `.graffel` files continue to load (the v1 ids `'rectangle'` etc. alias to the Basic pack's pack-qualified ids).

**Goals (v3.0):**
- A user can find any installed shape in under 5 seconds (search + categories).
- Palette load time stays well under 100ms across all enabled packs.
- The colored-square-that-looked-like-a-checkbox is gone.
- Right-click on any connector reveals the geometry menu; selecting "Make right-angle" auto-routes the line.

**Non-goals for v3.0:**
- Official AWS/GCP/Azure/CNCF icon sets — we ship stylized icons we author ourselves (see ADR-0010 license stance).
- Shape grouping or "smart shapes" (containers that auto-resize around children).
- Per-shape connection points beyond the four edge handles.
- Touch/mobile-friendly handle sizing for the right-click menu.

---

## v3.1–v3.4 — vendor packs (shipped, then superseded)
v3.1 AWS, v3.2 GCP, v3.3 Azure, v3.4 Kubernetes shipped as stylized per-vendor icon sets. v3.5 reversed three of them after user feedback (see ADR-0010 §"Icon policy"). Only the Kubernetes pack survived — CNCF is an open standard, not a single-vendor brand.

## v3.5 — Vendor-neutral Cloud pack (shipped)
One **Cloud** pack with 16 concepts standard across the industry (Virtual Machine, Container, Object Storage, Serverless Function, etc.) plus an Arch Core de-vendor pass (no rain glyphs, no lambda symbols). Establishes the "icon policy" that future packs follow.

## v3.6 — UML pack (shipped)
12 UML 2.x primitives (Class, Interface, Actor, Use Case, etc.).

## v3.7 — Flowchart & User Flow pack (shipped)
16 shapes for swimlanes, decisions, terminators, and user-flow primitives.

## v3.8 — Connector polish (shipped)
Three improvements to how connectors look and connect:
1. **Line styles** — solid / dashed / dotted via `edge.data.style.strokeStyle`.
2. **Endpoint markers** — arrow (filled / open), triangle, diamond, circle, all filled and outline variants; `markerSize` small/medium/large. 48 marker variants in one shared `<defs>` block.
3. **Silhouette anchors** — connection handles snap to the visual edge of cylinders, diamonds, circles, and heptagons instead of the bounding-box corners.

## v3.9 — Alignment guides + snap (shipped)

**Why this slice.** Connectors look right and shapes look right; the remaining "feels old" gap is what happens *between* shapes. Drag-time alignment guides + snap-to-shape close that gap with one focused, geometry-only slice.

**Scope.** See [ADR-0011](./adr/0011-alignment-snapping.md):
- Edge↔edge and center↔center snap within 4 px; centers beat edges on tie. One cyan (center) or magenta (edge) guide line per fired axis, spanning the dragged rect and every other rect sharing the snapped position.
- Opt-in 8 px grid snap toggled via toolbar (⌗ Grid button) or `Cmd/Ctrl+;`. Persisted to localStorage `graffel.snapGrid.v1`.
- Hold `Alt` during a drag → snap suppressed for that drag.
- Guides are ephemeral — never written to `.graffel`.

**Non-goals for v3.9 (fast-follow candidates):**
- Equal-spacing snap (gap-equalizer) — shipped as v3.9.1 (below).
- Multi-node-drag snap.
- Snap on resize (only on move).
- Align / Distribute toolbar actions.

**Goals:**
- Time-to-aligned-pair: under 2 seconds with no keyboard precision work.
- Snap geometry is pure / unit-tested — 19 unit tests in `snap.test.ts`.
- A drag near alignment is provably end-to-end snapped: 3 Playwright specs cover toolbar persistence, keyboard toggle, and drag-with-guide.

**Hand-offs:**
- Engineer: TDD on `snap.ts` first; then wire into `onNodesChange`; then `AlignmentGuides` overlay.
- QA: cover the toggle persistence, the keyboard shortcut, and a drag that produces both a visible guide mid-drag and a snapped position in the store.

---

## v3.9.1 — Equal-spacing snap (shipped)

**Why this slice.** v3.9 closed edge↔edge and center↔center alignment but left the "B sits between A and C with mismatched gaps" case unsolved — exactly the case architects hit constantly when laying out service rows. v3.9.1 closes it as the fast-follow ADR-0011 named.

**Scope.** See [ADR-0011 v3.9.1 amendment](./adr/0011-alignment-snapping.md#v391-amendment--equal-spacing-snap-shipped):
- New `kind: 'spacing'` variant on the `Guide` discriminated union (carries `axis`, `perpendicular`, `span`).
- For each axis, find every pair of other rects flanking the dragged rect with all three centers within `ROW_TOLERANCE = 8 px` on the perpendicular axis. Propose `delta = (gap2 - gap1) / 2`; snap when `|delta| ≤ 4 px`.
- Edge/center alignment beats equal-spacing at the same `|delta|` via per-candidate `kindPriority`.
- Two spacing guides emit per fire (one per gap). Rendered in orange (#fb923c) with end ticks, distinct from cyan center / magenta edge.

**Non-goals (still deferred):**
- Multi-node-drag snap.
- Resize snap.
- Align / Distribute toolbar actions.

**Goals (v3.9.1):**
- 10 unit tests cover the new geometry (row-alignment requirement, two-neighbor requirement, order invariance, tiebreak with edge/center, snap-only-when-within-threshold, overlap rejection).
- 1 Playwright spec drives a real drag and proves a spacing guide fires + lands in the DOM during the drag.

**Hand-offs:**
- Engineer: extend `snap.ts` only; `AlignmentGuides` rendering follows from the new guide variant.
- QA: cover one E2E spec — a drag between two flanking nodes triggers the gap-equalizer.
