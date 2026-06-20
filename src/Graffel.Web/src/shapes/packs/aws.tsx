import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeDef, ShapeRenderer } from '../types'

/**
 * AWS pack — the common Amazon Web Services building blocks, drawn in AWS's
 * category-colored tile idiom (a rounded square in the service's category color
 * with a white glyph). Recognizable approximations, not the official trademarked
 * marks. Category colors follow the 2023 AWS Architecture Icon palette.
 *
 * The tile fill is the (recolorable) node fill, so users can recolor a tile while
 * the glyph stays white. Anchors sit on the tile edge via the shared iconBounds.
 */

const COMPUTE = '#ED7100'   // orange
const STORAGE = '#7AA116'   // green
const DATABASE = '#2E27AD'  // blue-violet
const NET = '#8C4FFF'       // purple
const INTEGRATION = '#E7157B' // pink
const SECURITY = '#DD344C'  // red
const MGMT = '#C7237B'      // magenta

/** Every tile shares these silhouette bounds so connectors meet the tile edge. */
const TILE = { x: 6, y: 6, w: 88, h: 88 }

/** A rounded category-colored tile with a white glyph drawn into the 0–100 box. */
function awsTile(glyph: ReactNode): ShapeRenderer {
  return ({ width, height, fill }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <rect x={6} y={6} width={88} height={88} rx={12} fill={fill} />
      {glyph}
    </ShapeSvg>
  )
}

const W = '#ffffff'
const SW = 4

// ── Compute ──────────────────────────────────────────────────────────────────
const gEc2 = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={34} y={34} width={32} height={32} rx={2} />
    <rect x={43} y={43} width={14} height={14} fill={W} stroke="none" />
    <line x1={42} y1={28} x2={42} y2={34} /><line x1={50} y1={28} x2={50} y2={34} /><line x1={58} y1={28} x2={58} y2={34} />
    <line x1={42} y1={66} x2={42} y2={72} /><line x1={50} y1={66} x2={50} y2={72} /><line x1={58} y1={66} x2={58} y2={72} />
    <line x1={28} y1={42} x2={34} y2={42} /><line x1={28} y1={50} x2={34} y2={50} /><line x1={28} y1={58} x2={34} y2={58} />
    <line x1={66} y1={42} x2={72} y2={42} /><line x1={66} y1={50} x2={72} y2={50} /><line x1={66} y1={58} x2={72} y2={58} />
  </g>
)
const gLambda = (
  <text x={50} y={70} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={54} fontWeight={700} fill={W}>λ</text>
)
const gEcs = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={30} y={40} width={40} height={24} rx={2} />
    <line x1={40} y1={40} x2={40} y2={64} /><line x1={50} y1={40} x2={50} y2={64} /><line x1={60} y1={40} x2={60} y2={64} />
    <line x1={25} y1={40} x2={30} y2={40} /><line x1={25} y1={64} x2={30} y2={64} />
    <line x1={70} y1={40} x2={75} y2={40} /><line x1={70} y1={64} x2={75} y2={64} />
  </g>
)
const gEks = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,28 68,37 72,56 60,71 40,71 28,56 32,37" />
    <circle cx={50} cy={52} r={4} fill={W} stroke="none" />
    <line x1={50} y1={38} x2={50} y2={48} /><line x1={50} y1={56} x2={41} y2={64} /><line x1={50} y1={56} x2={59} y2={64} />
  </g>
)
const gFargate = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={30} y={38} width={40} height={28} rx={3} strokeDasharray="6 4" />
    <path d="M 52 44 L 44 56 L 50 56 L 47 64 L 58 50 L 52 50 Z" fill={W} stroke="none" />
  </g>
)

// ── Storage ──────────────────────────────────────────────────────────────────
const gS3 = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 32 34 L 36 70 Q 36 73 39 73 L 61 73 Q 64 73 64 70 L 68 34 Z" />
    <ellipse cx={50} cy={34} rx={18} ry={4.5} />
  </g>
)
const gEbs = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <rect x={30} y={34} width={40} height={32} rx={3} />
    <circle cx={50} cy={50} r={9} />
    <circle cx={50} cy={50} r={2.5} fill={W} stroke="none" />
    <line x1={60} y1={40} x2={64} y2={40} strokeLinecap="round" />
  </g>
)
const gEfs = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <path d="M 34 32 H 56 L 64 40 V 70 H 34 Z" />
    <path d="M 56 32 V 40 H 64" />
    <line x1={41} y1={50} x2={57} y2={50} /><line x1={41} y1={58} x2={57} y2={58} />
  </g>
)

// ── Database ─────────────────────────────────────────────────────────────────
const dbCylinder = (
  <>
    <ellipse cx={50} cy={36} rx={18} ry={5} />
    <path d="M 32 36 V 64 Q 32 69 50 69 Q 68 69 68 64 V 36" />
    <path d="M 32 50 Q 32 55 50 55 Q 68 55 68 50" />
  </>
)
const gRds = (<g fill="none" stroke={W} strokeWidth={SW}>{dbCylinder}</g>)
const gDynamo = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    {dbCylinder}
    <path d="M 53 39 L 45 53 L 51 53 L 48 62 L 58 47 L 52 47 Z" fill={W} stroke="none" />
  </g>
)
const gAurora = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    {dbCylinder}
    <circle cx={50} cy={51} r={21} strokeDasharray="3 4" opacity={0.85} />
  </g>
)
const gElastiCache = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    {dbCylinder}
    <path d="M 54 38 L 44 54 L 50 54 L 47 66 L 60 48 L 53 48 Z" fill={W} stroke="none" />
  </g>
)
const gRedshift = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <path d="M 50 30 L 70 40 V 60 L 50 70 L 30 60 V 40 Z" />
    <path d="M 30 40 L 50 50 L 70 40" />
    <line x1={50} y1={50} x2={50} y2={70} />
  </g>
)

// ── Networking & Content Delivery ────────────────────────────────────────────
const gVpc = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <polygon points="50,26 70,37 70,61 50,72 30,61 30,37" />
    <text x={50} y={55} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={13} fontWeight={700} fill={W} letterSpacing="0.5">VPC</text>
  </g>
)
const gCloudFront = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <circle cx={50} cy={50} r={20} />
    <ellipse cx={50} cy={50} rx={8} ry={20} />
    <line x1={30} y1={50} x2={70} y2={50} />
    <circle cx={50} cy={30} r={3} fill={W} stroke="none" /><circle cx={67} cy={60} r={3} fill={W} stroke="none" /><circle cx={33} cy={60} r={3} fill={W} stroke="none" />
  </g>
)
const gRoute53 = (
  <g fill="none" stroke={W} strokeWidth={SW}>
    <circle cx={50} cy={49} r={20} />
    <text x={50} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={19} fontWeight={700} fill={W}>53</text>
  </g>
)
const gElb = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={50} cy={34} r={6} /><circle cx={32} cy={66} r={6} /><circle cx={50} cy={66} r={6} /><circle cx={68} cy={66} r={6} />
    <line x1={48} y1={40} x2={34} y2={60} /><line x1={50} y1={40} x2={50} y2={60} /><line x1={52} y1={40} x2={66} y2={60} />
  </g>
)
const gApiGw = (
  <text x={50} y={66} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={42} fontWeight={700} fill={W}>{'{ }'}</text>
)

// ── Application Integration ──────────────────────────────────────────────────
const gSqs = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
    <rect x={30} y={40} width={40} height={20} rx={3} />
    <line x1={25} y1={44} x2={25} y2={56} /><line x1={75} y1={44} x2={75} y2={56} />
    <line x1={37} y1={50} x2={63} y2={50} /><path d="M 57 45 L 63 50 L 57 55" />
  </g>
)
const gSns = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round">
    <circle cx={48} cy={50} r={7} fill={W} stroke="none" />
    <path d="M 60 39 Q 68 50 60 61" /><path d="M 67 33 Q 79 50 67 67" />
    <path d="M 38 39 Q 30 50 38 61" /><path d="M 31 33 Q 19 50 31 67" />
  </g>
)
const gEventBridge = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <line x1={24} y1={50} x2={76} y2={50} />
    <path d="M 38 50 V 36 M 33 41 L 38 36 L 43 41" />
    <path d="M 50 50 V 32 M 45 37 L 50 32 L 55 37" />
    <path d="M 62 50 V 36 M 57 41 L 62 36 L 67 41" />
    <path d="M 44 50 V 64 M 39 59 L 44 64 L 49 59" />
    <path d="M 58 50 V 64 M 53 59 L 58 64 L 63 59" />
  </g>
)

// ── Security / Management ────────────────────────────────────────────────────
const gIam = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinejoin="round">
    <rect x={36} y={46} width={28} height={22} rx={3} />
    <path d="M 41 46 V 40 Q 41 31 50 31 Q 59 31 59 40 V 46" />
    <circle cx={50} cy={55} r={3} fill={W} stroke="none" />
    <line x1={50} y1={57} x2={50} y2={62} strokeLinecap="round" />
  </g>
)
const gKms = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={40} cy={42} r={9} />
    <line x1={46} y1={48} x2={68} y2={70} />
    <line x1={60} y1={62} x2={66} y2={56} />
    <line x1={64} y1={66} x2={70} y2={60} />
  </g>
)
const gCloudWatch = (
  <g fill="none" stroke={W} strokeWidth={SW} strokeLinecap="round">
    <path d="M 28 56 Q 28 38 50 38 Q 72 38 72 56" />
    <line x1={50} y1={56} x2={62} y2={46} />
    <circle cx={50} cy={56} r={3} fill={W} stroke="none" />
  </g>
)

function aws(id: string, label: string, color: string, glyph: ReactNode, keywords: string[]): ShapeDef {
  return {
    id: `aws:${id}`,
    packId: 'aws',
    label,
    keywords: ['aws', 'amazon', ...keywords],
    defaultSize: { w: 90, h: 90 },
    defaultStyle: { fill: color, borderColor: color },
    render: awsTile(glyph),
    iconBounds: TILE,
  }
}

export const AWS_PACK: Pack = {
  id: 'aws',
  label: 'AWS',
  description: 'Common Amazon Web Services, in AWS category colors. Opt-in vendor pack — enable in the Library Manager.',
  // Opt-in per ADR-0010's vendor-pack off-ramp: ships disabled so the default
  // palette stays vendor-neutral; users turn it on in the Library Manager.
  defaultEnabled: false,
  shapes: [
    aws('ec2', 'EC2', COMPUTE, gEc2, ['compute', 'instance', 'server', 'vm']),
    aws('lambda', 'Lambda', COMPUTE, gLambda, ['serverless', 'function', 'faas']),
    aws('ecs', 'ECS', COMPUTE, gEcs, ['container', 'docker', 'elastic container service']),
    aws('eks', 'EKS', COMPUTE, gEks, ['kubernetes', 'k8s', 'container']),
    aws('fargate', 'Fargate', COMPUTE, gFargate, ['serverless', 'container', 'compute']),
    aws('s3', 'S3', STORAGE, gS3, ['storage', 'bucket', 'object', 'blob']),
    aws('ebs', 'EBS', STORAGE, gEbs, ['storage', 'block', 'disk', 'volume']),
    aws('efs', 'EFS', STORAGE, gEfs, ['storage', 'file', 'nfs', 'shared']),
    aws('rds', 'RDS', DATABASE, gRds, ['database', 'sql', 'postgres', 'mysql', 'relational']),
    aws('dynamodb', 'DynamoDB', DATABASE, gDynamo, ['database', 'nosql', 'key-value', 'document']),
    aws('aurora', 'Aurora', DATABASE, gAurora, ['database', 'sql', 'relational', 'managed']),
    aws('elasticache', 'ElastiCache', DATABASE, gElastiCache, ['cache', 'redis', 'memcached', 'in-memory']),
    aws('redshift', 'Redshift', DATABASE, gRedshift, ['data warehouse', 'analytics', 'olap']),
    aws('vpc', 'VPC', NET, gVpc, ['network', 'virtual private cloud', 'subnet']),
    aws('cloudfront', 'CloudFront', NET, gCloudFront, ['cdn', 'edge', 'content delivery']),
    aws('route53', 'Route 53', NET, gRoute53, ['dns', 'domain', 'routing']),
    aws('elb', 'Elastic Load Balancing', NET, gElb, ['load balancer', 'alb', 'nlb', 'elb']),
    aws('api-gateway', 'API Gateway', NET, gApiGw, ['api', 'rest', 'http', 'gateway']),
    aws('sqs', 'SQS', INTEGRATION, gSqs, ['queue', 'message', 'fifo']),
    aws('sns', 'SNS', INTEGRATION, gSns, ['notification', 'pubsub', 'topic', 'broadcast']),
    aws('eventbridge', 'EventBridge', INTEGRATION, gEventBridge, ['events', 'bus', 'eventbus']),
    aws('iam', 'IAM', SECURITY, gIam, ['identity', 'access', 'permissions', 'roles', 'auth']),
    aws('kms', 'KMS', SECURITY, gKms, ['encryption', 'key', 'secrets', 'crypto']),
    aws('cloudwatch', 'CloudWatch', MGMT, gCloudWatch, ['monitoring', 'metrics', 'logs', 'observability']),
  ],
}
