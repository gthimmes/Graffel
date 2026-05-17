import { useDiagramStore } from '../store/diagramStore'
import { NodeInspector } from './NodeInspector'
import { EdgeInspector } from './EdgeInspector'

export function Inspector() {
  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useDiagramStore((s) => s.selectedEdgeIds)

  const oneNode = selectedNodeIds.length === 1 && selectedEdgeIds.length === 0
  const oneEdge = selectedEdgeIds.length === 1 && selectedNodeIds.length === 0

  return (
    <aside className="graffel-inspector" data-testid="inspector">
      {oneNode ? (
        <NodeInspector nodeId={selectedNodeIds[0]!} />
      ) : oneEdge ? (
        <EdgeInspector edgeId={selectedEdgeIds[0]!} />
      ) : (
        <EmptyState count={selectedNodeIds.length + selectedEdgeIds.length} />
      )}
    </aside>
  )
}

function EmptyState({ count }: { count: number }) {
  return (
    <div className="inspector-empty" data-testid="inspector-empty">
      <h3>Inspector</h3>
      <p className="hint">
        {count === 0
          ? 'Select a shape or connector to edit its properties.'
          : `${count} items selected — select a single item to edit.`}
      </p>
    </div>
  )
}
