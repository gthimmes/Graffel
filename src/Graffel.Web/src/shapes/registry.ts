import { create } from 'zustand'
import type { Fit, LabelPosition, Pack, ShapeDef } from './types'
import { DEFAULT_ANCHORS, type Anchor } from '../canvas/anchors'
import { ICON_BOUNDS } from './iconBounds.generated'
import { BASIC_PACK } from './packs/basic'
import { ARCH_CORE_PACK } from './packs/archCore'
import { CLOUD_PACK } from './packs/cloud'
import { K8S_PACK } from './packs/k8s'
import { UML_PACK } from './packs/uml'
import { FLOW_PACK } from './packs/flow'
import { AWS_PACK } from './packs/aws'
import { GCP_PACK } from './packs/gcp'
import { AZURE_PACK } from './packs/azure'

/**
 * The pack manifest. Add new packs here. Order is the order they appear in the
 * palette (assuming the user hasn't disabled any).
 */
export const PACKS: Pack[] = [
  BASIC_PACK,
  ARCH_CORE_PACK,
  CLOUD_PACK,
  AWS_PACK,
  GCP_PACK,
  AZURE_PACK,
  K8S_PACK,
  UML_PACK,
  FLOW_PACK,
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

/** Packs whose shapes stretch to fill the box by default (containers, not pictograms). */
const FILL_PACKS = new Set(['basic', 'flow'])

/** Resolve the icon fit for a shape: explicit override → pack default → 'contain'. */
export function resolveFit(def: ShapeDef | undefined): Fit {
  if (def?.fit) return def.fit
  if (def && FILL_PACKS.has(def.packId)) return 'fill'
  return 'contain'
}

/**
 * Resolve the default label position for a shape: explicit override, else
 * derived from fit — container shapes label inside ('center'), pictogram shapes
 * label above ('top').
 */
export function resolveDefaultLabelPosition(def: ShapeDef | undefined): LabelPosition {
  if (def?.defaultLabelPosition) return def.defaultLabelPosition
  return resolveFit(def) === 'fill' ? 'center' : 'top'
}

/** Whether a shape's instances act as containers (can hold nested children). */
export function resolveIsContainer(def: ShapeDef | undefined): boolean {
  return def?.isContainer === true
}

/** The shape's silhouette bbox in 0–100 viewBox coords (explicit → measured →
 *  full box). Used to hug outside labels to the drawn icon, not the node box. */
export function resolveIconBounds(def: ShapeDef | undefined): { x: number; y: number; w: number; h: number } {
  return def?.iconBounds ?? (def ? ICON_BOUNDS[def.id] : undefined) ?? { x: 0, y: 0, w: 100, h: 100 }
}

type SideAnchors = Record<'top' | 'right' | 'bottom' | 'left', Anchor>

/**
 * The four connection anchors (viewBox coords) for a shape. Precedence per side:
 * explicit handlePositions → iconBounds-derived midpoint → box-edge default.
 */
export function resolveAnchors(def: ShapeDef | undefined): SideAnchors {
  const hp = def?.handlePositions
  // Precedence for the silhouette box: explicit per-shape iconBounds, else the
  // measured (generated) bounds, else none (box-edge defaults).
  const b = def?.iconBounds ?? (def ? ICON_BOUNDS[def.id] : undefined)
  const derived: SideAnchors = b
    ? {
        top:    { x: b.x + b.w / 2, y: b.y },
        right:  { x: b.x + b.w,     y: b.y + b.h / 2 },
        bottom: { x: b.x + b.w / 2, y: b.y + b.h },
        left:   { x: b.x,           y: b.y + b.h / 2 },
      }
    : DEFAULT_ANCHORS
  return {
    top:    hp?.top    ?? derived.top,
    right:  hp?.right  ?? derived.right,
    bottom: hp?.bottom ?? derived.bottom,
    left:   hp?.left   ?? derived.left,
  }
}

/** Every shape id across all packs (pack-qualified). Used by E2E coverage. */
export function allShapeIds(): string[] {
  return PACKS.flatMap((p) => p.shapes.map((s) => s.id))
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

/** The pack's out-of-the-box visibility (opt-in vendor packs ship disabled). */
function packDefaultEnabled(packId: string): boolean {
  return PACKS.find((p) => p.id === packId)?.defaultEnabled ?? true
}

interface LibraryPrefsState {
  /** Explicit user choices, keyed by pack id. Absent → use the pack default. */
  overrides: Record<string, boolean>
  togglePack: (packId: string) => void
  isEnabled: (packId: string) => boolean
}

function loadOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LIBRARY_PREFS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { overrides?: Record<string, boolean>; disabledPacks?: string[] }
    if (parsed.overrides) return parsed.overrides
    // Migrate the legacy { disabledPacks: [...] } shape to explicit overrides.
    if (Array.isArray(parsed.disabledPacks)) {
      return Object.fromEntries(parsed.disabledPacks.map((id) => [id, false]))
    }
    return {}
  } catch {
    return {}
  }
}

function persistOverrides(overrides: Record<string, boolean>): void {
  try {
    localStorage.setItem(LIBRARY_PREFS_KEY, JSON.stringify({ overrides }))
  } catch {
    // quota / no storage — accept the silent failure
  }
}

export const useLibraryPrefs = create<LibraryPrefsState>((set, get) => ({
  overrides: typeof window !== 'undefined' ? loadOverrides() : {},
  togglePack(packId) {
    const next = { ...get().overrides, [packId]: !get().isEnabled(packId) }
    persistOverrides(next)
    set({ overrides: next })
  },
  isEnabled(packId) {
    const o = get().overrides
    return packId in o ? o[packId] : packDefaultEnabled(packId)
  },
}))
