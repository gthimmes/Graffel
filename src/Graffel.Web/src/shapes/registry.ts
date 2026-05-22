import { create } from 'zustand'
import type { Pack, ShapeDef } from './types'
import { BASIC_PACK } from './packs/basic'
import { ARCH_CORE_PACK } from './packs/archCore'
import { AWS_PACK } from './packs/aws'
import { GCP_PACK } from './packs/gcp'

/**
 * The pack manifest. Add new packs here. Order is the order they appear in the
 * palette (assuming the user hasn't disabled any).
 */
export const PACKS: Pack[] = [
  BASIC_PACK,
  ARCH_CORE_PACK,
  AWS_PACK,
  GCP_PACK,
]

/**
 * Index of every shape across all packs by both pack-qualified id ('basic:rectangle')
 * AND the unqualified legacy id ('rectangle') for v1 file-format compatibility.
 */
const _shapeIndex = new Map<string, ShapeDef>()
for (const pack of PACKS) {
  for (const shape of pack.shapes) {
    _shapeIndex.set(shape.id, shape)
    // Legacy alias: shapes whose id starts with 'basic:' or 'arch-core:' are also
    // findable by the unqualified suffix (the v1 NodeType strings).
    const lastColon = shape.id.lastIndexOf(':')
    if (lastColon >= 0) {
      const tail = shape.id.slice(lastColon + 1)
      if (!_shapeIndex.has(tail)) _shapeIndex.set(tail, shape)
    }
  }
}

/** Look up a shape by id (pack-qualified or legacy unqualified). Returns undefined if unknown. */
export function getShape(id: string): ShapeDef | undefined {
  return _shapeIndex.get(id)
}

/** Filter packs by a search query against label + keywords. */
export function searchShapes(query: string): ShapeDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: ShapeDef[] = []
  for (const pack of PACKS) {
    for (const shape of pack.shapes) {
      const hay = `${shape.label} ${(shape.keywords ?? []).join(' ')}`.toLowerCase()
      if (hay.includes(q)) results.push(shape)
    }
  }
  return results
}

/* -------------------- Library preferences (which packs to show) -------------------- */

const LIBRARY_PREFS_KEY = 'graffel.libraryPrefs.v1'

interface LibraryPrefsState {
  disabledPacks: Set<string>
  togglePack: (packId: string) => void
  isEnabled: (packId: string) => boolean
}

function loadPrefs(): Set<string> {
  try {
    const raw = localStorage.getItem(LIBRARY_PREFS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { disabledPacks?: string[] }
    return new Set(parsed.disabledPacks ?? [])
  } catch {
    return new Set()
  }
}

function persistPrefs(disabled: Set<string>): void {
  try {
    localStorage.setItem(LIBRARY_PREFS_KEY, JSON.stringify({ disabledPacks: Array.from(disabled) }))
  } catch {
    // quota / no storage — accept the silent failure
  }
}

export const useLibraryPrefs = create<LibraryPrefsState>((set, get) => ({
  disabledPacks: typeof window !== 'undefined' ? loadPrefs() : new Set<string>(),
  togglePack(packId) {
    const next = new Set(get().disabledPacks)
    if (next.has(packId)) next.delete(packId)
    else next.add(packId)
    persistPrefs(next)
    set({ disabledPacks: next })
  },
  isEnabled(packId) {
    return !get().disabledPacks.has(packId)
  },
}))
