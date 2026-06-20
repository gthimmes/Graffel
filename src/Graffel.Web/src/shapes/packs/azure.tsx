import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeDef, ShapeRenderer } from '../types'

/**
 * Azure pack — common Microsoft Azure building blocks. Opt-in vendor pack (ships
 * disabled; enable in the Library Manager) per ADR-0010's vendor off-ramp.
 *
 * Idiom: a filled Azure-blue tile with a white glyph — distinct from AWS's
 * per-category colored tiles and GCP's white tiles. Self-authored approximations,
 * not the official marks.
 */

const AZ = '#0078D4'
const TILE = { x: 6, y: 6, w: 88, h: 88 }
const W = '#ffffff'
const SW = 4

function azTile(glyph: ReactNode): ShapeRenderer {
  return ({ width, height, fill }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <rect x={6} y={6} width={88} height={88} rx={12} fill={fill} />
      {glyph}
    </ShapeSvg>
  )
}

const gVm = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <rect x={26} y={30} width={48} height={36} rx={3} />
    <line x1={26} y1={40} x2={74} y2={40} />
    <rect x={36} y={47} width={28} height={13} rx={2} />
    <line x1={40} y1={70} x2={60} y2={70} strokeLinecap="round" />
  </g>
)
const gFunc = (
  <text x={50} y={66} textAnchor="middle" fontFamily="system-ui, sans-serif" fontStyle="italic" fontSize={42} fontWeight={700} fill={W}>ƒ</text>
)
const gK8s = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,28 68,37 72,56 60,71 40,71 28,56 32,37" />
    <circle cx={50} cy={52} r={4} fill={W} stroke="none" />
    <line x1={50} y1={38} x2={50} y2={48} /><line x1={50} y1={56} x2={41} y2={64} /><line x1={50} y1={56} x2={59} y2={64} />
  </g>
)
const gContainer = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={30} y={40} width={40} height={24} rx={2} />
    <line x1={40} y1={40} x2={40} y2={64} /><line x1={50} y1={40} x2={50} y2={64} /><line x1={60} y1={40} x2={60} y2={64} />
    <line x1={25} y1={40} x2={30} y2={40} /><line x1={25} y1={64} x2={30} y2={64} /><line x1={70} y1={40} x2={75} y2={40} /><line x1={70} y1={64} x2={75} y2={64} />
  </g>
)
const gApp = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <circle cx={50} cy={50} r={20} /><ellipse cx={50} cy={50} rx={8} ry={20} /><line x1={30} y1={50} x2={70} y2={50} /><line x1={50} y1={30} x2={50} y2={70} />
  </g>
)
const gBucket = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 32 34 L 36 70 Q 36 73 39 73 L 61 73 Q 64 73 64 70 L 68 34 Z" />
    <ellipse cx={50} cy={34} rx={18} ry={4.5} />
  </g>
)
const gDisk = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <rect x={30} y={34} width={40} height={32} rx={3} />
    <circle cx={50} cy={50} r={9} /><circle cx={50} cy={50} r={2.5} fill={W} stroke="none" />
  </g>
)
const gFile = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <path d="M 34 32 H 56 L 64 40 V 70 H 34 Z" /><path d="M 56 32 V 40 H 64" />
    <line x1={41} y1={50} x2={57} y2={50} /><line x1={41} y1={58} x2={57} y2={58} />
  </g>
)
const cylinder = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <ellipse cx={50} cy={36} rx={18} ry={5} />
    <path d="M 32 36 V 64 Q 32 69 50 69 Q 68 69 68 64 V 36" />
    <path d="M 32 50 Q 32 55 50 55 Q 68 55 68 50" />
  </g>
)
const gCosmos = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <circle cx={50} cy={50} r={16} />
    <ellipse cx={50} cy={50} rx={24} ry={9} transform="rotate(30 50 50)" />
    <circle cx={71} cy={38} r={3} fill={W} stroke="none" />
  </g>
)
const gWarehouse = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx={50} cy={32} rx={20} ry={5} />
    <path d="M 30 32 V 66 Q 30 71 50 71 Q 70 71 70 66 V 32" />
    <line x1={40} y1={46} x2={40} y2={52} /><line x1={48} y1={42} x2={48} y2={52} /><line x1={56} y1={38} x2={56} y2={52} /><line x1={62} y1={44} x2={62} y2={52} />
  </g>
)
const gHexLabel = (label: string) => (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,26 70,37 70,61 50,72 30,61 30,37" />
    <text x={50} y={55} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={11} fontWeight={700} fill={W}>{label}</text>
  </g>
)
const gGlobeEdges = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <circle cx={50} cy={50} r={20} /><ellipse cx={50} cy={50} rx={8} ry={20} /><line x1={30} y1={50} x2={70} y2={50} />
    <circle cx={50} cy={30} r={3} fill={W} stroke="none" /><circle cx={67} cy={60} r={3} fill={W} stroke="none" /><circle cx={33} cy={60} r={3} fill={W} stroke="none" />
  </g>
)
const gDistribution = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={50} cy={34} r={6} /><circle cx={32} cy={66} r={6} /><circle cx={50} cy={66} r={6} /><circle cx={68} cy={66} r={6} />
    <line x1={48} y1={40} x2={34} y2={60} /><line x1={50} y1={40} x2={50} y2={60} /><line x1={52} y1={40} x2={66} y2={60} />
  </g>
)
const gBus = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <line x1={24} y1={50} x2={76} y2={50} />
    <path d="M 38 50 V 36 M 33 41 L 38 36 L 43 41" />
    <path d="M 50 50 V 32 M 45 37 L 50 32 L 55 37" />
    <path d="M 62 50 V 36 M 57 41 L 62 36 L 67 41" />
    <path d="M 44 50 V 64 M 39 59 L 44 64 L 49 59" />
    <path d="M 58 50 V 64 M 53 59 L 58 64 L 63 59" />
  </g>
)
const gGrid = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <rect x={30} y={30} width={16} height={16} rx={2} /><rect x={54} y={30} width={16} height={16} rx={2} />
    <rect x={30} y={54} width={16} height={16} rx={2} /><rect x={54} y={54} width={16} height={16} rx={2} />
    <line x1={46} y1={38} x2={54} y2={38} /><line x1={38} y1={46} x2={38} y2={54} /><line x1={62} y1={46} x2={62} y2={54} /><line x1={46} y1={62} x2={54} y2={62} />
  </g>
)
const gId = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <circle cx={50} cy={42} r={9} />
    <path d="M 32 70 Q 32 56 50 56 Q 68 56 68 70" />
  </g>
)
const gKey = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={40} cy={42} r={9} /><line x1={46} y1={48} x2={68} y2={70} /><line x1={60} y1={62} x2={66} y2={56} /><line x1={64} y1={66} x2={70} y2={60} />
  </g>
)
const gGauge = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round">
    <path d="M 28 56 Q 28 38 50 38 Q 72 38 72 56" /><line x1={50} y1={56} x2={62} y2={46} /><circle cx={50} cy={56} r={3} fill={W} stroke="none" />
  </g>
)

function az(id: string, label: string, glyph: ReactNode, keywords: string[]): ShapeDef {
  return {
    id: `azure:${id}`,
    packId: 'azure',
    label,
    keywords: ['azure', 'microsoft', ...keywords],
    defaultSize: { w: 90, h: 90 },
    defaultStyle: { fill: AZ, borderColor: AZ },
    render: azTile(glyph),
    iconBounds: TILE,
  }
}

export const AZURE_PACK: Pack = {
  id: 'azure',
  label: 'Azure',
  description: 'Common Microsoft Azure services. Opt-in vendor pack — enable in the Library Manager.',
  defaultEnabled: false,
  shapes: [
    az('virtual-machines', 'Virtual Machines', gVm, ['vm', 'instance', 'compute']),
    az('functions', 'Functions', gFunc, ['serverless', 'function', 'faas']),
    az('aks', 'AKS', gK8s, ['kubernetes', 'k8s', 'container service']),
    az('container-instances', 'Container Instances', gContainer, ['container', 'aci', 'docker']),
    az('app-service', 'App Service', gApp, ['web app', 'paas', 'website']),
    az('blob-storage', 'Blob Storage', gBucket, ['storage', 'object', 'bucket', 'blob']),
    az('managed-disks', 'Managed Disks', gDisk, ['storage', 'disk', 'block', 'volume']),
    az('files', 'Files', gFile, ['storage', 'file', 'smb', 'share']),
    az('sql-database', 'SQL Database', cylinder, ['database', 'sql', 'relational']),
    az('cosmos-db', 'Cosmos DB', gCosmos, ['database', 'nosql', 'document', 'global']),
    az('synapse', 'Synapse Analytics', gWarehouse, ['analytics', 'data warehouse', 'olap']),
    az('virtual-network', 'Virtual Network', gHexLabel('VNet'), ['network', 'vnet', 'subnet']),
    az('front-door', 'Front Door / CDN', gGlobeEdges, ['cdn', 'edge', 'content delivery']),
    az('dns', 'Azure DNS', gHexLabel('DNS'), ['dns', 'domain', 'routing']),
    az('load-balancer', 'Load Balancer', gDistribution, ['load balancer', 'lb']),
    az('service-bus', 'Service Bus', gBus, ['messaging', 'queue', 'topic']),
    az('event-grid', 'Event Grid', gGrid, ['events', 'eventgrid', 'pubsub']),
    az('entra-id', 'Entra ID', gId, ['identity', 'active directory', 'aad', 'auth', 'sso']),
    az('key-vault', 'Key Vault', gKey, ['secrets', 'key', 'encryption', 'kms']),
    az('monitor', 'Azure Monitor', gGauge, ['observability', 'metrics', 'logs', 'app insights']),
  ],
}
