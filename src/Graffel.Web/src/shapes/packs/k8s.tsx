import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * Kubernetes pack — stylized icons inspired by the Kubernetes
 * resource glyphs. Heptagon-blue frames with white pictograms (the
 * Kubernetes "wheel" shape language). Stylized only — not the
 * official CNCF marks (see ADR-0010).
 */

const K8S_BLUE = '#326CE5'
const K8S_BLUE_DARK = '#1A4FB3'
const SW = 2.5
const FRAME_RX = 12

// Standard heptagon-ish badge in the corner could be evocative, but for
// recognizability we use the same rounded-square frame as other packs and
// vary the pictogram.
function K8sFrame({ children, fill, borderColor }: { children: ReactNode; fill: string; borderColor: string }) {
  return (
    <>
      <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={FRAME_RX} ry={FRAME_RX}
        fill={fill} stroke={borderColor} strokeWidth={SW} />
      {children}
    </>
  )
}

function k(pictogram: (color: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <K8sFrame fill={fill} borderColor={borderColor}>
        {pictogram(borderColor)}
      </K8sFrame>
    </ShapeSvg>
  )
}

// Pod — heptagon (Kubernetes signature shape)
function heptagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 7; i++) {
    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

const pictoPod = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={20} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>p</text>
  </g>
)

// Service — heptagon with svc
const pictoSvc = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>svc</text>
  </g>
)

// Ingress — heptagon with arrow
const pictoIngress = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <polyline points="36,50 60,50 54,44 M 60,50 54,56" strokeLinecap="round" />
  </g>
)

// Deployment — heptagon with stacked layers
const pictoDeployment = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={20} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>d</text>
  </g>
)

// StatefulSet
const pictoStatefulSet = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>sts</text>
  </g>
)

// DaemonSet
const pictoDaemonSet = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>ds</text>
  </g>
)

// Job
const pictoJob = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={18} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>j</text>
  </g>
)

// CronJob
const pictoCronJob = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>cj</text>
  </g>
)

// ConfigMap
const pictoConfigMap = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>cm</text>
  </g>
)

// Secret
const pictoSecret = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <circle cx={42} cy={50} r={4} />
    <line x1={46} y1={50} x2={62} y2={50} />
    <line x1={56} y1={50} x2={56} y2={56} />
  </g>
)

// Namespace
const pictoNamespace = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>ns</text>
  </g>
)

// PersistentVolume
const pictoPv = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points={heptagonPath(50, 50, 22)} />
    <text x={50} y={56} textAnchor="middle" fontSize={13} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>pv</text>
  </g>
)

const PACK_FILL = '#EDF2FE'

/**
 * Handle anchors that snap to the heptagon silhouette (vertices at top + bottom-pair
 * midpoint, edge-midpoints on the sides). Without this, connection lines float far
 * outside the visual heptagon at its bounding-box corners.
 */
const HEPTAGON_HANDLES = {
  top:    { x: 50, y: 28 },
  right:  { x: 72, y: 60 },
  bottom: { x: 50, y: 78 },
  left:   { x: 28, y: 60 },
}

export const K8S_PACK: Pack = {
  id: 'k8s',
  label: 'Kubernetes',
  description: 'Stylized icons inspired by the Kubernetes resource glyphs.',
  defaultEnabled: true,
  shapes: [
    { id: 'k8s:pod',              packId: 'k8s', label: 'Pod',              keywords: ['workload'],          defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoPod) },
    { id: 'k8s:service',          packId: 'k8s', label: 'Service',          keywords: ['svc', 'network'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoSvc) },
    { id: 'k8s:ingress',          packId: 'k8s', label: 'Ingress',          keywords: ['gateway', 'router'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoIngress) },
    { id: 'k8s:deployment',       packId: 'k8s', label: 'Deployment',       keywords: ['workload', 'rs'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoDeployment) },
    { id: 'k8s:statefulset',      packId: 'k8s', label: 'StatefulSet',      keywords: ['stateful', 'sts'],   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoStatefulSet) },
    { id: 'k8s:daemonset',        packId: 'k8s', label: 'DaemonSet',        keywords: ['daemon', 'ds'],      defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoDaemonSet) },
    { id: 'k8s:job',              packId: 'k8s', label: 'Job',              keywords: ['batch'],             defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoJob) },
    { id: 'k8s:cronjob',          packId: 'k8s', label: 'CronJob',          keywords: ['cron', 'schedule'],  defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoCronJob) },
    { id: 'k8s:configmap',        packId: 'k8s', label: 'ConfigMap',        keywords: ['config', 'cm'],      defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoConfigMap) },
    { id: 'k8s:secret',           packId: 'k8s', label: 'Secret',           keywords: ['secret', 'creds'],   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE_DARK }, handlePositions: HEPTAGON_HANDLES, render: k(pictoSecret) },
    { id: 'k8s:namespace',        packId: 'k8s', label: 'Namespace',        keywords: ['ns', 'isolation'],   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoNamespace) },
    { id: 'k8s:pv',               packId: 'k8s', label: 'PersistentVolume', keywords: ['volume', 'pv', 'pvc'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: K8S_BLUE }, handlePositions: HEPTAGON_HANDLES, render: k(pictoPv) },
  ],
}
