import { ShapeSvg } from '../svg'
import type { Pack, ShapeRenderer } from '../types'

/**
 * Architecture · Core — the generic, vendor-neutral building blocks for system
 * architecture diagrams. Stylized 0–100 viewBox icons; brand-evocative colors
 * defaulted via defaultStyle.fill / borderColor.
 *
 * Convention: icons sized to fill the node bounds; ShapeNode overlays the label.
 * Each renderer reads { fill, borderColor } so the inspector's color pickers
 * still apply.
 */

const SW = 2.5 // standard stroke width

// ─── Service (rounded rect with a server-y badge) ────────────────────────────
const service: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={6} y={10} width={88} height={80} rx={10} ry={10}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={6} y1={30} x2={94} y2={30} stroke={borderColor} strokeWidth={SW * 0.7} />
    <circle cx={16} cy={20} r={2.5} fill={borderColor} />
    <circle cx={24} cy={20} r={2.5} fill={borderColor} />
    <circle cx={32} cy={20} r={2.5} fill={borderColor} />
  </ShapeSvg>
)

// ─── Database (cylinder) ──────────────────────────────────────────────────────
const database: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <path
      d="M 10 18 Q 10 6 50 6 Q 90 6 90 18 L 90 82 Q 90 94 50 94 Q 10 94 10 82 Z"
      fill={fill} stroke={borderColor} strokeWidth={SW}
    />
    <path
      d="M 10 18 Q 10 30 50 30 Q 90 30 90 18"
      fill="none" stroke={borderColor} strokeWidth={SW}
    />
    <path d="M 14 38 Q 14 46 50 46 Q 86 46 86 38" fill="none" stroke={borderColor} strokeWidth={SW * 0.6} opacity={0.6} />
    <path d="M 14 56 Q 14 64 50 64 Q 86 64 86 56" fill="none" stroke={borderColor} strokeWidth={SW * 0.6} opacity={0.6} />
  </ShapeSvg>
)

// ─── Queue (parallel pipes with messages) ────────────────────────────────────
const queue: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={6} y={32} width={88} height={36} rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={28} y1={32} x2={28} y2={68} stroke={borderColor} strokeWidth={SW * 0.8} />
    <line x1={50} y1={32} x2={50} y2={68} stroke={borderColor} strokeWidth={SW * 0.8} />
    <line x1={72} y1={32} x2={72} y2={68} stroke={borderColor} strokeWidth={SW * 0.8} />
    <polygon points="92,38 100,50 92,62" fill={borderColor} />
  </ShapeSvg>
)

// ─── Boundary (dashed container) ──────────────────────────────────────────────
const boundary: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="none">
    <rect x={SW / 2} y={SW / 2} width={100 - SW} height={100 - SW}
      rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW}
      strokeDasharray="6 4"
    />
  </ShapeSvg>
)

// ─── Server (tower with vents) ────────────────────────────────────────────────
const server: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={20} y={8} width={60} height={84} rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={20} y1={22} x2={80} y2={22} stroke={borderColor} strokeWidth={SW * 0.7} />
    <line x1={20} y1={44} x2={80} y2={44} stroke={borderColor} strokeWidth={SW * 0.7} />
    <line x1={20} y1={66} x2={80} y2={66} stroke={borderColor} strokeWidth={SW * 0.7} />
    <circle cx={70} cy={15} r={2.5} fill={borderColor} />
    <circle cx={70} cy={37} r={2.5} fill={borderColor} />
    <circle cx={70} cy={59} r={2.5} fill={borderColor} />
    <circle cx={70} cy={81} r={2.5} fill={borderColor} />
  </ShapeSvg>
)

// ─── Storage (stacked disks) ──────────────────────────────────────────────────
const storage: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <ellipse cx={50} cy={20} rx={36} ry={10}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <path d="M 14 20 L 14 50 Q 14 60 50 60 Q 86 60 86 50 L 86 20" fill={fill} stroke={borderColor} strokeWidth={SW} />
    <path d="M 14 50 Q 14 60 50 60 Q 86 60 86 50" fill="none" stroke={borderColor} strokeWidth={SW * 0.6} opacity={0.6} />
    <ellipse cx={50} cy={75} rx={28} ry={8}
      fill={fill} stroke={borderColor} strokeWidth={SW * 0.6} opacity={0.7} />
  </ShapeSvg>
)

// ─── Load Balancer (diamond with split arrows) ────────────────────────────────
const loadBalancer: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <polygon points="50,8 92,50 50,92 8,50"
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={28} y1={50} x2={72} y2={50} stroke={borderColor} strokeWidth={SW} />
    <polyline points="60,38 72,50 60,62" fill="none" stroke={borderColor} strokeWidth={SW} />
    <polyline points="40,38 28,50 40,62" fill="none" stroke={borderColor} strokeWidth={SW} />
  </ShapeSvg>
)

// ─── CDN (globe with edge nodes) ──────────────────────────────────────────────
const cdn: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <circle cx={50} cy={50} r={32} fill={fill} stroke={borderColor} strokeWidth={SW} />
    <ellipse cx={50} cy={50} rx={32} ry={12} fill="none" stroke={borderColor} strokeWidth={SW * 0.6} />
    <line x1={18} y1={50} x2={82} y2={50} stroke={borderColor} strokeWidth={SW * 0.6} />
    <line x1={50} y1={18} x2={50} y2={82} stroke={borderColor} strokeWidth={SW * 0.6} />
    <circle cx={50} cy={18} r={4} fill={borderColor} />
    <circle cx={82} cy={50} r={4} fill={borderColor} />
    <circle cx={50} cy={82} r={4} fill={borderColor} />
    <circle cx={18} cy={50} r={4} fill={borderColor} />
  </ShapeSvg>
)

// ─── Cache (lightning bolt over rect) ─────────────────────────────────────────
const cache: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={12} y={20} width={76} height={60} rx={6} ry={6}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <polygon points="55,28 38,52 50,52 45,72 62,48 50,48"
      fill={borderColor} opacity={0.85} />
  </ShapeSvg>
)

// ─── DNS (book/zone marker) ──────────────────────────────────────────────────
const dns: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={14} y={14} width={72} height={72} rx={6} ry={6}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <text x={50} y={60} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={24} fontWeight={700} fill={borderColor}>DNS</text>
  </ShapeSvg>
)

// ─── Function (transformation box with input/output arrows) ───────────────────
// Replaces the v3 lambda glyph (which nobody recognized as a function symbol).
// "ƒn" label inside a box, with arrows showing the transformation.
const fnShape: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={26} y={32} width={48} height={36} rx={6} ry={6}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <text x={50} y={56} textAnchor="middle" fontFamily="system-ui, sans-serif"
      fontSize={20} fontStyle="italic" fontWeight={600} fill={borderColor}>fn</text>
    <polyline points="12,50 24,50 20,46 M 24,50 20,54" fill="none" stroke={borderColor} strokeWidth={SW} strokeLinecap="round" />
    <polyline points="76,50 88,50 84,46 M 88,50 84,54" fill="none" stroke={borderColor} strokeWidth={SW} strokeLinecap="round" />
  </ShapeSvg>
)

// ─── API Gateway (gateway/arrows) ────────────────────────────────────────────
const apiGateway: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={20} y={20} width={60} height={60} rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={50} y1={20} x2={50} y2={80} stroke={borderColor} strokeWidth={SW * 0.6} />
    <line x1={20} y1={50} x2={80} y2={50} stroke={borderColor} strokeWidth={SW * 0.6} />
    <polyline points="6,50 18,50 14,46 M 18,50 14,54" fill="none" stroke={borderColor} strokeWidth={SW} />
    <polyline points="94,50 82,50 86,46 M 82,50 86,54" fill="none" stroke={borderColor} strokeWidth={SW} />
    <polyline points="50,6 50,18 46,14 M 50,18 54,14" fill="none" stroke={borderColor} strokeWidth={SW} />
    <polyline points="50,94 50,82 46,86 M 50,82 54,86" fill="none" stroke={borderColor} strokeWidth={SW} />
  </ShapeSvg>
)

// ─── Client / Browser (window with traffic light) ────────────────────────────
const client: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={8} y={18} width={84} height={68} rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={8} y1={32} x2={92} y2={32} stroke={borderColor} strokeWidth={SW * 0.7} />
    <circle cx={16} cy={25} r={2.5} fill={borderColor} />
    <circle cx={24} cy={25} r={2.5} fill={borderColor} />
    <circle cx={32} cy={25} r={2.5} fill={borderColor} />
    <rect x={14} y={40} width={72} height={6} rx={2} fill={borderColor} opacity={0.25} />
    <rect x={14} y={52} width={48} height={6} rx={2} fill={borderColor} opacity={0.25} />
    <rect x={14} y={64} width={56} height={6} rx={2} fill={borderColor} opacity={0.25} />
  </ShapeSvg>
)

// ─── Mobile (phone outline) ──────────────────────────────────────────────────
const mobile: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={30} y={6} width={40} height={88} rx={6} ry={6}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={30} y1={18} x2={70} y2={18} stroke={borderColor} strokeWidth={SW * 0.6} />
    <line x1={30} y1={82} x2={70} y2={82} stroke={borderColor} strokeWidth={SW * 0.6} />
    <circle cx={50} cy={88} r={2.5} fill={borderColor} />
    <rect x={44} y={11} width={12} height={2} rx={1} fill={borderColor} opacity={0.6} />
  </ShapeSvg>
)

// ─── IoT (chip / radio) ──────────────────────────────────────────────────────
const iot: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <rect x={26} y={26} width={48} height={48} rx={4} ry={4}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    {[10, 30, 50, 70, 90].map((y) => (
      <line key={`l-${y}`} x1={20} y1={y} x2={26} y2={y} stroke={borderColor} strokeWidth={SW} />
    ))}
    {[10, 30, 50, 70, 90].map((y) => (
      <line key={`r-${y}`} x1={74} y1={y} x2={80} y2={y} stroke={borderColor} strokeWidth={SW} />
    ))}
    {[10, 30, 50, 70, 90].map((x) => (
      <line key={`t-${x}`} x1={x} y1={20} x2={x} y2={26} stroke={borderColor} strokeWidth={SW} />
    ))}
    {[10, 30, 50, 70, 90].map((x) => (
      <line key={`b-${x}`} x1={x} y1={74} x2={x} y2={80} stroke={borderColor} strokeWidth={SW} />
    ))}
    <circle cx={50} cy={50} r={6} fill={borderColor} />
  </ShapeSvg>
)

// ─── External (cloud, no rain) ────────────────────────────────────────────────
// Centered cloud silhouette — the universal "external service / third party" icon.
const external: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    <path
      d="M 26 70 Q 12 70 12 56 Q 12 42 28 42 Q 30 28 48 28 Q 64 28 68 40 Q 88 40 88 58 Q 88 72 72 72 Z"
      fill={fill} stroke={borderColor} strokeWidth={SW}
    />
  </ShapeSvg>
)

// ─── Laptop (open laptop, side perspective) ──────────────────────────────────
const laptop: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    {/* Screen */}
    <rect x={20} y={20} width={60} height={42} rx={3} ry={3}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    <line x1={24} y1={26} x2={76} y2={26} stroke={borderColor} strokeWidth={SW * 0.5} opacity={0.6} />
    {/* Base / keyboard */}
    <polygon points="12,68 88,68 92,76 8,76"
      fill={fill} stroke={borderColor} strokeWidth={SW} strokeLinejoin="round" />
    <line x1={40} y1={72} x2={60} y2={72} stroke={borderColor} strokeWidth={SW * 0.7} />
  </ShapeSvg>
)

// ─── User (generic person / persona, for user flows) ─────────────────────────
const userShape: ShapeRenderer = ({ width, height, fill, borderColor }) => (
  <ShapeSvg width={width} height={height} preserve="xMidYMid meet">
    {/* Head */}
    <circle cx={50} cy={32} r={12}
      fill={fill} stroke={borderColor} strokeWidth={SW} />
    {/* Shoulders / body */}
    <path
      d="M 22 80 Q 22 52 50 52 Q 78 52 78 80"
      fill={fill} stroke={borderColor} strokeWidth={SW} strokeLinecap="round"
    />
  </ShapeSvg>
)

const ARCH = '#475569'  // base border color
const FILL_NEUTRAL = '#ffffff'
const FILL_SOFT_BLUE = '#dbeafe'
const FILL_SOFT_GREEN = '#dcfce7'
const FILL_SOFT_AMBER = '#fef3c7'
const FILL_SOFT_PURPLE = '#ede9fe'

export const ARCH_CORE_PACK: Pack = {
  id: 'arch-core',
  label: 'Architecture · Core',
  description: 'Vendor-neutral architecture primitives.',
  defaultEnabled: true,
  shapes: [
    { id: 'arch-core:service',       packId: 'arch-core', label: 'Service',       keywords: ['microservice', 'app'],     defaultSize: { w: 160, h: 110 }, defaultStyle: { fill: FILL_SOFT_GREEN,  borderColor: '#16a34a' }, render: service,      legacyTestId: 'service' },
    { id: 'arch-core:database',      packId: 'arch-core', label: 'Database',      keywords: ['db', 'storage', 'sql', 'postgres'], defaultSize: { w: 120, h: 130 }, defaultStyle: { fill: FILL_SOFT_AMBER,  borderColor: '#d97706' }, render: database,     legacyTestId: 'database',
      handlePositions: { top: { x: 50, y: 6 }, right: { x: 90, y: 50 }, bottom: { x: 50, y: 94 }, left: { x: 10, y: 50 } } },
    { id: 'arch-core:queue',         packId: 'arch-core', label: 'Queue',         keywords: ['message bus', 'mq', 'pubsub'], defaultSize: { w: 180, h: 80 }, defaultStyle: { fill: FILL_SOFT_PURPLE, borderColor: '#7c3aed' }, render: queue,        legacyTestId: 'queue',
      handlePositions: { top: { x: 50, y: 32 }, right: { x: 94, y: 50 }, bottom: { x: 50, y: 68 }, left: { x: 6, y: 50 } } },
    { id: 'arch-core:boundary',      packId: 'arch-core', label: 'Boundary',      keywords: ['group', 'container', 'context'], defaultSize: { w: 320, h: 200 }, defaultStyle: { fill: 'rgba(96,165,250,0.08)', borderColor: '#60a5fa' }, render: boundary,     legacyTestId: 'boundary',
      fit: 'fill', defaultLabelPosition: 'top', isContainer: true },
    { id: 'arch-core:server',        packId: 'arch-core', label: 'Server',        keywords: ['machine', 'host', 'vm'],    defaultSize: { w: 110, h: 140 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: server,
      handlePositions: { top: { x: 50, y: 8 }, right: { x: 80, y: 50 }, bottom: { x: 50, y: 92 }, left: { x: 20, y: 50 } } },
    { id: 'arch-core:storage',       packId: 'arch-core', label: 'Storage',       keywords: ['blob', 'object store'],     defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: storage,
      handlePositions: { top: { x: 50, y: 10 }, right: { x: 86, y: 40 }, bottom: { x: 50, y: 83 }, left: { x: 14, y: 40 } } },
    { id: 'arch-core:load-balancer', packId: 'arch-core', label: 'Load Balancer', keywords: ['lb', 'proxy', 'router'],    defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: '#0ea5e9' }, render: loadBalancer,
      handlePositions: { top: { x: 50, y: 8 }, right: { x: 92, y: 50 }, bottom: { x: 50, y: 92 }, left: { x: 8, y: 50 } } },
    { id: 'arch-core:cdn',           packId: 'arch-core', label: 'CDN',           keywords: ['edge', 'cloudfront'],       defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: '#0891b2' }, render: cdn,
      handlePositions: { top: { x: 50, y: 18 }, right: { x: 82, y: 50 }, bottom: { x: 50, y: 82 }, left: { x: 18, y: 50 } } },
    { id: 'arch-core:cache',         packId: 'arch-core', label: 'Cache',         keywords: ['redis', 'memcached'],       defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL_SOFT_AMBER,  borderColor: '#dc2626' }, render: cache },
    { id: 'arch-core:dns',           packId: 'arch-core', label: 'DNS',           keywords: ['resolver', 'route 53'],     defaultSize: { w: 120, h: 120 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: dns },
    { id: 'arch-core:function',      packId: 'arch-core', label: 'Function',      keywords: ['lambda', 'serverless'],     defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: '#f97316' }, render: fnShape,
      handlePositions: { top: { x: 50, y: 32 }, right: { x: 88, y: 50 }, bottom: { x: 50, y: 68 }, left: { x: 12, y: 50 } } },
    { id: 'arch-core:api-gateway',   packId: 'arch-core', label: 'API Gateway',   keywords: ['gateway', 'ingress'],       defaultSize: { w: 130, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: '#7c3aed' }, render: apiGateway },
    { id: 'arch-core:client',        packId: 'arch-core', label: 'Browser',       keywords: ['client', 'web', 'window'],  defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: client },
    { id: 'arch-core:laptop',        packId: 'arch-core', label: 'Laptop',        keywords: ['computer', 'desktop', 'pc', 'workstation'], defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: laptop,
      handlePositions: { top: { x: 50, y: 20 }, right: { x: 80, y: 40 }, bottom: { x: 50, y: 76 }, left: { x: 20, y: 40 } } },
    { id: 'arch-core:mobile',        packId: 'arch-core', label: 'Mobile',        keywords: ['phone', 'ios', 'android', 'tablet'],  defaultSize: { w: 80, h: 130 },  defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: mobile,
      iconBounds: { x: 30, y: 6, w: 40, h: 88 } },
    { id: 'arch-core:iot',           packId: 'arch-core', label: 'IoT Device',    keywords: ['sensor', 'device', 'chip'], defaultSize: { w: 120, h: 120 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: '#0891b2' }, render: iot,
      handlePositions: { top: { x: 50, y: 20 }, right: { x: 80, y: 50 }, bottom: { x: 50, y: 80 }, left: { x: 20, y: 50 } } },
    { id: 'arch-core:user',          packId: 'arch-core', label: 'User',          keywords: ['person', 'persona', 'actor', 'human'], defaultSize: { w: 100, h: 130 }, defaultStyle: { fill: FILL_NEUTRAL,     borderColor: ARCH },     render: userShape,
      handlePositions: { top: { x: 50, y: 20 }, right: { x: 78, y: 72 }, bottom: { x: 50, y: 80 }, left: { x: 22, y: 72 } } },
    { id: 'arch-core:external',      packId: 'arch-core', label: 'External',      keywords: ['third-party', 'cloud', 'saas'], defaultSize: { w: 150, h: 110 }, defaultStyle: { fill: FILL_SOFT_BLUE,   borderColor: '#3b82f6' }, render: external,
      handlePositions: { top: { x: 50, y: 28 }, right: { x: 88, y: 56 }, bottom: { x: 50, y: 72 }, left: { x: 12, y: 56 } } },
  ],
}
