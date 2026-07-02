import { ulid } from 'ulid'
import { parseDocument, serializeDocument } from '../format/graffelFile'
import type { GraffelDocument } from '../format/types'

// v3.26 — per-document version history. Snapshots (auto-checkpoints + manual
// saves) live under their own localStorage key, capped so history can't grow
// unbounded. The pruning + gating logic is pure and unit-tested; the rest is a
// thin localStorage wrapper.

export const HISTORY_KEY_PREFIX = 'graffel.history.v1.'
export const MAX_AUTO = 20
export const MAX_TOTAL = 40
/** Minimum spacing between auto-checkpoints (ms of editing activity). */
export const MIN_AUTO_INTERVAL_MS = 90_000

export type SnapshotKind = 'auto' | 'manual'

export interface StoredSnapshot {
  id: string
  at: string // ISO timestamp
  kind: SnapshotKind
  label: string | null
  body: string // serialized GraffelDocument
}

export type SnapshotMeta = Omit<StoredSnapshot, 'body'>

// ── pure helpers ─────────────────────────────────────────────────────────────

/**
 * Cap a history list (stored oldest→newest). Auto-checkpoints beyond `maxAuto`
 * are dropped oldest-first; manual snapshots are always kept — until the whole
 * list exceeds the hard `maxTotal`, at which point the oldest entries go.
 */
export function capHistory(list: StoredSnapshot[], maxAuto = MAX_AUTO, maxTotal = MAX_TOTAL): StoredSnapshot[] {
  const autos = list.filter((s) => s.kind === 'auto')
  const dropIds = new Set(autos.slice(0, Math.max(0, autos.length - maxAuto)).map((s) => s.id))
  let kept = list.filter((s) => !dropIds.has(s.id))
  if (kept.length > maxTotal) kept = kept.slice(kept.length - maxTotal)
  return kept
}

/** Whether enough time has passed since the last snapshot to auto-checkpoint. */
export function shouldAutoCheckpoint(lastAt: number | null, now: number, minMs = MIN_AUTO_INTERVAL_MS): boolean {
  if (lastAt === null) return true
  return now - lastAt >= minMs
}

// ── localStorage wrappers ────────────────────────────────────────────────────

function key(docId: string): string {
  return `${HISTORY_KEY_PREFIX}${docId}`
}

function read(docId: string): StoredSnapshot[] {
  try {
    const raw = localStorage.getItem(key(docId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as StoredSnapshot[]) : []
  } catch {
    return []
  }
}

function write(docId: string, list: StoredSnapshot[]): void {
  try {
    localStorage.setItem(key(docId), JSON.stringify(list))
  } catch {
    // Quota / disabled — history is best-effort, never blocks editing.
  }
}

/** Snapshot metadata for the current document, newest first. */
export function listSnapshots(docId: string): SnapshotMeta[] {
  return read(docId)
    .map(({ id, at, kind, label }) => ({ id, at, kind, label }))
    .reverse()
}

/** Capture a document as a new snapshot; returns its metadata. */
export function saveSnapshot(
  docId: string,
  doc: GraffelDocument,
  opts: { kind: SnapshotKind; label?: string | null; at?: number },
): SnapshotMeta {
  const snap: StoredSnapshot = {
    id: `s_${ulid()}`,
    at: new Date(opts.at ?? Date.now()).toISOString(),
    kind: opts.kind,
    label: opts.label ?? null,
    body: serializeDocument(doc),
  }
  write(docId, capHistory([...read(docId), snap]))
  return { id: snap.id, at: snap.at, kind: snap.kind, label: snap.label }
}

/** Parse a stored snapshot back to a document (null if missing/corrupt). */
export function loadSnapshot(docId: string, snapId: string): GraffelDocument | null {
  const s = read(docId).find((x) => x.id === snapId)
  if (!s) return null
  try {
    return parseDocument(s.body)
  } catch {
    return null
  }
}

export function deleteSnapshot(docId: string, snapId: string): void {
  write(docId, read(docId).filter((x) => x.id !== snapId))
}

export function clearHistory(docId: string): void {
  try {
    localStorage.removeItem(key(docId))
  } catch {
    // ignore
  }
}

/** Epoch ms of the most recent snapshot, or null if none. */
export function lastSnapshotAt(docId: string): number | null {
  const list = read(docId)
  if (list.length === 0) return null
  return new Date(list[list.length - 1]!.at).getTime()
}

/** Write an auto-checkpoint iff the gate allows it. Returns whether one was written. */
export function maybeAutoCheckpoint(docId: string, doc: GraffelDocument, now: number = Date.now()): boolean {
  if (!shouldAutoCheckpoint(lastSnapshotAt(docId), now)) return false
  saveSnapshot(docId, doc, { kind: 'auto', at: now })
  return true
}
