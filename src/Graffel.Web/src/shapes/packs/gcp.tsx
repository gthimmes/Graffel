import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeDef, ShapeRenderer } from '../types'

/**
 * GCP pack — common Google Cloud Platform building blocks. Opt-in vendor pack
 * (ships disabled; enable in the Library Manager) per ADR-0010's vendor off-ramp.
 *
 * Idiom (distinct from AWS's filled category tiles and Azure's filled blue
 * tiles): a WHITE tile with a thin border and a brand-colored line glyph, echoing
 * Google Cloud's flat multi-color icon style. Self-authored approximations, not
 * the official marks.
 */

const G_BLUE = '#4285F4'
const G_GREEN = '#34A853'
const G_RED = '#EA4335'
const G_YELLOW = '#FBBC04'
const TILE = { x: 6, y: 6, w: 88, h: 88 }
const SW = 4

/** White tile + thin border; glyph drawn in the service's brand color. */
function gcpTile(color: string, glyph: (c: string) => ReactNode): ShapeRenderer {
  return ({ width, height }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <rect x={6} y={6} width={88} height={88} rx={12} fill="#ffffff" stroke="#dadce0" strokeWidth={2} />
      {glyph(color)}
    </ShapeSvg>
  )
}

// ── glyph builders (parameterized by color) ──────────────────────────────────
const gVm = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <rect x={26} y={30} width={48} height={36} rx={3} />
    <line x1={26} y1={40} x2={74} y2={40} />
    <circle cx={32} cy={35} r={1.6} fill={c} stroke="none" /><circle cx={38} cy={35} r={1.6} fill={c} stroke="none" />
    <rect x={36} y={47} width={28} height={13} rx={2} />
    <line x1={40} y1={70} x2={60} y2={70} strokeLinecap="round" />
  </g>
)
const gFunc = (c: string) => (
  <text x={50} y={66} textAnchor="middle" fontFamily="system-ui, sans-serif" fontStyle="italic" fontSize={42} fontWeight={700} fill={c}>ƒ</text>
)
const gK8s = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,28 68,37 72,56 60,71 40,71 28,56 32,37" />
    <circle cx={50} cy={52} r={4} fill={c} stroke="none" />
    <line x1={50} y1={38} x2={50} y2={48} /><line x1={50} y1={56} x2={41} y2={64} /><line x1={50} y1={56} x2={59} y2={64} />
  </g>
)
const gRun = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={28} y={38} width={44} height={26} rx={3} />
    <path d="M 44 46 L 56 51 L 44 56 Z" fill={c} stroke="none" />
  </g>
)
const gApp = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 50 28 L 70 39 V 61 L 50 72 L 30 61 V 39 Z" />
    <path d="M 30 39 L 50 50 L 70 39 M 50 50 V 72" />
  </g>
)
const gBucket = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 32 34 L 36 70 Q 36 73 39 73 L 61 73 Q 64 73 64 70 L 68 34 Z" />
    <ellipse cx={50} cy={34} rx={18} ry={4.5} />
  </g>
)
const gDisk = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={30} y={34} width={40} height={32} rx={3} />
    <circle cx={50} cy={50} r={9} /><circle cx={50} cy={50} r={2.5} fill={c} stroke="none" />
  </g>
)
const gFile = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <path d="M 34 32 H 56 L 64 40 V 70 H 34 Z" /><path d="M 56 32 V 40 H 64" />
    <line x1={41} y1={50} x2={57} y2={50} /><line x1={41} y1={58} x2={57} y2={58} />
  </g>
)
const cylinder = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={36} rx={18} ry={5} />
    <path d="M 32 36 V 64 Q 32 69 50 69 Q 68 69 68 64 V 36" />
    <path d="M 32 50 Q 32 55 50 55 Q 68 55 68 50" />
  </g>
)
const gFirestore = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 50 26 L 70 36 L 50 46 L 30 36 Z" />
    <path d="M 30 48 L 50 58 L 70 48" /><path d="M 30 36 V 48 M 70 36 V 48 M 50 46 V 58" />
  </g>
)
const gTable = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <rect x={28} y={32} width={44} height={36} rx={2} />
    <line x1={28} y1={44} x2={72} y2={44} /><line x1={28} y1={56} x2={72} y2={56} />
    <line x1={43} y1={32} x2={43} y2={68} /><line x1={57} y1={32} x2={57} y2={68} />
  </g>
)
const gBigQuery = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round">
    <circle cx={45} cy={45} r={15} />
    <line x1={56} y1={56} x2={70} y2={70} />
    <line x1={40} y1={45} x2={40} y2={48} /><line x1={45} y1={42} x2={45} y2={48} /><line x1={50} y1={39} x2={50} y2={48} />
  </g>
)
const gHexLabel = (label: string) => (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,26 70,37 70,61 50,72 30,61 30,37" />
    <text x={50} y={55} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={12} fontWeight={700} fill={c}>{label}</text>
  </g>
)
const gGlobeEdges = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={20} /><ellipse cx={50} cy={50} rx={8} ry={20} /><line x1={30} y1={50} x2={70} y2={50} />
    <circle cx={50} cy={30} r={3} fill={c} stroke="none" /><circle cx={67} cy={60} r={3} fill={c} stroke="none" /><circle cx={33} cy={60} r={3} fill={c} stroke="none" />
  </g>
)
const gDistribution = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={50} cy={34} r={6} /><circle cx={32} cy={66} r={6} /><circle cx={50} cy={66} r={6} /><circle cx={68} cy={66} r={6} />
    <line x1={48} y1={40} x2={34} y2={60} /><line x1={50} y1={40} x2={50} y2={60} /><line x1={52} y1={40} x2={66} y2={60} />
  </g>
)
const gBroadcast = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round">
    <circle cx={48} cy={50} r={7} fill={c} stroke="none" />
    <path d="M 60 39 Q 68 50 60 61" /><path d="M 67 33 Q 79 50 67 67" />
    <path d="M 38 39 Q 30 50 38 61" /><path d="M 31 33 Q 19 50 31 67" />
  </g>
)
const gPadlock = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinejoin="round">
    <rect x={36} y={46} width={28} height={22} rx={3} />
    <path d="M 41 46 V 40 Q 41 31 50 31 Q 59 31 59 40 V 46" />
    <circle cx={50} cy={55} r={3} fill={c} stroke="none" /><line x1={50} y1={57} x2={50} y2={62} strokeLinecap="round" />
  </g>
)
const gKey = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={40} cy={42} r={9} /><line x1={46} y1={48} x2={68} y2={70} /><line x1={60} y1={62} x2={66} y2={56} /><line x1={64} y1={66} x2={70} y2={60} />
  </g>
)
const gGauge = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round">
    <path d="M 28 56 Q 28 38 50 38 Q 72 38 72 56" /><line x1={50} y1={56} x2={62} y2={46} /><circle cx={50} cy={56} r={3} fill={c} stroke="none" />
  </g>
)

function gcp(id: string, label: string, color: string, glyph: (c: string) => ReactNode, keywords: string[]): ShapeDef {
  return {
    id: `gcp:${id}`,
    packId: 'gcp',
    label,
    keywords: ['gcp', 'google cloud', 'google', ...keywords],
    defaultSize: { w: 90, h: 90 },
    defaultStyle: { fill: '#ffffff', borderColor: color },
    render: gcpTile(color, glyph),
    iconBounds: TILE,
  }
}

export const GCP_PACK: Pack = {
  id: 'gcp',
  label: 'Google Cloud',
  description: 'Common Google Cloud Platform services. Opt-in vendor pack — enable in the Library Manager.',
  defaultEnabled: false,
  shapes: [
    gcp('compute-engine', 'Compute Engine', G_BLUE, gVm, ['vm', 'instance', 'gce', 'compute']),
    gcp('cloud-functions', 'Cloud Functions', G_BLUE, gFunc, ['serverless', 'function', 'faas']),
    gcp('gke', 'GKE', G_BLUE, gK8s, ['kubernetes', 'k8s', 'container', 'engine']),
    gcp('cloud-run', 'Cloud Run', G_BLUE, gRun, ['serverless', 'container', 'run']),
    gcp('app-engine', 'App Engine', G_BLUE, gApp, ['paas', 'app', 'gae']),
    gcp('cloud-storage', 'Cloud Storage', G_GREEN, gBucket, ['gcs', 'bucket', 'object', 'blob']),
    gcp('persistent-disk', 'Persistent Disk', G_GREEN, gDisk, ['disk', 'block', 'volume', 'pd']),
    gcp('filestore', 'Filestore', G_GREEN, gFile, ['nfs', 'file', 'shared']),
    gcp('cloud-sql', 'Cloud SQL', G_BLUE, cylinder, ['database', 'sql', 'postgres', 'mysql']),
    gcp('firestore', 'Firestore', G_BLUE, gFirestore, ['database', 'nosql', 'document', 'datastore']),
    gcp('bigtable', 'Bigtable', G_BLUE, gTable, ['database', 'nosql', 'wide-column']),
    gcp('bigquery', 'BigQuery', G_RED, gBigQuery, ['analytics', 'data warehouse', 'olap', 'query']),
    gcp('vpc', 'VPC', G_GREEN, gHexLabel('VPC'), ['network', 'virtual private cloud', 'subnet']),
    gcp('cloud-cdn', 'Cloud CDN', G_BLUE, gGlobeEdges, ['cdn', 'edge', 'content delivery']),
    gcp('cloud-dns', 'Cloud DNS', G_BLUE, gHexLabel('DNS'), ['dns', 'domain', 'routing']),
    gcp('cloud-lb', 'Cloud Load Balancing', G_GREEN, gDistribution, ['load balancer', 'lb']),
    gcp('pubsub', 'Pub/Sub', G_YELLOW, gBroadcast, ['messaging', 'pubsub', 'events', 'topic']),
    gcp('iam', 'IAM', G_RED, gPadlock, ['identity', 'access', 'permissions', 'auth']),
    gcp('cloud-kms', 'Cloud KMS', G_RED, gKey, ['encryption', 'key', 'secrets', 'crypto']),
    gcp('cloud-monitoring', 'Cloud Monitoring', G_BLUE, gGauge, ['observability', 'metrics', 'stackdriver']),
  ],
}
