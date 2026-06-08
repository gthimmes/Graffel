import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * Cloud pack — vendor-neutral cloud architecture concepts. Every shape is the
 * standard industry concept, not bound to a single vendor (no EC2, no Lambda,
 * no Cloud Run, etc.). Visually distinct from Arch Core so the two packs don't
 * step on each other.
 *
 * Visual identity: indigo accent with deeper indigo pictograms. Outline icons,
 * not the filled-frame style used in earlier vendor packs.
 */

const CLOUD = '#4f46e5'        // indigo-600
const CLOUD_DARK = '#3730a3'
const CLOUD_SOFT = '#eef2ff'   // soft indigo fill
const SW = 2.5

function cloudShape(pictogram: (color: string) => ReactNode): ShapeRenderer {
  return ({ width, height, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      {pictogram(borderColor)}
    </ShapeSvg>
  )
}

// ─── Cloud (the generic outline; the "what runs in the cloud" container) ─────
const pictoCloud = (c: string) => (
  <path
    d="M 22 70 Q 8 70 8 56 Q 8 40 28 40 Q 30 22 50 22 Q 68 22 72 36 Q 92 36 92 56 Q 92 74 72 74 Z"
    fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round"
  />
)

// ─── Virtual Machine (monitor / window with hypervisor strip) ────────────────
const pictoVm = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={18} y={22} width={64} height={48} rx={3} />
    <line x1={18} y1={32} x2={82} y2={32} />
    <circle cx={24} cy={27} r={1.5} fill={c} stroke="none" />
    <circle cx={30} cy={27} r={1.5} fill={c} stroke="none" />
    {/* indicates a VM, not a physical box: dashed inner border */}
    <rect x={26} y={40} width={48} height={22} rx={2} strokeDasharray="4 3" />
    <line x1={32} y1={76} x2={68} y2={76} strokeLinecap="round" />
  </g>
)

// ─── Container (rectangle with arrowed handles like a shipping container) ────
const pictoContainer = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={16} y={32} width={68} height={36} rx={2} />
    <line x1={28} y1={32} x2={28} y2={68} />
    <line x1={40} y1={32} x2={40} y2={68} />
    <line x1={52} y1={32} x2={52} y2={68} />
    <line x1={64} y1={32} x2={64} y2={68} />
    <line x1={76} y1={32} x2={76} y2={68} />
    {/* corner brackets */}
    <line x1={12} y1={32} x2={16} y2={32} strokeLinecap="round" />
    <line x1={12} y1={68} x2={16} y2={68} strokeLinecap="round" />
    <line x1={84} y1={32} x2={88} y2={32} strokeLinecap="round" />
    <line x1={84} y1={68} x2={88} y2={68} strokeLinecap="round" />
  </g>
)

// ─── Container Cluster (three connected pods) ────────────────────────────────
const pictoCluster = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={30} cy={38} r={10} />
    <circle cx={70} cy={38} r={10} />
    <circle cx={50} cy={70} r={10} />
    <line x1={40} y1={38} x2={60} y2={38} />
    <line x1={35} y1={48} x2={45} y2={62} />
    <line x1={65} y1={48} x2={55} y2={62} />
  </g>
)

// ─── Serverless Function (event → small box → output) ────────────────────────
// Replaces the lambda glyph; reads as "input event triggers a function."
const pictoServerless = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="12,42 22,42 22,38 32,50 22,62 22,58 12,58" fill={c} stroke="none" />
    <rect x={36} y={32} width={28} height={36} rx={4} />
    <text x={50} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontStyle="italic" fontSize={18} fontWeight={600} fill={c}>ƒ</text>
    <polyline points="68,50 88,50 84,46 M 88,50 84,54" strokeLinecap="round" />
  </g>
)

// ─── Object Storage (bucket with handle — distinct from Arch Core's "storage" cylinder) ──
const pictoObjectStore = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 22 32 L 26 76 Q 26 80 30 80 L 70 80 Q 74 80 74 76 L 78 32 Z" />
    <line x1={22} y1={32} x2={78} y2={32} />
    <ellipse cx={50} cy={32} rx={26} ry={4} />
    <circle cx={50} cy={26} r={4} />
  </g>
)

// ─── Block Storage (disk platter / hard disk) ────────────────────────────────
const pictoBlockStore = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={18} y={28} width={64} height={44} rx={4} />
    <circle cx={50} cy={50} r={14} />
    <circle cx={50} cy={50} r={4} fill={c} stroke="none" />
    <line x1={68} y1={36} x2={74} y2={36} />
  </g>
)

// ─── Data Warehouse (stacked database with chart bars on top) ────────────────
const pictoWarehouse = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={30} rx={22} ry={6} />
    <path d="M 28 30 L 28 70 Q 28 76 50 76 Q 72 76 72 70 L 72 30" />
    <path d="M 28 50 Q 28 56 50 56 Q 72 56 72 50" />
    {/* analytics bars */}
    <line x1={38} y1={42} x2={38} y2={48} strokeLinecap="round" />
    <line x1={46} y1={40} x2={46} y2={48} strokeLinecap="round" />
    <line x1={54} y1={36} x2={54} y2={48} strokeLinecap="round" />
    <line x1={62} y1={38} x2={62} y2={48} strokeLinecap="round" />
  </g>
)

// ─── Event Bus (horizontal bus with branching arrows) ────────────────────────
const pictoEventBus = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={16} y={46} width={68} height={10} rx={2} />
    <polyline points="30,46 30,30 24,36 M 30,30 36,36" strokeLinecap="round" />
    <polyline points="50,46 50,26 44,32 M 50,26 56,32" strokeLinecap="round" />
    <polyline points="70,46 70,30 64,36 M 70,30 76,36" strokeLinecap="round" />
    <polyline points="40,56 40,72 34,66 M 40,72 46,66" strokeLinecap="round" />
    <polyline points="60,56 60,72 54,66 M 60,72 66,66" strokeLinecap="round" />
  </g>
)

// ─── Identity Provider (key inside a hexagon) ────────────────────────────────
const pictoIdp = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,16 80,32 80,68 50,84 20,68 20,32" />
    <circle cx={38} cy={50} r={8} />
    <line x1={46} y1={50} x2={66} y2={50} strokeLinecap="round" />
    <line x1={60} y1={50} x2={60} y2={58} strokeLinecap="round" />
    <line x1={66} y1={50} x2={66} y2={56} strokeLinecap="round" />
  </g>
)

// ─── Secrets Vault (vault door with combination) ─────────────────────────────
const pictoVault = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={18} y={22} width={64} height={56} rx={6} />
    <circle cx={50} cy={50} r={14} />
    <line x1={50} y1={36} x2={50} y2={42} strokeLinecap="round" />
    <line x1={50} y1={58} x2={50} y2={64} strokeLinecap="round" />
    <line x1={36} y1={50} x2={42} y2={50} strokeLinecap="round" />
    <line x1={58} y1={50} x2={64} y2={50} strokeLinecap="round" />
    <circle cx={50} cy={50} r={3} fill={c} stroke="none" />
  </g>
)

// ─── Monitoring (dashboard with gauge) ───────────────────────────────────────
const pictoMonitoring = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={16} y={22} width={68} height={56} rx={3} />
    <line x1={16} y1={32} x2={84} y2={32} />
    {/* gauge */}
    <path d="M 30 60 Q 30 46 50 46 Q 70 46 70 60" />
    <line x1={50} y1={58} x2={62} y2={50} strokeLinecap="round" />
    <circle cx={50} cy={60} r={2.5} fill={c} stroke="none" />
  </g>
)

// ─── VPN (tunnel with lock) ──────────────────────────────────────────────────
const pictoVpn = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 20 42 Q 50 26 80 42 L 80 70 Q 50 86 20 70 Z" />
    <line x1={20} y1={42} x2={80} y2={42} />
    <line x1={50} y1={42} x2={50} y2={82} strokeDasharray="3 3" />
    {/* small padlock */}
    <rect x={42} y={56} width={16} height={12} rx={1} />
    <path d="M 46 56 L 46 52 Q 46 48 50 48 Q 54 48 54 52 L 54 56" />
  </g>
)

// ─── Firewall (brick wall with flame) ────────────────────────────────────────
const pictoFirewall = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={18} y={36} width={64} height={48} rx={1} />
    {/* brick lines */}
    <line x1={18} y1={48} x2={82} y2={48} />
    <line x1={18} y1={60} x2={82} y2={60} />
    <line x1={18} y1={72} x2={82} y2={72} />
    <line x1={34} y1={36} x2={34} y2={48} />
    <line x1={50} y1={36} x2={50} y2={48} />
    <line x1={66} y1={36} x2={66} y2={48} />
    <line x1={26} y1={48} x2={26} y2={60} />
    <line x1={42} y1={48} x2={42} y2={60} />
    <line x1={58} y1={48} x2={58} y2={60} />
    <line x1={74} y1={48} x2={74} y2={60} />
    <line x1={34} y1={60} x2={34} y2={72} />
    <line x1={50} y1={60} x2={50} y2={72} />
    <line x1={66} y1={60} x2={66} y2={72} />
    <line x1={26} y1={72} x2={26} y2={84} />
    <line x1={42} y1={72} x2={42} y2={84} />
    <line x1={58} y1={72} x2={58} y2={84} />
    <line x1={74} y1={72} x2={74} y2={84} />
    {/* flame on top */}
    <path d="M 50 14 Q 56 22 54 28 Q 60 26 58 34 Q 50 30 42 34 Q 40 26 46 28 Q 44 22 50 14 Z"
      fill={c} stroke="none" />
  </g>
)

// ─── Region (labeled boundary box) ───────────────────────────────────────────
const pictoRegion = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={14} y={24} width={72} height={52} rx={4} />
    <text x={50} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={12} fontWeight={700} fill={c} letterSpacing="1">REGION</text>
  </g>
)

// ─── Availability Zone (smaller labeled box, dashed) ─────────────────────────
const pictoAz = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={16} y={26} width={68} height={48} rx={4} strokeDasharray="5 3" />
    <text x={50} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={11} fontWeight={700} fill={c} letterSpacing="0.5">ZONE</text>
  </g>
)

// ─── Internet (globe with longitude lines) ───────────────────────────────────
const pictoInternet = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={28} />
    <ellipse cx={50} cy={50} rx={12} ry={28} />
    <ellipse cx={50} cy={50} rx={28} ry={12} />
    <line x1={22} y1={50} x2={78} y2={50} />
  </g>
)

const FILL = CLOUD_SOFT

export const CLOUD_PACK: Pack = {
  id: 'cloud',
  label: 'Cloud',
  description: 'Vendor-neutral cloud architecture concepts.',
  defaultEnabled: true,
  shapes: [
    { id: 'cloud:cloud',             packId: 'cloud', label: 'Cloud',                keywords: ['external', 'internet'],         defaultSize: { w: 160, h: 110 }, defaultStyle: { fill: 'transparent', borderColor: CLOUD },      render: cloudShape(pictoCloud) },
    { id: 'cloud:vm',                packId: 'cloud', label: 'Virtual Machine',      keywords: ['vm', 'instance', 'compute'],   defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoVm) },
    { id: 'cloud:container',         packId: 'cloud', label: 'Container',            keywords: ['docker', 'oci', 'box'],         defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoContainer),
      iconBounds: { x: 16, y: 32, w: 68, h: 36 } },
    { id: 'cloud:cluster',           packId: 'cloud', label: 'Container Cluster',    keywords: ['cluster', 'orchestration', 'fleet'], defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL,    borderColor: CLOUD },      render: cloudShape(pictoCluster),
      handlePositions: { top: { x: 50, y: 38 }, right: { x: 80, y: 38 }, bottom: { x: 50, y: 80 }, left: { x: 20, y: 38 } } },
    { id: 'cloud:serverless',        packId: 'cloud', label: 'Serverless Function',  keywords: ['function', 'lambda', 'event-driven'], defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL,   borderColor: CLOUD },      render: cloudShape(pictoServerless) },
    { id: 'cloud:object-storage',    packId: 'cloud', label: 'Object Storage',       keywords: ['blob', 's3', 'bucket'],         defaultSize: { w: 110, h: 130 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoObjectStore) },
    { id: 'cloud:block-storage',     packId: 'cloud', label: 'Block Storage',        keywords: ['disk', 'volume', 'ebs'],        defaultSize: { w: 130, h: 110 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoBlockStore) },
    { id: 'cloud:data-warehouse',    packId: 'cloud', label: 'Data Warehouse',       keywords: ['analytics', 'olap', 'bigquery', 'redshift'], defaultSize: { w: 130, h: 140 }, defaultStyle: { fill: FILL, borderColor: CLOUD }, render: cloudShape(pictoWarehouse) },
    { id: 'cloud:event-bus',         packId: 'cloud', label: 'Event Bus',            keywords: ['pubsub', 'kafka', 'eventbridge'], defaultSize: { w: 160, h: 130 }, defaultStyle: { fill: FILL,        borderColor: CLOUD },      render: cloudShape(pictoEventBus),
      handlePositions: { bottom: { x: 50, y: 56 } } },
    { id: 'cloud:idp',               packId: 'cloud', label: 'Identity Provider',    keywords: ['idp', 'sso', 'oauth', 'auth'],  defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL,          borderColor: CLOUD_DARK }, render: cloudShape(pictoIdp) },
    { id: 'cloud:vault',             packId: 'cloud', label: 'Secrets Vault',        keywords: ['secrets', 'kms', 'hashicorp vault'], defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL,     borderColor: CLOUD_DARK }, render: cloudShape(pictoVault) },
    { id: 'cloud:monitoring',        packId: 'cloud', label: 'Monitoring',           keywords: ['observability', 'metrics', 'apm', 'grafana'], defaultSize: { w: 140, h: 130 }, defaultStyle: { fill: FILL, borderColor: CLOUD }, render: cloudShape(pictoMonitoring) },
    { id: 'cloud:vpn',               packId: 'cloud', label: 'VPN',                  keywords: ['tunnel', 'private network'],    defaultSize: { w: 140, h: 130 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoVpn) },
    { id: 'cloud:firewall',          packId: 'cloud', label: 'Firewall',             keywords: ['waf', 'security', 'wall'],      defaultSize: { w: 130, h: 140 }, defaultStyle: { fill: FILL,          borderColor: CLOUD_DARK }, render: cloudShape(pictoFirewall) },
    { id: 'cloud:region',            packId: 'cloud', label: 'Region',               keywords: ['region', 'geography'],          defaultSize: { w: 180, h: 110 }, defaultStyle: { fill: 'transparent', borderColor: CLOUD },      render: cloudShape(pictoRegion) },
    { id: 'cloud:az',                packId: 'cloud', label: 'Availability Zone',    keywords: ['az', 'zone', 'datacenter'],     defaultSize: { w: 160, h: 110 }, defaultStyle: { fill: 'transparent', borderColor: CLOUD },      render: cloudShape(pictoAz) },
    { id: 'cloud:internet',          packId: 'cloud', label: 'Internet',             keywords: ['web', 'wan'],                   defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL,          borderColor: CLOUD },      render: cloudShape(pictoInternet) },
  ],
}
