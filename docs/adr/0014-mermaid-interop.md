# ADR-0014: Mermaid interop (import + export)

**Status:** Accepted
**Date:** 2026-06-26
**Decision owner:** Architect

## Context

Graffel's differentiators — drill-down depth (ADR-0012) and presenter mode
(ADR-0013) — are reasons to *stay*. They do nothing about the reason a new tool
gets closed in the first thirty seconds: **"I can't get my existing diagrams in."**
Architects don't start from a blank canvas; they have diagrams already, and a
large share of them live as **Mermaid** in READMEs, wikis, ADRs, and git. Mermaid
is the lingua franca of diagrams-as-text. Reading and writing it is the cheapest,
highest-leverage thing we can do to remove adoption friction — and it plays *with*
the depth bet rather than against it (a flowchart is exactly the kind of thing that
later wants drilling into).

## Decision

Ship two-way interop for the Mermaid **flowchart** dialect (`graph` /
`flowchart`) — the form architects actually paste. Scope is deliberately the
flat flowchart; richer dialects (sequence, class, state) and `subgraph`→container
mapping are out of v1 (see "Deferred").

### A clean pipeline of pure stages, then one impure orchestrator

The conversion is split so each stage is independently unit-testable and the only
impure step (ELK layout + touching the document library) is isolated:

```
text ──parseMermaid──▶ MermaidGraph ──buildGraph──▶ {nodes, edges} ──layout+import──▶ document
                          ▲                                                   (importMermaid.ts)
GraffelNodes ────────toMermaid──▶ text
```

- **`parseMermaid`** (pure) reads the header/direction, node declarations with the
  common shape wrappers (`[]` rect, `()` round, `([])` stadium, `{}` diamond,
  `(())` circle, `[()]` cylinder), and link statements — including chains
  (`A --> B --> C`), pipe labels (`-->|x|`), and inline labels (`-- x -->`). It
  tolerates comments, styling/interaction directives, and `subgraph` framing
  (flattened, not errored). First-seen ordering is preserved; a later labeled
  reference upgrades an earlier bare one.
- **`buildGraph`** (pure) maps Mermaid shapes onto registry shape ids
  (`basic:rectangle` / `basic:diamond` / `basic:ellipse`, and `[()]` →
  `arch-core:database`), stamps registry default sizes, and picks edge handles
  from the flow direction so routing reads cleanly the instant the import lands.
- **`toMermaid`** (pure) serializes a flat node/edge set back to `graph` text.
  Opaque ulid ids are aliased to stable short names (`N0`, `N1`, …); labels are
  quoted so arbitrary punctuation survives a round-trip.
- **`importMermaid`** (impure) is the only async/stateful piece: it runs the
  parsed graph through the **existing ELK layout** (`layoutLevel`, reused verbatim
  from "Tidy up", ADR-implicit v3.20) and opens the result as a **new document**
  via the standard `importDocument` path — so the user's current diagram is saved,
  not clobbered.

### Reuse layout; never persist a hand-placed import

Mermaid carries no coordinates, so an import *must* be laid out. Rather than invent
placement, we feed it straight into the same ELK pass the Tidy-up button uses. The
import therefore arrives looking like a tidied diagram — and, being just nodes +
edges in the normal format, every later feature (drill-down, presenter, export)
works on it with zero special-casing.

### Export follows the view

`toMermaid` serializes the **level currently in view** (the direct children of
`viewRootId` and the edges internal to it) — the same scoping as Tidy up and image
export. A drilled-in level exports as its own flat flowchart; the hierarchy is not
forced into one flat blob.

### UI: a single two-mode dialog

One `MermaidDialog` with an import mode (paste textarea → convert) and an export
mode (read-only text + Copy + Download `.mmd`). Import is surfaced as a toolbar
button (`⇄ Mermaid`, the adoption hook) and both modes live in the command palette.
The dialog reuses the existing modal overlay/role/keyboard chrome; the only new CSS
is a wider shell and a monospace text area.

## Consequences

**Positive:**
- Removes the single biggest first-run barrier: existing Mermaid diagrams come in
  with one paste, auto-arranged.
- Diagrams-as-text out: a level drops into a README/wiki/ADR and stays in sync with
  how engineers already work.
- The pure-stage split means the parser/serializer are exhaustively unit-tested
  away from React, ELK, and the store; the round-trip is asserted in both unit and
  E2E layers.
- Imports are ordinary documents — depth, presenter, and `.graffel` export all
  apply for free.

**Negative / accepted trade-offs:**
- **Flat only in v1.** `subgraph` blocks are flattened on import, and export emits a
  single flat graph per level. Mapping subgraphs ↔ drill-down containers is the
  obvious next slice (the depth payoff) but needs a per-level hierarchical layout
  pass, so it's deferred rather than half-done.
- **Flowchart dialect only.** Sequence/class/state/ER diagrams are not parsed; the
  header check rejects them with a clear message rather than mangling them.
- **Lossy round-trip by design.** Styling, exact geometry, waypoints, and edge
  line-styles don't survive a Graffel→Mermaid→Graffel trip — Mermaid can't express
  them. The *structure* (nodes, shapes, labels, connections, direction) round-trips
  faithfully, which is the point.

## Deferred (fast-follows)

- **`subgraph` ↔ container** — import nested subgraphs as drill-down containers and
  export containers as subgraphs. The headline depth-interop slice.
- **More dialects** — at least sequence diagrams (architects use them constantly).
- **Frontmatter title** — read `---\ntitle: …\n---` into the document title.

## Implementation notes

- Pure logic + tests: `src/format/mermaid/parseMermaid.ts`, `toMermaid.ts`,
  `buildGraph.ts` (+ `.test.ts` each), and `exportFromStore.test.ts`.
- Orchestration: `src/format/mermaid/importMermaid.ts` (`importMermaidText`,
  `exportCurrentLevelMermaid`) — reuses `canvas/autoLayout.layoutLevel`.
- UI: `src/ui/mermaidStore.ts`, `src/ui/MermaidDialog.tsx`; toolbar `⇄ Mermaid`
  button; palette commands `mermaid-import` / `mermaid-export`; mounted in `App.tsx`.
- E2E: `e2e/mermaid.spec.ts` (paste → laid-out shapes + direction; malformed →
  error keeps dialog open; export → `graph TD` with correct wrappers).
