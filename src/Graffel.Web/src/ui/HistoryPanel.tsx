import { useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { deleteSnapshot, listSnapshots, saveSnapshot } from '../store/history'
import { restoreSnapshot } from '../store/documents'
import { useHistoryUiStore } from './historyUiStore'
import { useDialogStore } from './dialogStore'
import { timeAgo } from './timeAgo'

/**
 * v3.26 — version history. Lists this document's snapshots (auto-checkpoints +
 * manual saves), lets you capture a named snapshot, and restore or delete any
 * one. Restore is non-destructive: the current state is checkpointed first.
 */
export function HistoryPanel() {
  const open = useHistoryUiStore((s) => s.open)
  // Subscribing to `version` re-renders (and re-reads localStorage) after any
  // snapshot mutation, without a store subscription on the history itself.
  useHistoryUiStore((s) => s.version)
  const bump = useHistoryUiStore((s) => s.bump)
  const closePanel = useHistoryUiStore((s) => s.closePanel)
  const documentId = useDiagramStore((s) => s.documentId)
  const toDocument = useDiagramStore((s) => s.toDocument)
  const [name, setName] = useState('')

  if (!open) return null

  const snapshots = listSnapshots(documentId)

  function onSnapshot() {
    saveSnapshot(documentId, toDocument(), { kind: 'manual', label: name.trim() || null })
    setName('')
    bump()
  }

  async function onRestore(id: string) {
    const ok = await useDialogStore.getState().ask({
      title: 'Restore this version?',
      message: 'Your current diagram will be saved as a checkpoint first, so you can undo the restore.',
      confirmLabel: 'Restore',
    })
    if (!ok) return
    restoreSnapshot(id)
    bump()
  }

  function onDelete(id: string) {
    deleteSnapshot(documentId, id)
    bump()
  }

  return (
    <aside className="graffel-history-panel" data-testid="history-panel" aria-label="Version history">
      <header className="history-panel-head">
        <h3>🕘 Version history</h3>
        <button
          type="button"
          className="history-panel-close"
          onClick={closePanel}
          data-testid="history-panel-close"
          aria-label="Close version history"
        >✕</button>
      </header>

      <div className="history-snapshot-new">
        <input
          className="history-name-input"
          value={name}
          placeholder="Name this version (optional)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSnapshot() }}
          data-testid="history-name-input"
          aria-label="Snapshot name"
        />
        <button type="button" className="history-snapshot-btn" onClick={onSnapshot} data-testid="history-snapshot">
          📸 Snapshot
        </button>
      </div>

      {snapshots.length === 0 ? (
        <p className="history-empty" data-testid="history-empty">No versions yet. Snapshots appear here as you work.</p>
      ) : (
        <ol className="history-list">
          {snapshots.map((s) => (
            <li key={s.id} className="history-item" data-testid={`history-item-${s.id}`}>
              <div className="history-item-main">
                <span className="history-item-label">{s.label ?? (s.kind === 'manual' ? 'Snapshot' : 'Auto-save')}</span>
                <span className="history-item-meta">
                  <span className={`history-badge is-${s.kind}`}>{s.kind === 'manual' ? 'Manual' : 'Auto'}</span>
                  {timeAgo(s.at)}
                </span>
              </div>
              <div className="history-item-actions">
                <button
                  type="button"
                  className="history-item-btn"
                  onClick={() => void onRestore(s.id)}
                  data-testid={`history-restore-${s.id}`}
                >Restore</button>
                <button
                  type="button"
                  className="history-item-btn is-danger"
                  onClick={() => onDelete(s.id)}
                  title="Delete this version"
                  data-testid={`history-delete-${s.id}`}
                >🗑</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
