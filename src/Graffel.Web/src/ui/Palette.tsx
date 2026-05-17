import type { NodeType } from '../format/types'
import { useReactFlow } from '@xyflow/react'
import { useDiagramStore } from '../store/diagramStore'

interface PaletteItem {
  type: NodeType
  label: string
  swatch: string
}

const ARCHITECTURE: PaletteItem[] = [
  { type: 'service',  label: 'Service',  swatch: '#dcfce7' },
  { type: 'database', label: 'Database', swatch: '#fef3c7' },
  { type: 'queue',    label: 'Queue',    swatch: '#ede9fe' },
  { type: 'boundary', label: 'Boundary', swatch: 'rgba(96, 165, 250, 0.18)' },
]

const GENERIC: PaletteItem[] = [
  { type: 'rectangle', label: 'Rectangle', swatch: '#ffffff' },
  { type: 'ellipse',   label: 'Ellipse',   swatch: '#ffffff' },
  { type: 'diamond',   label: 'Diamond',   swatch: '#ffffff' },
  { type: 'text',      label: 'Text',      swatch: 'transparent' },
]

export function Palette() {
  const addNode = useDiagramStore((s) => s.addNode)
  const rf = useReactFlow()

  function spawnAtCenter(type: NodeType) {
    // Drop near current viewport center if no drag-drop happened.
    const { x, y, zoom } = rf.getViewport()
    const center = {
      x: (-x + window.innerWidth / 2 - 200) / zoom,
      y: (-y + window.innerHeight / 2) / zoom,
    }
    addNode(type, center)
  }

  return (
    <aside className="graffel-palette" data-testid="palette">
      <h3>Architecture</h3>
      {ARCHITECTURE.map((item) => (
        <PaletteButton key={item.type} item={item} onAdd={spawnAtCenter} />
      ))}
      <h3>Generic</h3>
      {GENERIC.map((item) => (
        <PaletteButton key={item.type} item={item} onAdd={spawnAtCenter} />
      ))}
    </aside>
  )
}

function PaletteButton({
  item,
  onAdd,
}: {
  item: PaletteItem
  onAdd: (t: NodeType) => void
}) {
  return (
    <button
      type="button"
      className="palette-item"
      draggable
      data-testid={`palette-${item.type}`}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/graffel-node-type', item.type)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => onAdd(item.type)}
    >
      <span className="palette-swatch" style={{ background: item.swatch }} />
      {item.label}
    </button>
  )
}
