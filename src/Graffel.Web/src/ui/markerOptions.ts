import type { EdgeMarker } from '../format/style'

/** Endpoint marker choices, shared by the Inspector and the on-canvas toolbar. */
export const MARKER_OPTIONS: { value: EdgeMarker; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow (filled)' },
  { value: 'arrow-open', label: 'Arrow (open)' },
  { value: 'triangle', label: 'Triangle (open)' },
  { value: 'triangle-filled', label: 'Triangle (filled)' },
  { value: 'diamond', label: 'Diamond (open)' },
  { value: 'diamond-filled', label: 'Diamond (filled)' },
  { value: 'circle', label: 'Circle (open)' },
  { value: 'circle-filled', label: 'Circle (filled)' },
]
