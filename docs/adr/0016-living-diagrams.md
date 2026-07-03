# ADR-0016: Living diagrams — generate from docker-compose (slice 1)

**Status:** Accepted
**Date:** 2026-07-03
**Decision owner:** Architect

## Context

Every diagramming tool draws boxes; almost none *know about the system*. The most
valuable thing an architecture tool can do — and the thing draw.io and its clones
don't — is generate a diagram from a source of truth and keep it honest as that
source changes. Architecture diagrams rot: someone draws them once, the system
moves on, and the picture quietly lies. "Living diagrams" is the direction that
closes that gap.

This ADR covers **slice 1: generate**. Point Graffel at a `docker-compose.yml` and
get an auto-laid-out architecture diagram. We deliberately picked docker-compose as
the on-ramp (over Kubernetes, Terraform, or repo inference) because it has the
cleanest 1:1 mapping to Graffel's model — services are nodes, `depends_on` is edges,
the image names the shape — so it's a fully deterministic, unit-testable target that
lets us prove the pipeline and, crucially, the **identity model** that a later
re-sync depends on. **Slice 2 (re-sync)** — re-import preserving manual layout with
a change diff — is the payoff and is explicitly out of scope here.

## Decision

### Reuse the Mermaid import spine

Living-diagram import is the same shape as Mermaid import (ADR-0014): a chain of
**pure** modules feeding one **impure** orchestrator.

- `src/format/compose/parseCompose.ts` — YAML → `ComposeModel`
  (`services[{name, image, build, dependsOn, ports, networks}]`). YAML tokenizing is
  delegated to the mainstream `yaml` package so our code only handles compose
  *semantics* (e.g. `depends_on` in both list and long map/condition forms).
- `src/format/compose/inferShape.ts` — image name → registry shape id. An ordered,
  generous keyword table (Postgres/MySQL/Mongo→`database`, Redis→`cache`,
  RabbitMQ/Kafka/NATS→`queue`, Nginx/Traefik→`api-gateway`, MinIO→`storage`,
  Prometheus/Grafana→`monitoring`), registry/tag stripped, default `service`. Being
  generous is the point: a generated picture should already *read* like an
  architecture, and a plain service box is a safe miss.
- `src/format/compose/buildComposeGraph.ts` — `ComposeModel` → Graffel nodes/edges.
- `src/format/compose/importCompose.ts` — parse → build → ELK (`layoutNested`) →
  open as a new document. Impure; covered by `e2e/compose.spec.ts`.

### Ids are derived from the source — the seed of re-sync

Nodes get `compose:<service>` ids and edges `ce:<from>__<to>`, not random ulids.
Re-building the same file yields byte-identical ids. This is the whole reason to do
generate first: slice 2's re-sync will match a freshly-generated graph against the
current (hand-edited) diagram by these stable ids to preserve moved/styled nodes and
compute an add/remove/change diff. Getting identity right now is what makes the
"doesn't rot" slice a merge instead of a rewrite.

### Provenance is stored on the document — and carried through the store

The document remembers where it came from: `metadata.source =
{ kind: 'compose', text, importedAt }` (new optional `DocumentSource`, an additive
field — no schema-version bump). The subtlety: the store rebuilds the document in
`toDocument()` on every autosave, so a field that lived only on `metadata` would be
**erased by the next autosave**. So `documentSource` is threaded through the store
state (set in `loadDocument`, emitted in `toDocument`), the same way `driveFileId`
is. Without this, re-sync would have nothing to diff against after a reload.

### `depends_on` orientation

`web depends_on db` means web needs db, so the call arrow points **web → db**.
Dangling `depends_on` (naming an undeclared service) is skipped rather than
inventing a phantom node.

## Consequences

**Positive:**
- Graffel goes from "draws boxes" to "drafts your architecture from the source of
  truth" — the headline differentiator, shipped as one self-contained slice.
- Stable ids + persisted provenance mean slice 2 (re-sync) is a merge over a known
  identity, not a new pipeline.
- Pure parse/infer/build are unit-tested independently of the DOM/ELK; the
  orchestrator is E2E-tested. Additive: no file-format migration.

**Negative / accepted trade-offs:**
- **Generate-only for now.** Re-importing an updated compose file opens a *new*
  diagram; it doesn't yet sync into an existing one. That's slice 2, deliberately.
- **Shape inference is heuristic.** An unknown image becomes a generic service.
  Broadening the table (or letting users correct a mapping) is cheap follow-up.
- **`depends_on` is the only edge source.** Compose networks/ports aren't yet
  rendered as containers/annotations — a later enrichment.
- **docker-compose only.** Kubernetes / Terraform / repo inference are future
  on-ramps that will reuse this same generate→(sync) spine.

## Implementation notes

- Pure: `src/format/compose/{parseCompose,inferShape,buildComposeGraph}.ts`
  (+ co-located `.test.ts`). Orchestrator: `importCompose.ts`.
- Store: `documentSource` added to `diagramState` (set in `loadDocument`, emitted in
  `toDocument`) so provenance survives autosave; `DocumentSource` type in
  `format/types.ts`.
- UI: `src/ui/composeStore.ts` + `ComposeDialog.tsx` (paste + file), reusing the
  Mermaid dialog styles; `compose-import` command; toolbar **🐳 Compose**; mounted
  in `App.tsx`.
- Dep: `yaml` (parser).
- E2E: `e2e/compose.spec.ts` (compose → inferred shapes + `depends_on` edges + laid
  out + provenance recorded; malformed source surfaces an error, dialog stays open).

## Update (v3.28) — slice 2: re-sync (the "doesn't rot" payoff)

Re-importing an updated compose file now **merges into the existing diagram**
instead of opening a new one — the point of living diagrams.

### The merge is a pure function over stable ids

`src/format/compose/syncCompose.ts` — `syncComposeGraph(existing, fresh)` →
`{ nodes, edges, diff }`. Matching is by the slice-1 stable ids:

- **Matched** (`compose:<svc>` in both): keep the user's `position`/`size`/`data`
  (layout + styling) verbatim; adopt only the freshly-**inferred shape** (so an
  image swap re-types the node). Reported `changed` if the shape moved, else
  `unchanged`.
- **Added** (in fresh only): staged in a row **below the existing bounding box** so
  nothing is displaced — re-sync must never rearrange your diagram; new services
  arrive somewhere obvious to wire in. (Deterministic placement, no ELK — full
  re-layout is a Tidy-up away if wanted.)
- **Removed** (compose id in existing, gone from fresh): dropped, with its edges.
- **Hand-drawn** nodes/edges (ids without the `compose:`/`ce:` prefix) are **passed
  through untouched** and never appear in the diff — your manual annotations are
  safe. A final pass drops any edge (even manual) left dangling by a removal.

Edges follow the same id match/add/remove, so manual waypoints on a surviving
compose edge are preserved.

### Applied as one undoable step; provenance advances

The orchestrator `resyncComposeFromText` (impure) reads the live graph, computes the
merge, and applies it via a new store action **`replaceGraph(nodes, edges)`** (a
single `snapshot()` → the whole re-sync is one Ctrl-Z, `readOnly`-guarded). It then
advances provenance (`setDocumentSource` with the new text) so the *next* re-sync
diffs against the latest file, and persists. The dialog (mounted only while open, so
each open is a fresh mount that pre-fills the stored source — sidestepping an
effect-cascade that would wipe the summary) shows a **change report**:
"+2 added · −1 removed · N unchanged · your layout was preserved".

### Consequences

- The headline promise is real: your compose diagram tracks the source of truth
  without you redrawing it, and you can always see *what* changed.
- Pure merge (6 unit tests) + undoable single-step apply; no schema change.
- Trade-off: new nodes are staged, not intelligently re-laid-out among existing
  ones (a deliberate "never move your stuff" choice). Networks/ports still unused.

Files: `src/format/compose/syncCompose.ts` (+`.test.ts`); `resyncComposeFromText`
in `importCompose.ts`; `replaceGraph`/`setDocumentSource` in `store/diagramStore.ts`;
re-sync mode + summary in `ui/ComposeDialog.tsx` (conditionally mounted in
`App.tsx`); `e2e/compose.spec.ts` (+2: merge-preserves-layout with undo; removal).
