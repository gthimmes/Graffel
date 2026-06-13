import { useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { getShape } from '../shapes/registry'
import { levelHash } from './levelLink'
import type { GraffelNode } from '../format/types'

/**
 * Drill-down breadcrumb: `Title ▸ Container ▸ Sub`. Shown only when inside a
 * container; clicking a crumb jumps to that level. Pure navigation, so it works
 * in read-only share views too.
 */
export function Breadcrumbs() {
  const viewRootId = useDiagramStore((s) => s.viewRootId)
  const nodes = useDiagramStore((s) => s.nodes)
  const title = useDiagramStore((s) => s.title)
  const exitToLevel = useDiagramStore((s) => s.exitToLevel)
  const [copied, setCopied] = useState(false)

  if (!viewRootId) return null

  function copyLink() {
    const url = window.location.origin + window.location.pathname + window.location.search + levelHash(viewRootId)
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const chain: GraffelNode[] = []
  let cur = byId.get(viewRootId)
  const seen = new Set<string>()
  while (cur && !seen.has(cur.id)) {
    chain.unshift(cur)
    seen.add(cur.id)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }

  const crumbLabel = (n: GraffelNode) =>
    n.data.label || getShape(n.type)?.label || 'Container'

  return (
    <nav className="graffel-breadcrumbs" data-testid="breadcrumbs" aria-label="Diagram level">
      <button
        type="button"
        className="crumb"
        onClick={() => exitToLevel(null)}
        data-testid="crumb-root"
      >
        {title || 'Diagram'}
      </button>
      {chain.map((n, i) => {
        const isLast = i === chain.length - 1
        return (
          <span key={n.id} className="crumb-seg">
            <span className="crumb-sep" aria-hidden>▸</span>
            {isLast ? (
              <span className="crumb is-current" data-testid={`crumb-${n.id}`}>{crumbLabel(n)}</span>
            ) : (
              <button
                type="button"
                className="crumb"
                onClick={() => exitToLevel(n.id)}
                data-testid={`crumb-${n.id}`}
              >
                {crumbLabel(n)}
              </button>
            )}
          </span>
        )
      })}
      <button
        type="button"
        className="crumb-copy"
        onClick={copyLink}
        title="Copy a link that opens this level"
        data-testid="crumb-copy-link"
      >{copied ? '✓ Copied' : '🔗 Link'}</button>
    </nav>
  )
}
