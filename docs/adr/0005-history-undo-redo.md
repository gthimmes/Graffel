# ADR-0005: Undo/redo via snapshot stack

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

v1.3 brings keyboard shortcuts and undo/redo. The PRD names "Cmd+Z / cmd+shift+Z unbounded undo/redo" as a v1 goal. Decision: how to track history.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Snapshot stack** (deep-copy state before each mutation) | Trivial to implement; correct by construction; trivially restores any field added later | Memory grows with stack size and state size; whole-state replay can flash UI |
| **Command pattern** (record forward + inverse operations) | Memory-efficient; granular | Every action needs an inverse; new actions risk being added without an inverse; expensive to evolve |
| **State patches** (e.g. Immer patches) | Memory-efficient; auto-inverse | Adds Immer dependency; patch granularity for nested arrays (waypoints) gets fiddly |

## Decision

**Snapshot stack.** Each undo-worthy mutation pushes a shallow-but-deep-enough copy of `{ nodes, edges, title, documentId }` onto a past stack. Undo pops past → restores → pushes onto future stack. Any new mutation clears the future stack.

- **Bounded:** 50 entries. Old entries drop off the bottom.
- **Coalescing:** consecutive `updateNodePosition` for the same node within 300ms collapse into a single history entry (dragging a shape shouldn't create 60 undo entries).
- **Selection is NOT part of history.** Undoing a delete restores the deleted nodes but doesn't restore the prior selection. Standard behavior in most tools.

## Rationale

- The state we care about is small: a v1.3-scale diagram is ~hundreds of nodes/edges, well under 1MB JSON. 50 snapshots × 1MB = 50MB worst case, almost always far less.
- Snapshot stack is the **boring, correct** choice. New actions get undo support for free (no inverse to write).
- Coalescing is the one cleverness — it solves the "drag = 100 history entries" problem without ditching the simple model.

## Consequences

**Positive:**
- Every store action gets undo support automatically.
- Future v2 (cloud) and v3 (multiplayer) can co-exist with this — undo is local, multiplayer ops are separate.
- Simple test surface: do action, undo, assert state matches pre-action snapshot.

**Negative:**
- Memory cost on large diagrams. Mitigated by bounded stack; revisit if it bites.
- No granular per-field undo (can't undo just the color change without undoing the position change that came after). Standard behavior.

## Off-ramps

If memory ever becomes an issue, the data shape is already JSON-serializable — we could compress snapshots via JSON+gzip, or migrate to Immer patches without changing the action API.

## Implementation notes

- The history slice wraps the existing `useDiagramStore` actions. Each "undo-able" action pushes a snapshot **before** mutating.
- Reading actions (`selectNodes`, `selectEdges`) do NOT snapshot.
- Coalescing key: `${actionName}:${argHash}`. If the same key fires within the coalesce window, replace the top snapshot instead of pushing a new one.
- API surface added to the store: `undo()`, `redo()`, `canUndo: boolean`, `canRedo: boolean`.
