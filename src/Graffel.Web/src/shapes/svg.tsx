import type { CSSProperties, ReactNode } from 'react'

/**
 * Shape SVG container. Every pack's renderer draws into the 0-100 viewBox; this
 * wrapper handles the absolute positioning + preserveAspectRatio.
 */
export function ShapeSvg({
  children,
  width,
  height,
  preserve = 'none',
  style,
}: {
  children: ReactNode
  width: number
  height: number
  preserve?: 'none' | 'xMidYMid meet' | 'xMidYMid slice'
  style?: CSSProperties
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio={preserve}
      style={{ display: 'block', overflow: 'visible', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}
