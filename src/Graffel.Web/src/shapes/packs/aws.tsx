import type { ReactNode } from 'react'
import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * AWS pack — stylized icons inspired by the AWS service shape language.
 * Each icon is a soft-orange rounded square with a darker-orange pictogram.
 * Not the official AWS Architecture Icons (see ADR-0010 license stance).
 */

const AWS_ORANGE = '#F18B00'         // service border + pictogram
const AWS_ORANGE_DARK = '#C2570A'
const SW = 2.5
const FRAME_RX = 12

// Wrap each icon in the standard AWS frame.
function AwsFrame({ children, fill, borderColor }: { children: ReactNode; fill: string; borderColor: string }) {
  return (
    <>
      <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW} rx={FRAME_RX} ry={FRAME_RX}
        fill={fill} stroke={borderColor} strokeWidth={SW} />
      {children}
    </>
  )
}

function aws(pictogram: (color: string) => ReactNode): ShapeRenderer {
  return ({ width, height, fill, borderColor }) => (
    <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
      <AwsFrame fill={fill} borderColor={borderColor}>
        {pictogram(borderColor)}
      </AwsFrame>
    </ShapeSvg>
  )
}

// ─── Pictograms ──────────────────────────────────────────────────────────────
// EC2 — rounded square with corner "step"
const pictoEc2 = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={28} width={44} height={44} rx={4} />
    <line x1={28} y1={38} x2={72} y2={38} />
    <polyline points="78,32 84,32 84,28" />
    <polyline points="78,68 84,68 84,72" />
  </g>
)

// Lambda — λ glyph
const pictoLambda = (c: string) => (
  <path d="M 32 30 Q 40 30 44 38 L 60 72 M 44 38 L 32 72 M 36 64 L 60 64"
    fill="none" stroke={c} strokeWidth={SW * 1.4} strokeLinecap="round" />
)

// S3 — bucket with handle
const pictoS3 = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 28 38 L 32 78 Q 32 80 34 80 L 66 80 Q 68 80 68 78 L 72 38 Z" />
    <line x1={28} y1={38} x2={72} y2={38} />
    <circle cx={50} cy={32} r={4} />
  </g>
)

// RDS — cylinder with "DB"
const pictoRds = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={28} rx={20} ry={6} />
    <path d="M 30 28 L 30 72 Q 30 78 50 78 Q 70 78 70 72 L 70 28" />
    <path d="M 30 50 Q 30 56 50 56 Q 70 56 70 50" />
  </g>
)

// DynamoDB — stacked cylinder
const pictoDynamo = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <ellipse cx={50} cy={28} rx={22} ry={6} />
    <ellipse cx={50} cy={50} rx={22} ry={6} />
    <ellipse cx={50} cy={72} rx={22} ry={6} />
    <line x1={28} y1={28} x2={28} y2={72} />
    <line x1={72} y1={28} x2={72} y2={72} />
  </g>
)

// API Gateway — gateway with arrows
const pictoApiGw = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={32} y={32} width={36} height={36} rx={4} />
    <line x1={50} y1={32} x2={50} y2={68} />
    <line x1={32} y1={50} x2={68} y2={50} />
    <polyline points="18,50 30,50 26,46 M 30,50 26,54" />
    <polyline points="82,50 70,50 74,46 M 70,50 74,54" />
  </g>
)

// SQS — parallel pipes (queue)
const pictoSqs = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={42} width={48} height={18} rx={3} />
    <line x1={42} y1={42} x2={42} y2={60} />
    <line x1={58} y1={42} x2={58} y2={60} />
    <polyline points="78,46 84,51 78,56" />
  </g>
)

// SNS — fanout (bell + arrows)
const pictoSns = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={32} r={6} />
    <line x1={50} y1={38} x2={50} y2={50} />
    <line x1={50} y1={50} x2={30} y2={70} />
    <line x1={50} y1={50} x2={50} y2={70} />
    <line x1={50} y1={50} x2={70} y2={70} />
    <circle cx={30} cy={72} r={3} fill={c} />
    <circle cx={50} cy={72} r={3} fill={c} />
    <circle cx={70} cy={72} r={3} fill={c} />
  </g>
)

// CloudFront — globe
const pictoCloudFront = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={50} r={22} />
    <ellipse cx={50} cy={50} rx={22} ry={8} />
    <line x1={28} y1={50} x2={72} y2={50} />
    <line x1={50} y1={28} x2={50} y2={72} />
  </g>
)

// Route 53 — DNS tag
const pictoRoute53 = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="26,38 60,38 74,52 60,66 26,66" />
    <circle cx={64} cy={52} r={2.5} fill={c} />
  </g>
)

// IAM — shield + check
const pictoIam = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 50 24 L 70 30 L 70 50 Q 70 68 50 76 Q 30 68 30 50 L 30 30 Z" />
    <polyline points="40,50 48,58 60,42" strokeLinecap="round" strokeLinejoin="round" />
  </g>
)

// VPC — dashed container
const pictoVpc = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={28} width={48} height={44} rx={4} strokeDasharray="4 3" />
    <rect x={38} y={42} width={10} height={10} />
    <rect x={52} y={42} width={10} height={10} />
    <rect x={38} y={56} width={24} height={6} />
  </g>
)

// ECS — stacked containers
const pictoEcs = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={26} width={44} height={14} />
    <rect x={28} y={44} width={44} height={14} />
    <rect x={28} y={62} width={44} height={14} />
    <circle cx={36} cy={33} r={1.5} fill={c} />
    <circle cx={36} cy={51} r={1.5} fill={c} />
    <circle cx={36} cy={69} r={1.5} fill={c} />
  </g>
)

// EKS — hexagonal cluster (Kubernetes-ish)
const pictoEks = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,22 72,34 72,58 50,70 28,58 28,34" />
    <polygon points="50,38 60,44 60,54 50,60 40,54 40,44" />
  </g>
)

// Fargate — container outline
const pictoFargate = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={28} y={32} width={44} height={36} rx={3} />
    <line x1={28} y1={42} x2={72} y2={42} />
    <line x1={36} y1={50} x2={64} y2={50} />
    <line x1={36} y1={58} x2={54} y2={58} />
  </g>
)

// CloudWatch — eye
const pictoCloudWatch = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <path d="M 22 50 Q 50 28 78 50 Q 50 72 22 50 Z" />
    <circle cx={50} cy={50} r={8} />
    <circle cx={50} cy={50} r={3} fill={c} />
  </g>
)

// ELB — triangle splitting
const pictoElb = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <polygon points="50,22 78,76 22,76" />
    <line x1={50} y1={38} x2={50} y2={76} />
    <line x1={36} y1={64} x2={64} y2={64} />
  </g>
)

// Cognito — person + lock
const pictoCognito = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={50} cy={36} r={8} />
    <path d="M 30 72 Q 30 52 50 52 Q 70 52 70 72" />
  </g>
)

// Step Functions — workflow nodes
const pictoStepFn = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <rect x={26} y={26} width={18} height={14} rx={2} />
    <rect x={56} y={46} width={18} height={14} rx={2} />
    <rect x={26} y={66} width={18} height={14} rx={2} />
    <polyline points="44,33 50,33 50,53 56,53" />
    <polyline points="74,53 80,53 80,73 44,73" />
  </g>
)

// EventBridge — branching arrow
const pictoEventBridge = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={32} cy={50} r={6} />
    <line x1={38} y1={50} x2={50} y2={50} />
    <polyline points="50,50 62,36 70,36" />
    <polyline points="50,50 62,50 70,50" />
    <polyline points="50,50 62,64 70,64" />
    <polyline points="66,32 70,36 66,40" />
    <polyline points="66,46 70,50 66,54" />
    <polyline points="66,60 70,64 66,68" />
  </g>
)

// SecretsManager — key
const pictoSecrets = (c: string) => (
  <g fill="none" stroke={c} strokeWidth={SW}>
    <circle cx={36} cy={44} r={10} />
    <line x1={45} y1={44} x2={74} y2={44} />
    <line x1={66} y1={44} x2={66} y2={56} />
    <line x1={74} y1={44} x2={74} y2={52} />
  </g>
)

const PACK_FILL = '#FFF7ED'         // very soft orange tint for the frame fill

export const AWS_PACK: Pack = {
  id: 'aws',
  label: 'AWS',
  description: 'Stylized icons inspired by the AWS shape language.',
  defaultEnabled: true,
  shapes: [
    { id: 'aws:ec2',           packId: 'aws', label: 'EC2',            keywords: ['compute', 'server', 'instance'],           defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoEc2) },
    { id: 'aws:lambda',        packId: 'aws', label: 'Lambda',         keywords: ['function', 'serverless'],                  defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoLambda) },
    { id: 'aws:s3',            packId: 'aws', label: 'S3',             keywords: ['storage', 'bucket', 'object'],             defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoS3) },
    { id: 'aws:rds',           packId: 'aws', label: 'RDS',            keywords: ['database', 'sql', 'postgres', 'mysql'],    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoRds) },
    { id: 'aws:dynamodb',      packId: 'aws', label: 'DynamoDB',       keywords: ['database', 'nosql'],                       defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoDynamo) },
    { id: 'aws:api-gateway',   packId: 'aws', label: 'API Gateway',    keywords: ['api', 'gateway', 'http'],                  defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoApiGw) },
    { id: 'aws:sqs',           packId: 'aws', label: 'SQS',            keywords: ['queue', 'message'],                        defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoSqs) },
    { id: 'aws:sns',           packId: 'aws', label: 'SNS',            keywords: ['notification', 'pubsub', 'fanout'],        defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoSns) },
    { id: 'aws:cloudfront',    packId: 'aws', label: 'CloudFront',     keywords: ['cdn', 'edge', 'cache'],                    defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoCloudFront) },
    { id: 'aws:route53',       packId: 'aws', label: 'Route 53',       keywords: ['dns', 'routing'],                          defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoRoute53) },
    { id: 'aws:iam',           packId: 'aws', label: 'IAM',            keywords: ['auth', 'identity', 'security'],            defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE_DARK }, render: aws(pictoIam) },
    { id: 'aws:vpc',           packId: 'aws', label: 'VPC',            keywords: ['network', 'private'],                      defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoVpc) },
    { id: 'aws:ecs',           packId: 'aws', label: 'ECS',            keywords: ['container', 'docker'],                     defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoEcs) },
    { id: 'aws:eks',           packId: 'aws', label: 'EKS',            keywords: ['kubernetes', 'k8s', 'cluster'],            defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoEks) },
    { id: 'aws:fargate',       packId: 'aws', label: 'Fargate',        keywords: ['container', 'serverless'],                 defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoFargate) },
    { id: 'aws:cloudwatch',    packId: 'aws', label: 'CloudWatch',     keywords: ['monitoring', 'observability', 'logs'],     defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoCloudWatch) },
    { id: 'aws:elb',           packId: 'aws', label: 'ELB',            keywords: ['load balancer', 'alb', 'nlb'],             defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoElb) },
    { id: 'aws:cognito',       packId: 'aws', label: 'Cognito',        keywords: ['auth', 'user', 'identity'],                defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE_DARK }, render: aws(pictoCognito) },
    { id: 'aws:step-functions',packId: 'aws', label: 'Step Functions', keywords: ['workflow', 'orchestration', 'state machine'], defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoStepFn) },
    { id: 'aws:eventbridge',   packId: 'aws', label: 'EventBridge',    keywords: ['events', 'bus'],                           defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE }, render: aws(pictoEventBridge) },
    { id: 'aws:secrets-manager', packId: 'aws', label: 'Secrets Manager', keywords: ['secrets', 'kms', 'credentials'],       defaultSize: { w: 110, h: 110 }, defaultStyle: { fill: PACK_FILL, borderColor: AWS_ORANGE_DARK }, render: aws(pictoSecrets) },
  ],
}
