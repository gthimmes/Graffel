// v3.23 — walkthrough (presenter) mode. Pure helpers for resolving and ordering
// tour stops; the store owns id generation and playback state, these stay
// side-effect-free so they're trivially testable.

import type { TourStop } from '../format/types'

/**
 * Reconcile a stored stop against the diagram as it exists now. The level falls
 * back to root if its container was deleted; selected ids that no longer exist
 * are dropped (so playback never points at a ghost node).
 */
export function resolveStop(
  stop: TourStop,
  presentIds: Set<string>,
): { viewRootId: string | null; selectedNodeIds: string[] } {
  const viewRootId = stop.viewRootId && presentIds.has(stop.viewRootId) ? stop.viewRootId : null
  const selectedNodeIds = stop.selectedNodeIds.filter((id) => presentIds.has(id))
  return { viewRootId, selectedNodeIds }
}

/** Reorder one stop by `dir` (-1 = earlier, +1 = later). Always returns a new array. */
export function moveStop(stops: TourStop[], id: string, dir: -1 | 1): TourStop[] {
  const i = stops.findIndex((s) => s.id === id)
  const j = i + dir
  if (i === -1 || j < 0 || j >= stops.length) return stops.slice()
  const next = stops.slice()
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  return next
}

/** Clamp an index into [0, len-1]; 0 for an empty list. */
export function clampIndex(index: number, len: number): number {
  if (len <= 0) return 0
  return Math.max(0, Math.min(len - 1, index))
}

/** Default human title for the nth (0-based) stop. */
export function defaultStopTitle(index: number): string {
  return `Stop ${index + 1}`
}
