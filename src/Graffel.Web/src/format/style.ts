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

export interface EdgeStyle {
  strokeColor?: string
  strokeWidth?: number
}
