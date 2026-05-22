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
  /** Whether the label is rendered as an overlay on top (most shapes) or below (icon-style shapes). */
  labelPlacement?: 'overlay' | 'below'
  /** Optional short test id for E2E specs that predate pack-qualified ids (e.g. 'service'). */
  legacyTestId?: string
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
