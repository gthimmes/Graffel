import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * Azure pack — stylized icons inspired by Microsoft Azure's color palette.
 * Soft-cyan rounded square with cyan pictogram. Not the official Azure icons
 * (see ADR-0010 license stance).
 */

const AZ_CYAN = '#0078D4'
const AZ_CYAN_DARK = '#005A9E'
const SW = 2.5
const FRAME_RX = 12

function AzFrame({ children, fill, borderColor }: { children: ReactNode; fill: string; borderColor: string }) {
  return (
    <>
      <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={FRAME_RX} ry={FRAME_RX}
        fill={fill} stroke={borderColor} strokeWidth={SW} />
      {children}
    </>
  )
}

function az(pictogram: (color: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <AzFrame fill={fill} borderColor={borderColor}>
        {pictogram(borderColor)}
      </AzFrame>
    </ShapeSvg>
  )
}

// VM — monitor
const pictoVm = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={28} width={48} height={36} rx={2} />
    <line x1={26} y1={38} x2={74} y2={38} />
    <line x1={42} y1={64} x2={58} y2={64} />
    <line x1={50} y1={64} x2={50} y2={72} />
    <line x1={38} y1={72} x2={62} y2={72} />
    <circle cx={32} cy={33} r={1.5} fill={c} />
  </g>
)

// App Service — globe + cog
const pictoAppService = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={22} />
    <ellipse cx={50} cy={50} rx={22} ry={8} />
    <line x1={28} y1={50} x2={72} y2={50} />
    <line x1={50} y1={28} x2={50} y2={72} />
  </g>
)

// Functions — λ
const pictoFunctions = (c: string) => (
  <path d="M 32 30 Q 40 30 44 38 L 60 72 M 44 38 L 32 72 M 36 64 L 60 64"
    fill="none" stroke={c} strokeWidth={SW * 1.4} strokeLinecap="round" />
)

// AKS — hexagonal cluster
const pictoAks = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,22 72,34 72,58 50,70 28,58 28,34" />
    <line x1={50} y1={22} x2={50} y2={46} />
    <line x1={28} y1={34} x2={50} y2={46} />
    <line x1={72} y1={34} x2={50} y2={46} />
    <circle cx={50} cy={46} r={3} fill={c} />
  </g>
)

// Container Instances — single container
const pictoContainer = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={32} width={44} height={36} rx={3} />
    <line x1={28} y1={42} x2={72} y2={42} />
    <line x1={36} y1={50} x2={64} y2={50} />
    <line x1={36} y1={58} x2={56} y2={58} />
  </g>
)

// Blob Storage — bucket
const pictoBlob = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 28 38 L 32 78 Q 32 80 34 80 L 66 80 Q 68 80 68 78 L 72 38 Z" />
    <line x1={28} y1={38} x2={72} y2={38} />
    <text x={50} y={64} textAnchor="middle" fontSize={11} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>BLOB</text>
  </g>
)

// Cosmos DB — planet
const pictoCosmos = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={20} />
    <ellipse cx={50} cy={50} rx={28} ry={10} transform="rotate(-25 50 50)" />
    <ellipse cx={50} cy={50} rx={28} ry={10} transform="rotate(25 50 50)" />
  </g>
)

// SQL Database — cylinder
const pictoSqlDb = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={28} rx={20} ry={6} />
    <path d="M 30 28 L 30 72 Q 30 78 50 78 Q 70 78 70 72 L 70 28" />
    <path d="M 30 50 Q 30 56 50 56 Q 70 56 70 50" />
    <text x={50} y={48} textAnchor="middle" fontSize={9} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>SQL</text>
  </g>
)

// Service Bus — bus with stops
const pictoServiceBus = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <line x1={22} y1={50} x2={78} y2={50} strokeLinecap="round" />
    <circle cx={30} cy={50} r={4} fill={c} />
    <circle cx={50} cy={50} r={4} fill={c} />
    <circle cx={70} cy={50} r={4} fill={c} />
    <line x1={30} y1={44} x2={30} y2={36} />
    <line x1={50} y1={44} x2={50} y2={28} />
    <line x1={70} y1={44} x2={70} y2={36} />
    <rect x={26} y={28} width={8} height={6} rx={1} />
    <rect x={46} y={20} width={8} height={6} rx={1} />
    <rect x={66} y={28} width={8} height={6} rx={1} />
  </g>
)

// Event Grid — pubsub grid
const pictoEventGrid = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={6} />
    <line x1={50} y1={44} x2={50} y2={32} />
    <line x1={50} y1={56} x2={50} y2={68} />
    <line x1={44} y1={50} x2={32} y2={50} />
    <line x1={56} y1={50} x2={68} y2={50} />
    <circle cx={50} cy={28} r={4} />
    <circle cx={50} cy={72} r={4} />
    <circle cx={28} cy={50} r={4} />
    <circle cx={72} cy={50} r={4} />
  </g>
)

// API Management
const pictoApiMgmt = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={32} width={44} height={36} rx={3} />
    <text x={50} y={56} textAnchor="middle" fontSize={14} fontFamily="system-ui, sans-serif"
      fontWeight={700} fill={c}>API</text>
  </g>
)

// CDN
const pictoCdn = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={22} />
    <ellipse cx={50} cy={50} rx={22} ry={8} />
    <line x1={28} y1={50} x2={72} y2={50} />
    <line x1={50} y1={28} x2={50} y2={72} />
  </g>
)

// Front Door — gateway/door
const pictoFrontDoor = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 30 76 L 30 36 Q 30 28 38 28 L 62 28 Q 70 28 70 36 L 70 76" />
    <circle cx={60} cy={52} r={2} fill={c} />
    <line x1={30} y1={42} x2={70} y2={42} />
  </g>
)

// Active Directory — group of users
const pictoAd = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={40} cy={36} r={6} />
    <circle cx={60} cy={36} r={6} />
    <path d="M 28 66 Q 28 52 40 52 Q 52 52 52 66" />
    <path d="M 48 66 Q 48 52 60 52 Q 72 52 72 66" />
  </g>
)

// Application Insights — magnifier on chart
const pictoAppInsights = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={42} width={48} height={32} rx={2} />
    <polyline points="32,68 40,58 48,62 56,50 66,54" />
    <circle cx={64} cy={32} r={6} />
    <line x1={68} y1={36} x2={74} y2={42} strokeLinecap="round" />
  </g>
)

const PACK_FILL = '#E0F2FE'

export const AZURE_PACK: Pack = {
  id: 'azure',
  label: 'Azure',
  description: 'Stylized icons inspired by the Microsoft Azure shape language.',
  defaultEnabled: true,
  shapes: [
    { id: 'azure:vm',                 packId: 'azure', label: 'Virtual Machine',     keywords: ['vm', 'compute'],            defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoVm) },
    { id: 'azure:app-service',        packId: 'azure', label: 'App Service',         keywords: ['paas', 'web'],              defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoAppService) },
    { id: 'azure:functions',          packId: 'azure', label: 'Functions',           keywords: ['serverless', 'lambda'],     defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoFunctions) },
    { id: 'azure:aks',                packId: 'azure', label: 'AKS',                 keywords: ['kubernetes', 'cluster'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoAks) },
    { id: 'azure:container-instance', packId: 'azure', label: 'Container Instance',  keywords: ['aci', 'container'],         defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoContainer) },
    { id: 'azure:blob-storage',       packId: 'azure', label: 'Blob Storage',        keywords: ['storage', 'blob', 'object'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoBlob) },
    { id: 'azure:cosmos-db',          packId: 'azure', label: 'Cosmos DB',           keywords: ['database', 'nosql', 'global'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoCosmos) },
    { id: 'azure:sql-database',       packId: 'azure', label: 'SQL Database',        keywords: ['database', 'sql', 'mssql'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoSqlDb) },
    { id: 'azure:service-bus',        packId: 'azure', label: 'Service Bus',         keywords: ['messaging', 'queue'],       defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoServiceBus) },
    { id: 'azure:event-grid',         packId: 'azure', label: 'Event Grid',          keywords: ['events', 'pubsub'],         defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoEventGrid) },
    { id: 'azure:api-management',     packId: 'azure', label: 'API Management',      keywords: ['api', 'gateway'],           defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoApiMgmt) },
    { id: 'azure:cdn',                packId: 'azure', label: 'CDN',                 keywords: ['edge', 'cache'],            defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoCdn) },
    { id: 'azure:front-door',         packId: 'azure', label: 'Front Door',          keywords: ['gateway', 'global'],        defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoFrontDoor) },
    { id: 'azure:active-directory',   packId: 'azure', label: 'Active Directory',    keywords: ['identity', 'aad', 'entra'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN_DARK }, render: az(pictoAd) },
    { id: 'azure:app-insights',       packId: 'azure', label: 'App Insights',        keywords: ['monitoring', 'logs', 'apm'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AZ_CYAN }, render: az(pictoAppInsights) },
  ],
}
