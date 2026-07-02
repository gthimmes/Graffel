# ADR-0015: Version history + autosave trust

**Status:** Accepted
**Date:** 2026-07-01
**Decision owner:** Architect

## Context

Graffel autosaves to localStorage on every change (debounced), but the user has
no way to *see* that it happened and no way to get back to an earlier state. For a
single-user tool that lives entirely in the browser, that's the quiet anxiety that
stops people from trusting it with real work: "did that save?" and "I just messed
up my diagram — can I undo past what undo remembers?" Undo/redo covers the active
session (and deliberately excludes some state, e.g. tour edits), but it's gone on
reload and can't jump back hours. This slice adds the two things that turn autosave
from invisible into trustworthy: a **save indicator** and a **restorable version
history**.

## Decision

### Snapshots are full documents, stored per-document, capped

A snapshot is a complete serialized `GraffelDocument` plus metadata
(`id`, `at`, `kind: 'auto' | 'manual'`, `label`). They live under a per-document
localStorage key (`graffel.history.v1.<docId>`), separate from the document body,
so history travels with the document but never bloats the doc itself. Storing the
full body (not a diff) keeps restore trivially faithful and the code simple; the
cost is bounded by **capping**: at most `MAX_AUTO` auto-checkpoints (oldest dropped
first) and a hard `MAX_TOTAL` ceiling, while **manual snapshots are never dropped
to satisfy the auto cap** (a version you deliberately named shouldn't evaporate).
The cap + the auto-checkpoint gate are pure functions (`capHistory`,
`shouldAutoCheckpoint`), unit-tested independently of localStorage.

### Two kinds of snapshot: gated auto-checkpoints + explicit manual saves

- **Auto-checkpoints** piggyback on the existing debounced autosave. On each save
  we call `maybeAutoCheckpoint`, which writes one *only if* enough editing time has
  passed since the last snapshot (`MIN_AUTO_INTERVAL_MS`, ~90s). Without the gate,
  every keystroke-driven autosave would spam a version; with it, you get a
  timeline roughly one entry per minute-and-a-half of active work. The initial
  mount (which reflects the just-loaded document, not an edit) is skipped so
  loading a diagram doesn't manufacture a checkpoint or flip the indicator.
- **Manual snapshots** are captured on demand from the history panel, with an
  optional name — the "I'm about to try something; mark this" affordance.

### Restore is non-destructive

Restoring loads a snapshot back into the store as the current document — but first
it **checkpoints the present state** (labelled "Before restore"). So restore can
always be undone by restoring again; you can never lose current work to a misclick.
Because restore just goes through the normal `loadDocument` + save path, everything
downstream (drill-down, presenter, autosave) works unchanged.

### The indicator is a first-class, low-cost signal

A tiny `saveStatusStore` (`'idle' | 'saving' | 'saved'` + `lastSavedAt`) is driven
by the autosave effect: `markSaving()` when a change lands, `markSaved()` once it's
persisted. The toolbar renders "Saving…" / "✓ Saved · 2s ago", the relative time
refreshed on a slow interval. Idle (pre-first-edit) renders nothing, so a
read-only or untouched view isn't cluttered.

## Consequences

**Positive:**
- The trust gap closes: work is visibly saved, and any recent state is one click
  from restored — without leaving the browser or setting up a backend.
- Pure, tested pruning/gating keeps history bounded and predictable; the storage
  wrapper is thin.
- Restore reuses `loadDocument`, so it's not a special code path — nested imports,
  tours, everything restores correctly.
- Additive and self-contained: no document schema change (history is a sibling
  localStorage key), no change to the file format, nothing to migrate.

**Negative / accepted trade-offs:**
- **Full-body snapshots, not diffs.** Simplicity and faithful restore over storage
  efficiency; the caps bound the total. A diff/delta scheme could come later if
  localStorage pressure ever shows up.
- **History is per-browser/localStorage**, so it doesn't sync across devices and is
  lost if site data is cleared — acceptable for the single-user v1 (multiplayer /
  Drive-backed history is out of scope, ADR-0001).
- **Auto-checkpoint cadence is time-gated, not semantic** — it can't know that a
  particular edit was "important." Manual snapshots cover the moments that matter.

## Implementation notes

- Storage + pure logic: `src/store/history.ts` (+ `history.test.ts`) —
  `capHistory`, `shouldAutoCheckpoint`, `saveSnapshot`/`listSnapshots`/
  `loadSnapshot`/`deleteSnapshot`/`maybeAutoCheckpoint`.
- Restore orchestrator: `restoreSnapshot` in `src/store/documents.ts`
  (checkpoints current, then `loadDocument` + save).
- Indicator: `src/ui/saveStatusStore.ts` + `src/ui/SaveStatus.tsx`; relative time
  via `src/ui/timeAgo.ts` (+ test). Autosave effect in `canvas/DiagramCanvas.tsx`
  now drives status + `maybeAutoCheckpoint` (skipping the initial mount).
- UI: `src/ui/HistoryPanel.tsx` + `src/ui/historyUiStore.ts`; toolbar 🕘 History
  toggle + `<SaveStatus/>`; mounted in `App.tsx`.
- E2E: `e2e/history.spec.ts` (indicator shows Saved; snapshot → edit → restore
  reverts; delete removes a version).
