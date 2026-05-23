import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * UML pack — the standard UML 2.x building blocks for class, use-case,
 * component, and sequence diagrams. Black-on-white visual identity to match
 * the convention from UML textbooks.
 */

const UML = '#0f172a'         // slate-900
const UML_FILL = '#ffffff'
const SW = 2

function uml(pictogram: (color: string, fill: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      {pictogram(borderColor, fill)}
    </ShapeSvg>
  )
}

// ─── Actor (stick figure) ────────────────────────────────────────────────────
const pictoActor = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round">
    <circle cx={50} cy={22} r={10} />
    <line x1={50} y1={32} x2={50} y2={62} />
    <line x1={28} y1={44} x2={72} y2={44} />
    <line x1={50} y1={62} x2={30} y2={88} />
    <line x1={50} y1={62} x2={70} y2={88} />
  </g>
)

// ─── Use Case (oval) ─────────────────────────────────────────────────────────
const pictoUseCase = (c: string, fill: string) => (
  <ellipse cx={50} cy={50} rx={40} ry={24}
    fill={fill} stroke={c} strokeWidth={SW} />
)

// ─── Class (3-row rectangle: name, attributes, methods) ──────────────────────
const pictoClass = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={10} y={14} width={80} height={72} />
    <line x1={10} y1={32} x2={90} y2={32} />
    <line x1={10} y1={58} x2={90} y2={58} />
    <text x={50} y={26} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={9} fontWeight={700} fill={c} stroke="none">ClassName</text>
    <line x1={16} y1={40} x2={50} y2={40} stroke={c} strokeWidth={SW * 0.7} />
    <line x1={16} y1={47} x2={56} y2={47} stroke={c} strokeWidth={SW * 0.7} />
    <line x1={16} y1={66} x2={60} y2={66} stroke={c} strokeWidth={SW * 0.7} />
    <line x1={16} y1={73} x2={48} y2={73} stroke={c} strokeWidth={SW * 0.7} />
  </g>
)

// ─── Object (rect with underlined name) ──────────────────────────────────────
const pictoObject = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={14} y={32} width={72} height={36} />
    <text x={50} y={50} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={10} fontWeight={600} fill={c} stroke="none"
      textDecoration="underline">name : Class</text>
    <line x1={20} y1={54} x2={80} y2={54} stroke={c} strokeWidth={SW * 0.6} />
  </g>
)

// ─── Interface (rectangle with «interface» stereotype) ───────────────────────
const pictoInterface = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={10} y={14} width={80} height={72} />
    <text x={50} y={26} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={8} fontWeight={500} fill={c} stroke="none" fontStyle="italic">«interface»</text>
    <text x={50} y={40} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={9} fontWeight={700} fill={c} stroke="none">IName</text>
    <line x1={10} y1={48} x2={90} y2={48} />
    <line x1={16} y1={58} x2={56} y2={58} stroke={c} strokeWidth={SW * 0.7} />
    <line x1={16} y1={66} x2={62} y2={66} stroke={c} strokeWidth={SW * 0.7} />
    <line x1={16} y1={74} x2={50} y2={74} stroke={c} strokeWidth={SW * 0.7} />
  </g>
)

// ─── Lollipop (provided interface) ───────────────────────────────────────────
const pictoLollipop = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <line x1={20} y1={50} x2={68} y2={50} />
    <circle cx={74} cy={50} r={8} />
  </g>
)

// ─── Component (rect with two small rectangles on left edge) ─────────────────
const pictoComponent = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={20} y={22} width={70} height={56} />
    <rect x={10} y={32} width={20} height={12} />
    <rect x={10} y={56} width={20} height={12} />
    <text x={56} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={10} fontWeight={600} fill={c} stroke="none">Component</text>
  </g>
)

// ─── Package (folder-tab shape) ──────────────────────────────────────────────
const pictoPackage = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 10 30 L 40 30 L 44 22 L 90 22 L 90 82 L 10 82 Z" />
    <line x1={10} y1={30} x2={44} y2={30} />
  </g>
)

// ─── Note (rectangle with folded top-right corner) ───────────────────────────
const pictoNote = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 14 22 L 80 22 L 88 30 L 88 78 L 14 78 Z" />
    <polyline points="80,22 80,30 88,30" />
    <line x1={22} y1={42} x2={70} y2={42} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={22} y1={52} x2={76} y2={52} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={22} y1={62} x2={60} y2={62} stroke={c} strokeWidth={SW * 0.6} />
  </g>
)

// ─── Lifeline (header + dashed line, for sequence diagrams) ──────────────────
const pictoLifeline = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={26} y={14} width={48} height={20} />
    <text x={50} y={28} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={9} fontWeight={600} fill={c} stroke="none">: Object</text>
    <line x1={50} y1={34} x2={50} y2={90} strokeDasharray="3 4" />
  </g>
)

// ─── Activation (narrow vertical rectangle) ──────────────────────────────────
const pictoActivation = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={42} y={12} width={16} height={76} />
  </g>
)

// ─── Boundary (UML system boundary, dashed) ──────────────────────────────────
const pictoUmlBoundary = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW * 0.8}>
    <rect x={6} y={12} width={88} height={76} rx={2} />
    <text x={50} y={26} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={8} fontWeight={600} fill={c} stroke="none">System Boundary</text>
  </g>
)

export const UML_PACK: Pack = {
  id: 'uml',
  label: 'UML',
  description: 'Class, use case, component, and sequence diagram primitives.',
  defaultEnabled: true,
  shapes: [
    { id: 'uml:actor',       packId: 'uml', label: 'Actor',           keywords: ['user', 'person', 'role'],         defaultSize: { w: 80, h: 130 }, defaultStyle: { fill: 'transparent', borderColor: UML }, render: uml(pictoActor) },
    { id: 'uml:use-case',    packId: 'uml', label: 'Use Case',        keywords: ['oval', 'scenario'],                defaultSize: { w: 180, h: 90 }, defaultStyle: { fill: UML_FILL,      borderColor: UML }, render: uml(pictoUseCase) },
    { id: 'uml:class',       packId: 'uml', label: 'Class',           keywords: ['object oriented', 'oop'],         defaultSize: { w: 160, h: 140 }, defaultStyle: { fill: UML_FILL,    borderColor: UML }, render: uml(pictoClass) },
    { id: 'uml:object',      packId: 'uml', label: 'Object',          keywords: ['instance'],                        defaultSize: { w: 150, h: 80 }, defaultStyle: { fill: UML_FILL,      borderColor: UML }, render: uml(pictoObject) },
    { id: 'uml:interface',   packId: 'uml', label: 'Interface',       keywords: ['protocol', 'contract'],           defaultSize: { w: 160, h: 140 }, defaultStyle: { fill: UML_FILL,    borderColor: UML }, render: uml(pictoInterface) },
    { id: 'uml:lollipop',    packId: 'uml', label: 'Lollipop',        keywords: ['provided interface', 'ball'],     defaultSize: { w: 110, h: 50 }, defaultStyle: { fill: UML_FILL,      borderColor: UML }, render: uml(pictoLollipop) },
    { id: 'uml:component',   packId: 'uml', label: 'Component',       keywords: ['module', 'unit'],                 defaultSize: { w: 160, h: 110 }, defaultStyle: { fill: UML_FILL,    borderColor: UML }, render: uml(pictoComponent) },
    { id: 'uml:package',     packId: 'uml', label: 'Package',         keywords: ['namespace', 'module', 'folder'], defaultSize: { w: 170, h: 130 }, defaultStyle: { fill: UML_FILL,     borderColor: UML }, render: uml(pictoPackage) },
    { id: 'uml:note',        packId: 'uml', label: 'Note',            keywords: ['comment', 'annotation', 'callout'], defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: '#fefce8',  borderColor: UML }, render: uml(pictoNote) },
    { id: 'uml:lifeline',    packId: 'uml', label: 'Lifeline',        keywords: ['sequence diagram', 'timeline'],   defaultSize: { w: 110, h: 200 }, defaultStyle: { fill: UML_FILL,    borderColor: UML }, render: uml(pictoLifeline) },
    { id: 'uml:activation',  packId: 'uml', label: 'Activation',      keywords: ['execution', 'sequence'],          defaultSize: { w: 40, h: 200 }, defaultStyle: { fill: UML_FILL,      borderColor: UML }, render: uml(pictoActivation) },
    { id: 'uml:boundary',    packId: 'uml', label: 'System Boundary', keywords: ['use case boundary', 'subject'],   defaultSize: { w: 320, h: 220 }, defaultStyle: { fill: 'transparent', borderColor: UML }, render: uml(pictoUmlBoundary) },
  ],
}
