import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

const STROKE = 2

const rectangle: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="none">
    <rect
      x={STROKE / 2}
      y={STROKE / 2}
      width={100 - STROKE}
      height={100 - STROKE}
      rx={2}
      ry={2}
      fill={fill}
      stroke={borderColor}
      strokeWidth={STROKE}
    />
  </ShapeSvg>
)

const ellipse: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="none">
    <ellipse
      cx={50}
      cy={50}
      rx={50 - STROKE / 2}
      ry={50 - STROKE / 2}
      fill={fill}
      stroke={borderColor}
      strokeWidth={STROKE}
    />
  </ShapeSvg>
)

const diamond: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="none">
    <polygon
      points="50,2 98,50 50,98 2,50"
      fill={fill}
      stroke={borderColor}
      strokeWidth={STROKE}
    />
  </ShapeSvg>
)

const textShape: ShapeRenderer = ({ width, height }) => (
  <ShapeSvg width={width} height={height} preserve="none">
    <rect width={100} height={100} fill="transparent" />
  </ShapeSvg>
)

export const BASIC_PACK: Pack = {
  id: 'basic',
  label: 'Basic',
  description: 'Generic primitives for any diagram.',
  defaultEnabled: true,
  shapes: [
    {
      id: 'basic:rectangle', packId: 'basic', label: 'Rectangle',
      keywords: ['rect', 'box', 'square'],
      defaultSize: { w: 160, h: 80 },
      defaultStyle: { fill: '#ffffff', borderColor: '#475569' },
      render: rectangle,
      legacyTestId: 'rectangle',
    },
    {
      id: 'basic:ellipse', packId: 'basic', label: 'Ellipse',
      keywords: ['circle', 'oval'],
      defaultSize: { w: 160, h: 80 },
      defaultStyle: { fill: '#ffffff', borderColor: '#475569' },
      render: ellipse,
      legacyTestId: 'ellipse',
    },
    {
      id: 'basic:diamond', packId: 'basic', label: 'Diamond',
      keywords: ['decision', 'rhombus', 'choice'],
      defaultSize: { w: 140, h: 100 },
      defaultStyle: { fill: '#ffffff', borderColor: '#475569' },
      render: diamond,
      legacyTestId: 'diamond',
    },
    {
      id: 'basic:text', packId: 'basic', label: 'Text',
      keywords: ['label', 'note'],
      defaultSize: { w: 160, h: 40 },
      defaultStyle: { fill: 'transparent', borderColor: 'transparent' },
      render: textShape,
      legacyTestId: 'text',
    },
  ],
}
