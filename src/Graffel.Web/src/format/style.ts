// Shared style vocabulary for nodes and edges.
// These live inside the open `data.style` object on each node/edge per ADR-0002 —
// no schema bump required.

export type TextHAlign = 'left' | 'center' | 'right'
export type TextVAlign = 'top' | 'middle' | 'bottom'
export type FontWeight = 'regular' | 'medium' | 'bold'

export const FONT_FAMILIES = [
  { id: 'system', label: 'System',  css: 'system-ui, -apple-system, sans-serif' },
  { id: 'inter',  label: 'Inter',   css: '"Inter", system-ui, sans-serif' },
  { id: 'roboto', label: 'Roboto',  css: '"Roboto", system-ui, sans-serif' },
  { id: 'serif',  label: 'Serif',   css: 'Georgia, "Times New Roman", serif' },
  { id: 'mono',   label: 'Mono',    css: 'Menlo, Consolas, monospace' },
  { id: 'times',  label: 'Times',   css: '"Times New Roman", Times, serif' },
] as const

export type FontFamilyId = typeof FONT_FAMILIES[number]['id']

export function fontFamilyCss(id: FontFamilyId | undefined): string {
  return (FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0]).css
}

export function fontWeightCss(weight: FontWeight | undefined): number {
  switch (weight) {
    case 'bold':    return 700
    case 'medium':  return 500
    case 'regular':
    default:        return 400
  }
}

export interface NodeStyle {
  fontFamily?: FontFamilyId
  fontSize?: number          // px
  fontWeight?: FontWeight
  textColor?: string         // CSS color
  textHAlign?: TextHAlign
  textVAlign?: TextVAlign
  fill?: string              // CSS color (background)
  borderColor?: string       // CSS color
}

export type StrokeStyle = 'solid' | 'dashed' | 'dotted'

export type EdgeMarker =
  | 'none'
  | 'arrow'          // filled triangle
  | 'arrow-open'     // V-shape, no fill
  | 'triangle'       // open triangle (UML generalization)
  | 'triangle-filled'
  | 'diamond'        // open diamond (UML aggregation)
  | 'diamond-filled' // filled diamond (UML composition)
  | 'circle'         // open circle
  | 'circle-filled'

export type MarkerSize = 'sm' | 'md' | 'lg'

export interface EdgeStyle {
  strokeColor?: string
  strokeWidth?: number
  strokeStyle?: StrokeStyle
  markerStart?: EdgeMarker
  markerEnd?: EdgeMarker
  markerSize?: MarkerSize
}

/** SVG stroke-dasharray pattern for each style. */
export function strokeDashArray(style: StrokeStyle | undefined): string | undefined {
  if (style === 'dashed') return '8 4'
  if (style === 'dotted') return '2 4'
  return undefined
}

/** Marker scale by size token. */
export function markerSizePx(size: MarkerSize | undefined): number {
  if (size === 'sm') return 5
  if (size === 'lg') return 9
  return 7
}
