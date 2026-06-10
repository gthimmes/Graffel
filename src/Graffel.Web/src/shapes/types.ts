import type { ReactNode } from 'react'
import type { NodeStyle } from '../format/style'

export interface ShapeRenderContext {
  width: number
  height: number
  selected: boolean
  /** Resolved fill color (style override → shape default → 'transparent'). */
  fill: string
  /** Resolved border color. */
  borderColor: string
  /** Resolved text color. */
  textColor: string
}

export type ShapeRenderer = (ctx: ShapeRenderContext) => ReactNode

/**
 * How the icon fills the node box. 'fill' = stretch to the bounds
 * (preserveAspectRatio="none"); 'contain' = scale-to-fit + center
 * (preserveAspectRatio="xMidYMid meet"). MUST match what the renderer passes to
 * ShapeSvg — connection-anchor placement depends on it.
 */
export type Fit = 'fill' | 'contain'

/** Where the text label sits relative to the icon. */
export type LabelPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

export interface ShapeDef {
  /** Fully-qualified id, e.g. 'basic:rectangle', 'arch-core:database', 'aws:ec2'. */
  id: string
  /** Owning pack id. */
  packId: string
  /** Display label for tooltip + library manager. */
  label: string
  /** Extra search terms (e.g. ['add', 'rect', 'box'] for Rectangle). */
  keywords?: string[]
  /** Initial dimensions when added to the canvas. */
  defaultSize: { w: number; h: number }
  /** Default style (fill, border, etc.) applied to new instances. */
  defaultStyle?: NodeStyle
  /** Renders the shape's body (SVG, mostly). Caller wraps in the label container. */
  render: ShapeRenderer
  /**
   * Icon fit. Defaults are pack-derived (see resolveFit): 'fill' for the
   * container packs (basic, flow), 'contain' for pictogram packs. Set
   * explicitly to override a single shape (e.g. arch-core:boundary is a
   * container in an otherwise-pictogram pack).
   */
  fit?: Fit
  /**
   * Default label position for new instances. When absent it's derived from
   * fit: 'center' (inside) for container shapes, 'top' (above) for pictograms.
   * Per-instance overrides live in node.data.style.labelPosition.
   */
  defaultLabelPosition?: LabelPosition
  /** Optional short test id for E2E specs that predate pack-qualified ids (e.g. 'service'). */
  legacyTestId?: string
  /**
   * When true, instances act as containers: other nodes can be nested inside
   * them (via Ctrl+G grouping or drag-into), move/resize with the container, and
   * delete with it. Box-like shapes only (e.g. basic:group, arch-core:boundary,
   * cloud:region). See resolveIsContainer.
   */
  isContainer?: boolean
  /**
   * Tight bounding box of the drawn silhouette in 0–100 viewBox coords. When
   * set, the four connection anchors are derived from it (side midpoints), so
   * lines meet the icon edge instead of the icon's square. Cheaper to author
   * than handlePositions for the common "icon is inset within its square" case.
   */
  iconBounds?: { x: number; y: number; w: number; h: number }
  /**
   * Per-side handle anchor points in 0–100 viewBox coords. Wins over iconBounds
   * for any side it specifies — use it when a silhouette isn't well-described by
   * a box (e.g. a stick figure's arm tips). Default (when neither is set):
   * box-edge midpoints {top:(50,0), right:(100,50), bottom:(50,100), left:(0,50)}.
   */
  handlePositions?: {
    top?:    { x: number; y: number }
    right?:  { x: number; y: number }
    bottom?: { x: number; y: number }
    left?:   { x: number; y: number }
  }
}

export interface Pack {
  id: string
  label: string
  shapes: ShapeDef[]
  /** Whether this pack is visible in the palette by default. */
  defaultEnabled: boolean
  /** Optional short blurb shown in the library manager. */
  description?: string
}
