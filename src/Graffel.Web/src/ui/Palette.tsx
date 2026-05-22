import { useMemo, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDiagramStore } from '../store/diagramStore'
import {
  PACKS,
  searchShapes,
  useLibraryPrefs,
} from '../shapes/registry'
import type { ShapeDef } from '../shapes/types'
import { LibraryManager } from './LibraryManager'

const PREVIEW_SIZE = 36

export function Palette() {
  const addNode = useDiagramStore((s) => s.addNode)
  const rf = useReactFlow()
  const isEnabled = useLibraryPrefs((s) => s.isEnabled)
  const [query, setQuery] = useState('')
  const [collapsedPacks, setCollapsedPacks] = useState<Set<string>>(() => new Set())
  const [libManagerOpen, setLibManagerOpen] = useState(false)

  const visiblePacks = useMemo(
    () => PACKS.filter((p) => isEnabled(p.id)),
    // re-evaluate when prefs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [PACKS, useLibraryPrefs((s) => s.disabledPacks)],
  )

  const trimmedQuery = query.trim()
  const searchResults = useMemo(
    () => (trimmedQuery ? searchShapes(trimmedQuery).filter((sh) => isEnabled(sh.packId)) : null),
    [trimmedQuery, isEnabled],
  )

  function spawnAtCenter(shape: ShapeDef) {
    const { x, y, zoom } = rf.getViewport()
    const center = {
      x: (-x + window.innerWidth / 2 - 200) / zoom - shape.defaultSize.w / 2,
      y: (-y + window.innerHeight / 2) / zoom - shape.defaultSize.h / 2,
    }
    addNode(shape.id, center)
  }

  function toggleCollapsed(packId: string) {
    setCollapsedPacks((prev) => {
      const next = new Set(prev)
      if (next.has(packId)) next.delete(packId)
      else next.add(packId)
      return next
    })
  }

  return (
    <aside className="graffel-palette" data-testid="palette">
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search shapes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="palette-search"
          aria-label="Search shapes"
        />
      </div>

      <div className="palette-scroll">
        {searchResults ? (
          <PaletteSection
            title={`Results (${searchResults.length})`}
            shapes={searchResults}
            collapsed={false}
            onToggle={() => {}}
            onShapeClick={spawnAtCenter}
            packId="search-results"
            interactiveHeader={false}
          />
        ) : (
          visiblePacks.map((pack) => (
            <PaletteSection
              key={pack.id}
              title={pack.label}
              shapes={pack.shapes}
              collapsed={collapsedPacks.has(pack.id)}
              onToggle={() => toggleCollapsed(pack.id)}
              onShapeClick={spawnAtCenter}
              packId={pack.id}
            />
          ))
        )}
      </div>

      <div className="palette-footer">
        <button
          type="button"
          className="palette-libraries-btn"
          onClick={() => setLibManagerOpen(true)}
          data-testid="palette-manage-libraries"
        >
          ⚙ Manage libraries
        </button>
      </div>

      {libManagerOpen && <LibraryManager onClose={() => setLibManagerOpen(false)} />}
    </aside>
  )
}

function PaletteSection({
  title,
  shapes,
  collapsed,
  onToggle,
  onShapeClick,
  packId,
  interactiveHeader = true,
}: {
  title: string
  shapes: readonly ShapeDef[]
  collapsed: boolean
  onToggle: () => void
  onShapeClick: (shape: ShapeDef) => void
  packId: string
  interactiveHeader?: boolean
}) {
  return (
    <section className="palette-section" data-testid={`palette-section-${packId}`}>
      <button
        type="button"
        className={`palette-section-header${collapsed ? ' is-collapsed' : ''}`}
        onClick={interactiveHeader ? onToggle : undefined}
        aria-expanded={!collapsed}
        data-testid={`palette-section-toggle-${packId}`}
        disabled={!interactiveHeader}
      >
        {interactiveHeader && <span className="palette-caret">{collapsed ? '▸' : '▾'}</span>}
        <span className="palette-section-title">{title}</span>
      </button>
      {!collapsed && (
        <div className="palette-grid">
          {shapes.map((shape) => (
            <PaletteShape key={shape.id} shape={shape} onClick={() => onShapeClick(shape)} />
          ))}
        </div>
      )}
    </section>
  )
}

function PaletteShape({ shape, onClick }: { shape: ShapeDef; onClick: () => void }) {
  const fill = (shape.defaultStyle?.fill as string | undefined) ?? '#ffffff'
  const borderColor = (shape.defaultStyle?.borderColor as string | undefined) ?? '#94a3b8'
  const textColor = (shape.defaultStyle?.textColor as string | undefined) ?? '#1f2330'
  // Prefer the legacy short test id when one is defined (v1 shapes). New shapes
  // get the pack-qualified form. This keeps existing E2E selectors working.
  const testId = shape.legacyTestId
    ? `palette-${shape.legacyTestId}`
    : `palette-shape-${shape.id.replace(/[:]/g, '-')}`
  return (
    <button
      type="button"
      className="palette-shape"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/graffel-shape-id', shape.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onClick}
      title={shape.label}
      data-testid={testId}
      data-shape-id={shape.id}
      aria-label={shape.label}
    >
      <span className="palette-shape-preview" style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}>
        {shape.render({
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          selected: false,
          fill,
          borderColor,
          textColor,
        })}
      </span>
    </button>
  )
}
