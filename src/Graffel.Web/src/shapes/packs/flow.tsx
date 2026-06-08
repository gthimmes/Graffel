import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * Flowchart & User Flow pack — the standard ANSI/ISO flowchart symbols plus
 * a few user-flow-specific shapes (Screen, Form). Visual identity: soft
 * sky-blue fills with darker blue borders, distinct from every other pack.
 */

const FLOW = '#0369a1'        // sky-700
const FLOW_DARK = '#0c4a6e'
const FLOW_FILL = '#e0f2fe'
const SW = 2.5

function flow(pictogram: (color: string, fill: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="none">
      {pictogram(borderColor, fill)}
    </ShapeSvg>
  )
}

// ─── Terminator (rounded rectangle: start / end) ─────────────────────────────
const pictoTerminator = (c: string, fill: string) => (
  <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW}
    rx={48} ry={48}
    fill={fill} stroke={c} strokeWidth={SW} />
)

// ─── Process (plain rectangle, the workhorse flowchart shape) ────────────────
const pictoProcess = (c: string, fill: string) => (
  <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW}
    fill={fill} stroke={c} strokeWidth={SW} />
)

// ─── Subprocess / Predefined Process (rect with vertical bars on sides) ──────
const pictoSubprocess = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} />
    <line x1={10} y1={SW / 2} x2={10} y2={100 - SW / 2} />
    <line x1={90} y1={SW / 2} x2={90} y2={100 - SW / 2} />
  </g>
)

// ─── Input / Output (parallelogram) ──────────────────────────────────────────
const pictoIo = (c: string, fill: string) => (
  <polygon points="14,12 96,12 86,88 4,88"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round" />
)

// ─── Manual Operation (trapezoid: wider on top) ──────────────────────────────
const pictoManualOp = (c: string, fill: string) => (
  <polygon points="6,12 94,12 82,88 18,88"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round" />
)

// ─── Manual Input (trapezoid with slanted top edge) ──────────────────────────
const pictoManualInput = (c: string, fill: string) => (
  <polygon points="6,30 94,12 94,88 6,88"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round" />
)

// ─── Document (rectangle with wavy bottom) ───────────────────────────────────
const pictoDocument = (c: string, fill: string) => (
  <path
    d="M 6 12 L 94 12 L 94 76 Q 80 86 50 80 Q 20 74 6 84 Z"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round"
  />
)

// ─── Multi-document (stacked documents) ──────────────────────────────────────
const pictoMultiDoc = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 16 22 L 100 22 L 100 84 Q 86 92 56 88 Q 26 84 16 92 Z" />
    <path d="M 8 14 L 92 14 L 92 76 Q 78 84 48 80 Q 18 76 8 84 Z" />
    <path d="M 0 6 L 84 6 L 84 68 Q 70 76 40 72 Q 10 68 0 76 Z" />
  </g>
)

// ─── Data / Stored Data (cylinder, oriented horizontally) ────────────────────
const pictoStoredData = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <path d="M 18 12 L 82 12 Q 92 12 92 50 Q 92 88 82 88 L 18 88 Q 14 88 14 50 Q 14 12 18 12" />
    <path d="M 82 12 Q 72 12 72 50 Q 72 88 82 88" />
  </g>
)

// ─── Off-page Connector (pentagon / home plate, pointing down) ───────────────
const pictoOffPage = (c: string, fill: string) => (
  <polygon points="10,8 90,8 90,60 50,92 10,60"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round" />
)

// ─── Connector (small circle with letter) ────────────────────────────────────
const pictoConnector = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={36} />
    <text x={50} y={58} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={28} fontWeight={700} fill={c} stroke="none">A</text>
  </g>
)

// ─── Screen / Page (rectangle with header bar — for user flow) ───────────────
const pictoScreen = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={3} />
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={16} rx={3} fill={c} stroke="none" />
    {/* traffic-light dots */}
    <circle cx={10} cy={10} r={2} fill={fill} stroke="none" />
    <circle cx={17} cy={10} r={2} fill={fill} stroke="none" />
    <circle cx={24} cy={10} r={2} fill={fill} stroke="none" />
    {/* content lines */}
    <line x1={12} y1={32} x2={88} y2={32} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={12} y1={42} x2={70} y2={42} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={12} y1={58} x2={88} y2={58} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={12} y1={68} x2={76} y2={68} stroke={c} strokeWidth={SW * 0.6} />
    <line x1={12} y1={78} x2={60} y2={78} stroke={c} strokeWidth={SW * 0.6} />
  </g>
)

// ─── Form (page with input field markers) ────────────────────────────────────
const pictoForm = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={3} />
    {/* fields */}
    <rect x={12} y={18} width={76} height={12} rx={2} stroke={c} strokeWidth={SW * 0.8} />
    <rect x={12} y={38} width={76} height={12} rx={2} stroke={c} strokeWidth={SW * 0.8} />
    <rect x={12} y={58} width={76} height={12} rx={2} stroke={c} strokeWidth={SW * 0.8} />
    {/* submit button */}
    <rect x={56} y={78} width={32} height={14} rx={2} fill={c} stroke="none" />
  </g>
)

// ─── Action (rounded rect, distinguished from Terminator by aspect & label) ──
const pictoAction = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={20} ry={20} />
  </g>
)

// ─── Display (CRT-shaped output) ─────────────────────────────────────────────
const pictoDisplay = (c: string, fill: string) => (
  <path
    d="M 22 12 Q 8 12 8 50 Q 8 88 22 88 L 86 88 Q 96 88 96 50 Q 96 12 86 12 Z"
    fill={fill} stroke={c} strokeWidth={SW} strokeLinejoin="round"
  />
)

// ─── Database (drum, slightly different from cloud's; cylinder shape) ───────
// (Reuse cylinder feel but with vertical orientation typical of flowcharts)
const pictoDb = (c: string, fill: string) => (
  <g fill={fill} stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={18} rx={36} ry={8} />
    <path d="M 14 18 L 14 82 Q 14 90 50 90 Q 86 90 86 82 L 86 18" />
  </g>
)

export const FLOW_PACK: Pack = {
  id: 'flow',
  label: 'Flowchart & User Flow',
  description: 'Standard ANSI flowchart shapes plus user-flow primitives.',
  defaultEnabled: true,
  shapes: [
    { id: 'flow:terminator',     packId: 'flow', label: 'Terminator',     keywords: ['start', 'end', 'begin', 'finish'], defaultSize: { w: 160, h: 60 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoTerminator) },
    { id: 'flow:process',        packId: 'flow', label: 'Process',        keywords: ['step', 'action'],                  defaultSize: { w: 160, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoProcess) },
    { id: 'flow:action',         packId: 'flow', label: 'Action',         keywords: ['step', 'user action'],             defaultSize: { w: 160, h: 70 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoAction) },
    { id: 'flow:subprocess',     packId: 'flow', label: 'Subprocess',     keywords: ['predefined', 'function call'],     defaultSize: { w: 160, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoSubprocess) },
    { id: 'flow:io',             packId: 'flow', label: 'Input/Output',   keywords: ['data', 'parallelogram'],           defaultSize: { w: 160, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoIo),
      handlePositions: { left: { x: 9, y: 50 }, right: { x: 91, y: 50 } } },
    { id: 'flow:manual-op',      packId: 'flow', label: 'Manual Operation', keywords: ['manual step', 'trapezoid'],     defaultSize: { w: 160, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoManualOp),
      handlePositions: { left: { x: 12, y: 50 }, right: { x: 88, y: 50 } } },
    { id: 'flow:manual-input',   packId: 'flow', label: 'Manual Input',   keywords: ['keyboard', 'entry'],               defaultSize: { w: 160, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoManualInput),
      handlePositions: { top: { x: 50, y: 21 } } },
    { id: 'flow:document',       packId: 'flow', label: 'Document',       keywords: ['report', 'paper', 'output'],       defaultSize: { w: 160, h: 100 }, defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoDocument),
      handlePositions: { bottom: { x: 50, y: 80 } } },
    { id: 'flow:multi-document', packId: 'flow', label: 'Multi-document', keywords: ['reports', 'stack'],                defaultSize: { w: 180, h: 120 }, defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoMultiDoc),
      handlePositions: { bottom: { x: 50, y: 88 } } },
    { id: 'flow:stored-data',    packId: 'flow', label: 'Stored Data',    keywords: ['drum', 'magnetic disk', 'storage'], defaultSize: { w: 160, h: 80 }, defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoStoredData) },
    { id: 'flow:db',             packId: 'flow', label: 'Database',       keywords: ['data store', 'persistence'],       defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoDb) },
    { id: 'flow:off-page',       packId: 'flow', label: 'Off-page Connector', keywords: ['continued', 'jump', 'page'],   defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoOffPage) },
    { id: 'flow:connector',      packId: 'flow', label: 'Connector',      keywords: ['continued', 'reference', 'jump'], defaultSize: { w: 70, h: 70 },   defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoConnector) },
    { id: 'flow:display',        packId: 'flow', label: 'Display',        keywords: ['screen', 'show', 'output'],        defaultSize: { w: 170, h: 80 },  defaultStyle: { fill: FLOW_FILL, borderColor: FLOW },      render: flow(pictoDisplay) },
    { id: 'flow:screen',         packId: 'flow', label: 'Screen / Page',  keywords: ['ui', 'wireframe', 'mockup'],       defaultSize: { w: 160, h: 130 }, defaultStyle: { fill: '#ffffff', borderColor: FLOW_DARK }, render: flow(pictoScreen) },
    { id: 'flow:form',           packId: 'flow', label: 'Form',           keywords: ['inputs', 'fields', 'submit'],      defaultSize: { w: 150, h: 140 }, defaultStyle: { fill: '#ffffff', borderColor: FLOW_DARK }, render: flow(pictoForm) },
  ],
}
