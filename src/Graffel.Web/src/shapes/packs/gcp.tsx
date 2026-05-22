import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * GCP pack — stylized icons inspired by Google Cloud's color palette and
 * shape language. Each icon is a soft-blue rounded square with a pictogram
 * in GCP blue. Not the official Google Cloud icons (see ADR-0010).
 */

const GCP_BLUE = '#4285F4'
const GCP_BLUE_DARK = '#1A73E8'
const SW = 2.5
const FRAME_RX = 12

function GcpFrame({ children, fill, borderColor }: { children: ReactNode; fill: string; borderColor: string }) {
  return (
    <>
      <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={FRAME_RX} ry={FRAME_RX}
        fill={fill} stroke={borderColor} strokeWidth={SW} />
      {children}
    </>
  )
}

function gcp(pictogram: (color: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <GcpFrame fill={fill} borderColor={borderColor}>
        {pictogram(borderColor)}
      </GcpFrame>
    </ShapeSvg>
  )
}

// ─── Pictograms ──────────────────────────────────────────────────────────────

// Compute Engine — server block
const pictoCompute = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={28} width={48} height={44} rx={3} />
    <line x1={26} y1={42} x2={74} y2={42} />
    <line x1={26} y1={58} x2={74} y2={58} />
    <circle cx={36} cy={35} r={1.8} fill={c} />
    <circle cx={36} cy={50} r={1.8} fill={c} />
    <circle cx={36} cy={65} r={1.8} fill={c} />
  </g>
)

// Cloud Run — running container with arrow
const pictoCloudRun = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={36} width={44} height={28} rx={3} />
    <polyline points="42,42 52,50 42,58" strokeLinecap="round" strokeLinejoin="round" />
    <line x1={56} y1={50} x2={64} y2={50} strokeLinecap="round" />
  </g>
)

// GKE — hexagonal cluster
const pictoGke = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,22 72,34 72,58 50,70 28,58 28,34" />
    <line x1={50} y1={22} x2={50} y2={46} />
    <line x1={28} y1={34} x2={50} y2={46} />
    <line x1={72} y1={34} x2={50} y2={46} />
    <circle cx={50} cy={46} r={3} fill={c} />
  </g>
)

// App Engine — gear / sandbox
const pictoAppEngine = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={28} width={44} height={44} rx={6} />
    <circle cx={50} cy={50} r={10} />
    <line x1={50} y1={36} x2={50} y2={40} />
    <line x1={50} y1={60} x2={50} y2={64} />
    <line x1={36} y1={50} x2={40} y2={50} />
    <line x1={60} y1={50} x2={64} y2={50} />
  </g>
)

// Cloud Functions — λ
const pictoFunctions = (c: string) => (
  <path d="M 32 30 Q 40 30 44 38 L 60 72 M 44 38 L 32 72 M 36 64 L 60 64"
    fill="none" stroke={c} strokeWidth={SW * 1.4} strokeLinecap="round" />
)

// Cloud Storage — bucket
const pictoCloudStorage = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 28 38 L 32 78 Q 32 80 34 80 L 66 80 Q 68 80 68 78 L 72 38 Z" />
    <line x1={28} y1={38} x2={72} y2={38} />
    <line x1={42} y1={48} x2={42} y2={70} />
    <line x1={58} y1={48} x2={58} y2={70} />
  </g>
)

// BigQuery — analytics chart
const pictoBigQuery = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={48} cy={50} r={18} />
    <line x1={62} y1={64} x2={74} y2={76} strokeLinecap="round" />
    <line x1={40} y1={56} x2={40} y2={48} />
    <line x1={48} y1={56} x2={48} y2={42} />
    <line x1={56} y1={56} x2={56} y2={46} />
  </g>
)

// Firestore — flame
const pictoFirestore = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 50 22 Q 64 38 64 50 Q 64 62 50 70 Q 36 62 36 50 Q 36 38 50 22 Z" />
    <path d="M 50 38 Q 56 46 56 52 Q 56 60 50 64" fill="none" />
  </g>
)

// Cloud SQL — database
const pictoCloudSql = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={28} rx={20} ry={6} />
    <path d="M 30 28 L 30 72 Q 30 78 50 78 Q 70 78 70 72 L 70 28" />
    <path d="M 30 44 Q 30 50 50 50 Q 70 50 70 44" />
    <path d="M 30 58 Q 30 64 50 64 Q 70 64 70 58" />
  </g>
)

// Pub/Sub — fanout
const pictoPubSub = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={36} y={32} width={28} height={14} rx={3} />
    <line x1={50} y1={46} x2={50} y2={56} />
    <line x1={50} y1={56} x2={32} y2={70} />
    <line x1={50} y1={56} x2={50} y2={70} />
    <line x1={50} y1={56} x2={68} y2={70} />
    <circle cx={32} cy={72} r={3} fill={c} />
    <circle cx={50} cy={72} r={3} fill={c} />
    <circle cx={68} cy={72} r={3} fill={c} />
  </g>
)

// Cloud Load Balancing
const pictoLb = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,22 78,76 22,76" />
    <line x1={50} y1={38} x2={50} y2={76} />
    <line x1={36} y1={64} x2={64} y2={64} />
  </g>
)

// Cloud CDN — globe
const pictoCdn = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={22} />
    <ellipse cx={50} cy={50} rx={22} ry={8} />
    <line x1={28} y1={50} x2={72} y2={50} />
    <line x1={50} y1={28} x2={50} y2={72} />
  </g>
)

// Cloud DNS — DNS tag
const pictoDns = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="26,38 60,38 74,52 60,66 26,66" />
    <text x={42} y={56} textAnchor="middle" fontSize={12} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>DNS</text>
  </g>
)

// IAM — shield
const pictoIam = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 50 24 L 70 30 L 70 50 Q 70 68 50 76 Q 30 68 30 50 L 30 30 Z" />
    <polyline points="40,50 48,58 60,42" strokeLinecap="round" strokeLinejoin="round" />
  </g>
)

// Cloud Logging — document with lines
const pictoLogging = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 30 24 L 62 24 L 72 34 L 72 76 L 30 76 Z" />
    <polyline points="62,24 62,34 72,34" />
    <line x1={38} y1={44} x2={64} y2={44} />
    <line x1={38} y1={52} x2={64} y2={52} />
    <line x1={38} y1={60} x2={56} y2={60} />
  </g>
)

const PACK_FILL = '#EFF6FF'

export const GCP_PACK: Pack = {
  id: 'gcp',
  label: 'Google Cloud',
  description: 'Stylized icons inspired by the GCP shape language.',
  defaultEnabled: true,
  shapes: [
    { id: 'gcp:compute-engine',   packId: 'gcp', label: 'Compute Engine',     keywords: ['vm', 'instance', 'gce'],          defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoCompute) },
    { id: 'gcp:cloud-run',        packId: 'gcp', label: 'Cloud Run',          keywords: ['container', 'serverless'],         defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoCloudRun) },
    { id: 'gcp:gke',              packId: 'gcp', label: 'GKE',                keywords: ['kubernetes', 'k8s', 'cluster'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoGke) },
    { id: 'gcp:app-engine',       packId: 'gcp', label: 'App Engine',         keywords: ['paas', 'webapp'],                  defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoAppEngine) },
    { id: 'gcp:cloud-functions',  packId: 'gcp', label: 'Cloud Functions',    keywords: ['serverless', 'function', 'lambda'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoFunctions) },
    { id: 'gcp:cloud-storage',    packId: 'gcp', label: 'Cloud Storage',      keywords: ['gcs', 'bucket', 'object'],         defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoCloudStorage) },
    { id: 'gcp:bigquery',         packId: 'gcp', label: 'BigQuery',           keywords: ['analytics', 'data warehouse'],     defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoBigQuery) },
    { id: 'gcp:firestore',        packId: 'gcp', label: 'Firestore',          keywords: ['firebase', 'nosql', 'database'],   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoFirestore) },
    { id: 'gcp:cloud-sql',        packId: 'gcp', label: 'Cloud SQL',          keywords: ['database', 'mysql', 'postgres'],   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoCloudSql) },
    { id: 'gcp:pubsub',           packId: 'gcp', label: 'Pub/Sub',            keywords: ['messaging', 'queue', 'fanout'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoPubSub) },
    { id: 'gcp:load-balancing',   packId: 'gcp', label: 'Cloud Load Balancing', keywords: ['lb', 'gclb'],                    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoLb) },
    { id: 'gcp:cloud-cdn',        packId: 'gcp', label: 'Cloud CDN',          keywords: ['edge', 'cache'],                   defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoCdn) },
    { id: 'gcp:cloud-dns',        packId: 'gcp', label: 'Cloud DNS',          keywords: ['dns', 'routing'],                  defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoDns) },
    { id: 'gcp:iam',              packId: 'gcp', label: 'IAM',                keywords: ['identity', 'auth', 'security'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE_DARK }, render: gcp(pictoIam) },
    { id: 'gcp:cloud-logging',    packId: 'gcp', label: 'Cloud Logging',      keywords: ['logs', 'stackdriver'],             defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: GCP_BLUE }, render: gcp(pictoLogging) },
  ],
}
